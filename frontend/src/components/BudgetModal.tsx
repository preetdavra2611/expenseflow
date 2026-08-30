import React, { useState, useEffect } from 'react';
import { Budget, Category } from '../types';
import { X, Target, Tag } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { categoryId: string; amount: number; period?: string }) => Promise<void>;
  budget?: Budget | null;
  categories: Category[];
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budget,
  categories,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [period, setPeriod] = useState<string>('MONTHLY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId);
      setAmount(String(budget.budgetAmount));
      setPeriod(budget.period || 'MONTHLY');
    } else {
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
      setAmount('');
      setPeriod('MONTHLY');
    }
    setError(null);
  }, [budget, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid monthly budget limit');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        categoryId,
        amount: parseFloat(amount),
        period,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {budget ? 'Edit Budget' : 'Set Category Budget'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Expense Category</label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                disabled={!!budget}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer disabled:opacity-60"
              >
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Monthly Budget Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 8000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white font-['Outfit'] font-bold text-base focus:outline-none focus:border-brand-500/60"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              You will receive automatic alerts when you reach 75%, 90%, and 100% of this limit.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : budget ? 'Update Budget' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
