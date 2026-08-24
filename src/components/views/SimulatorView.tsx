import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Activity,
  Zap,
  Radio,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Flame,
  Layers,
  Sparkles,
  GitBranch,
  MapPin,
  ListFilter,
  Eye,
  Maximize2,
  Minimize2,
  X,
  Terminal,
  CheckCircle2,
  Info,
  ShieldAlert
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { InfrastructureGraph } from '../graph/InfrastructureGraph';
import { SyntheticCityMap } from '../map/SyntheticCityMap';
import { NodeInspector } from '../inspector/NodeInspector';
import { TimelineScrubber } from '../timeline/TimelineScrubber';
import { formatTime } from '../../lib/utils';
import { RecoveryAction } from '../../types/recovery';

interface SimulatorViewProps {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onReplay: () => void;
  onSetSpeed: (speed: number) => void;
  onSelectNode: (nodeId: string) => void;
  onScrub: (time: number | null) => void;
  onApplyRecovery: (action: RecoveryAction) => void;
  onInjectFailure: (nodeId: string) => void;
  onOpenFailureModal: () => void;
  onOpenRecoveryModal: (nodeId?: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  state,
  onStart,
  onPause,
  onStep,
  onReset,
  onReplay,
  onSetSpeed,
  onSelectNode,
  onScrub,
  onApplyRecovery,
  onInjectFailure,
  onOpenFailureModal,
  onOpenRecoveryModal,
}) => {
  const isRunning = state.status === 'RUNNING';
  const currentT = state.scrubTime !== null ? state.scrubTime : state.currentTime;
  const [canvasMode, setCanvasMode] = useState<'GRAPH' | 'GIS_MAP'>('GRAPH');
  const [rightPanelTab, setRightPanelTab] = useState<'EVENTS' | 'INSPECTOR'>('EVENTS');
  const [isGraphExpanded, setIsGraphExpanded] = useState<boolean>(false);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'FAILURES' | 'RECOVERIES'>('ALL');

  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || null;

  // Auto-switch right panel to inspector when a node is selected
  React.useEffect(() => {
    if (state.selectedNodeId) {
      setRightPanelTab('INSPECTOR');
    }
  }, [state.selectedNodeId]);

  // Key visual story stages
  const stage =
    state.metrics.failedCount === 0
      ? 'NOMINAL'
      : state.metrics.cascadeDepth <= 1
      ? 'FAILURE'
      : state.metrics.cascadeDepth <= 2
      ? 'PROPAGATION'
      : state.metrics.cascadeDepth <= 3
      ? 'CASCADE'
      : 'IMPACT';

  // Filtered event history for Diagnostics stream
  const filteredEvents = state.events.filter((e) => {
    if (eventFilter === 'FAILURES') {
      return e.type === 'FAILURE_INJECTED' || e.type === 'FAILURE_PROPAGATED';
    }
    if (eventFilter === 'RECOVERIES') {
      return e.type === 'RECOVERY_STARTED' || e.type === 'RECOVERY_COMPLETED';
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col gap-3 p-4 lg:p-5 overflow-y-auto bg-[var(--app-bg)] font-mono text-[var(--text-primary)] select-none transition-colors duration-200">
      {/* 1. SIMULATION ENGINE CONTROL BANNER */}
      <div className="relative rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Scenario & Clock */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
              <Activity className="w-3 h-3 text-[var(--text-secondary)]" />
              SIMULATION ENGINE
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              SCENARIO: {state.scenario.name.toUpperCase()}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-xs text-[var(--text-secondary)]">VIRTUAL TIME:</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-headline-md tracking-tight">
              T+{formatTime(currentT)}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-semibold">
              ({state.status})
            </span>
          </div>
        </div>

        {/* Story Flow: FAILURE -> PROPAGATION -> CASCADE -> IMPACT */}
        <div className="hidden xl:flex items-center gap-2 p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[10px]">
          <div
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              stage === 'FAILURE'
                ? 'bg-[#f43f5e] text-white shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse'
                : 'text-slate-500'
            }`}
          >
            1. FAILURE
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              stage === 'PROPAGATION'
                ? 'bg-[#fbbf24] text-[#451a03] shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse'
                : 'text-slate-500'
            }`}
          >
            2. PROPAGATION
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              stage === 'CASCADE'
                ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse'
                : 'text-slate-500'
            }`}
          >
            3. CASCADE
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              stage === 'IMPACT'
                ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse'
                : 'text-slate-500'
            }`}
          >
            4. IMPACT
          </div>
        </div>

        {/* Playback & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Speed Buttons */}
          <div className="flex items-center bg-[var(--card-subtle)] p-1 rounded-lg border border-[var(--border-color)]">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onSetSpeed(speed)}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  state.speed === speed
                    ? 'bg-[#495464] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Primary Action Button */}
          {isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 border border-amber-600"
            >
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs shadow-[2px_2px_0px_#1e293b] transition-all active:scale-95 border border-[#1e293b]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Simulation</span>
            </button>
          )}

          {/* Step Button */}
          <button
            onClick={onStep}
            disabled={isRunning}
            className="p-2 rounded-lg bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
            title="Step forward by 1 virtual minute"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Reset simulation to T+00:00"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Disruption & Recovery Console Triggers */}
          <div className="h-6 w-px bg-[var(--border-color)] mx-1" />

          <button
            onClick={onOpenFailureModal}
            className="px-3 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Inject Disruption</span>
          </button>

          <button
            onClick={() => onOpenRecoveryModal()}
            className="px-3 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Deploy Recovery</span>
          </button>
        </div>
      </div>

      {/* ACTIVE WORK IN PROGRESS BANNER (SYNCHRONIZED WITH VIRTUAL SIMULATION CLOCK) */}
      {state.activeRecoveries.length > 0 && (
        <div className="rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-3 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
              ACTIVE ENGINEERING INTERVENTIONS IN PROGRESS ({state.activeRecoveries.length})
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Synchronized with Virtual Clock (T+{formatTime(currentT)})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {state.activeRecoveries.map((rec) => {
              const elapsed = Math.max(0, currentT - rec.startTime);
              const isFinished = currentT >= rec.startTime + rec.duration;
              const isPending = currentT < rec.startTime;
              const percent = rec.duration > 0 ? Math.min(100, Math.round((elapsed / rec.duration) * 100)) : 100;
              const remaining = Math.max(0, (rec.startTime + rec.duration) - currentT);

              return (
                <div
                  key={rec.id}
                  className={`p-2.5 rounded border text-xs flex flex-col gap-1.5 ${
                    isFinished
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                      : isPending
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                      : 'bg-slate-800/40 border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className="truncate max-w-[180px]">{rec.nodeName || rec.nodeId}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase ${
                      isFinished ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-200'
                    }`}>
                      {isFinished ? '✓ RESTORED' : isPending ? 'SCHEDULED' : `${percent}% DONE`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden border border-[var(--border-color)]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFinished ? 'bg-emerald-500' : 'bg-[#495464]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-sans">
                    <span>{rec.type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-[var(--text-primary)] font-bold">
                      {isFinished ? 'Nominal Health Restored' : `${remaining}m remaining (T+${rec.startTime + rec.duration})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CORE EXPERIMENT CANVAS: DUAL GRAPH/GIS MAP (LEFT) + DIAGNOSTICS/EVENT STREAM (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[480px]">
        {/* Left: Interactive Dependency Flow / GIS Map Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-2 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[var(--border-color)] text-xs gap-2">
            {/* 1-CLICK TOGGLE BETWEEN TOPOLOGICAL GRAPH & CITY GIS MAP + EXPAND BUTTON */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[var(--card-subtle)] p-1 rounded-lg border border-[var(--border-color)]">
                <button
                  onClick={() => setCanvasMode('GRAPH')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                    canvasMode === 'GRAPH'
                      ? 'bg-[#495464] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Topological Graph</span>
                </button>
                <button
                  onClick={() => setCanvasMode('GIS_MAP')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                    canvasMode === 'GIS_MAP'
                      ? 'bg-[#495464] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>City GIS Map</span>
                </button>
              </div>

              {/* EXPAND GRAPH BUTTON */}
              {canvasMode === 'GRAPH' && (
                <button
                  onClick={() => setIsGraphExpanded(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:border-[#495464] transition-all shadow-sm"
                  title="Expand to Fullscreen Topological Graph Workspace"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>EXPAND GRAPH</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-slate-400">
                CASCADE DEPTH: <strong className="text-[#f43f5e]">L{state.metrics.cascadeDepth}</strong>
              </span>
              <span className="text-slate-400">
                AFFECTED NODES: <strong className="text-[#fbbf24]">{state.metrics.affectedServices}</strong>
              </span>
            </div>
          </div>

          {/* Interactive Canvas Body */}
          <div className="flex-1 w-full h-full min-h-[390px] rounded bg-[#0b0d13] overflow-hidden">
            {canvasMode === 'GRAPH' ? (
              <InfrastructureGraph state={state} onSelectNode={onSelectNode} />
            ) : (
              <SyntheticCityMap
                state={state}
                onSelectNode={onSelectNode}
                onInjectFailure={onInjectFailure}
              />
            )}
          </div>
        </div>

        {/* Right: Technical Diagnostics & Engine Event Stream Tab (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2 rounded bg-[#161922] border border-[#262a38] p-3 overflow-hidden">
          {/* Panel Selector Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#262a38] text-xs">
            <div className="flex items-center gap-1 bg-[#0b0d13] p-0.5 rounded border border-[#262a38]">
              <button
                onClick={() => setRightPanelTab('EVENTS')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  rightPanelTab === 'EVENTS'
                    ? 'bg-[#495464] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Diagnostics ({state.events.length})</span>
              </button>
              <button
                onClick={() => setRightPanelTab('INSPECTOR')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  rightPanelTab === 'INSPECTOR'
                    ? 'bg-[#495464] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {selectedNode ? selectedNode.code : 'Asset Inspector'}
              </button>
            </div>

            {selectedNode && rightPanelTab === 'INSPECTOR' && (
              <button
                onClick={() => onSelectNode('')}
                className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
              >
                Clear
              </button>
            )}

            {rightPanelTab === 'EVENTS' && state.events.length > 0 && (
              <div className="flex items-center gap-1 text-[9px]">
                {(['ALL', 'FAILURES', 'RECOVERIES'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className={`px-1.5 py-0.5 rounded uppercase font-bold transition-all ${
                      eventFilter === f
                        ? 'bg-[#495464] text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-y-auto max-h-[440px] pr-0.5">
            {rightPanelTab === 'INSPECTOR' && selectedNode ? (
              <NodeInspector
                nodeId={selectedNode.id}
                state={state}
                onClose={() => {
                  onSelectNode('');
                  setRightPanelTab('EVENTS');
                }}
                onInjectFailure={onInjectFailure}
                onApplyRecovery={onApplyRecovery}
                onSelectNode={onSelectNode}
                onOpenRecoveryModal={onOpenRecoveryModal}
              />
            ) : (
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-tertiary)] text-xs">
                    <Activity className="w-8 h-8 text-[var(--text-secondary)] mb-2 animate-pulse" />
                    <span>Grid is in nominal steady state.</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] mt-1">
                      Run simulation or inject a disruption to observe technical engine events.
                    </span>
                  </div>
                ) : (
                  filteredEvents.map((e) => {
                    const isFailure =
                      e.type === 'FAILURE_INJECTED' || e.type === 'FAILURE_PROPAGATED';
                    const isRecovery =
                      e.type === 'RECOVERY_STARTED' || e.type === 'RECOVERY_COMPLETED';
                    const isStart = e.type === 'SCENARIO_STARTED';

                    return (
                      <div
                        key={e.id}
                        onClick={() => {
                          if (e.targetNode && e.targetNode !== 'system') {
                            onSelectNode(e.targetNode);
                          }
                        }}
                        className={`p-2.5 rounded border text-xs flex flex-col gap-1 transition-all cursor-pointer hover:border-slate-400 ${
                          isFailure
                            ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                            : isRecovery
                            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200'
                            : isStart
                            ? 'bg-blue-950/30 border-blue-900/40 text-blue-200'
                            : 'bg-amber-950/30 border-amber-900/40 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[10px]">
                          <span className="text-[var(--text-primary)] font-mono font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            T+{formatTime(e.timestamp)}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-bold ${
                              isFailure
                                ? 'bg-rose-900/80 text-rose-200'
                                : isRecovery
                                ? 'bg-emerald-900/80 text-emerald-200'
                                : isStart
                                ? 'bg-blue-900/80 text-blue-200'
                                : 'bg-amber-900/80 text-amber-200'
                            }`}
                          >
                            {e.type}
                          </span>
                        </div>

                        {/* Technical event line */}
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)]">
                          {e.cause?.sourceNodeName && e.cause.sourceNodeName !== e.targetNodeName && (
                            <>
                              <span className="text-slate-400">{e.cause.sourceNodeName}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                            </>
                          )}
                          <span className="text-white">{e.targetNodeName || e.targetNode}</span>
                          {e.previousState && e.newState && e.previousState !== e.newState && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300 font-mono ml-auto">
                              {e.previousState} → {e.newState}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-300 leading-snug">{e.message}</p>

                        {e.cause?.rootCauses && e.cause.rootCauses.length > 0 && (
                          <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>Origin:</span>
                            <span className="text-rose-400 font-bold">
                              {e.cause.rootCauses.join(', ')}
                            </span>
                            {e.cause.propagationDelay !== undefined && e.cause.propagationDelay > 0 && (
                              <span className="text-slate-500 ml-auto">
                                Latency: +{e.cause.propagationDelay}m
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE TIMELINE SCRUBBER */}
      <div className="shrink-0">
        <TimelineScrubber
          state={state}
          onScrub={onScrub}
          onStart={onStart}
          onPause={onPause}
          onStep={onStep}
          onReset={onReset}
          onReplay={onReplay}
        />
      </div>

      {/* 4. EXPANDED FULLSCREEN TOPOLOGICAL GRAPH WORKSPACE MODAL */}
      {isGraphExpanded && (
        <div className="fixed inset-0 z-50 bg-[#0b0d13]/95 backdrop-blur-md flex flex-col p-4 lg:p-6 overflow-hidden animate-fadeIn">
          {/* Fullscreen Workspace Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#495464] border border-[#BBBFCA] text-white">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                  TOPOLOGICAL DEPENDENCY GRAPH WORKSPACE
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>SCENARIO: <strong className="text-white">{state.scenario.name}</strong></span>
                  <span>•</span>
                  <span>TIME: <strong className="text-emerald-400">T+{formatTime(currentT)}</strong></span>
                  <span>•</span>
                  <span>CASCADE DEPTH: <strong className="text-rose-400">L{state.metrics.cascadeDepth}</strong></span>
                  <span>•</span>
                  <span>AFFECTED: <strong className="text-amber-400">{state.metrics.affectedServices} / {state.nodes.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGraphExpanded(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-white text-xs font-bold transition-all shadow-sm"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>EXIT FULLSCREEN [ ESC ]</span>
              </button>
              <button
                onClick={() => setIsGraphExpanded(false)}
                className="p-1.5 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                title="Close Fullscreen Workspace"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Graph Canvas */}
          <div className="flex-1 w-full h-full rounded-lg bg-[#0b0d13] border border-[var(--border-color)] overflow-hidden relative">
            <InfrastructureGraph state={state} onSelectNode={onSelectNode} />

            {/* Live Inspector Drawer inside expanded workspace if a node is selected */}
            {selectedNode && (
              <div className="absolute top-4 right-4 z-30 w-80 max-h-[calc(100%-32px)] overflow-y-auto rounded-lg shadow-2xl border border-[var(--border-color)] bg-[var(--surface-bg)]/95 backdrop-blur-md">
                <NodeInspector
                  nodeId={selectedNode.id}
                  state={state}
                  onClose={() => onSelectNode('')}
                  onInjectFailure={onInjectFailure}
                  onApplyRecovery={onApplyRecovery}
                  onSelectNode={onSelectNode}
                  onOpenRecoveryModal={onOpenRecoveryModal}
                />
              </div>
            )}
          </div>

          {/* Workspace Footer Bar */}
          <div className="pt-3 mt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Degraded</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Failed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#BBBFCA]" /> Recovering</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="px-3 py-1 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-white"
              >
                Reset T+00:00
              </button>
              <button
                onClick={isRunning ? onPause : onStart}
                className="px-4 py-1 rounded bg-[#495464] hover:bg-[#334155] text-white text-xs font-bold border border-[#1e293b]"
              >
                {isRunning ? 'Pause' : 'Resume Simulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
