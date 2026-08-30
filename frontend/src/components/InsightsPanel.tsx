import React from 'react';
import { SmartInsight } from '../types';
import { Sparkles, TrendingUp, TrendingDown, PieChart, Calendar, BarChart3, AlertTriangle, PiggyBank } from 'lucide-react';

interface InsightsPanelProps {
  insights: SmartInsight[];
  loading?: boolean;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, loading }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return TrendingUp;
      case 'TrendingDown':
        return TrendingDown;
      case 'PieChart':
        return PieChart;
      case 'Calendar':
        return Calendar;
      case 'BarChart3':
        return BarChart3;
      case 'AlertTriangle':
        return AlertTriangle;
      case 'PiggyBank':
        return PiggyBank;
      default:
        return Sparkles;
    }
  };

  const getSeverityStyle = (severity: SmartInsight['severity']) => {
    switch (severity) {
      case 'POSITIVE':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'WARNING':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'INFO':
        return 'bg-brand-500/10 border-brand-500/30 text-brand-400';
      default:
        return 'bg-slate-800/80 border-slate-700/60 text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Sparkles className="w-4 h-4 fill-white/20" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">Smart Spending Insights</h4>
          <p className="text-xs text-slate-400">Personalized data-driven highlights from your habits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {insights.map((insight) => {
          const Icon = getIcon(insight.icon);
          const style = getSeverityStyle(insight.severity);
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-150 hover:scale-[1.01] ${style}`}
            >
              <div className="p-2 rounded-lg bg-slate-950/40 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white mb-1">{insight.title}</h5>
                <p className="text-xs text-slate-300 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
