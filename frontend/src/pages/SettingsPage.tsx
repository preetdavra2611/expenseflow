import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Globe, Bot, Shield, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(user?.currencySymbol || '₹');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [telegramUsername, setTelegramUsername] = useState(user?.telegramUsername || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    switch (val) {
      case 'INR':
        setCurrencySymbol('₹');
        break;
      case 'USD':
        setCurrencySymbol('$');
        break;
      case 'EUR':
        setCurrencySymbol('€');
        break;
      case 'GBP':
        setCurrencySymbol('£');
        break;
      case 'AED':
        setCurrencySymbol('AED');
        break;
      default:
        setCurrencySymbol('₹');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await updateUser({
        name,
        currency,
        currencySymbol,
        timezone,
        telegramUsername: telegramUsername || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
          Application & Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure currency defaults, timezone offsets, and Telegram Bot credentials
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Settings successfully saved!
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile & Localization */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Globe className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Profile & Regional Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || 'N/A'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 cursor-pointer"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="AED">AED (AED - UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60 cursor-pointer"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (GMT +0:00)</option>
                <option value="America/New_York">America/New_York (EST -5:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</option>
                <option value="Europe/London">Europe/London (GMT +0:00 / BST +1:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Telegram Bot Integration Details */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Bot className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Telegram Account Integration</h3>
          </div>

          {/* Status Badge */}
          {user?.telegramUserId ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Telegram Connected:</strong> User ID <code className="bg-emerald-950 px-1 py-0.5 rounded">{user.telegramUserId}</code> {user.telegramUsername ? `(@${user.telegramUsername})` : ''}
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-emerald-500/20 rounded-md">Active Sync</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <span>⚠️ Telegram Bot Not Linked Yet</span>
              </div>
              <p className="text-[11px] text-slate-300">
                To link your Telegram account, send this message to the bot on Telegram:
              </p>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-white text-xs select-all">
                /link {user?.email}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Telegram Username</label>
              <input
                type="text"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="@your_username"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
              <p className="text-[11px] text-slate-500 mt-1">Entering your username enables automatic message linking.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Telegram User ID</label>
              <input
                type="text"
                disabled
                value={user?.telegramUserId || 'Auto-linked on first message'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Quick Telegram Bot Setup Instructions */}
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs space-y-2">
            <h4 className="font-bold text-sky-300">🤖 How Multi-User Telegram Sync Works:</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li>Each user signs up on this dashboard with their email & password.</li>
              <li>They send <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300 font-mono">/link their-email@example.com</code> to the Telegram bot.</li>
              <li>The bot automatically binds their Telegram account to their dashboard account.</li>
              <li>All their natural language expenses & incomes are strictly isolated and recorded under their account!</li>
            </ul>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
