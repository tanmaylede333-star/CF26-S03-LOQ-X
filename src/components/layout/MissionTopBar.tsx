import React from 'react';
import { Play, Pause, RotateCcw, ArrowRight, Layers, Activity } from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface TopBarProps {
  title: string;
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onNavigateToScenarios: () => void;
}

export const MissionTopBar: React.FC<TopBarProps> = ({
  title,
  state,
  onStart,
  onPause,
  onReset,
  onNavigateToScenarios,
}) => {
  const isRunning = state.status === 'RUNNING';
  const currentT = state.scrubTime !== null ? state.scrubTime : state.currentTime;

  return (
    <header className="h-14 bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] px-5 flex items-center justify-between gap-4 shrink-0 font-mono transition-colors duration-200">
      {/* Left: View Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="font-heading font-black tracking-wider text-[var(--text-primary)] text-sm uppercase">
          {title}
        </h2>
      </div>

      {/* Center: Live Virtual Simulation Clock & Active Scenario */}
      <div className="flex items-center gap-3 bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-1.5 shadow-inner">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">V-TIME:</span>
          <span className="text-[var(--text-primary)] font-bold font-mono text-sm">
            T+{formatTime(currentT)}
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--border-color)]" />

        <button
          onClick={onNavigateToScenarios}
          className="flex items-center gap-1.5 text-left group hover:opacity-85 transition-opacity"
          title="Switch Active Scenario in Scenario Lab"
        >
          <Layers className="w-3 h-3 text-[var(--text-secondary)]" />
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">SCENARIO:</span>
          <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors uppercase truncate max-w-[190px] lg:max-w-[240px]">
            {state.scenario.name}
          </span>
          <span className="text-[9px] font-bold text-[var(--text-tertiary)] group-hover:text-emerald-400 group-hover:underline">
            [Switch]
          </span>
        </button>

        <div className="h-4 w-px bg-[var(--border-color)]" />

        {/* Live Status Indicator */}
        <span
          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            state.status === 'RUNNING'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse'
              : state.status === 'PAUSED'
              ? 'bg-amber-950 text-amber-300 border border-amber-700'
              : state.status === 'COMPLETED'
              ? 'bg-blue-950 text-blue-300 border border-blue-700'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          {state.status}
        </span>
      </div>

      {/* Right: Core Simulation Controls (Reset, Pause, Start) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-2 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Reset Simulation to T+00:00"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPause}
          disabled={!isRunning}
          className="px-3.5 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] disabled:opacity-40 border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold transition-colors"
        >
          PAUSE
        </button>

        <button
          onClick={onStart}
          className={`px-4 py-1.5 rounded text-xs font-extrabold uppercase transition-all shadow-[2px_2px_0px_#1e293b] active:scale-95 border border-[#1e293b] flex items-center gap-1.5 ${
            isRunning
              ? 'bg-[#fbbf24] hover:bg-amber-400 text-[#451a03]'
              : 'bg-[#495464] hover:bg-[#334155] text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>RUNNING</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
