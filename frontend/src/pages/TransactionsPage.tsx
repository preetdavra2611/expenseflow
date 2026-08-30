import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { transactionsApi, categoriesApi } from '../services/api';
import { Transaction, Category } from '../types';
import { FilterBar } from '../components/FilterBar';
import { TransactionTable } from '../components/TransactionTable';
import { Plus, Download } from 'lucide-react';

interface TransactionsPageProps {
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenAddModal,
  onOpenExportModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { user } = useAuth();
  const { filters, setFilters, resetFilters } = useFilters();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (page = pagination.page) => {
    try {
      setLoading(true);
      const [txRes, catRes] = await Promise.all([
        transactionsApi.getTransactions({ ...filters, page, limit: pagination.limit }),
        categoriesApi.getCategories(),
      ]);

      setTransactions(txRes.data);
      setPagination(txRes.pagination);
      setCategories(catRes.categories);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
            Transactions History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View, search, edit, and organize all your expense & income records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onReset={resetFilters}
        categories={categories}
      />

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
        currencySymbol={user?.currencySymbol || '₹'}
      />
    </div>
  );
};
