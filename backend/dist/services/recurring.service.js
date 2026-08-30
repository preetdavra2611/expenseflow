"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringService = exports.RecurringService = void 0;
const config_1 = require("../config");
const transaction_service_1 = require("./transaction.service");
class RecurringService {
    async getRecurring(userId) {
        return config_1.prisma.recurringTransaction.findMany({
            where: { userId },
            include: { category: true },
            orderBy: { nextDate: 'asc' },
        });
    }
    async createRecurring(userId, data) {
        return config_1.prisma.recurringTransaction.create({
            data: {
                userId,
                categoryId: data.categoryId,
                amount: data.amount,
                type: data.type || 'EXPENSE',
                description: data.description,
                merchant: data.merchant || null,
                paymentMethod: data.paymentMethod || 'UPI',
                frequency: data.frequency || 'MONTHLY',
                nextDate: new Date(data.nextDate),
                active: data.active ?? true,
            },
            include: { category: true },
        });
    }
    async updateRecurring(id, userId, data) {
        return config_1.prisma.recurringTransaction.updateMany({
            where: { id, userId },
            data: {
                ...data,
                nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
            },
        });
    }
    async deleteRecurring(id, userId) {
        return config_1.prisma.recurringTransaction.deleteMany({
            where: { id, userId },
        });
    }
    /**
     * Process all due recurring transactions and advance their nextDate
     */
    async processDueRecurring() {
        const now = new Date();
        const dueItems = await config_1.prisma.recurringTransaction.findMany({
            where: {
                active: true,
                nextDate: { lte: now },
            },
            include: { category: true },
        });
        let createdCount = 0;
        for (const item of dueItems) {
            // 1. Create the transaction
            await transaction_service_1.transactionService.createFromParsed(item.userId, {
                type: item.type,
                amount: item.amount,
                currency: 'INR',
                category: item.category.name,
                description: `[Recurring] ${item.description}`,
                merchant: item.merchant,
                paymentMethod: item.paymentMethod,
                date: item.nextDate.toISOString().split('T')[0],
                notes: `Auto-generated from recurring schedule (${item.frequency})`,
            });
            // 2. Compute next execution date
            const nextDate = this.calculateNextDate(item.nextDate, item.frequency);
            // 3. Update recurring record
            await config_1.prisma.recurringTransaction.update({
                where: { id: item.id },
                data: { nextDate },
            });
            createdCount++;
        }
        return createdCount;
    }
    calculateNextDate(current, frequency) {
        const next = new Date(current);
        switch (frequency) {
            case 'DAILY':
                next.setDate(next.getDate() + 1);
                break;
            case 'WEEKLY':
                next.setDate(next.getDate() + 7);
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + 1);
                break;
            default:
                next.setMonth(next.getMonth() + 1);
        }
        return next;
    }
}
exports.RecurringService = RecurringService;
exports.recurringService = new RecurringService();
