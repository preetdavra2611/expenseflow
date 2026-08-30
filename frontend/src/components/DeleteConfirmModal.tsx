import React, { useState } from 'react';
import { Transaction } from '../types';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transaction: Transaction | null;
  currencySymbol?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  currencySymbol = '₹',
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">Delete Transaction?</h3>
        <p className="text-xs text-slate-400 mb-4">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-slate-200">"{transaction.description}"</span> for{' '}
          <span className="font-semibold text-slate-200">
            {currencySymbol}
            {transaction.amount}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-medium rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
