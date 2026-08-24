import React from 'react';
import { Play, Pause, RotateCcw, Clock, FastForward, SkipBack, SkipForward, History, Radio } from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface TimelineScrubberProps {
  state: SimulationState;
  onScrub: (time: number | null) => void;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onReplay: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  state,
  onScrub,
  onStart,
  onPause,
  onStep,
  onReset,
  onReplay,
}) => {
  const isRunning = state.status === 'RUNNING';
  const isCompleted = state.status === 'COMPLETED';
  const maxTime = state.scenario.parameters.maxSimulationTime || 60;
  const currentViewTime = state.scrubTime !== null ? state.scrubTime : state.currentTime;

  // Find unique event timestamps for track ticks
  const eventTimestamps = Array.from(
    new Set(state.events.map((e) => e.timestamp).filter((t) => t <= state.currentTime))
  ).sort((a, b) => a - b);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val === state.currentTime && state.scrubTime === null) return;
    onScrub(val);
  };

  const handleJumpToTimestamp = (t: number) => {
    onScrub(t);
  };

  const handleReturnToLive = () => {
    onScrub(null);
  };

  return (
    <div className="glass-panel p-3 rounded-xl flex flex-col gap-2.5 border-[var(--border-color)] bg-[var(--surface-bg)] shadow-sm">
      {/* Top Header: Clock status & Scrubbing State */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="font-bold text-[var(--text-primary)] font-heading">
            SIMULATION TIMELINE CONTROLLER
          </span>
          {state.scrubTime !== null ? (
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600 text-amber-300 font-bold text-[10px] flex items-center gap-1">
              <History className="w-3 h-3 animate-spin" /> SCRUBBING T+{state.scrubTime}m
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[10px] flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> LIVE T+{state.currentTime}m
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {state.scrubTime !== null && (
            <button
              onClick={handleReturnToLive}
              className="px-2.5 py-1 rounded bg-[#495464] hover:bg-[#334155] border border-[#1e293b] text-white text-[10px] font-bold transition-all shadow-sm"
            >
              Return to Live (T+{state.currentTime}m)
            </button>
          )}

          <span className="text-[var(--text-tertiary)] text-[11px]">
            Range: 0m — {maxTime}m
          </span>
        </div>
      </div>

      {/* Interactive Timeline Track & Slider */}
      <div className="relative pt-1 pb-1">
        {/* Event Marker Ticks */}
        <div className="relative h-2.5 w-full mb-1">
          {state.events.map((e) => {
            const leftPct = (e.timestamp / maxTime) * 100;
            const isScrubbedHere = currentViewTime === e.timestamp;
            const isRecovery = e.type === 'RECOVERY_STARTED' || e.type === 'RECOVERY_COMPLETED';
            const isFailure = e.type === 'FAILURE_INJECTED' || e.type === 'FAILURE_PROPAGATED';

            return (
              <button
                key={e.id}
                onClick={() => handleJumpToTimestamp(e.timestamp)}
                style={{ left: `${Math.min(100, Math.max(0, leftPct))}%` }}
                className={`absolute -top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-all hover:scale-150 z-10 ${
                  isScrubbedHere
                    ? 'bg-[#BBBFCA] ring-2 ring-[#495464] ring-offset-1 scale-125'
                    : isRecovery
                    ? 'bg-emerald-400 border border-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : isFailure
                    ? 'bg-rose-500 border border-slate-900'
                    : 'bg-amber-400 border border-slate-900'
                }`}
                title={`Jump to T+${e.timestamp}m: ${e.message}`}
              />
            );
          })}
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max={Math.max(state.currentTime, 1)}
          value={currentViewTime}
          onChange={handleSliderChange}
          className="w-full accent-[#495464] bg-[var(--card-subtle)] rounded-lg h-2.5 cursor-pointer hover:bg-[var(--card-subtle)] transition-colors"
        />

        {/* Time Labels */}
        <div className="flex justify-between text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
          <span>T+00:00 (Origin)</span>
          <span className="text-[var(--text-primary)] font-bold">
            Inspecting State at: {formatTime(currentViewTime)}
          </span>
          <span>T+{maxTime}:00 (Cap)</span>
        </div>
      </div>
    </div>
  );
};
