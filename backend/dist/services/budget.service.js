"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetService = exports.BudgetService = void 0;
const config_1 = require("../config");
class BudgetService {
    /**
     * Get all budgets for a user with live spending calculations
     */
    async getUserBudgets(userId) {
        const budgets = await config_1.prisma.budget.findMany({
            where: { userId },
            include: { category: true },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const statuses = [];
        for (const b of budgets) {
            // Calculate spent amount in current period (default monthly)
            const spendingAgg = await config_1.prisma.transaction.aggregate({
                where: {
                    userId,
                    categoryId: b.categoryId,
                    type: 'EXPENSE',
                    transactionDate: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: {
                    amount: true,
                },
            });
            const spent = spendingAgg._sum.amount || 0;
            const remaining = Math.max(0, b.amount - spent);
            const percentageUsed = Math.round((spent / b.amount) * 100);
            let warningLevel = 'NORMAL';
            let warningMessage;
            if (percentageUsed >= 100) {
                warningLevel = 'EXCEEDED_100';
                warningMessage = `⚠️ Budget Exceeded! You have spent ${percentageUsed}% of your ${b.category.name} budget.`;
            }
            else if (percentageUsed >= 90) {
                warningLevel = 'WARNING_90';
                warningMessage = `🚨 Critical Warning: You have used ${percentageUsed}% of your ${b.category.name} budget.`;
            }
            else if (percentageUsed >= 75) {
                warningLevel = 'WARNING_75';
                warningMessage = `⚡ Alert: You have used ${percentageUsed}% of your ${b.category.name} budget.`;
            }
            statuses.push({
                id: b.id,
                categoryId: b.categoryId,
                categoryName: b.category.name,
                categoryIcon: b.category.icon,
                categoryColor: b.category.color,
                budgetAmount: b.amount,
                spentAmount: spent,
                remainingAmount: remaining,
                percentageUsed,
                period: b.period,
                warningLevel,
                warningMessage,
            });
        }
        return statuses;
    }
    /**
     * Check if adding an expense triggers a budget warning
     */
    async checkBudgetAlert(userId, categoryId, additionalAmount = 0) {
        const budget = await config_1.prisma.budget.findFirst({
            where: { userId, categoryId, period: 'MONTHLY' },
            include: { category: true },
        });
        if (!budget)
            return null;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const spendingAgg = await config_1.prisma.transaction.aggregate({
            where: {
                userId,
                categoryId,
                type: 'EXPENSE',
                transactionDate: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            _sum: {
                amount: true,
            },
        });
        const currentSpent = (spendingAgg._sum.amount || 0) + additionalAmount;
        const pct = Math.round((currentSpent / budget.amount) * 100);
        if (pct >= 100) {
            return `🚨 Warning: You have exceeded 100% of your ${budget.category.name} budget (Spent: ₹${currentSpent} / ₹${budget.amount})!`;
        }
        else if (pct >= 90) {
            return `⚠️ Alert: You have reached ${pct}% of your ${budget.category.name} budget (Spent: ₹${currentSpent} / ₹${budget.amount})!`;
        }
        else if (pct >= 75) {
            return `⚡ Notice: You have used ${pct}% of your ${budget.category.name} budget (Spent: ₹${currentSpent} / ₹${budget.amount}).`;
        }
        return null;
    }
    /**
     * Upsert a category budget
     */
    async upsertBudget(userId, categoryId, amount, period = 'MONTHLY') {
        const existing = await config_1.prisma.budget.findFirst({
            where: { userId, categoryId, period },
        });
        if (existing) {
            return config_1.prisma.budget.update({
                where: { id: existing.id },
                data: { amount },
            });
        }
        return config_1.prisma.budget.create({
            data: {
                userId,
                categoryId,
                amount,
                period,
            },
        });
    }
    async deleteBudget(id, userId) {
        return config_1.prisma.budget.deleteMany({
            where: { id, userId },
        });
    }
}
exports.BudgetService = BudgetService;
exports.budgetService = new BudgetService();
