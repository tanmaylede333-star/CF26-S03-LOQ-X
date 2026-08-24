import React from 'react';
import {
  Activity,
  Layers,
  Clock,
  Radio,
  Crosshair,
  MapPin,
  AlertTriangle,
  Zap,
  Wrench,
  Shield,
  BatteryCharging,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { InfrastructureGraph } from '../graph/InfrastructureGraph';
import { formatTime } from '../../lib/utils';
import { RecoveryAction } from '../../types/recovery';

interface CommandCenterProps {
  state: SimulationState;
  onSelectNode: (nodeId: string) => void;
  onScrub: (time: number | null) => void;
  onSetSpeed: (speed: number) => void;
  onApplyRecovery: (action: RecoveryAction) => void;
  onInjectFailure: (nodeId: string) => void;
  onOpenRecoveryModal: () => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({
  state,
  onSelectNode,
  onScrub,
  onSetSpeed,
  onApplyRecovery,
  onInjectFailure,
  onOpenRecoveryModal,
}) => {
  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || state.nodes[0];
  const selectedRuntime = selectedNode ? state.nodeStates[selectedNode.id] : null;

  const currentViewTime = state.scrubTime !== null ? state.scrubTime : state.currentTime;
  const maxTime = state.scenario.parameters.maxSimulationTime || 60;

  // Find incoming & outgoing for selected node
  const incoming = selectedNode ? state.edges.filter((e) => e.target === selectedNode.id) : [];
  const outgoing = selectedNode ? state.edges.filter((e) => e.source === selectedNode.id) : [];

  // Filter recent telemetry stream for the selected node or global
  const relevantEvents = state.events
    .filter((e) => !selectedNode || e.targetNode === selectedNode.id || e.sourceNode === selectedNode.id)
    .slice(-4);

  const isSystemCritical = state.metrics.failedCount > 0 || state.metrics.systemHealthPercentage < 50;

  return (
    <div className="flex-1 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto bg-[var(--app-bg)] font-mono text-[var(--text-primary)] transition-colors duration-200">
      {/* Top 5 Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: System Health */}
        <div className="p-3.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
            SYSTEM HEALTH
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSystemCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span
              className={`font-heading font-black tracking-tight text-xl ${
                isSystemCritical ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isSystemCritical ? 'CRITICAL' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Metric 2: Cascade Depth */}
        <div className="p-3.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
            CASCADE DEPTH
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono">
            <span className="text-xl font-bold text-[var(--text-primary)]">
              Lvl {state.metrics.cascadeDepth}
            </span>
          </div>
        </div>

        {/* Metric 3: Affected Services */}
        <div className="p-3.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
            AFFECTED SVCS
          </span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono">
            <span
              className={`text-xl font-bold ${
                state.metrics.affectedServices > 0 ? 'text-amber-400' : 'text-[var(--text-primary)]'
              }`}
            >
              {state.metrics.affectedServices}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
              / {state.metrics.totalNodes} Nodes
            </span>
          </div>
        </div>

        {/* Metric 4: Recovery Estimate */}
        <div className="p-3.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
            EST. RECOVERY
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono">
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {state.metrics.recoveryTime > 0 ? `${state.metrics.recoveryTime}m` : '0m'}
            </span>
          </div>
        </div>

        {/* Metric 5: Sim Time */}
        <div className="p-3.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
            SIM TIME (T)
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono">
            <span className="text-xl font-bold text-[var(--text-primary)]">
              T+{formatTime(currentViewTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Graph Canvas (Left 8 cols) + Inspector & Impact (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[460px]">
        {/* Left: Interactive Dependency Flow Graph (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="flex-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-3 flex flex-col min-h-[420px]">
            <InfrastructureGraph state={state} onSelectNode={onSelectNode} />
          </div>
        </div>

        {/* Right: Node Diagnostics & Telemetry (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Selected Node Details Card */}
          <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-3">
            <div className="flex items-start justify-between pb-2 border-b border-[var(--border-color)]">
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block">
                  SELECTED ASSET
                </span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedNode?.name}
                </h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  selectedNode?.status === 'FAILED'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : selectedNode?.status === 'DEGRADED'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                ● {selectedNode?.status}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              {selectedNode?.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-tertiary)] block">SECTOR / ZONE</span>
                <span className="text-[var(--text-primary)] font-bold text-[11px] truncate block">
                  {selectedNode?.zone}
                </span>
              </div>
              <div className="p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-tertiary)] block">CRITICALITY</span>
                <span className="text-amber-400 font-bold text-[11px] block">
                  {selectedNode?.criticality}
                </span>
              </div>
            </div>

            {/* Active Recovery Status or Quick Actions */}
            {(() => {
              const activeRecovery = state.activeRecoveries.find(
                (r) => r.nodeId === selectedNode?.id && r.status !== 'COMPLETED'
              );

              if (activeRecovery) {
                const elapsed = Math.max(0, state.currentTime - activeRecovery.startTime);
                const percent = activeRecovery.duration > 0 ? Math.min(100, Math.round((elapsed / activeRecovery.duration) * 100)) : 100;
                const remaining = Math.max(0, (activeRecovery.startTime + activeRecovery.duration) - state.currentTime);

                return (
                  <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col gap-1.5 text-xs font-mono shadow-sm">
                    <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
                      <span className="flex items-center gap-1 uppercase">
                        <Wrench className="w-3.5 h-3.5 animate-spin" />
                        {activeRecovery.type.replace(/_/g, ' ')}
                      </span>
                      <span>{percent}% DONE</span>
                    </div>

                    <div className="w-full bg-[var(--surface-bg)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div
                        className="h-full bg-[#495464] transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-[var(--text-secondary)] text-right">
                      {remaining}m remaining (T+{activeRecovery.startTime + activeRecovery.duration})
                    </span>
                  </div>
                );
              }

              return (
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    onClick={() => onInjectFailure(selectedNode?.id || '')}
                    className="flex-1 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all"
                  >
                    ⚡ Trigger Outage
                  </button>
                  <button
                    onClick={onOpenRecoveryModal}
                    className="flex-1 py-1.5 rounded bg-[#495464] hover:bg-[#334155] border border-[#1e293b] text-white text-xs font-bold transition-all shadow-[2px_2px_0px_#1e293b]"
                  >
                    ⚡ Deploy Recovery
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Real-time Telemetry Events */}
          <div className="flex-1 p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border-color)]">
              LIVE TELEMETRY STREAM
            </span>
            <div className="space-y-1.5 overflow-y-auto max-h-[160px]">
              {relevantEvents.length === 0 ? (
                <span className="text-xs text-[var(--text-tertiary)] block text-center py-4">
                  No active disruptions recorded.
                </span>
              ) : (
                relevantEvents.map((e) => (
                  <div
                    key={e.id}
                    className="p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[11px] flex items-center justify-between"
                  >
                    <span className="text-[var(--text-primary)] font-bold">T+{formatTime(e.timestamp)}</span>
                    <span className="text-[var(--text-secondary)] truncate max-w-[180px]">{e.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
