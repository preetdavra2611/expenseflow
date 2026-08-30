import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, PaymentMethod } from '../types';
import { X, Calendar, CreditCard, Tag, Store, AlignLeft } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  transaction?: Transaction | null;
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  categories,
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setDescription(transaction.description);
      setMerchant(transaction.merchant || '');
      setPaymentMethod(transaction.paymentMethod);
      setTransactionDate(new Date(transaction.transactionDate).toISOString().split('T')[0]);
      setNotes(transaction.notes || '');
    } else {
      setType('EXPENSE');
      setAmount('');
      setDescription('');
      setMerchant('');
      setPaymentMethod('UPI');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
    setError(null);
  }, [transaction, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
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
        type,
        amount: parseFloat(amount),
        categoryId,
        description: description.trim(),
        merchant: merchant.trim() || null,
        paymentMethod,
        transactionDate: new Date(transactionDate).toISOString(),
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                const expCat = categories.find((c) => c.type === 'EXPENSE');
                if (expCat) setCategoryId(expCat.id);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                const incCat = categories.find((c) => c.type === 'INCOME');
                if (incCat) setCategoryId(incCat.id);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white font-['Outfit'] font-bold text-base focus:outline-none focus:border-brand-500/60"
              />
            </div>
          </div>

          {/* Description & Merchant Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner with team"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Merchant / Vendor</label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Domino's, Uber"
                  className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
                />
              </div>
            </div>
          </div>

          {/* Category & Payment Method Grid */}
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
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Payment Method</label>
              <div className="relative">
                <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
                >
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="WALLET">Wallet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Transaction Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes (Optional)</label>
            <div className="relative">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or tags..."
                rows={2}
                className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all duration-150"
            >
              {loading ? 'Saving...' : transaction ? 'Save Changes' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
