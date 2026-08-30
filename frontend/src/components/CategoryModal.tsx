import React, { useState, useEffect } from 'react';
import { Category, TransactionType } from '../types';
import { X, Tag, Palette } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: TransactionType; icon: string; color: string }) => Promise<void>;
  category?: Category | null;
}

const COLOR_PALETTE = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#a855f7', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('Tag');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color);
      setIcon(category.icon);
    } else {
      setName('');
      setType('EXPENSE');
      setColor('#6366f1');
      setIcon('Tag');
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        type,
        color,
        icon,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save category');
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
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {category ? 'Edit Category' : 'New Custom Category'}
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

          {/* Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income Category
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pet Care, Gaming, Side Hustle"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Select Color Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all ${
                    color === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
