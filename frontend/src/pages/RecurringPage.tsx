import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { recurringApi, categoriesApi } from '../services/api';
import { RecurringTransaction, Category } from '../types';
import { RecurringModal } from '../components/RecurringModal';
import { Plus, Repeat, Calendar, CreditCard, Play, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export const RecurringPage: React.FC = () => {
  const { user } = useAuth();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState<string | null>(null);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const [rRes, cRes] = await Promise.all([
        recurringApi.getRecurring(),
        categoriesApi.getCategories('EXPENSE'),
      ]);
      setRecurring(rRes.recurring);
      setCategories(cRes.categories);
    } catch (err) {
      console.error('Failed to load recurring items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleSaveRecurring = async (data: any) => {
    if (selectedRecurring) {
      await recurringApi.updateRecurring(selectedRecurring.id, data);
    } else {
      await recurringApi.createRecurring(data);
    }
    await fetchRecurring();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring schedule?')) {
      await recurringApi.deleteRecurring(id);
      await fetchRecurring();
    }
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    await recurringApi.updateRecurring(item.id, { active: !item.active });
    await fetchRecurring();
  };

  const handleProcessDue = async () => {
    setProcessing(true);
    setProcessMessage(null);
    try {
      const res = await recurringApi.processDue();
      setProcessMessage(
        res.processed > 0
          ? `✅ Successfully processed ${res.processed} due recurring transaction(s)!`
          : 'ℹ️ No transactions were due today.'
      );
      await fetchRecurring();
      setTimeout(() => setProcessMessage(null), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const currencySymbol = user?.currencySymbol || '₹';
  const monthlyTotal = recurring
    .filter((r) => r.active)
    .reduce((acc, r) => {
      let multiplier = 1;
      if (r.frequency === 'DAILY') multiplier = 30;
      if (r.frequency === 'WEEKLY') multiplier = 4.3;
      if (r.frequency === 'YEARLY') multiplier = 1 / 12;
      return acc + r.amount * multiplier;
    }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
            Recurring Bills & Subscriptions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generate transactions for fixed commitments like rent, utilities, and memberships
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleProcessDue}
            disabled={processing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>{processing ? 'Processing...' : 'Run Due Schedules'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedRecurring(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {processMessage && (
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 animate-in fade-in">
          {processMessage}
        </div>
      )}

      {/* Monthly Recurring Commitment Card */}
      <div className="glass-panel p-6 rounded-2xl border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-brand-500/10 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Monthly Fixed Commitment</h4>
            <p className="text-xs text-slate-400">Total estimated monthly cost of all active subscriptions</p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <span className="text-2xl font-bold font-['Outfit'] text-purple-400">
            {currencySymbol}
            {Math.round(monthlyTotal).toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400 block">/ month</span>
        </div>
      </div>

      {/* Schedules Table */}
      {loading ? (
        <div className="glass-panel p-8 rounded-2xl animate-pulse h-64"></div>
      ) : recurring.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">No recurring schedules</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Add recurring commitments like Rent, Netflix, Spotify, or WiFi to have them automatically recorded.
          </p>
          <button
            onClick={() => {
              setSelectedRecurring(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20"
          >
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Frequency</th>
                  <th className="py-3.5 px-4">Next Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recurring.map((item) => {
                  const nextDateStr = new Date(item.nextDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.description}
                        {item.merchant && (
                          <span className="text-[11px] font-normal text-slate-400 block">{item.merchant}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                          style={{
                            backgroundColor: `${item.category.color}15`,
                            borderColor: `${item.category.color}35`,
                            color: item.category.color,
                          }}
                        >
                          {item.category.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-[11px]">
                          {item.frequency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {nextDateStr}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                            item.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.active ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" /> Paused
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right font-['Outfit'] font-bold text-sm text-white">
                        {currencySymbol}
                        {item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRecurring(item);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <RecurringModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveRecurring}
        recurring={selectedRecurring}
        categories={categories}
      />
    </div>
  );
};
