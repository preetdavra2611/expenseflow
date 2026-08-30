import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_EXPENSES = [
  { name: 'Food', icon: 'Utensils', color: '#f97316' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#10b981' },
  { name: 'Transport', icon: 'Car', color: '#3b82f6' },
  { name: 'Fuel', icon: 'Fuel', color: '#ef4444' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#eab308' },
  { name: 'Rent', icon: 'Home', color: '#6366f1' },
  { name: 'Education', icon: 'GraduationCap', color: '#06b6d4' },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#14b8a6' },
  { name: 'Travel', icon: 'Plane', color: '#f59e0b' },
  { name: 'Subscriptions', icon: 'Tv', color: '#a855f7' },
  { name: 'Personal Care', icon: 'Sparkles', color: '#d946ef' },
  { name: 'Gifts', icon: 'Gift', color: '#f43f5e' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#64748b' },
];

const DEFAULT_INCOMES = [
  { name: 'Salary', icon: 'Briefcase', color: '#22c55e' },
  { name: 'Freelance', icon: 'Laptop', color: '#0ea5e9' },
  { name: 'Business', icon: 'Building2', color: '#8b5cf6' },
  { name: 'Gift', icon: 'Gift', color: '#ec4899' },
  { name: 'Refund', icon: 'RefreshCw', color: '#10b981' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#64748b' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create or update Demo User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      telegramUsername: 'expense_demo_user',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
    },
  });

  console.log(`👤 User ready: ${user.name} (${user.email})`);

  // 2. Seed Default Categories
  const categoryMap: Record<string, string> = {};

  for (const c of DEFAULT_EXPENSES) {
    const cat = await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: c.name,
          type: 'EXPENSE',
        },
      },
      update: { color: c.color, icon: c.icon },
      create: {
        userId: user.id,
        name: c.name,
        type: 'EXPENSE',
        icon: c.icon,
        color: c.color,
        isDefault: true,
      },
    });
    categoryMap[c.name] = cat.id;
  }

  for (const c of DEFAULT_INCOMES) {
    const cat = await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: c.name,
          type: 'INCOME',
        },
      },
      update: { color: c.color, icon: c.icon },
      create: {
        userId: user.id,
        name: c.name,
        type: 'INCOME',
        icon: c.icon,
        color: c.color,
        isDefault: true,
      },
    });
    categoryMap[c.name] = cat.id;
  }

  console.log('📁 Categories created/updated');

  // 3. Clear existing sample transactions to avoid unbounded growth on re-seed
  await prisma.transaction.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Helper to create dates
  const makeDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  // 4. Sample Transactions (Spanning this month and last month)
  const sampleTransactions = [
    // Current Month Income
    { type: 'INCOME', amount: 45000, category: 'Salary', desc: 'Monthly Salary', merchant: 'Acme Corp', method: 'NET_BANKING', date: new Date(year, month, 1) },
    { type: 'INCOME', amount: 8500, category: 'Freelance', desc: 'Website Landing Page Design', merchant: 'Upwork Client', method: 'UPI', date: new Date(year, month, 10) },
    { type: 'INCOME', amount: 2000, category: 'Gift', desc: 'Gift from Dad', merchant: null, method: 'UPI', date: new Date(year, month, 14) },

    // Current Month Expenses
    { type: 'EXPENSE', amount: 12000, category: 'Rent', desc: 'Apartment Monthly Rent', merchant: 'Landlord', method: 'NET_BANKING', date: new Date(year, month, 2) },
    { type: 'EXPENSE', amount: 2450, category: 'Groceries', desc: 'Monthly Groceries & Essentials', merchant: 'DMart', method: 'CARD', date: new Date(year, month, 3) },
    { type: 'EXPENSE', amount: 350, category: 'Food', desc: 'Dinner with friends', merchant: "Domino's", method: 'UPI', date: new Date(year, month, 5) },
    { type: 'EXPENSE', amount: 500, category: 'Fuel', desc: 'Petrol for bike', merchant: 'HP Petrol', method: 'UPI', date: new Date(year, month, 7) },
    { type: 'EXPENSE', amount: 1800, category: 'Shopping', desc: 'Bought clothes for weekend', merchant: 'Zara', method: 'CARD', date: new Date(year, month, 9) },
    { type: 'EXPENSE', amount: 999, category: 'Bills & Utilities', desc: 'High-Speed Broadband Bill', merchant: 'Airtel', method: 'UPI', date: new Date(year, month, 11) },
    { type: 'EXPENSE', amount: 649, category: 'Subscriptions', desc: 'Premium 4K Subscription', merchant: 'Netflix', method: 'CARD', date: new Date(year, month, 12) },
    { type: 'EXPENSE', amount: 120, category: 'Transport', desc: 'Uber ride to meeting', merchant: 'Uber', method: 'UPI', date: new Date(year, month, 15) },
    { type: 'EXPENSE', amount: 750, category: 'Groceries', desc: 'Fresh Fruits & Vegetables', merchant: 'Blinkit', method: 'UPI', date: new Date(year, month, 17) },
    { type: 'EXPENSE', amount: 150, category: 'Food', desc: 'Evening snacks & chai', merchant: 'Chai Point', method: 'CASH', date: makeDate(3) },
    { type: 'EXPENSE', amount: 450, category: 'Entertainment', desc: 'Cinema tickets', merchant: 'PVR', method: 'UPI', date: makeDate(2) },
    { type: 'EXPENSE', amount: 280, category: 'Food', desc: 'Lunch at cafe', merchant: 'Swiggy', method: 'UPI', date: makeDate(1) },
    { type: 'EXPENSE', amount: 320, category: 'Food', desc: 'Dinner bowl', merchant: 'Zomato', method: 'UPI', date: makeDate(0) },

    // Previous Month Data (for comparison & insights)
    { type: 'INCOME', amount: 45000, category: 'Salary', desc: 'Previous Month Salary', merchant: 'Acme Corp', method: 'NET_BANKING', date: new Date(year, month - 1, 1) },
    { type: 'EXPENSE', amount: 12000, category: 'Rent', desc: 'Rent for last month', merchant: 'Landlord', method: 'NET_BANKING', date: new Date(year, month - 1, 2) },
    { type: 'EXPENSE', amount: 1800, category: 'Groceries', desc: 'Groceries at DMart', merchant: 'DMart', method: 'CARD', date: new Date(year, month - 1, 8) },
    { type: 'EXPENSE', amount: 1200, category: 'Food', desc: 'Food dining last month', merchant: 'Cafe', method: 'UPI', date: new Date(year, month - 1, 15) },
    { type: 'EXPENSE', amount: 800, category: 'Transport', desc: 'Cabs & fuel', merchant: 'Uber', method: 'UPI', date: new Date(year, month - 1, 20) },
  ];

  for (const t of sampleTransactions) {
    const catId = categoryMap[t.category] || categoryMap['Other'];
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: t.type,
        amount: t.amount,
        currency: 'INR',
        categoryId: catId,
        description: t.desc,
        merchant: t.merchant,
        paymentMethod: t.method,
        transactionDate: t.date,
        notes: 'Seed sample transaction',
      },
    });
  }

  console.log(`💳 Created ${sampleTransactions.length} sample transactions`);

  // 5. Seed Budgets
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  const sampleBudgets = [
    { cat: 'Food', amount: 8000 },
    { cat: 'Transport', amount: 4000 },
    { cat: 'Shopping', amount: 5000 },
    { cat: 'Entertainment', amount: 2000 },
    { cat: 'Groceries', amount: 6000 },
  ];

  for (const b of sampleBudgets) {
    const catId = categoryMap[b.cat];
    if (catId) {
      await prisma.budget.create({
        data: {
          userId: user.id,
          categoryId: catId,
          amount: b.amount,
          period: 'MONTHLY',
        },
      });
    }
  }

  console.log(`🎯 Created ${sampleBudgets.length} category budgets`);

  // 6. Seed Recurring Transactions
  await prisma.recurringTransaction.deleteMany({ where: { userId: user.id } });
  const sampleRecurring = [
    { cat: 'Rent', amount: 12000, desc: 'Apartment Monthly Rent', merchant: 'Landlord', method: 'NET_BANKING', freq: 'MONTHLY' },
    { cat: 'Subscriptions', amount: 649, desc: 'Netflix 4K Subscription', merchant: 'Netflix', method: 'CARD', freq: 'MONTHLY' },
    { cat: 'Bills & Utilities', amount: 999, desc: 'Airtel Broadband Internet', merchant: 'Airtel', method: 'UPI', freq: 'MONTHLY' },
    { cat: 'Subscriptions', amount: 119, desc: 'Spotify Premium Music', merchant: 'Spotify', method: 'CARD', freq: 'MONTHLY' },
  ];

  for (const r of sampleRecurring) {
    const catId = categoryMap[r.cat] || categoryMap['Other'];
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 10);

    await prisma.recurringTransaction.create({
      data: {
        userId: user.id,
        categoryId: catId,
        amount: r.amount,
        type: 'EXPENSE',
        description: r.desc,
        merchant: r.merchant,
        paymentMethod: r.method,
        frequency: r.freq,
        nextDate,
        active: true,
      },
    });
  }

  console.log(`🔁 Created ${sampleRecurring.length} recurring schedules`);
  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
