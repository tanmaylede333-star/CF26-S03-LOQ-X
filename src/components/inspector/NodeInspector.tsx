import React from 'react';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Zap,
  BatteryCharging,
  Wrench,
  Shield,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Radio,
  Share2,
  Crosshair
} from 'lucide-react';
import { InfrastructureNode, NodeStatus } from '../../types/node';
import { DependencyEdge } from '../../types/edge';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface InspectorProps {
  nodeId: string | null;
  state: SimulationState;
  onClose: () => void;
  onInjectFailure: (nodeId: string) => void;
  onApplyRecovery: (action: any) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleHighlightPath?: (nodeId: string) => void;
  onToggleBlastRadius?: (nodeId: string) => void;
  onOpenRecoveryModal?: (nodeId?: string) => void;
}

export const NodeInspector: React.FC<InspectorProps> = ({
  nodeId,
  state,
  onClose,
  onInjectFailure,
  onApplyRecovery,
  onSelectNode,
  onToggleHighlightPath,
  onToggleBlastRadius,
  onOpenRecoveryModal,
}) => {
  if (!nodeId) return null;

  const node = state.nodes.find((n) => n.id === nodeId);
  const runtime = state.nodeStates[nodeId];

  if (!node || !runtime) return null;

  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  // Find active recovery action for this node
  const activeRecovery = state.activeRecoveries.find(
    (r) => r.nodeId === nodeId && r.status !== 'COMPLETED'
  );

  let percent = 0;
  let remainingTime = 0;
  if (activeRecovery) {
    const elapsed = Math.max(0, state.currentTime - activeRecovery.startTime);
    percent = activeRecovery.duration > 0 ? Math.min(100, Math.round((elapsed / activeRecovery.duration) * 100)) : 100;
    remainingTime = Math.max(0, (activeRecovery.startTime + activeRecovery.duration) - state.currentTime);
  }

  // Find incoming and outgoing edges
  const incoming = state.edges.filter((e) => e.target === nodeId);
  const outgoing = state.edges.filter((e) => e.source === nodeId);

  // Find latest relevant event for this node
  const latestEvent = [...state.events]
    .reverse()
    .find((e) => e.targetNode === nodeId);

  const status = runtime.status;

  const statusBadge = {
    HEALTHY: { bg: 'bg-emerald-950 border-emerald-800 text-emerald-300', label: 'HEALTHY' },
    AT_RISK: { bg: 'bg-amber-950 border-amber-800 text-amber-300', label: 'AT RISK' },
    DEGRADED: { bg: 'bg-orange-950 border-orange-800 text-orange-300', label: 'DEGRADED' },
    FAILED: { bg: 'bg-red-950 border-red-800 text-red-300', label: 'FAILED' },
    RECOVERING: { bg: 'bg-[#495464] border-[#BBBFCA] text-white', label: 'RECOVERING' },
  }[status];

  const hasCausalChain = runtime.causalChain && runtime.causalChain.length > 1;
  const contributingOrigins = runtime.contributingOrigins || [];

  return (
    <div className="glass-panel-glow rounded-xl p-4 lg:p-5 flex flex-col gap-4 border-[var(--border-color)] font-mono bg-[var(--surface-bg)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-primary)] font-bold bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)]">
              {node.type} SERVICE
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">{node.zone}</span>
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] font-heading leading-tight">
            {node.name} ({node.code})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {onToggleHighlightPath && (
            <button
              onClick={() => onToggleHighlightPath(nodeId)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-semibold transition-all shadow-sm"
              title="Highlight causal propagation path on the dependency graph"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>View Impact Path</span>
            </button>
          )}

          {onToggleBlastRadius && (
            <button
              onClick={() => onToggleBlastRadius(nodeId)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-700/60 text-red-300 text-[11px] font-semibold transition-all"
              title="Highlight all downstream reachable services in the blast radius"
            >
              <Share2 className="w-3.5 h-3.5 text-red-400" />
              <span>Blast Radius</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-color)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status & Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
            Status
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.bg}`}
          >
            ● {statusBadge.label}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
            Criticality
          </span>
          <span
            className={`text-xs font-bold ${
              node.criticality === 'CRITICAL'
                ? 'text-red-400'
                : node.criticality === 'HIGH'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {node.criticality}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
            Recovery Benchmark
          </span>
          <span className="text-xs font-bold text-[var(--text-primary)]">
            {node.recoveryTime} min
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
            Auxiliary Power
          </span>
          <span
            className={`text-xs font-bold ${
              runtime.backupActive ? 'text-[var(--text-primary)] font-bold' : 'text-slate-500'
            }`}
          >
            {runtime.backupActive ? 'ACTIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Dependencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Incoming */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
            Upstream Dependencies ({incoming.length})
          </span>
          {incoming.length === 0 ? (
            <span className="text-[11px] text-slate-500 italic">No upstream dependencies (Origin)</span>
          ) : (
            <div className="space-y-1.5">
              {incoming.map((edge) => {
                const src = nodeMap.get(edge.source);
                const srcState = state.nodeStates[edge.source]?.status || 'HEALTHY';
                return (
                  <button
                    key={edge.id}
                    onClick={() => onSelectNode(edge.source)}
                    className="w-full flex items-center justify-between p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-[11px] text-slate-200 font-medium truncate max-w-[130px]">
                      {src?.name}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        srcState === 'HEALTHY' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {srcState} (+{edge.propagationDelay}m)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Outgoing */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
            Downstream Dependents ({outgoing.length})
          </span>
          {outgoing.length === 0 ? (
            <span className="text-[11px] text-slate-500 italic">No downstream services</span>
          ) : (
            <div className="space-y-1.5">
              {outgoing.map((edge) => {
                const tgt = nodeMap.get(edge.target);
                const tgtState = state.nodeStates[edge.target]?.status || 'HEALTHY';
                return (
                  <button
                    key={edge.id}
                    onClick={() => onSelectNode(edge.target)}
                    className="w-full flex items-center justify-between p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-[11px] text-slate-200 font-medium truncate max-w-[130px]">
                      {tgt?.name}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        tgtState === 'HEALTHY' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tgtState} (+{edge.propagationDelay}m)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE RECOVERY IN PROGRESS PANEL */}
      {activeRecovery ? (
        <div className="p-3 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5 uppercase font-heading">
              <Wrench className="w-4 h-4 text-[var(--text-secondary)] animate-spin" />
              Active Intervention: {activeRecovery.type.replace(/_/g, ' ')}
            </span>
            <span className="bg-[#495464] px-2 py-0.5 rounded text-[10px] text-white">
              {percent}% DONE
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[var(--surface-bg)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className="h-full bg-[#495464] transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-color)]">
            <span>⏱️ Remaining Duration:</span>
            <span className="font-bold text-[var(--text-primary)] font-mono">
              {remainingTime} virtual min (T+{activeRecovery.startTime + activeRecovery.duration})
            </span>
          </div>

          <p className="text-[10px] text-[var(--text-tertiary)] italic font-sans">
            {activeRecovery.description}
          </p>
        </div>
      ) : (
        /* Operator Intervention Triggers */
        <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap gap-2">
          {status === 'HEALTHY' ? (
            <button
              onClick={() => onInjectFailure(nodeId)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/80 text-rose-200 text-xs font-bold transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Inject Disruption Outage
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenRecoveryModal) {
                  onOpenRecoveryModal(nodeId);
                } else {
                  onApplyRecovery({
                    id: `rec-repair-${nodeId}-${state.currentTime}`,
                    nodeId,
                    nodeName: node.name,
                    type: 'REPAIR',
                    startTime: state.currentTime,
                    duration: node.recoveryTime || 25,
                    cost: 30,
                    description: `Engineering repair intervention deployed for ${node.name}`,
                    status: 'SCHEDULED',
                  });
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#495464] hover:bg-[#334155] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#1e293b] border border-[#1e293b] active:scale-95"
            >
              <Wrench className="w-4 h-4 text-white" />
              ⚡ Deploy Calibrated Recovery Console
            </button>
          )}
        </div>
      )}
    </div>
  );
};
