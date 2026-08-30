import React, { useState, useEffect } from 'react';
import { RecurringTransaction, Category } from '../types';
import { X, Repeat, Tag, Calendar, CreditCard, Store } from 'lucide-react';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  recurring?: RecurringTransaction | null;
  categories: Category[];
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recurring,
  categories,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [frequency, setFrequency] = useState<string>('MONTHLY');
  const [nextDate, setNextDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  useEffect(() => {
    if (recurring) {
      setCategoryId(recurring.categoryId);
      setAmount(String(recurring.amount));
      setDescription(recurring.description);
      setMerchant(recurring.merchant || '');
      setPaymentMethod(recurring.paymentMethod);
      setFrequency(recurring.frequency);
      setNextDate(new Date(recurring.nextDate).toISOString().split('T')[0]);
    } else {
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
      setAmount('');
      setDescription('');
      setMerchant('');
      setPaymentMethod('UPI');
      setFrequency('MONTHLY');
      setNextDate(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [recurring, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description (e.g. Netflix, Rent, Broadband)');
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
        description: description.trim(),
        merchant: merchant.trim() || null,
        paymentMethod,
        frequency,
        nextDate: new Date(nextDate).toISOString(),
        active: true,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save recurring item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {recurring ? 'Edit Recurring Schedule' : 'New Recurring Schedule'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Netflix Subscription, Rent"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white font-bold focus:outline-none focus:border-brand-500/60"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Frequency</label>
              <div className="relative">
                <Repeat className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Merchant / Service</label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Netflix, Airtel, Landlord"
                  className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Next Due Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
                />
              </div>
            </div>
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
              {loading ? 'Saving...' : recurring ? 'Update Schedule' : 'Add Recurring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
