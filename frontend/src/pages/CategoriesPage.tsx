import React, { useState, useEffect } from 'react';
import { categoriesApi } from '../services/api';
import { Category, TransactionType } from '../types';
import { CategoryModal } from '../components/CategoryModal';
import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeTypeTab, setActiveTypeTab] = useState<TransactionType>('EXPENSE');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesApi.getCategories();
      setCategories(res.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (data: { name: string; type: TransactionType; icon: string; color: string }) => {
    if (selectedCategory) {
      await categoriesApi.updateCategory(selectedCategory.id, data);
    } else {
      await categoriesApi.createCategory(data);
    }
    await fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom category?')) {
      try {
        await categoriesApi.deleteCategory(id);
        await fetchCategories();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Cannot delete category');
      }
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTypeTab);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
            Categories Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Default system categories & custom categories used for parsing and analytics
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 w-fit">
        <button
          onClick={() => setActiveTypeTab('EXPENSE')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTypeTab === 'EXPENSE'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Expense Categories ({categories.filter((c) => c.type === 'EXPENSE').length})
        </button>
        <button
          onClick={() => setActiveTypeTab('INCOME')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTypeTab === 'INCOME'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Income Categories ({categories.filter((c) => c.type === 'INCOME').length})
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-slate-800/40 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="glass-panel p-4 rounded-2xl border flex items-center justify-between group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                    borderColor: `${cat.color}40`,
                    borderWidth: '1px',
                  }}
                >
                  {cat.name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    {cat.isDefault ? 'Default Category' : 'Custom Category'}
                  </p>
                </div>
              </div>

              {!cat.isDefault && (
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setSelectedCategory(cat);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
      />
    </div>
  );
};
