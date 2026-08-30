import { prisma } from '../config';
import { ParsedTransaction, PaymentMethod, TransactionType } from '../types';
import { budgetService } from './budget.service';

export interface TransactionFilter {
  search?: string;
  categoryId?: string;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
  dateRange?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TransactionService {
  /**
   * Finds or creates a category for a user
   */
  async resolveCategory(userId: string, categoryName: string, type: TransactionType): Promise<string> {
    const trimmed = categoryName.trim();

    // 1. Try to find user's category
    let category = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: trimmed },
        type,
      },
    });

    if (!category) {
      // Create user category
      category = await prisma.category.create({
        data: {
          userId,
          name: trimmed,
          type,
          icon: type === 'INCOME' ? 'TrendingUp' : 'Tag',
          color: '#6366f1',
          isDefault: false,
        },
      });
    }

    return category.id;
  }

  /**
   * Creates a transaction from parsed data
   */
  async createFromParsed(
    userId: string,
    parsed: ParsedTransaction,
    telegramMessageId?: string
  ): Promise<{ transaction: any; budgetAlert: string | null; categoryTotalMonth: number }> {
    const categoryId = await this.resolveCategory(userId, parsed.category, parsed.type);

    const transactionDate = parsed.date ? new Date(parsed.date) : new Date();

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: parsed.type,
        amount: parsed.amount,
        currency: parsed.currency || 'INR',
        categoryId,
        description: parsed.description,
        merchant: parsed.merchant || null,
        paymentMethod: parsed.paymentMethod,
        transactionDate,
        telegramMessageId: telegramMessageId || null,
        notes: parsed.notes || null,
      },
      include: {
        category: true,
      },
    });

    // Check budget alert if expense
    let budgetAlert: string | null = null;
    if (parsed.type === 'EXPENSE') {
      budgetAlert = await budgetService.checkBudgetAlert(userId, categoryId);
    }

    // Get current month's spending in this category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: parsed.type,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const categoryTotalMonth = monthAgg._sum.amount || parsed.amount;

    return { transaction, budgetAlert, categoryTotalMonth };
  }

  /**
   * Batch creates multiple transactions
   */
  async createMultipleParsed(userId: string, parsedList: ParsedTransaction[], telegramMessageId?: string) {
    const results = [];
    for (const item of parsedList) {
      const res = await this.createFromParsed(userId, item, telegramMessageId);
      results.push(res);
    }
    return results;
  }

  /**
   * Undo most recent transaction for user
   */
  async undoLatestTransaction(userId: string) {
    const latest = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    if (!latest) {
      return null;
    }

    await prisma.transaction.delete({
      where: { id: latest.id },
    });

    return latest;
  }

  /**
   * Query transactions with robust filtering, searching, sorting, pagination
   */
  async getTransactions(userId: string, filter: TransactionFilter) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filter.search) {
      where.OR = [
        { description: { contains: filter.search } },
        { merchant: { contains: filter.search } },
        { notes: { contains: filter.search } },
      ];
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.paymentMethod) {
      where.paymentMethod = filter.paymentMethod;
    }

    // Date range filter
    const now = new Date();
    if (filter.dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    } else if (filter.dateRange === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      where.transactionDate = { gte: start };
    } else if (filter.dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    } else if (filter.dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    } else if (filter.dateRange === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    } else if (filter.dateRange === 'custom' || (filter.startDate && filter.endDate)) {
      const start = filter.startDate ? new Date(filter.startDate) : new Date(0);
      const end = filter.endDate ? new Date(filter.endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    }

    const sortBy = filter.sortBy || 'transactionDate';
    const sortOrder = filter.sortOrder || 'desc';

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(id: string, userId: string) {
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
  }

  async updateTransaction(id: string, userId: string, data: any) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Transaction not found or unauthorized');
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
      },
      include: { category: true },
    });
  }

  async deleteTransaction(id: string, userId: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Transaction not found or unauthorized');
    }

    return prisma.transaction.delete({
      where: { id },
    });
  }
}

export const transactionService = new TransactionService();
