import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DailyAnalyticsItem } from '../types';

interface DailyAreaChartProps {
  data: DailyAnalyticsItem[];
  currencySymbol?: string;
}

export const DailyAreaChart: React.FC<DailyAreaChartProps> = ({ data, currencySymbol = '₹' }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as DailyAnalyticsItem;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white mb-1">Day {item.day} ({item.date})</p>
          <div className="flex items-center justify-between gap-4 text-brand-400">
            <span>Spent today:</span>
            <span className="font-semibold">{currencySymbol}{item.amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-purple-400 pt-1 border-t border-slate-700/60">
            <span>Month Cumulative:</span>
            <span className="font-semibold">{currencySymbol}{item.cumulative.toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">Daily Spending Velocity</h4>
          <p className="text-xs text-slate-400">Day-by-day burn rate throughout the month</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${currencySymbol}${val > 999 ? `${Math.round(val / 1000)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              name="Daily Spend"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorDaily)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
