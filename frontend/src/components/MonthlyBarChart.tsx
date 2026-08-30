import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlyAnalyticsItem } from '../types';

interface MonthlyBarChartProps {
  data: MonthlyAnalyticsItem[];
  currencySymbol?: string;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data, currencySymbol = '₹' }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white mb-1.5">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Income:</span>
            <span className="font-semibold">{currencySymbol}{payload[0]?.value?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Expense:</span>
            <span className="font-semibold">{currencySymbol}{payload[1]?.value?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-brand-400 pt-1 border-t border-slate-700/60">
            <span>Net Savings:</span>
            <span className="font-semibold">
              {currencySymbol}{((payload[0]?.value || 0) - (payload[1]?.value || 0)).toLocaleString('en-IN')}
            </span>
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
          <h4 className="text-sm font-bold text-white tracking-wide">Monthly Cashflow</h4>
          <p className="text-xs text-slate-400">Income vs. Expense comparison over time</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${currencySymbol}${val > 999 ? `${Math.round(val / 1000)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
