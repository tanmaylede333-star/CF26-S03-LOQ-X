import React from 'react';
import { Activity, ShieldAlert, Cpu, GitCompare, RefreshCw, Sparkles, ShieldCheck, Home, ArrowLeft } from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface HeaderProps {
  state: SimulationState;
  onOpenScenarioModal: () => void;
  onOpenComparisonModal: () => void;
  onOpenAdvisorModal: () => void;
  onOpenReproducibilityModal: () => void;
  onReset: () => void;
  onBackToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onOpenScenarioModal,
  onOpenComparisonModal,
  onOpenAdvisorModal,
  onOpenReproducibilityModal,
  onReset,
  onBackToLanding,
}) => {
  const statusConfig = {
    IDLE: { label: "SIMULATION READY", color: "bg-surface-container-high text-on-surface-variant border-border-subtle", dot: "bg-slate-400" },
    RUNNING: { label: "LIVE CASCADE RUNNING", color: "bg-primary/10 text-primary border-primary/40", dot: "bg-primary animate-ping" },
    PAUSED: { label: "SIMULATION PAUSED", color: "bg-status-degraded/15 text-status-degraded border-status-degraded/40", dot: "bg-status-degraded" },
    COMPLETED: { label: "CASCADE STABILIZED", color: "bg-status-healthy/15 text-status-healthy border-status-healthy/40", dot: "bg-status-healthy" },
  }[state.status];

  return (
    <header className="border-b border-border-subtle bg-surface-container-lowest/90 backdrop-blur-md px-4 lg:px-6 py-2.5 sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Product Name */}
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-primary transition-all flex items-center gap-1 text-xs font-telemetry-label font-bold"
              title="Return to Landing Page & Incident Library"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          )}

          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/40 text-primary shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <Cpu className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline-md font-bold tracking-tight text-on-surface text-base lg:text-lg">
                CASCADE CITY
              </span>
              <span className="font-telemetry-label text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high border border-border-subtle text-primary font-bold">
                S-03
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 font-medium">
              <span>Mission Control</span>
              <span className="text-slate-600">•</span>
              <span className="text-primary/80 font-mono">JanNagar Grid</span>
            </p>
          </div>
        </div>

        {/* Center: Virtual Simulation Clock & Active Scenario */}
        <div className="flex items-center gap-2.5 bg-surface-container border border-border-subtle rounded-xl px-3.5 py-1.5 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest font-mono text-on-surface-variant font-semibold">Virtual Time</span>
            <span className="font-mono text-base font-bold text-primary tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
              {formatTime(state.scrubTime !== null ? state.scrubTime : state.currentTime)}
            </span>
          </div>

          <div className="h-6 w-px bg-border-subtle" />

          <button
            onClick={onOpenScenarioModal}
            className="flex flex-col text-left group hover:opacity-90 transition-opacity"
            title="Click to switch scenario"
          >
            <span className="text-[8px] uppercase tracking-widest font-mono text-on-surface-variant font-semibold flex items-center gap-1">
              Scenario
              <span className="text-[8px] text-primary group-hover:underline">[Switch]</span>
            </span>
            <span className="text-xs font-semibold text-on-surface max-w-[180px] lg:max-w-[220px] truncate">
              {state.scenario.name}
            </span>
          </button>

          <div className="h-6 w-px bg-border-subtle" />

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold ${statusConfig.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </div>
        </div>

        {/* Right: Decision Support Actions & Verification */}
        <div className="flex items-center gap-2">
          {/* 1. Resilience Advisor (High Value Action) */}
          <button
            onClick={onOpenAdvisorModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container text-on-primary-container text-xs font-telemetry-data font-bold transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:bg-primary active:scale-95"
            title="Evaluate candidate resilience interventions deterministically"
          >
            <Sparkles className="w-3.5 h-3.5 fill-on-primary-container" />
            <span>Resilience Advisor</span>
          </button>

          {/* 2. Strategy Comparison */}
          <button
            onClick={onOpenComparisonModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs font-telemetry-label font-medium transition-all"
            title="Compare mitigation strategies side-by-side"
          >
            <GitCompare className="w-3.5 h-3.5 text-secondary" />
            <span className="hidden md:inline">Compare</span>
          </button>

          {/* 3. Reproducibility & Replay Verification */}
          <button
            onClick={onOpenReproducibilityModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-status-healthy text-xs font-telemetry-label font-medium transition-all"
            title="Verify deterministic mathematical reproducibility and export JSON"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-status-healthy" />
            <span className="hidden xl:inline">Verify Replay</span>
          </button>

          {/* 4. Reset Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all"
            title="Reset Simulation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high border border-border-subtle text-[9px] font-mono text-status-degraded">
            <ShieldAlert className="w-3 h-3" />
            <span>SYNTHETIC MODEL</span>
          </div>
        </div>
      </div>
    </header>
  );
};
