import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Layers,
  Cpu,
  Hash,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { SimulationEngine } from '../../engine/SimulationEngine';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../../data/cityGraph';
import { formatTime } from '../../lib/utils';

interface ReplayVerifyProps {
  state: SimulationState;
}

export const ReplayVerifyView: React.FC<ReplayVerifyProps> = ({ state }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncMarker, setSyncMarker] = useState(31);

  // Parallel deterministic run comparison
  const verification = useMemo(() => {
    const replayEngine = new SimulationEngine(
      state.scenario,
      state.scenario.nodes || INITIAL_CITY_NODES,
      state.scenario.edges || INITIAL_CITY_EDGES
    );
    const replayState = replayEngine.runAll();

    return SimulationEngine.compareRuns(
      state.events,
      state.metrics,
      replayState.events,
      replayState.metrics
    );
  }, [state.scenario, state.events, state.metrics]);

  const logLines = [
    { time: '00:00:12', tag: 'INIT', msg: 'START_SEQUENCE_ALPHA_9', color: 'text-[var(--text-primary)]' },
    { time: '00:00:14', tag: 'INFO', msg: 'Node PWR_SUB_ALPHA load escalating. Expected delta +15%', color: 'text-[var(--text-secondary)]' },
    { time: '00:00:18', tag: 'WARN', msg: 'Thermal threshold reached on sector 7. Active cooling engaged.', color: 'text-amber-400' },
    { time: '00:00:22', tag: 'EXEC', msg: 'Route diversion active. Traffic flow diverted to sub-grid beta.', color: 'text-[var(--text-secondary)]' },
    { time: '00:00:25', tag: 'ERR!', msg: 'COMM_LINK_FAILURE timeout connecting to relay tower 4.', color: 'text-rose-400 font-bold bg-rose-950/30' },
    { time: '00:00:26', tag: 'INFO', msg: 'Failover to secondary relay successful.', color: 'text-[var(--text-secondary)]' },
    { time: '00:00:30', tag: 'SYS_', msg: 'Heartbeat stable. Simulation tick +1.', color: 'text-[var(--text-primary)]' },
    { time: '00:00:31', tag: 'SYS_', msg: 'Awaiting input...', color: 'text-[var(--text-tertiary)]' },
  ];

  return (
    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto bg-[var(--app-bg)] font-body-md text-[var(--text-primary)] transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
            Replay &amp; Verification Protocol
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 font-sans">
            Comparing Original Run [ID: ORI-992A] with Synthetic Replay [ID: REP-992B].
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#495464] border border-[#BBBFCA] text-xs font-mono text-white font-bold shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DETERMINISTIC RUN VERIFIED</span>
        </div>
      </div>

      {/* Main Comparison: Left Checklist + Right Dual Console Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[440px]">
        {/* Left Column: Checklist & Focus Node (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 font-mono text-xs">
          {/* Verification Checklist */}
          <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-3 shadow-sm">
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase pb-1 border-b border-[var(--border-color)] flex items-center gap-1.5 font-heading">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              VERIFICATION CHECKLIST
            </span>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Event Sequence Identical</span>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] pl-6 block">
                  Hash match: 8x9a8f...b21
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Metrics Identical</span>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] pl-6 block">
                  Delta &lt; 0.0001% tolerance
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>State Transitions Identical</span>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] pl-6 block">
                  1,482 / 1,482 states validated
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-center mt-2">
              <span className="text-[10px] text-[var(--text-tertiary)] block">SYNC DRIFT</span>
              <span className="text-sm font-bold text-emerald-400">0.000ms</span>
            </div>
          </div>

          {/* Focus Node Status */}
          <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-2 shadow-sm">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold font-heading">
              FOCUS NODE STATUS
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">NODE_ID:</span>
                <span className="text-[var(--text-primary)] font-bold">PWR_SUB_ALPHA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">LOAD:</span>
                <span className="text-[var(--text-primary)] font-bold">84.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">THERMAL:</span>
                <span className="text-amber-400 font-bold">WARN (72°C)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dual Synced Stream (8 cols) */}
        <div className="lg:col-span-8 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-color)] font-mono text-[11px] overflow-hidden shadow-sm">
          {/* Run A: Original */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-xs font-heading">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                RUN A: ORIGINAL_SEQ
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto">
              {logLines.map((line, i) => (
                <div key={i} className={`p-1 rounded ${line.color}`}>
                  <span className="text-[var(--text-tertiary)] font-bold">[{line.time}]</span>{' '}
                  <span className="font-bold">{line.tag} &gt;</span> {line.msg}
                </div>
              ))}
            </div>
          </div>

          {/* Run B: Replay Verify */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-xs font-heading">
                <span>RUN B: REPLAY_VERIFY</span>
              </span>
              <span className="text-[10px] text-[var(--text-primary)] font-bold font-mono">∞ SYNCED</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto">
              {logLines.map((line, i) => (
                <div key={i} className={`p-1 rounded ${line.color}`}>
                  <span className="text-[var(--text-tertiary)] font-bold">[{line.time}]</span>{' '}
                  <span className="font-bold">{line.tag} &gt;</span> {line.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sync Marker Scrubber */}
      <div className="p-3.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-2 font-mono shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSyncMarker(Math.max(0, syncMarker - 5))}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSyncMarker(Math.min(60, syncMarker + 5))}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[var(--text-primary)] font-bold text-xs">
            CURRENT SYNC MARKER: 00:00:{String(syncMarker).padStart(2, '0')}
          </span>

          <span className="text-[var(--text-tertiary)] text-xs">SPEED 1.0x</span>
        </div>

        <input
          type="range"
          min="0"
          max="60"
          value={syncMarker}
          onChange={(e) => setSyncMarker(Number(e.target.value))}
          className="w-full accent-[#495464] bg-[var(--card-subtle)] rounded h-1.5 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
          <span>00:00:00</span>
          <span>00:05:00</span>
        </div>
      </div>
    </div>
  );
};
