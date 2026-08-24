import React from 'react';
import { Layers, Activity, Clock, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, HeartPulse } from 'lucide-react';
import { SimulationMetrics } from '../../types/simulation';
import { InfrastructureNode } from '../../types/node';

interface MetricsPanelProps {
  metrics: SimulationMetrics;
  nodes: InfrastructureNode[];
  onSelectNode: (nodeId: string) => void;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  nodes,
  onSelectNode,
}) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* 3 Core Hackathon Problem Statement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Cascade Depth */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center gap-1.5 font-heading">
              <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              Cascade Depth
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)]">
              Max Hops
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-[var(--text-primary)] tracking-tight">
              {metrics.cascadeDepth}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium font-sans">
              {metrics.cascadeDepth === 0 ? "No cascade" : `Level ${metrics.cascadeDepth} propagation`}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  level <= metrics.cascadeDepth && metrics.cascadeDepth > 0
                    ? level === 0 ? "bg-rose-500" : level === 1 ? "bg-amber-500" : "bg-[#495464]"
                    : "bg-[var(--card-subtle)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Metric 2: Affected Services */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center gap-1.5 font-heading">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Affected Services
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300">
              Downstream
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-rose-400 tracking-tight">
              {metrics.affectedServices}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium font-sans">
              of {metrics.totalNodes} total ({metrics.criticalServicesAffected} critical)
            </span>
          </div>

          {/* Clickable Affected Nodes Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1 max-h-12 overflow-y-auto">
            {metrics.affectedNodeIds.length === 0 ? (
              <span className="text-[11px] text-[var(--text-tertiary)] italic font-sans">No downstream services disrupted</span>
            ) : (
              metrics.affectedNodeIds.map((id) => (
                <button
                  key={id}
                  onClick={() => onSelectNode(id)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 truncate max-w-[140px] transition-colors"
                  title="Click to inspect cause"
                >
                  {nodeMap.get(id)?.name || id}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Metric 3: Recovery Time */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center gap-1.5 font-heading">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Recovery Time
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
              Simulated
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-emerald-400 tracking-tight">
              {metrics.recoveryTime > 0 ? `${metrics.recoveryTime}m` : "--"}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium font-sans">
              {metrics.recoveryTime > 0 ? "Total restoration time" : "No recovery logged yet"}
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-[var(--text-secondary)] font-mono flex items-center gap-1">
            <span>Stabilization T+</span>
            <span className="text-[var(--text-primary)] font-bold">{metrics.stabilizationTime} min</span>
          </div>
        </div>
      </div>

      {/* Grid Health & State Breakdown Gauges */}
      <div className="glass-panel p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wide font-heading">
              INFRASTRUCTURE HEALTH &amp; SERVICE STATUS
            </span>
          </div>
          <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
            {metrics.systemHealthPercentage}% Operational
          </span>
        </div>

        {/* Segmented Health Bar */}
        <div className="h-2.5 w-full bg-[var(--card-subtle)] rounded-full overflow-hidden flex p-0.5 border border-[var(--border-color)]">
          <div
            style={{ width: `${(metrics.healthyCount / (metrics.totalNodes || 1)) * 100}%` }}
            className="bg-emerald-500 rounded-l-full transition-all duration-500"
            title={`Healthy: ${metrics.healthyCount}`}
          />
          <div
            style={{ width: `${(metrics.recoveringCount / (metrics.totalNodes || 1)) * 100}%` }}
            className="bg-[#495464] transition-all duration-500"
            title={`Recovering: ${metrics.recoveringCount}`}
          />
          <div
            style={{ width: `${(metrics.atRiskCount / (metrics.totalNodes || 1)) * 100}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`At Risk: ${metrics.atRiskCount}`}
          />
          <div
            style={{ width: `${(metrics.degradedCount / (metrics.totalNodes || 1)) * 100}%` }}
            className="bg-orange-500 transition-all duration-500"
            title={`Degraded: ${metrics.degradedCount}`}
          />
          <div
            style={{ width: `${(metrics.failedCount / (metrics.totalNodes || 1)) * 100}%` }}
            className="bg-rose-500 rounded-r-full transition-all duration-500"
            title={`Failed: ${metrics.failedCount}`}
          />
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-[var(--border-color)] text-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1 font-heading">
              <CheckCircle2 className="w-2.5 h-2.5" /> Healthy
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">{metrics.healthyCount}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold flex items-center justify-center gap-1 font-heading">
              <RefreshCw className="w-2.5 h-2.5" /> Recovering
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">{metrics.recoveringCount}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-amber-400 font-semibold flex items-center justify-center gap-1 font-heading">
              <AlertTriangle className="w-2.5 h-2.5" /> At Risk
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">{metrics.atRiskCount}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-orange-400 font-semibold flex items-center justify-center gap-1 font-heading">
              <AlertCircle className="w-2.5 h-2.5" /> Degraded
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">{metrics.degradedCount}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-rose-400 font-semibold flex items-center justify-center gap-1 font-heading">
              <ShieldAlert className="w-2.5 h-2.5" /> Failed
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">{metrics.failedCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
