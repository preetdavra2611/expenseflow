import React from 'react';
import { Plus, Download, Send, Search } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenTelegramSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenExportModal,
  onOpenTelegramSimulator,
}) => {
  const { filters, setFilters } = useFilters();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Search transactions, merchants..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenTelegramSimulator}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all duration-150"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram Simulator</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all duration-150 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
};
