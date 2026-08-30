"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightService = exports.InsightService = void 0;
const config_1 = require("../config");
class InsightService {
    async generateInsights(userId) {
        const insights = [];
        const now = new Date();
        // Date bounds for current month & last month
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        // 1. Fetch current month and last month expenses
        const [currentMonthTx, lastMonthTx, budgets] = await Promise.all([
            config_1.prisma.transaction.findMany({
                where: {
                    userId,
                    transactionDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
                },
                include: { category: true },
            }),
            config_1.prisma.transaction.findMany({
                where: {
                    userId,
                    transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                include: { category: true },
            }),
            config_1.prisma.budget.findMany({
                where: { userId },
                include: { category: true },
            }),
        ]);
        const currentExpenses = currentMonthTx.filter((t) => t.type === 'EXPENSE');
        const currentIncome = currentMonthTx.filter((t) => t.type === 'INCOME');
        const totalCurrentExpense = currentExpenses.reduce((acc, t) => acc + t.amount, 0);
        const totalCurrentIncome = currentIncome.reduce((acc, t) => acc + t.amount, 0);
        const lastExpenses = lastMonthTx.filter((t) => t.type === 'EXPENSE');
        // Insight 1: Highest Spending Category This Month
        const categoryTotals = {};
        for (const t of currentExpenses) {
            const catName = t.category.name;
            if (!categoryTotals[catName]) {
                categoryTotals[catName] = { name: catName, amount: 0 };
            }
            categoryTotals[catName].amount += t.amount;
        }
        const sortedCats = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
        if (sortedCats.length > 0) {
            const top = sortedCats[0];
            const pct = totalCurrentExpense > 0 ? Math.round((top.amount / totalCurrentExpense) * 100) : 0;
            insights.push({
                id: 'top-category',
                type: 'CATEGORY_PEAK',
                title: 'Highest Spending Category',
                message: `Your highest spending category this month is ${top.name} (₹${top.amount.toLocaleString('en-IN')}, ${pct}% of total spending).`,
                icon: 'PieChart',
                severity: 'INFO',
            });
        }
        // Insight 2: Month-over-Month Category Trends
        const lastCategoryTotals = {};
        for (const t of lastExpenses) {
            lastCategoryTotals[t.category.name] = (lastCategoryTotals[t.category.name] || 0) + t.amount;
        }
        for (const cat of sortedCats) {
            const lastAmount = lastCategoryTotals[cat.name] || 0;
            if (lastAmount > 0) {
                const diff = cat.amount - lastAmount;
                if (Math.abs(diff) > 500) {
                    if (diff > 0) {
                        insights.push({
                            id: `mom-up-${cat.name}`,
                            type: 'TREND',
                            title: `${cat.name} Spending Increase`,
                            message: `You spent ₹${diff.toLocaleString('en-IN')} more on ${cat.name} this month compared with last month.`,
                            icon: 'TrendingUp',
                            severity: 'WARNING',
                        });
                    }
                    else {
                        insights.push({
                            id: `mom-down-${cat.name}`,
                            type: 'TREND',
                            title: `${cat.name} Savings`,
                            message: `Great job! You spent ₹${Math.abs(diff).toLocaleString('en-IN')} less on ${cat.name} this month compared with last month.`,
                            icon: 'TrendingDown',
                            severity: 'POSITIVE',
                        });
                    }
                    break; // Take the most prominent category shift
                }
            }
        }
        // Insight 3: Average Daily Spending
        const daysElapsed = Math.max(1, now.getDate());
        const avgDaily = Math.round(totalCurrentExpense / daysElapsed);
        insights.push({
            id: 'daily-average',
            type: 'DAILY_AVG',
            title: 'Daily Spending Velocity',
            message: `Your average daily spending is ₹${avgDaily.toLocaleString('en-IN')}/day over the last ${daysElapsed} days.`,
            icon: 'Calendar',
            severity: 'NEUTRAL',
        });
        // Insight 4: Peak Weekday Analysis
        const weekdayTotals = {
            Sunday: { amount: 0, count: 0 },
            Monday: { amount: 0, count: 0 },
            Tuesday: { amount: 0, count: 0 },
            Wednesday: { amount: 0, count: 0 },
            Thursday: { amount: 0, count: 0 },
            Friday: { amount: 0, count: 0 },
            Saturday: { amount: 0, count: 0 },
        };
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const t of currentExpenses) {
            const dayName = days[new Date(t.transactionDate).getDay()];
            weekdayTotals[dayName].amount += t.amount;
            weekdayTotals[dayName].count += 1;
        }
        const peakDay = Object.entries(weekdayTotals).sort((a, b) => b[1].amount - a[1].amount)[0];
        if (peakDay && peakDay[1].amount > 0) {
            insights.push({
                id: 'peak-weekday',
                type: 'WEEKDAY_PEAK',
                title: 'Peak Spending Day',
                message: `You spent the most on ${peakDay[0]}s (₹${peakDay[1].amount.toLocaleString('en-IN')} across ${peakDay[1].count} transactions).`,
                icon: 'BarChart3',
                severity: 'INFO',
            });
        }
        // Insight 5: Budget Utilization Warnings
        for (const b of budgets) {
            const spent = categoryTotals[b.category.name]?.amount || 0;
            const pct = Math.round((spent / b.amount) * 100);
            if (pct >= 80) {
                insights.push({
                    id: `budget-${b.id}`,
                    type: 'BUDGET_ALERT',
                    title: `${b.category.name} Budget Alert`,
                    message: `You have used ${pct}% of your ${b.category.name} budget (₹${spent.toLocaleString('en-IN')} of ₹${b.amount.toLocaleString('en-IN')}).`,
                    icon: 'AlertTriangle',
                    severity: pct >= 100 ? 'WARNING' : 'INFO',
                });
            }
        }
        // Insight 6: Savings Rate
        if (totalCurrentIncome > 0) {
            const netSavings = totalCurrentIncome - totalCurrentExpense;
            const savingsRate = Math.round((netSavings / totalCurrentIncome) * 100);
            insights.push({
                id: 'savings-rate',
                type: 'SAVINGS_RATE',
                title: 'Monthly Savings Rate',
                message: savingsRate >= 0
                    ? `Your current savings rate is ${savingsRate}%. Net saved: ₹${netSavings.toLocaleString('en-IN')}.`
                    : `Expenses exceeded income by ₹${Math.abs(netSavings).toLocaleString('en-IN')} this month.`,
                icon: 'PiggyBank',
                severity: savingsRate >= 20 ? 'POSITIVE' : savingsRate < 0 ? 'WARNING' : 'NEUTRAL',
            });
        }
        return insights;
    }
}
exports.InsightService = InsightService;
exports.insightService = new InsightService();
