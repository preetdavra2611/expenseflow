import { Response, NextFunction } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middlewares/auth.middleware';

export class DashboardController {
  /**
   * High level overview metrics
   */
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const now = new Date();

      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Aggregations
      const [allTxTotals, currentMonthTx, lastMonthTx] = await Promise.all([
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId,
            transactionDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId,
            transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      let totalIncome = 0;
      let totalExpenses = 0;
      for (const item of allTxTotals) {
        if (item.type === 'INCOME') totalIncome = item._sum.amount || 0;
        if (item.type === 'EXPENSE') totalExpenses = item._sum.amount || 0;
      }

      let currentMonthIncome = 0;
      let currentMonthExpenses = 0;
      for (const item of currentMonthTx) {
        if (item.type === 'INCOME') currentMonthIncome = item._sum.amount || 0;
        if (item.type === 'EXPENSE') currentMonthExpenses = item._sum.amount || 0;
      }

      let lastMonthExpenses = 0;
      for (const item of lastMonthTx) {
        if (item.type === 'EXPENSE') lastMonthExpenses = item._sum.amount || 0;
      }

      const totalBalance = totalIncome - totalExpenses;
      const daysElapsed = Math.max(1, now.getDate());
      const avgDailySpending = Math.round(currentMonthExpenses / daysElapsed);

      const expenseChangePct =
        lastMonthExpenses > 0
          ? Math.round(((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100)
          : 0;

      res.json({
        success: true,
        summary: {
          totalBalance,
          totalIncome,
          totalExpenses,
          thisMonthSpending: currentMonthExpenses,
          thisMonthIncome: currentMonthIncome,
          averageDailySpending: avgDailySpending,
          expenseChangePct,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Category spending donut chart data
   */
  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, dateRange } = req.query;

      const where: any = {
        userId,
        type: 'EXPENSE',
      };

      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        where.transactionDate = { gte: start, lte: end };
      } else if (dateRange === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        where.transactionDate = { gte: start };
      } else if (dateRange === 'last_month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        where.transactionDate = { gte: start, lte: end };
      } else if (dateRange === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        where.transactionDate = { gte: start, lte: end };
      } else if (startDate && endDate) {
        where.transactionDate = {
          gte: new Date(String(startDate)),
          lte: new Date(String(endDate) + 'T23:59:59.999Z'),
        };
      } else {
        // Default to this month
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        where.transactionDate = { gte: start, lte: end };
      }

      const transactions = await prisma.transaction.findMany({
        where,
        include: { category: true },
      });

      const catMap: Record<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }> = {};
      let totalAmount = 0;

      for (const t of transactions) {
        const cat = t.category;
        if (!catMap[cat.id]) {
          catMap[cat.id] = {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            amount: 0,
            count: 0,
          };
        }
        catMap[cat.id].amount += t.amount;
        catMap[cat.id].count += 1;
        totalAmount += t.amount;
      }

      const result = Object.values(catMap).map((c) => ({
        ...c,
        percentage: totalAmount > 0 ? Math.round((c.amount / totalAmount) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount);

      res.json({
        success: true,
        totalAmount,
        categories: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Monthly Income vs Expense Bar Chart
   */
  async getMonthly(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const now = new Date();

      // Fetch last 6 months
      const monthsData: { month: string; monthKey: string; income: number; expense: number; savings: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const totals = await prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId,
            transactionDate: { gte: start, lte: end },
          },
          _sum: { amount: true },
        });

        let income = 0;
        let expense = 0;
        for (const t of totals) {
          if (t.type === 'INCOME') income = t._sum.amount || 0;
          if (t.type === 'EXPENSE') expense = t._sum.amount || 0;
        }

        monthsData.push({
          month: monthName,
          monthKey,
          income,
          expense,
          savings: income - expense,
        });
      }

      res.json({ success: true, monthly: monthsData });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Daily Spending Area / Line Chart
   */
  async getDaily(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const now = new Date();

      const year = parseInt(req.query.year as string, 10) || now.getFullYear();
      const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1; // 1-indexed

      const start = new Date(year, month - 1, 1);
      const daysInMonth = new Date(year, month, 0).getDate();
      const end = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          transactionDate: { gte: start, lte: end },
        },
        orderBy: { transactionDate: 'asc' },
      });

      const dailyTotals: Record<number, number> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dailyTotals[day] = 0;
      }

      for (const t of transactions) {
        const day = new Date(t.transactionDate).getDate();
        dailyTotals[day] = (dailyTotals[day] || 0) + t.amount;
      }

      let cumulative = 0;
      const dailyData = Object.entries(dailyTotals).map(([dayStr, amount]) => {
        const dayNum = parseInt(dayStr, 10);
        cumulative += amount;
        return {
          day: dayNum,
          date: `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
          amount,
          cumulative,
        };
      });

      res.json({ success: true, daily: dailyData });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
