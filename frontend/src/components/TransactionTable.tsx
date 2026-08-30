import React from 'react';
import { Transaction } from '../types';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Store, CreditCard } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  currencySymbol?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  currencySymbol = '₹',
}) => {
  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-2xl animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/4"></div>
        <div className="h-48 bg-slate-800/50 rounded-xl"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Store className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">No transactions found</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          No records match your filters. Try adjusting filters or send an expense via Telegram bot.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Merchant / Note</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const dateStr = new Date(tx.transactionDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-800/40 transition-colors duration-150 group"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-300">
                    {dateStr}
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4 font-semibold text-white max-w-[200px] truncate">
                    {tx.description}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                      style={{
                        backgroundColor: `${tx.category?.color || '#6366f1'}15`,
                        borderColor: `${tx.category?.color || '#6366f1'}35`,
                        color: tx.category?.color || '#6366f1',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: tx.category?.color || '#6366f1' }}
                      />
                      {tx.category?.name || 'Uncategorized'}
                    </span>
                  </td>

                  {/* Merchant / Note */}
                  <td className="py-3.5 px-4 text-slate-400 max-w-[160px] truncate">
                    {tx.merchant ? (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Store className="w-3 h-3 text-slate-400" />
                        {tx.merchant}
                      </span>
                    ) : tx.notes ? (
                      <span className="italic">{tx.notes}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Payment Method */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50 text-[11px] font-medium">
                      <CreditCard className="w-2.5 h-2.5 text-slate-400" />
                      {tx.paymentMethod}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {tx.type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-['Outfit'] font-bold text-sm ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {currencySymbol}
                      {tx.amount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(tx)}
                        title="Edit Transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        title="Delete Transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing page <span className="font-semibold text-slate-200">{pagination.page}</span> of{' '}
          <span className="font-semibold text-slate-200">{pagination.totalPages || 1}</span> (Total{' '}
          {pagination.total} records)
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-1.5 rounded-lg border border-slate-700/60 bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-1.5 rounded-lg border border-slate-700/60 bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
