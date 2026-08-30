import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RecurringPage } from './pages/RecurringPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TransactionModal } from './components/TransactionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ExportModal } from './components/ExportModal';
import { TelegramSimulatorModal } from './components/TelegramSimulatorModal';
import { transactionsApi, categoriesApi } from './services/api';
import { Transaction, Category } from './types';

export const App: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Global Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (token) {
      categoriesApi.getCategories().then((res) => {
        setCategories(res.categories);
      }).catch(console.error);
    }
  }, [token, refreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-medium">Initializing ExpenseFlow...</p>
      </div>
    );
  }

  if (!user || !token) {
    return isRegisterMode ? (
      <RegisterPage onSwitchToLogin={() => setIsRegisterMode(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setIsRegisterMode(true)} />
    );
  }

  const handleSaveTransaction = async (data: any) => {
    if (selectedTransaction) {
      await transactionsApi.updateTransaction(selectedTransaction.id, data);
    } else {
      await transactionsApi.createTransaction(data);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleConfirmDelete = async () => {
    if (selectedTransaction) {
      await transactionsApi.deleteTransaction(selectedTransaction.id);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            key={refreshTrigger}
            onOpenAddModal={() => {
              setSelectedTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setSelectedTransaction(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={(tx) => {
              setSelectedTransaction(tx);
              setIsDeleteModalOpen(true);
            }}
          />
        );
      case 'transactions':
        return (
          <TransactionsPage
            key={refreshTrigger}
            onOpenAddModal={() => {
              setSelectedTransaction(null);
              setIsAddModalOpen(true);
            }}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onEditTransaction={(tx) => {
              setSelectedTransaction(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={(tx) => {
              setSelectedTransaction(tx);
              setIsDeleteModalOpen(true);
            }}
          />
        );
      case 'analytics':
        return <AnalyticsPage key={refreshTrigger} />;
      case 'budgets':
        return <BudgetsPage key={refreshTrigger} />;
      case 'recurring':
        return <RecurringPage key={refreshTrigger} />;
      case 'categories':
        return <CategoriesPage key={refreshTrigger} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onOpenAddModal={() => {
              setSelectedTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setSelectedTransaction(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={(tx) => {
              setSelectedTransaction(tx);
              setIsDeleteModalOpen(true);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openTelegramSimulator={() => setIsTelegramModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenAddModal={() => {
            setSelectedTransaction(null);
            setIsAddModalOpen(true);
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenTelegramSimulator={() => setIsTelegramModalOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        categories={categories}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        transaction={selectedTransaction}
        currencySymbol={user?.currencySymbol || '₹'}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <TelegramSimulatorModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        onTransactionCreated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};
export default App;
