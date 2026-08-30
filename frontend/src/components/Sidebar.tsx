import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Repeat,
  Tags,
  Settings,
  Send,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openTelegramSimulator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openTelegramSimulator }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Logo */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-['Outfit'] font-bold text-lg text-white leading-tight flex items-center gap-1.5">
                Expense<span className="text-brand-400">Flow</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Telegram Finance</p>
            </div>
          </div>
        </div>

        {/* Telegram Quick Trigger Banner */}
        <div className="px-4 pt-4">
          <button
            onClick={openTelegramSimulator}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-brand-500/10 to-purple-500/10 border border-sky-500/20 hover:border-sky-500/40 hover:from-sky-500/20 transition-all duration-200 group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4 fill-sky-400/30 text-sky-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-sky-300">Telegram Bot</p>
                <p className="text-[10px] text-slate-400">Test Natural Input</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Demo User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.currencySymbol || '₹'} ({user?.currency || 'INR'})</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
