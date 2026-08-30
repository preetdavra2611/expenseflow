import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  amount: number;
  currencySymbol?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  currencySymbol = '₹',
  icon: Icon,
  trend,
  accentColor,
  subtitle,
}) => {
  const colorMap = {
    indigo: {
      bg: 'from-indigo-500/10 to-transparent',
      border: 'border-indigo-500/20',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
      glow: 'group-hover:border-indigo-500/40',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-transparent',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    rose: {
      bg: 'from-rose-500/10 to-transparent',
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/20 text-rose-400',
      glow: 'group-hover:border-rose-500/40',
    },
    amber: {
      bg: 'from-amber-500/10 to-transparent',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    sky: {
      bg: 'from-sky-500/10 to-transparent',
      border: 'border-sky-500/20',
      iconBg: 'bg-sky-500/20 text-sky-400',
      glow: 'group-hover:border-sky-500/40',
    },
  };

  const scheme = colorMap[accentColor] || colorMap.indigo;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl bg-gradient-to-b ${scheme.bg} border ${scheme.border} ${scheme.glow} transition-all duration-200 group flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${scheme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
          {currencySymbol}
          {amount.toLocaleString('en-IN')}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
          <span className="text-xs text-slate-400">{trend?.label || subtitle}</span>
        </div>
      </div>
    </div>
  );
};
