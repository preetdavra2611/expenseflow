"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = exports.TransactionService = void 0;
const config_1 = require("../config");
const budget_service_1 = require("./budget.service");
class TransactionService {
    /**
     * Finds or creates a category for a user
     */
    async resolveCategory(userId, categoryName, type) {
        const trimmed = categoryName.trim();
        // 1. Try to find user's category
        let category = await config_1.prisma.category.findFirst({
            where: {
                userId,
                name: { equals: trimmed },
                type,
            },
        });
        if (!category) {
            // Create user category
            category = await config_1.prisma.category.create({
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
    async createFromParsed(userId, parsed, telegramMessageId) {
        const categoryId = await this.resolveCategory(userId, parsed.category, parsed.type);
        const transactionDate = parsed.date ? new Date(parsed.date) : new Date();
        const transaction = await config_1.prisma.transaction.create({
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
        let budgetAlert = null;
        if (parsed.type === 'EXPENSE') {
            budgetAlert = await budget_service_1.budgetService.checkBudgetAlert(userId, categoryId);
        }
        // Get current month's spending in this category
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthAgg = await config_1.prisma.transaction.aggregate({
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
    async createMultipleParsed(userId, parsedList, telegramMessageId) {
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
    async undoLatestTransaction(userId) {
        const latest = await config_1.prisma.transaction.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { category: true },
        });
        if (!latest) {
            return null;
        }
        await config_1.prisma.transaction.delete({
            where: { id: latest.id },
        });
        return latest;
    }
    /**
     * Query transactions with robust filtering, searching, sorting, pagination
     */
    async getTransactions(userId, filter) {
        const page = Math.max(1, filter.page || 1);
        const limit = Math.min(100, Math.max(1, filter.limit || 20));
        const skip = (page - 1) * limit;
        const where = { userId };
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
        }
        else if (filter.dateRange === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
            const start = new Date(now.setDate(diff));
            start.setHours(0, 0, 0, 0);
            where.transactionDate = { gte: start };
        }
        else if (filter.dateRange === 'this_month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            where.transactionDate = { gte: start, lte: end };
        }
        else if (filter.dateRange === 'last_month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            where.transactionDate = { gte: start, lte: end };
        }
        else if (filter.dateRange === 'this_year') {
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            where.transactionDate = { gte: start, lte: end };
        }
        else if (filter.dateRange === 'custom' || (filter.startDate && filter.endDate)) {
            const start = filter.startDate ? new Date(filter.startDate) : new Date(0);
            const end = filter.endDate ? new Date(filter.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            where.transactionDate = { gte: start, lte: end };
        }
        const sortBy = filter.sortBy || 'transactionDate';
        const sortOrder = filter.sortOrder || 'desc';
        const [total, transactions] = await Promise.all([
            config_1.prisma.transaction.count({ where }),
            config_1.prisma.transaction.findMany({
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
    async getTransactionById(id, userId) {
        return config_1.prisma.transaction.findFirst({
            where: { id, userId },
            include: { category: true },
        });
    }
    async updateTransaction(id, userId, data) {
        const existing = await config_1.prisma.transaction.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new Error('Transaction not found or unauthorized');
        }
        return config_1.prisma.transaction.update({
            where: { id },
            data: {
                ...data,
                transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
            },
            include: { category: true },
        });
    }
    async deleteTransaction(id, userId) {
        const existing = await config_1.prisma.transaction.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new Error('Transaction not found or unauthorized');
        }
        return config_1.prisma.transaction.delete({
            where: { id },
        });
    }
}
exports.TransactionService = TransactionService;
exports.transactionService = new TransactionService();
