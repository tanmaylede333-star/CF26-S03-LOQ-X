import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Share2,
  BarChart3,
  Shield,
  Settings,
  User,
  Cpu,
  Home
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

import { User as SupabaseUser } from '@supabase/supabase-js';

export type ActiveNavTab =
  | 'SIMULATOR'
  | 'SCENARIOS'
  | 'IMPACT_ANALYSIS'
  | 'RESILIENCE_ADVISOR'
  | 'SETTINGS';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onReturnToLanding?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  currentUser?: SupabaseUser | null;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onReturnToLanding,
  isDark = true,
  onToggleTheme,
  currentUser,
  onOpenAuth,
}) => {
  const navItems = [
    {
      id: 'SIMULATOR' as ActiveNavTab,
      label: 'Simulator',
      subtitle: 'Graph & City GIS Map',
      icon: Activity,
    },
    {
      id: 'SCENARIOS' as ActiveNavTab,
      label: 'Incident Scenarios',
      subtitle: 'Disruption Profiles',
      icon: Share2,
    },
    {
      id: 'IMPACT_ANALYSIS' as ActiveNavTab,
      label: 'Causal Impact',
      subtitle: 'Propagation Analytics',
      icon: BarChart3,
    },
    {
      id: 'RESILIENCE_ADVISOR' as ActiveNavTab,
      label: 'Resilience Advisor',
      subtitle: 'AI Strategy Evaluation',
      icon: Shield,
    },
  ];

  const isSettingsActive = activeTab === 'SETTINGS';

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col justify-between shrink-0 select-none z-30 font-mono transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div
          onClick={onReturnToLanding}
          className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition-opacity"
          title="Click to return to Landing Page"
        >
          <div className="w-8 h-8 rounded bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white shadow-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black tracking-wider text-[var(--text-primary)] text-sm group-hover:text-[#495464]">
                CASCADE CITY
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider">
              V.2.4.0-RESILIENCE
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] font-semibold w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </div>

          {onReturnToLanding && (
            <button
              onClick={onReturnToLanding}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
              title="Return to Public Landing Page"
            >
              <Home className="w-3 h-3" />
              <span>Landing</span>
            </button>
          )}
        </div>
      </div>

      {/* Streamlined Primary Navigation (4 Primary Views) */}
      <nav className="flex-1 py-3 px-2.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          Primary Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isActive
                  ? 'bg-[#495464] text-white font-bold shadow-[2px_2px_0px_#1e293b] border border-[#334155]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] border border-transparent hover:border-[var(--border-color)]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
              <div className="flex flex-col truncate">
                <span className="truncate font-bold">{item.label}</span>
                <span className={`text-[9px] truncate ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer / Theme Switch / Settings / User Profile */}
      <div className="p-3 border-t border-[var(--border-color)] space-y-2">
        {/* Animated Theme Switch */}
        {onToggleTheme && (
          <div className="px-3 py-1.5 flex items-center justify-between rounded bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-sm">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>
        )}

        <button
          onClick={() => onSelectTab('SETTINGS')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            isSettingsActive
              ? 'bg-[#495464] text-white font-bold shadow-[2px_2px_0px_#1e293b] border border-[#334155]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] border border-transparent hover:border-[var(--border-color)]'
          }`}
        >
          <Settings className={`w-4 h-4 ${isSettingsActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
          <span>System Settings</span>
        </button>

        {/* Auth / Login Option */}
        {!currentUser ? (
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 px-4 rounded-lg bg-[#495464] hover:bg-[#384252] text-white font-mono font-bold text-xs uppercase tracking-widest border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
          >
            LOGIN
          </button>
        ) : (
          <div
            onClick={onOpenAuth}
            className="flex items-center justify-between p-2 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] cursor-pointer hover:border-[#495464] transition-all group"
            title={`Logged in as ${currentUser.email}. Click to manage account.`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-6 h-6 rounded-full bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate group-hover:text-[#495464]">
                  {currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-[var(--text-secondary)] truncate font-mono">
                  ● CLOUD SYNCED
                </span>
              </div>
            </div>
            <button className="text-[9px] font-mono text-[var(--text-secondary)] hover:text-red-400 font-bold px-1.5 py-0.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)]">
              EXIT
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
