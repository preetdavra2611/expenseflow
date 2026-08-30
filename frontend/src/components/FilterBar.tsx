import React from 'react';
import { FilterState, Category } from '../types';
import { RotateCcw, Calendar, Tag, CreditCard, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  categories: Category[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  categories,
}) => {
  const datePresets: { id: FilterState['dateRange']; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
      {/* Date Presets Pill Selector */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80">
        {datePresets.map((preset) => {
          const isActive = filters.dateRange === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onFilterChange({ dateRange: preset.id })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Picker inputs (when custom selected) */}
      {filters.dateRange === 'custom' && (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
          </div>
          <span className="text-slate-400">to</span>
          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <div className="relative flex items-center">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={filters.categoryId || ''}
            onChange={(e) => onFilterChange({ categoryId: e.target.value })}
            className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange({ type: e.target.value as any })}
            className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="INCOME">Income Only</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="relative flex items-center">
          <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={filters.paymentMethod || ''}
            onChange={(e) => onFilterChange({ paymentMethod: e.target.value as any })}
            className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
          >
            <option value="">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="WALLET">Wallet</option>
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset Filters"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
