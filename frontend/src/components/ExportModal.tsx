import React, { useState } from 'react';
import { useFilters } from '../context/FilterContext';
import { exportApi } from '../services/api';
import { X, FileSpreadsheet, FileText, Download, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { filters } = useFilters();
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      if (format === 'csv') {
        await exportApi.downloadCSV(filters);
      } else if (format === 'excel') {
        await exportApi.downloadExcel(filters);
      } else if (format === 'pdf') {
        await exportApi.downloadPDF(filters);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-brand-400" />
            Export Transactions
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Select Export Format</label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Excel */}
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  format === 'excel'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span className="text-xs font-bold">Excel (.xlsx)</span>
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  format === 'csv'
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-400 shadow-md shadow-brand-500/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs font-bold">CSV</span>
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  format === 'pdf'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs font-bold">PDF Report</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs space-y-1">
            <p className="text-slate-300 font-semibold">Active Filter Scope:</p>
            <p className="text-slate-400">
              • Date Range: <span className="text-slate-200 font-medium capitalize">{filters.dateRange.replace('_', ' ')}</span>
            </p>
            {filters.type && (
              <p className="text-slate-400">
                • Type: <span className="text-slate-200 font-medium">{filters.type}</span>
              </p>
            )}
            {filters.paymentMethod && (
              <p className="text-slate-400">
                • Method: <span className="text-slate-200 font-medium">{filters.paymentMethod}</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDownload}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {success ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Downloaded!
                </>
              ) : loading ? (
                'Generating...'
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
