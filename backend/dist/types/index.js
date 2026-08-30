"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramWebhookSchema = exports.CategorySchema = exports.RecurringSchema = exports.BudgetSchema = exports.TransactionSchema = void 0;
const zod_1 = require("zod");
exports.TransactionSchema = zod_1.z.object({
    type: zod_1.z.enum(['EXPENSE', 'INCOME']),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('INR'),
    categoryId: zod_1.z.string().uuid(),
    description: zod_1.z.string().min(1),
    merchant: zod_1.z.string().optional().nullable(),
    paymentMethod: zod_1.z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'WALLET', 'OTHER']).default('CASH'),
    transactionDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)).default(() => new Date().toISOString()),
    notes: zod_1.z.string().optional().nullable(),
});
exports.BudgetSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    period: zod_1.z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
    startDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    endDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
});
exports.RecurringSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
    description: zod_1.z.string().min(1),
    merchant: zod_1.z.string().optional().nullable(),
    paymentMethod: zod_1.z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'WALLET', 'OTHER']).default('UPI'),
    frequency: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
    nextDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    active: zod_1.z.boolean().default(true),
});
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['EXPENSE', 'INCOME']),
    icon: zod_1.z.string().default('Tag'),
    color: zod_1.z.string().default('#6366f1'),
});
exports.TelegramWebhookSchema = zod_1.z.object({
    update_id: zod_1.z.number(),
    message: zod_1.z
        .object({
        message_id: zod_1.z.number(),
        from: zod_1.z.object({
            id: zod_1.z.number(),
            first_name: zod_1.z.string().optional(),
            last_name: zod_1.z.string().optional(),
            username: zod_1.z.string().optional(),
        }),
        chat: zod_1.z.object({
            id: zod_1.z.number(),
            type: zod_1.z.string(),
        }),
        date: zod_1.z.number(),
        text: zod_1.z.string().optional(),
    })
        .optional(),
    callback_query: zod_1.z
        .object({
        id: zod_1.z.string(),
        from: zod_1.z.object({
            id: zod_1.z.number(),
            username: zod_1.z.string().optional(),
            first_name: zod_1.z.string().optional(),
        }),
        message: zod_1.z.object({
            message_id: zod_1.z.number(),
            chat: zod_1.z.object({
                id: zod_1.z.number(),
            }),
        }).optional(),
        data: zod_1.z.string(),
    })
        .optional(),
});
