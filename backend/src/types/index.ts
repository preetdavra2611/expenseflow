import { z } from 'zod';

export type TransactionType = 'EXPENSE' | 'INCOME';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'OTHER';

export interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant?: string | null;
  paymentMethod: PaymentMethod;
  date: string; // ISO format or YYYY-MM-DD
  notes?: string | null;
}

export interface ClarificationRequest {
  type: 'CLARIFICATION_REQUIRED';
  rawMessage: string;
  extractedAmount?: number;
  extractedCurrency?: string;
  extractedType?: TransactionType;
  question: string;
  options: string[];
}

export type ParseResult =
  | {
      status: 'SUCCESS';
      transactions: ParsedTransaction[];
    }
  | {
      status: 'CLARIFICATION';
      clarification: ClarificationRequest;
    }
  | {
      status: 'FAILED';
      error: string;
    };

export const TransactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  categoryId: z.string().uuid(),
  description: z.string().min(1),
  merchant: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'WALLET', 'OTHER']).default('CASH'),
  transactionDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).default(() => new Date().toISOString()),
  notes: z.string().optional().nullable(),
});

export const BudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
});

export const RecurringSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
  description: z.string().min(1),
  merchant: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'WALLET', 'OTHER']).default('UPI'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  nextDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  active: z.boolean().default(true),
});

export const CategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['EXPENSE', 'INCOME']),
  icon: z.string().default('Tag'),
  color: z.string().default('#6366f1'),
});

export const TelegramWebhookSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      from: z.object({
        id: z.number(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        username: z.string().optional(),
      }),
      chat: z.object({
        id: z.number(),
        type: z.string(),
      }),
      date: z.number(),
      text: z.string().optional(),
    })
    .optional(),
  callback_query: z
    .object({
      id: z.string(),
      from: z.object({
        id: z.number(),
        username: z.string().optional(),
        first_name: z.string().optional(),
      }),
      message: z.object({
        message_id: z.number(),
        chat: z.object({
          id: z.number(),
        }),
      }).optional(),
      data: z.string(),
    })
    .optional(),
});
