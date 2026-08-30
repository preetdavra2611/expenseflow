import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, transactionsApi, categoriesApi, insightsApi } from '../services/api';
import {
  DashboardSummary,
  CategoryAnalyticsItem,
  MonthlyAnalyticsItem,
  DailyAnalyticsItem,
  Transaction,
  Category,
  SmartInsight,
} from '../types';
import { StatCard } from '../components/StatCard';
import { FilterBar } from '../components/FilterBar';
import { ExpenseDonutChart } from '../components/ExpenseDonutChart';
import { MonthlyBarChart } from '../components/MonthlyBarChart';
import { DailyAreaChart } from '../components/DailyAreaChart';
import { InsightsPanel } from '../components/InsightsPanel';
import { TransactionTable } from '../components/TransactionTable';
import { Wallet, TrendingUp, TrendingDown, Calendar, CreditCard, Sparkles } from 'lucide-react';

interface DashboardPageProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { user } = useAuth();
  const { filters, setFilters, resetFilters } = useFilters();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoriesAnalytics, setCategoriesAnalytics] = useState<CategoryAnalyticsItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalyticsItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyAnalyticsItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, catRes, monRes, dayRes, txRes, catListRes, insRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getCategories(filters),
        dashboardApi.getMonthly(),
        dashboardApi.getDaily(),
        transactionsApi.getTransactions({ ...filters, limit: 7, page: 1 }),
        categoriesApi.getCategories(),
        insightsApi.getInsights(),
      ]);

      setSummary(sumRes.summary);
      setCategoriesAnalytics(catRes.categories);
      setMonthlyData(monRes.monthly);
      setDailyData(dayRes.daily);
      setRecentTransactions(txRes.data);
      setCategories(catListRes.categories);
      setInsights(insRes.insights);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const currencySymbol = user?.currencySymbol || '₹';

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || 'Friend'} 👋
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Here is your financial pulse and real-time expense telemetry.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Balance */}
        <StatCard
          title="Net Balance"
          amount={summary?.totalBalance || 0}
          currencySymbol={currencySymbol}
          icon={Wallet}
          accentColor="indigo"
          subtitle="All-time savings"
        />

        {/* Total Income */}
        <StatCard
          title="Total Income"
          amount={summary?.totalIncome || 0}
          currencySymbol={currencySymbol}
          icon={TrendingUp}
          accentColor="emerald"
          subtitle="Cumulative earnings"
        />

        {/* Total Expenses */}
        <StatCard
          title="Total Expenses"
          amount={summary?.totalExpenses || 0}
          currencySymbol={currencySymbol}
          icon={TrendingDown}
          accentColor="rose"
          subtitle="All-time expenditures"
        />

        {/* This Month Spending */}
        <StatCard
          title="This Month"
          amount={summary?.thisMonthSpending || 0}
          currencySymbol={currencySymbol}
          icon={CreditCard}
          accentColor="amber"
          trend={
            summary?.expenseChangePct !== undefined && summary.expenseChangePct !== 0
              ? {
                  value: summary.expenseChangePct,
                  isPositive: summary.expenseChangePct < 0,
                  label: 'vs last month',
                }
              : undefined
          }
          subtitle="Current billing cycle"
        />

        {/* Daily Spending Velocity */}
        <StatCard
          title="Daily Average"
          amount={summary?.averageDailySpending || 0}
          currencySymbol={currencySymbol}
          icon={Calendar}
          accentColor="sky"
          subtitle="Per day burn rate"
        />
      </div>

      {/* Dynamic Filter Controls */}
      <FilterBar
        filters={filters}
        onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onReset={resetFilters}
        categories={categories}
      />

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-[380px]">
          <ExpenseDonutChart
            categories={categoriesAnalytics}
            totalAmount={categoriesAnalytics.reduce((acc, c) => acc + c.amount, 0)}
            currencySymbol={currencySymbol}
          />
        </div>

        <div className="lg:col-span-7 h-[380px]">
          <MonthlyBarChart data={monthlyData} currencySymbol={currencySymbol} />
        </div>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-[360px]">
          <DailyAreaChart data={dailyData} currencySymbol={currencySymbol} />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between">
          <InsightsPanel insights={insights.slice(0, 3)} loading={loading} />
        </div>
      </div>

      {/* Recent Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white tracking-wide">Recent Activity</h4>
          <span className="text-xs text-slate-400">Showing latest transactions</span>
        </div>

        <TransactionTable
          transactions={recentTransactions}
          loading={loading}
          pagination={{ page: 1, limit: 7, total: recentTransactions.length, totalPages: 1 }}
          onPageChange={() => {}}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
          currencySymbol={currencySymbol}
        />
      </div>
    </div>
  );
};
