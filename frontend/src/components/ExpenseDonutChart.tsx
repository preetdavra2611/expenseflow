import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryAnalyticsItem } from '../types';

interface ExpenseDonutChartProps {
  categories: CategoryAnalyticsItem[];
  totalAmount: number;
  currencySymbol?: string;
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  categories,
  totalAmount,
  currencySymbol = '₹',
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center h-80 text-slate-400">
        <p className="text-sm">No expense data for this period</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryAnalyticsItem;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-slate-200">{data.name}</span>
          </div>
          <p className="text-sm font-bold text-white">
            {currencySymbol}
            {data.amount.toLocaleString('en-IN')}
          </p>
          <p className="text-slate-400 mt-0.5">{data.percentage}% of total expenses ({data.count} transactions)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">Expense by Category</h4>
          <p className="text-xs text-slate-400">Spending breakdown by category</p>
        </div>
        <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
          Total: {currencySymbol}
          {totalAmount.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={categories}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              stroke="none"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Category</span>
          <span className="text-sm font-bold text-white max-w-[100px] truncate text-center">
            {categories[0]?.name || 'N/A'}
          </span>
          <span className="text-xs font-semibold text-brand-400">
            {categories[0]?.percentage || 0}%
          </span>
        </div>
      </div>

      {/* Category Pills List */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 max-h-24 overflow-y-auto pr-1">
        {categories.slice(0, 6).map((cat) => (
          <div key={cat.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-300 truncate font-medium">{cat.name}</span>
            </div>
            <span className="text-slate-200 font-semibold shrink-0 ml-1">
              {currencySymbol}{cat.amount.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
