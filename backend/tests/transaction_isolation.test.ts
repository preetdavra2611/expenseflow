import { transactionService } from '../src/services/transaction.service';
import { prisma } from '../src/config';

describe('Transaction Service & User Data Isolation Test Suite', () => {
  let userA: any;
  let userB: any;

  beforeAll(async () => {
    // Create two separate test users
    userA = await prisma.user.upsert({
      where: { email: 'userA@test.com' },
      update: {},
      create: {
        email: 'userA@test.com',
        name: 'User Alpha',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    userB = await prisma.user.upsert({
      where: { email: 'userB@test.com' },
      update: {},
      create: {
        email: 'userB@test.com',
        name: 'User Beta',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
  });

  it('should isolate transactions strictly by userId', async () => {
    // Create transaction for user A
    await transactionService.createFromParsed(userA.id, {
      type: 'EXPENSE',
      amount: 1500,
      currency: 'INR',
      category: 'Food',
      description: 'Alpha Private Lunch',
      paymentMethod: 'UPI',
      date: '2026-08-28',
    });

    // Create transaction for user B
    await transactionService.createFromParsed(userB.id, {
      type: 'EXPENSE',
      amount: 4500,
      currency: 'INR',
      category: 'Shopping',
      description: 'Beta Shopping spree',
      paymentMethod: 'CARD',
      date: '2026-08-28',
    });

    // Fetch user A transactions
    const aResults = await transactionService.getTransactions(userA.id, {});
    const aDescriptions = aResults.data.map((t) => t.description);
    expect(aDescriptions).toContain('Alpha Private Lunch');
    expect(aDescriptions).not.toContain('Beta Shopping spree');

    // Fetch user B transactions
    const bResults = await transactionService.getTransactions(userB.id, {});
    const bDescriptions = bResults.data.map((t) => t.description);
    expect(bDescriptions).toContain('Beta Shopping spree');
    expect(bDescriptions).not.toContain('Alpha Private Lunch');
  });

  it('should handle undo properly for the correct user', async () => {
    // Add transaction for user A and undo
    const { transaction } = await transactionService.createFromParsed(userA.id, {
      type: 'EXPENSE',
      amount: 999,
      currency: 'INR',
      category: 'Food',
      description: 'Undo Me Dinner',
      paymentMethod: 'CASH',
      date: '2026-08-28',
    });

    const undone = await transactionService.undoLatestTransaction(userA.id);
    expect(undone).toBeDefined();
    expect(undone?.id).toBe(transaction.id);

    // Verify it is gone from DB
    const fetched = await transactionService.getTransactionById(transaction.id, userA.id);
    expect(fetched).toBeNull();
  });

  it('should isolate categories strictly by userId with no duplicates from other users', async () => {
    const { authService } = await import('../src/services/auth.service');
    await authService.seedUserDefaultCategories(userA.id);
    await authService.seedUserDefaultCategories(userB.id);

    const aCategories = await prisma.category.findMany({
      where: { userId: userA.id, type: 'EXPENSE' },
    });

    const bCategories = await prisma.category.findMany({
      where: { userId: userB.id, type: 'EXPENSE' },
    });

    // Exactly 15 default expense categories per user
    expect(aCategories).toHaveLength(15);
    expect(bCategories).toHaveLength(15);

    // Verify all names are unique within userA's list
    const aNames = aCategories.map((c) => c.name);
    const uniqueNames = new Set(aNames);
    expect(uniqueNames.size).toBe(15);
  });
});
