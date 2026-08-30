import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, insightsApi } from '../services/api';
import {
  CategoryAnalyticsItem,
  MonthlyAnalyticsItem,
  DailyAnalyticsItem,
  SmartInsight,
} from '../types';
import { ExpenseDonutChart } from '../components/ExpenseDonutChart';
import { MonthlyBarChart } from '../components/MonthlyBarChart';
import { DailyAreaChart } from '../components/DailyAreaChart';
import { InsightsPanel } from '../components/InsightsPanel';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [categoriesAnalytics, setCategoriesAnalytics] = useState<CategoryAnalyticsItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalyticsItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyAnalyticsItem[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [catRes, monRes, dayRes, insRes] = await Promise.all([
          dashboardApi.getCategories(),
          dashboardApi.getMonthly(),
          dashboardApi.getDaily(),
          insightsApi.getInsights(),
        ]);

        setCategoriesAnalytics(catRes.categories);
        setMonthlyData(monRes.monthly);
        setDailyData(dayRes.daily);
        setInsights(insRes.insights);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const currencySymbol = user?.currencySymbol || '₹';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
          Financial Intelligence & Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Deep-dive trends, historical cashflow patterns, and AI-driven recommendations
        </p>
      </div>

      {/* Smart Insights Panel */}
      <InsightsPanel insights={insights} loading={loading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-[400px]">
          <ExpenseDonutChart
            categories={categoriesAnalytics}
            totalAmount={categoriesAnalytics.reduce((acc, c) => acc + c.amount, 0)}
            currencySymbol={currencySymbol}
          />
        </div>

        <div className="lg:col-span-7 h-[400px]">
          <MonthlyBarChart data={monthlyData} currencySymbol={currencySymbol} />
        </div>
      </div>

      {/* Daily Burn Rate Full Width */}
      <div className="h-[380px]">
        <DailyAreaChart data={dailyData} currencySymbol={currencySymbol} />
      </div>
    </div>
  );
};
