import React from 'react';
import { Play, Pause, RotateCcw, FastForward, PlaySquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SimulationState } from '../../types/simulation';

interface ControlsProps {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onReplay: () => void;
  onSetSpeed: (speed: number) => void;
  onOpenFailureModal: () => void;
  onOpenRecoveryModal: () => void;
}

export const SimulationControls: React.FC<ControlsProps> = ({
  state,
  onStart,
  onPause,
  onStep,
  onReset,
  onReplay,
  onSetSpeed,
  onOpenFailureModal,
  onOpenRecoveryModal,
}) => {
  const isRunning = state.status === "RUNNING";
  const isCompleted = state.status === "COMPLETED";

  const speeds = [1, 2, 5, 10];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-sm font-mono">
      {/* Primary Execution Buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={isCompleted ? onReplay : onStart}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs tracking-wider transition-all shadow-[2px_2px_0px_#1e293b] border border-[#1e293b] active:scale-95 uppercase font-heading"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isCompleted ? "REPLAY CASCADE" : "RUN SIMULATION"}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wider transition-all shadow-[2px_2px_0px_#78350f] border border-[#78350f] active:scale-95 uppercase font-heading"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>PAUSE</span>
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isRunning || isCompleted}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] disabled:opacity-40 disabled:cursor-not-allowed border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all active:scale-95"
          title="Advance by single simulation event step"
        >
          <PlaySquare className="w-3.5 h-3.5" />
          <span>STEP</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all active:scale-95"
          title="Reset to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1.5 bg-[var(--card-subtle)] border border-[var(--border-color)] px-2 py-1 rounded-lg">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1 mr-1">
          <FastForward className="w-3 h-3 text-[var(--text-secondary)]" />
          Speed:
        </span>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
              state.speed === s
                ? "bg-[#495464] text-white shadow-sm border border-[#1e293b]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Disruption & Recovery Interventions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenFailureModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-all active:scale-95"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Inject Disruption</span>
        </button>

        <button
          onClick={onOpenRecoveryModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold transition-all active:scale-95"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Apply Recovery</span>
        </button>
      </div>
    </div>
  );
};
