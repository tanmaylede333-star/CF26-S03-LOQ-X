import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplets,
  Shield,
  Layers,
  Clock,
  Play,
  Wrench,
  BatteryCharging,
  SlidersHorizontal
} from 'lucide-react';
import { Scenario } from '../../types/scenario';
import { RecoveryAction, RecoveryType } from '../../types/recovery';
import { SimulationEngine } from '../../engine/SimulationEngine';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../../data/cityGraph';

interface RecoveryComparisonViewProps {
  scenario: Scenario;
  onApplyStrategy: (action: RecoveryAction) => void;
}

export const RecoveryComparisonView: React.FC<RecoveryComparisonViewProps> = ({
  scenario,
  onApplyStrategy,
}) => {
  const nodes = scenario.nodes || INITIAL_CITY_NODES;
  const edges = scenario.edges || INITIAL_CITY_EDGES;

  // 1. Determine target candidate node from scenario failures or highest centrality node
  const rootFailureNodeId = scenario.initialFailures?.[0]?.nodeId || 'power-grid-main';
  const targetNode = nodes.find(n => n.id === rootFailureNodeId) || nodes[0];

  // 2. Selectable strategy type
  const [selectedStrategyType, setSelectedStrategyType] = useState<RecoveryType>('BACKUP_POWER');

  // 3. Construct dynamic strategy action based on active scenario and selected strategy
  const strategyAction: RecoveryAction = useMemo(() => {
    const isIsolate = selectedStrategyType === 'ISOLATE';
    const isBackup = selectedStrategyType === 'BACKUP_POWER';

    return {
      id: `strat-${selectedStrategyType.toLowerCase()}-${targetNode.id}`,
      nodeId: targetNode.id,
      nodeName: targetNode.name,
      type: selectedStrategyType,
      startTime: isIsolate ? 2 : 5,
      duration: isIsolate ? 0 : isBackup ? 10 : 15,
      cost: isIsolate ? 15 : isBackup ? 35 : 50,
      description: isBackup
        ? `Deploy Auxiliary Emergency Backup to ${targetNode.name}`
        : isIsolate
        ? `Isolate ${targetNode.name} from secondary cascade pathways`
        : `Dispatch rapid engineering repair crew to ${targetNode.name}`,
      status: 'SCHEDULED',
    };
  }, [selectedStrategyType, targetNode]);

  // 4. Memoized Baseline and Proposed Simulation Runs (TICK-001 Fix)
  const { baselineState, proposedState, deltaAffected, deltaDepth } = useMemo(() => {
    const baselineEngine = new SimulationEngine(
      { ...scenario, scheduledRecoveries: [] },
      nodes,
      edges
    );
    const bState = baselineEngine.runAll();

    const proposedEngine = new SimulationEngine(
      {
        ...scenario,
        scheduledRecoveries: [strategyAction],
      },
      nodes,
      edges
    );
    const pState = proposedEngine.runAll();

    const dAff = Math.max(0, bState.metrics.affectedServices - pState.metrics.affectedServices);
    const dDep = Math.max(0, bState.metrics.cascadeDepth - pState.metrics.cascadeDepth);

    return {
      baselineState: bState,
      proposedState: pState,
      deltaAffected: dAff,
      deltaDepth: dDep,
    };
  }, [scenario, nodes, edges, strategyAction]);

  return (
    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto bg-[#07090e] font-body-md text-on-surface">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
            Recovery Strategy A/B Comparison
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 font-sans">
            Evaluating Baseline (No Intervention) vs Proposed Intervention for <span className="text-[var(--text-primary)] font-bold">{scenario.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#495464] border border-[#BBBFCA] text-xs font-mono text-white font-bold shadow-sm">
          <GitCompare className="w-4 h-4 text-white" />
          <span>PARALLEL DISCRETE SIMULATION</span>
        </div>
      </div>

      {/* Strategy Type Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-[var(--surface-bg)] border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)]">
          <SlidersHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="font-bold font-heading">Intervention Target:</span>
          <span className="text-[var(--text-primary)] bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)] font-bold">
            {targetNode.name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[var(--text-secondary)] font-bold font-heading">Strategy:</span>
          <button
            onClick={() => setSelectedStrategyType('BACKUP_POWER')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              selectedStrategyType === 'BACKUP_POWER'
                ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>Auxiliary Backup</span>
          </button>
          <button
            onClick={() => setSelectedStrategyType('REPAIR')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              selectedStrategyType === 'REPAIR'
                ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Rapid Repair</span>
          </button>
          <button
            onClick={() => setSelectedStrategyType('ISOLATE')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              selectedStrategyType === 'ISOLATE'
                ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Grid Isolation</span>
          </button>
        </div>
      </div>

      {/* Comparative Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold font-heading">
            CASCADE DEPTH REDUCTION
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">
              -{deltaDepth} Levels
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              ({baselineState.metrics.cascadeDepth} → {proposedState.metrics.cascadeDepth})
            </span>
          </div>
        </div>

        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold font-heading">
            PROTECTED SERVICES
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">
              +{deltaAffected} Nodes
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              ({baselineState.metrics.affectedServices} → {proposedState.metrics.affectedServices} affected)
            </span>
          </div>
        </div>

        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold font-heading">
            SYSTEM HEALTH GAIN
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              +{Math.max(0, proposedState.metrics.systemHealthPercentage - baselineState.metrics.systemHealthPercentage)}%
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              ({baselineState.metrics.systemHealthPercentage}% → {proposedState.metrics.systemHealthPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 font-mono">
        {/* Strategy Alpha (Baseline) */}
        <div className="p-5 rounded bg-[var(--surface-bg)] border border-rose-900/50 flex flex-col justify-between gap-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <span className="text-xs font-bold text-rose-400 uppercase font-heading">
                STRATEGY ALPHA (NO INTERVENTION)
              </span>
              <span className="text-[10px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-bold">
                UNMITIGATED
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              Standard passive response without auxiliary generation or active bypass. Failures propagate unhindered across all dependent service layers.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">Affected Services:</span>
                <span className="text-rose-400 font-bold">
                  {baselineState.metrics.affectedServices} / {baselineState.metrics.totalNodes}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">Cascade Max Depth:</span>
                <span className="text-rose-400 font-bold">
                  Level {baselineState.metrics.cascadeDepth}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">Final System Health:</span>
                <span className="text-rose-400 font-bold">
                  {baselineState.metrics.systemHealthPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Beta (Intervention) */}
        <div className="p-5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase font-heading">
                STRATEGY BETA ({selectedStrategyType.replace('_', ' ')})
              </span>
              <span className="text-[10px] text-[var(--text-primary)] bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)] font-bold">
                ACTIVE INTERVENTION
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              {strategyAction.description}. Deployed at T+{strategyAction.startTime} with duration {strategyAction.duration} min.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">Affected Services:</span>
                <span className="text-emerald-400 font-bold">
                  {proposedState.metrics.affectedServices} / {proposedState.metrics.totalNodes}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">Cascade Max Depth:</span>
                <span className="text-emerald-400 font-bold">
                  Level {proposedState.metrics.cascadeDepth}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">Final System Health:</span>
                <span className="text-emerald-400 font-bold">
                  {proposedState.metrics.systemHealthPercentage}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onApplyStrategy(strategyAction)}
            className="w-full py-2.5 rounded bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_#1e293b] border border-[#1e293b] active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>DEPLOY STRATEGY BETA TO LIVE ENGINE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
