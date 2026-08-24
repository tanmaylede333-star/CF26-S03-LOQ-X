import React from 'react';
import { Play, Pause, RotateCcw, Search, ExternalLink, Activity } from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface TopBarProps {
  title: string;
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenScenarioModal: () => void;
}

export const MissionTopBar: React.FC<TopBarProps> = ({
  title,
  state,
  onStart,
  onPause,
  onReset,
  searchQuery,
  onSearchChange,
  onOpenScenarioModal,
}) => {
  const isRunning = state.status === 'RUNNING';
  const currentT = state.scrubTime !== null ? state.scrubTime : state.currentTime;

  return (
    <header className="h-14 bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] px-5 flex items-center justify-between gap-4 shrink-0 font-mono transition-colors duration-200">
      {/* Left: View Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <h2 className="font-heading font-black tracking-wider text-[var(--text-primary)] text-sm uppercase">
          {title}
        </h2>

        <div className="hidden md:flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="text-slate-500">|</span>
          <span className="text-[var(--text-primary)] font-bold">
            T+{formatTime(currentT)}
          </span>
          <span className="text-slate-500">|</span>
          <button
            onClick={onOpenScenarioModal}
            className="text-[var(--text-primary)] hover:opacity-80 transition-opacity uppercase truncate max-w-[200px]"
            title="Switch scenario"
          >
            {state.scenario.name.toUpperCase().replace(/\s+/g, '_').substring(0, 24)}
          </button>
        </div>
      </div>

      {/* Middle: Search Query */}
      <div className="flex-1 max-w-xs hidden lg:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search node logs..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#495464] focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Controls (Reset, Toggle, Pause, Start) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-2 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Reset Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenScenarioModal}
          className="p-2 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Switch Active Scenario"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPause}
          disabled={!isRunning}
          className="px-4 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] disabled:opacity-40 border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold transition-colors"
        >
          PAUSE
        </button>

        <button
          onClick={onStart}
          className={`px-5 py-1.5 rounded text-xs font-extrabold uppercase transition-all shadow-[2px_2px_0px_#1e293b] active:scale-95 border border-[#1e293b] ${
            isRunning
              ? 'bg-[#fbbf24] hover:bg-amber-400 text-[#451a03]'
              : 'bg-[#495464] hover:bg-[#334155] text-white'
          }`}
        >
          {isRunning ? 'RUNNING' : 'START'}
        </button>
      </div>
    </header>
  );
};
