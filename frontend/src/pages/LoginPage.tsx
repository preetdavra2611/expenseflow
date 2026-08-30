import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await loginDemo();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/25">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="font-['Outfit'] font-bold text-2xl text-white">
            Expense<span className="text-brand-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Telegram-powered personal finance intelligence
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <button
          onClick={handleDemoLogin}
          disabled={demoLoading}
          className="w-full mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 border border-brand-500/30 hover:border-brand-500/60 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/30 flex items-center justify-center text-brand-300 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 fill-brand-300/30" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Explore with Demo Account</p>
              <p className="text-[10px] text-slate-400">Pre-seeded with realistic Indian financial data</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-semibold absolute">
            Or sign in with email
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-white focus:outline-none focus:border-brand-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};
