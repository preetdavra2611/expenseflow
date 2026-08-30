import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetsApi, categoriesApi } from '../services/api';
import { Budget, Category } from '../types';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetModal } from '../components/BudgetModal';
import { Plus, Target, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([
        budgetsApi.getBudgets(),
        categoriesApi.getCategories('EXPENSE'),
      ]);
      setBudgets(bRes.budgets);
      setCategories(cRes.categories);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSaveBudget = async (data: { categoryId: string; amount: number; period?: string }) => {
    await budgetsApi.upsertBudget(data);
    await fetchBudgets();
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Are you sure you want to remove this category budget?')) {
      await budgetsApi.deleteBudget(id);
      await fetchBudgets();
    }
  };

  const currencySymbol = user?.currencySymbol || '₹';

  const totalBudget = budgets.reduce((acc, b) => acc + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const exceededCount = budgets.filter((b) => b.percentageUsed >= 100).length;
  const criticalCount = budgets.filter((b) => b.percentageUsed >= 90 && b.percentageUsed < 100).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
            Monthly Budget Health
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track category spending caps with automatic 75%, 90%, and 100% alerts
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedBudget(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Allocated */}
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Allocated Budget</span>
            <Target className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold font-['Outfit'] text-white">
            {currencySymbol}
            {totalBudget.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1">{budgets.length} Active Categories</p>
        </div>

        {/* Total Spent */}
        <div className="glass-panel p-5 rounded-2xl border-rose-500/20 bg-gradient-to-b from-rose-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Spent</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-['Outfit'] text-white">
            {currencySymbol}
            {totalSpent.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1">{overallPercentage}% of total limit</p>
        </div>

        {/* Total Remaining */}
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Remaining Buffer</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-['Outfit'] text-emerald-400">
            {currencySymbol}
            {totalRemaining.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Available to spend</p>
        </div>

        {/* Alerts Count */}
        <div className="glass-panel p-5 rounded-2xl border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Budget Alerts</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-['Outfit'] text-amber-400">
            {exceededCount + criticalCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {exceededCount} Exceeded, {criticalCount} Critical
          </p>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-800/40 rounded-2xl"></div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">No budgets set</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Create monthly spending limits for categories like Food, Transport, or Shopping to stay in control.
          </p>
          <button
            onClick={() => {
              setSelectedBudget(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={(budget) => {
                setSelectedBudget(budget);
                setModalOpen(true);
              }}
              onDelete={handleDeleteBudget}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveBudget}
        budget={selectedBudget}
        categories={categories}
      />
    </div>
  );
};
