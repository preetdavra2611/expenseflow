import { prisma } from '../config';
import { transactionService } from './transaction.service';

export class RecurringService {
  async getRecurring(userId: string) {
    return prisma.recurringTransaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { nextDate: 'asc' },
    });
  }

  async createRecurring(userId: string, data: any) {
    return prisma.recurringTransaction.create({
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

  async updateRecurring(id: string, userId: string, data: any) {
    return prisma.recurringTransaction.updateMany({
      where: { id, userId },
      data: {
        ...data,
        nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
      },
    });
  }

  async deleteRecurring(id: string, userId: string) {
    return prisma.recurringTransaction.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Process all due recurring transactions and advance their nextDate
   */
  async processDueRecurring(): Promise<number> {
    const now = new Date();
    const dueItems = await prisma.recurringTransaction.findMany({
      where: {
        active: true,
        nextDate: { lte: now },
      },
      include: { category: true },
    });

    let createdCount = 0;

    for (const item of dueItems) {
      // 1. Create the transaction
      await transactionService.createFromParsed(item.userId, {
        type: item.type as any,
        amount: item.amount,
        currency: 'INR',
        category: item.category.name,
        description: `[Recurring] ${item.description}`,
        merchant: item.merchant,
        paymentMethod: item.paymentMethod as any,
        date: item.nextDate.toISOString().split('T')[0],
        notes: `Auto-generated from recurring schedule (${item.frequency})`,
      });

      // 2. Compute next execution date
      const nextDate = this.calculateNextDate(item.nextDate, item.frequency);

      // 3. Update recurring record
      await prisma.recurringTransaction.update({
        where: { id: item.id },
        data: { nextDate },
      });

      createdCount++;
    }

    return createdCount;
  }

  private calculateNextDate(current: Date, frequency: string): Date {
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

export const recurringService = new RecurringService();
