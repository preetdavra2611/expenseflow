export type TransactionType = 'EXPENSE' | 'INCOME';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'OTHER';

export interface User {
  id: string;
  email?: string | null;
  name: string;
  telegramUserId?: string | null;
  telegramUsername?: string | null;
  currency: string;
  currencySymbol: string;
  timezone: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  description: string;
  merchant?: string | null;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  telegramMessageId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  period: string;
  warningLevel: 'NORMAL' | 'WARNING_75' | 'WARNING_90' | 'EXCEEDED_100';
  warningMessage?: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchant?: string | null;
  paymentMethod: PaymentMethod;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextDate: string;
  active: boolean;
  category: Category;
}

export interface SmartInsight {
  id: string;
  type: 'TREND' | 'CATEGORY_PEAK' | 'DAILY_AVG' | 'WEEKDAY_PEAK' | 'BUDGET_ALERT' | 'SAVINGS_RATE';
  title: string;
  message: string;
  icon: string;
  severity: 'INFO' | 'WARNING' | 'POSITIVE' | 'NEUTRAL';
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  thisMonthSpending: number;
  thisMonthIncome: number;
  averageDailySpending: number;
  expenseChangePct: number;
}

export interface CategoryAnalyticsItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyAnalyticsItem {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
  savings: number;
}

export interface DailyAnalyticsItem {
  day: number;
  date: string;
  amount: number;
  cumulative: number;
}

export interface FilterState {
  dateRange: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: TransactionType | '';
  paymentMethod?: PaymentMethod | '';
  search?: string;
}
