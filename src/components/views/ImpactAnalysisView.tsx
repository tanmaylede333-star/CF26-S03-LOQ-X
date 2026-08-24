import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Radio,
  Clock,
  Zap,
  Droplets,
  Layers,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Crosshair,
  BarChart3,
  Activity,
  PieChart as PieIcon,
  LineChart as LineIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface ImpactAnalysisProps {
  state: SimulationState;
  onSelectNode: (nodeId: string) => void;
}

export const ImpactAnalysisView: React.FC<ImpactAnalysisProps> = ({
  state,
  onSelectNode,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'PROPAGATION' | 'SECTORS' | 'RADAR'>('PROPAGATION');

  const failedNodes = state.nodes.filter((n) => n.status === 'FAILED');
  const degradedNodes = state.nodes.filter((n) => n.status === 'DEGRADED');
  const healthyNodes = state.nodes.filter((n) => n.status === 'HEALTHY');

  // Real-time estimated downtime horizon calculated from active disrupted assets
  const estimatedDowntimeMinutes = useMemo(() => {
    const affected = state.nodes.filter((n) => n.status !== 'HEALTHY');
    if (affected.length === 0) return 0;
    return Math.max(...affected.map((n) => n.recoveryTime || 15));
  }, [state.nodes]);

  // 1. Time-series data for Cascade Propagation Curve (Virtual Minute 0 -> maxSimulationTime)
  const propagationData = useMemo(() => {
    const points = [];
    const total = state.nodes.length;
    const maxTime = state.scenario.parameters?.maxSimulationTime || 60;
    const currentT = state.scrubTime !== null ? state.scrubTime : state.currentTime;

    for (let t = 0; t <= maxTime; t += 5) {
      let failed = 0;
      let degraded = 0;

      // Count events up to virtual time t
      state.events.forEach((e) => {
        if (e.timestamp <= t) {
          if (e.newState === 'FAILED') {
            failed++;
          } else if (e.newState === 'DEGRADED') {
            degraded++;
          }
        }
      });

      // Clamp to actual node count
      failed = Math.min(total, failed);
      degraded = Math.min(total - failed, degraded);

      // If at or past current simulation time, lock to real current node status
      if (t >= currentT && currentT > 0) {
        failed = failedNodes.length;
        degraded = degradedNodes.length;
      }

      const healthy = Math.max(0, total - failed - degraded);

      points.push({
        time: `T+${t}m`,
        Healthy: healthy,
        Degraded: degraded,
        Failed: failed,
      });
    }

    return points;
  }, [state.events, state.nodes, state.currentTime, state.scrubTime, failedNodes.length, degradedNodes.length]);

  // 2. Sector-by-Sector Vulnerability & Health Bar Chart
  const sectorData = useMemo(() => {
    const sectors = ['POWER', 'WATER', 'TELECOM', 'TRAFFIC', 'EMERGENCY', 'SEWAGE'];
    return sectors.map((sec) => {
      const nodesInSec = state.nodes.filter((n) => n.type.toUpperCase() === sec);
      const healthyInSec = nodesInSec.filter((n) => n.status === 'HEALTHY').length;
      const affectedInSec = nodesInSec.filter((n) => n.status !== 'HEALTHY').length;

      return {
        sector: sec,
        Healthy: healthyInSec,
        Affected: affectedInSec,
        total: nodesInSec.length || 1,
      };
    });
  }, [state.nodes]);

  // 3. Domain Resilience Radar Profile
  const radarData = useMemo(() => {
    const isPowerFail = failedNodes.some((n) => n.type === 'POWER');
    const isWaterFail = failedNodes.some((n) => n.type === 'WATER');
    const isTelecomFail = failedNodes.some((n) => n.type === 'TELECOM');

    return [
      { domain: 'Power Grid', Resilience: isPowerFail ? 20 : 85, fullMark: 100 },
      { domain: 'Water Security', Resilience: isWaterFail ? 30 : 90, fullMark: 100 },
      { domain: 'Communications', Resilience: isTelecomFail ? 35 : 95, fullMark: 100 },
      { domain: 'Emergency Dispatch', Resilience: state.metrics.systemHealthPercentage > 60 ? 80 : 40, fullMark: 100 },
      { domain: 'Traffic Corridors', Resilience: state.metrics.failedCount > 2 ? 45 : 85, fullMark: 100 },
    ];
  }, [failedNodes, state.metrics]);

  return (
    <div className="flex-1 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto bg-[var(--app-bg)] font-body-md text-[var(--text-primary)] transition-colors duration-200">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold flex items-center gap-1.5 font-heading">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            MAXIMUM CASCADE DEPTH
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-500 font-heading">
              Level {state.metrics.cascadeDepth}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] font-bold font-sans">
              {state.metrics.cascadeDepth === 0 ? 'Nominal Baseline' : state.metrics.cascadeDepth === 1 ? 'Direct Failure' : 'Multi-Hop Cascade'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold flex items-center gap-1.5 font-heading">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            TOTAL AFFECTED SERVICES
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-heading">
              {state.metrics.affectedServices}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] font-bold font-sans">
              / {state.metrics.totalNodes} Nodes ({state.metrics.totalNodes > 0 ? Math.round((state.metrics.affectedServices / state.metrics.totalNodes) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold flex items-center gap-1.5 font-heading">
            <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            ESTIMATED DOWNTIME HORIZON
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text-primary)] font-heading">
              {estimatedDowntimeMinutes > 0 ? `${estimatedDowntimeMinutes}m` : '0m (Nominal)'}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)]">
              {state.activeRecoveries.length > 0 ? `${state.activeRecoveries.length} Recoveries Active` : 'Standard Dispatch'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Graphical Overview (Left 7 cols) + Priority Targets & Propagation Tree (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* LEFT: GRAPHICAL OVERVIEW SECTION (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-4 flex flex-col gap-3 font-mono flex-1 shadow-sm">
            {/* Graphical representation header & tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--text-primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase font-heading">
                  GRAPHICAL OVERVIEW &amp; TIME HORIZON
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setActiveChartTab('PROPAGATION')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    activeChartTab === 'PROPAGATION'
                      ? 'bg-[#495464] text-white shadow-sm'
                      : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Cascade Curve
                </button>
                <button
                  onClick={() => setActiveChartTab('SECTORS')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    activeChartTab === 'SECTORS'
                      ? 'bg-[#495464] text-white shadow-sm'
                      : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Sector Health
                </button>
                <button
                  onClick={() => setActiveChartTab('RADAR')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    activeChartTab === 'RADAR'
                      ? 'bg-[#495464] text-white shadow-sm'
                      : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Radar Profile
                </button>
              </div>
            </div>

            {/* CHART 1: Cascade Propagation Curve (Area Chart) */}
            {activeChartTab === 'PROPAGATION' && (
              <div className="flex-1 w-full min-h-[300px] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Failure Propagation Volume vs. Virtual Timeline (T+00 to T+60)
                </span>
                <div className="w-full h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={propagationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorDegraded" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#495464" opacity={0.3} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#495464', fontSize: '11px', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="Failed" stackId="1" stroke="#ef4444" fill="url(#colorFailed)" />
                      <Area type="monotone" dataKey="Degraded" stackId="1" stroke="#f59e0b" fill="url(#colorDegraded)" />
                      <Area type="monotone" dataKey="Healthy" stackId="1" stroke="#10b981" fill="url(#colorHealthy)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 2: Sector Breakdown (Bar Chart) */}
            {activeChartTab === 'SECTORS' && (
              <div className="flex-1 w-full min-h-[300px] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Healthy vs Affected Infrastructure Units per Domain
                </span>
                <div className="w-full h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#495464" opacity={0.3} />
                      <XAxis dataKey="sector" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#495464', fontSize: '11px', color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Healthy" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Affected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 3: Resilience Radar Profile */}
            {activeChartTab === 'RADAR' && (
              <div className="flex-1 w-full min-h-[300px] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Multi-Sector Systemic Resilience Index Score (%)
                </span>
                <div className="w-full h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#495464" opacity={0.3} />
                      <PolarAngleAxis dataKey="domain" stroke="#94a3b8" fontSize={10} />
                      <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                      <Radar name="Resilience Index" dataKey="Resilience" stroke="#495464" fill="#495464" fillOpacity={0.4} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#495464', fontSize: '11px', color: '#fff' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Causal Failure Propagation Tree */}
          <div className="rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-4 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] text-xs">
              <span className="font-bold text-[var(--text-primary)] uppercase font-heading">
                DYNAMIC CAUSAL FAILURE PROPAGATION TREE
              </span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Primary Origin
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Cascade Hop
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] overflow-x-auto">
              {/* Dynamic Causal Root Nodes (Hop 0) */}
              {(() => {
                const rootEvents = state.events.filter(e => e.type === 'FAILURE_INJECTED');
                const hop1Events = state.events.filter(e => e.type === 'FAILURE_PROPAGATED' && e.cause?.chain && e.cause.chain.length === 2);
                const hop2Events = state.events.filter(e => e.type === 'FAILURE_PROPAGATED' && e.cause?.chain && e.cause.chain.length >= 3);

                const rootNodes = rootEvents.length > 0
                  ? rootEvents.map(e => state.nodes.find(n => n.id === e.targetNode)).filter(Boolean)
                  : state.scenario.initialFailures.map(f => state.nodes.find(n => n.id === f.nodeId)).filter(Boolean);

                if (rootNodes.length === 0 && state.events.length === 0) {
                  return (
                    <div className="w-full py-6 flex flex-col items-center justify-center text-center text-slate-400 text-xs gap-1">
                      <Activity className="w-6 h-6 text-emerald-400 mb-1" />
                      <span className="font-bold text-white">Nominal Steady State</span>
                      <span className="text-[10px] text-slate-500">No causal failure propagation active. Launch a scenario to observe propagation waves.</span>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-3 min-w-max">
                    {/* Hop 0: Root Failures */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase">HOP 0 (ORIGIN)</span>
                      {rootNodes.map((n) => n && (
                        <div
                          key={n.id}
                          onClick={() => onSelectNode(n.id)}
                          className="p-2.5 rounded border border-rose-500 bg-rose-950/70 hover:bg-rose-900/80 text-center min-w-[130px] cursor-pointer shadow-sm transition-all"
                        >
                          <span className="text-xs font-bold text-slate-100 block">{n.name}</span>
                          <span className="text-[9px] text-rose-300 font-bold block uppercase">{n.code} • {n.status}</span>
                        </div>
                      ))}
                    </div>

                    {hop1Events.length > 0 && <ArrowRight className="w-4 h-4 text-rose-500 shrink-0 mt-4" />}

                    {/* Hop 1: Primary Downstream Cascade */}
                    {hop1Events.length > 0 && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase">HOP 1 (DIRECT DEPENDENTS)</span>
                        <div className="flex flex-wrap gap-2 max-w-xs">
                          {hop1Events.slice(0, 3).map((e) => {
                            const n = state.nodes.find(node => node.id === e.targetNode);
                            return (
                              <div
                                key={e.id}
                                onClick={() => onSelectNode(e.targetNode)}
                                className="p-2 rounded border border-rose-500/80 bg-rose-950/50 hover:bg-rose-900/60 text-center min-w-[120px] cursor-pointer transition-all"
                              >
                                <span className="text-xs font-bold text-slate-200 block">{n?.name || e.targetNodeName}</span>
                                <span className="text-[9px] text-rose-400 font-bold block uppercase">{n?.status || 'DEGRADED'} (+{e.cause?.propagationDelay || 5}m)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {hop2Events.length > 0 && <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 mt-4" />}

                    {/* Hop 2: Secondary & Deep Cascade */}
                    {hop2Events.length > 0 && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase">HOP 2+ (EXTENDED IMPACT)</span>
                        <div className="flex flex-wrap gap-2 max-w-xs">
                          {hop2Events.slice(0, 3).map((e) => {
                            const n = state.nodes.find(node => node.id === e.targetNode);
                            return (
                              <div
                                key={e.id}
                                onClick={() => onSelectNode(e.targetNode)}
                                className="p-2 rounded border border-amber-500/80 bg-amber-950/50 hover:bg-amber-900/60 text-center min-w-[120px] cursor-pointer transition-all"
                              >
                                <span className="text-xs font-bold text-slate-200 block">{n?.name || e.targetNodeName}</span>
                                <span className="text-[9px] text-amber-400 font-bold block uppercase">{n?.status || 'DEGRADED'} (+{e.cause?.propagationDelay || 5}m)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* RIGHT: PRIORITY TARGETS & BLAST RADIUS RADAR (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Blast Radius Radar Map */}
          <div className="rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-4 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-primary)] font-bold uppercase truncate max-w-xs font-heading">
                BLAST RADIUS OVERVIEW
              </span>
              <span className="text-[var(--text-secondary)] font-bold shrink-0 font-mono">GIS ACTIVE</span>
            </div>

            <div className="h-44 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)]" />

              <div className="w-28 h-28 rounded-full border border-rose-500/40 bg-rose-500/10 flex items-center justify-center animate-ping" />
              <div className="w-16 h-16 rounded-full border border-rose-500 bg-rose-950/60 flex items-center justify-center absolute shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                <Crosshair className="w-6 h-6 text-rose-400 animate-spin" />
              </div>
            </div>
          </div>

          {/* Priority Targets List Sorted by Severity */}
          <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex-1 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] text-xs">
              <span className="font-bold text-[var(--text-primary)] uppercase font-heading">PRIORITY TARGETS</span>
              <span className="text-[10px] text-rose-400 font-bold">SORT: SEVERITY</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[320px]">
              {failedNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className="p-2.5 rounded bg-[var(--card-subtle)] border border-rose-900/50 hover:border-rose-500 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block truncate max-w-[150px]">
                        {node.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">
                        {node.type} // {node.id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                    OFFLINE
                  </span>
                </div>
              ))}

              {degradedNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className="p-2.5 rounded bg-[var(--card-subtle)] border border-amber-900/50 hover:border-amber-500 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block truncate max-w-[150px]">
                        {node.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">
                        {node.type} // {node.id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    DEGRADED
                  </span>
                </div>
              ))}

              {healthyNodes.slice(0, 3).map((node) => (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className="p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:border-[#495464]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">
                      {node.name}
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold">NOMINAL</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
