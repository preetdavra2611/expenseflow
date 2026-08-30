import React from 'react';
import { Budget } from '../types';
import { AlertCircle, CheckCircle2, AlertTriangle, Edit2, Trash2 } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
  currencySymbol?: string;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
  currencySymbol = '₹',
}) => {
  const getProgressColor = () => {
    if (budget.percentageUsed >= 100) return 'bg-rose-500 shadow-rose-500/50';
    if (budget.percentageUsed >= 90) return 'bg-orange-500 shadow-orange-500/50';
    if (budget.percentageUsed >= 75) return 'bg-amber-400 shadow-amber-400/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  const getStatusBadge = () => {
    if (budget.percentageUsed >= 100) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          Exceeded 100%
        </span>
      );
    }
    if (budget.percentageUsed >= 90) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30">
          <AlertTriangle className="w-3 h-3" />
          90% Critical
        </span>
      );
    }
    if (budget.percentageUsed >= 75) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          75% Alert
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        On Track
      </span>
    );
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between group transition-all duration-200 hover:border-slate-700">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: `${budget.categoryColor}20`,
                color: budget.categoryColor,
                borderColor: `${budget.categoryColor}40`,
                borderWidth: '1px',
              }}
            >
              {budget.categoryName[0]}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{budget.categoryName}</h4>
              <p className="text-[11px] text-slate-400 capitalize">{budget.period.toLowerCase()} Budget</p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(budget)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(budget.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">{getStatusBadge()}</div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              {currencySymbol}{budget.spentAmount.toLocaleString('en-IN')}{' '}
              <span className="text-slate-500 font-normal">spent</span>
            </span>
            <span className="font-bold text-white">{budget.percentageUsed}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${getProgressColor()}`}
              style={{ width: `${Math.min(100, budget.percentageUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Budget</span>
          <span className="font-bold text-slate-200">
            {currencySymbol}{budget.budgetAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Remaining</span>
          <span
            className={`font-bold ${
              budget.remainingAmount <= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {currencySymbol}{budget.remainingAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};
