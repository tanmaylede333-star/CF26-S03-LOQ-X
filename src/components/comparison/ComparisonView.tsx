import React, { useState, useMemo } from 'react';
import {
  X,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  Layers,
  Activity,
  Clock,
  ShieldCheck,
  Wrench,
  BatteryCharging,
  Shield
} from 'lucide-react';
import { SimulationEngine } from '../../engine/SimulationEngine';
import { Scenario } from '../../types/scenario';
import { RecoveryAction } from '../../types/recovery';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../../data/cityGraph';

interface ComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: Scenario;
}

export const ComparisonView: React.FC<ComparisonProps> = ({
  isOpen,
  onClose,
  currentScenario,
}) => {
  // Strategy selection states
  const [strategyAType, setStrategyAType] = useState<'REPAIR' | 'BACKUP_POWER' | 'ISOLATE'>('REPAIR');
  const [strategyBType, setStrategyBType] = useState<'REPAIR' | 'BACKUP_POWER' | 'ISOLATE'>('BACKUP_POWER');

  // Run three deterministic simulations in memory from the exact same initial disruption:
  // 1. Baseline: No Recovery
  // 2. Strategy A
  // 3. Strategy B
  const { baselineMetrics, strategyAMetrics, strategyBMetrics } = useMemo(() => {
    // 1. Baseline
    const baselineScenario: Scenario = {
      ...currentScenario,
      id: `${currentScenario.id}-baseline`,
      scheduledRecoveries: [],
    };
    const engineBaseline = new SimulationEngine(baselineScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const baselineResult = engineBaseline.runAll();

    // 2. Strategy A
    const actionA: RecoveryAction = {
      id: 'strat-a-action',
      nodeId: strategyAType === 'REPAIR' ? 'power-grid-main' : 'water-pump-01',
      nodeName: strategyAType === 'REPAIR' ? 'Central Power Substation #01' : 'North Intake Water Pump',
      type: strategyAType,
      startTime: 6,
      duration: strategyAType === 'REPAIR' ? 12 : 5,
      cost: 30,
      status: 'SCHEDULED',
    };
    const scenarioA: Scenario = {
      ...currentScenario,
      id: `${currentScenario.id}-strat-a`,
      scheduledRecoveries: [actionA],
    };
    const engineA = new SimulationEngine(scenarioA, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const resultA = engineA.runAll();

    // 3. Strategy B
    const actionB: RecoveryAction = {
      id: 'strat-b-action',
      nodeId: strategyBType === 'BACKUP_POWER' ? 'water-pump-01' : 'hospital-metro-01',
      nodeName: strategyBType === 'BACKUP_POWER' ? 'North Intake Water Pump' : 'Metro Hospital Trauma Center',
      type: strategyBType,
      startTime: 5,
      duration: strategyBType === 'ISOLATE' ? 0 : 5,
      cost: 20,
      status: 'SCHEDULED',
    };
    const scenarioB: Scenario = {
      ...currentScenario,
      id: `${currentScenario.id}-strat-b`,
      scheduledRecoveries: [actionB],
    };
    const engineB = new SimulationEngine(scenarioB, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const resultB = engineB.runAll();

    return {
      baselineMetrics: baselineResult.metrics,
      strategyAMetrics: resultA.metrics,
      strategyBMetrics: resultB.metrics,
    };
  }, [currentScenario, strategyAType, strategyBType]);

  if (!isOpen) return null;

  const hopsSaved = Math.abs(strategyAMetrics.cascadeDepth - strategyBMetrics.cascadeDepth);
  const servicesSaved = Math.abs(strategyAMetrics.affectedServices - strategyBMetrics.affectedServices);
  const recoveryDelta = Math.abs(strategyAMetrics.recoveryTime - strategyBMetrics.recoveryTime);

  const betterStrategy = strategyBMetrics.affectedServices <= strategyAMetrics.affectedServices ? 'Strategy B' : 'Strategy A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-heading">
                Recovery Strategy A/B Comparison
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Compare candidate mitigation interventions starting from the identical baseline scenario: <strong>"{currentScenario.name}"</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Factual Simulation Result Banner */}
        <div className="p-3.5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-color)] flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-primary)] tracking-wider block font-heading">
              SIMULATION RESULT
            </span>
            <p className="text-xs text-[var(--text-secondary)] leading-snug font-sans">
              {betterStrategy} produced{' '}
              <strong className="text-emerald-400 font-bold">{hopsSaved} fewer cascade hops</strong>,{' '}
              <strong className="text-emerald-400 font-bold">{servicesSaved} fewer affected services</strong>, and{' '}
              <strong className="text-emerald-400 font-bold">{recoveryDelta} minutes faster stabilization</strong> compared to alternate intervention.
            </p>
          </div>
        </div>

        {/* Strategy Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Strategy A */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] font-heading">
                STRATEGY A: Direct Repair
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                T+6m Dispatch
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans">
              Dispatches emergency utility repair crews directly to Central Substation #01 to replace blown transformer elements.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-color)] text-center font-mono">
              <div>
                <span className="text-[9px] text-[var(--text-tertiary)] block uppercase">Depth</span>
                <span className="text-base font-bold text-[var(--text-primary)]">{strategyAMetrics.cascadeDepth}</span>
              </div>
              <div>
                <span className="text-[9px] text-[var(--text-tertiary)] block uppercase">Affected</span>
                <span className="text-base font-bold text-rose-400">{strategyAMetrics.affectedServices}</span>
              </div>
              <div>
                <span className="text-[9px] text-[var(--text-tertiary)] block uppercase">Recovery</span>
                <span className="text-base font-bold text-emerald-400">{strategyAMetrics.recoveryTime}m</span>
              </div>
            </div>
          </div>

          {/* Strategy B */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] font-heading">
                STRATEGY B: Downstream Auxiliary Power
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                T+5m Activation
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans">
              Activates automated auxiliary diesel turbine at North Water Pump to keep water distribution and hospital operations active.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-color)] text-center font-mono">
              <div>
                <span className="text-[9px] text-[var(--text-tertiary)] block uppercase">Depth</span>
                <span className="text-base font-bold text-[var(--text-primary)]">{strategyBMetrics.cascadeDepth}</span>
              </div>
              <div>
                <span className="text-[9px] text-[var(--text-tertiary)] block uppercase">Affected</span>
                <span className="text-base font-bold text-emerald-400">{strategyBMetrics.affectedServices}</span>
              </div>
              <div>
                <span className="text-[9px] text-[var(--text-tertiary)] block uppercase">Recovery</span>
                <span className="text-base font-bold text-emerald-400">{strategyBMetrics.recoveryTime}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Way Comparative Matrix */}
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-bg)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--card-subtle)] border-b border-[var(--border-color)] text-[var(--text-tertiary)] text-[10px] uppercase">
              <tr>
                <th className="p-2.5 pl-4">Simulation Metric</th>
                <th className="p-2.5 text-center text-rose-400">Baseline (No Recovery)</th>
                <th className="p-2.5 text-center text-[var(--text-secondary)]">Strategy A (Repair)</th>
                <th className="p-2.5 text-center text-[var(--text-primary)]">Strategy B (Aux Power)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
              <tr>
                <td className="p-2.5 pl-4 font-semibold text-[var(--text-secondary)] font-sans">Cascade Propagation Depth</td>
                <td className="p-2.5 text-center text-rose-400 font-bold">{baselineMetrics.cascadeDepth} hops</td>
                <td className="p-2.5 text-center font-bold text-[var(--text-secondary)]">{strategyAMetrics.cascadeDepth} hops</td>
                <td className="p-2.5 text-center font-bold text-emerald-400">{strategyBMetrics.cascadeDepth} hops</td>
              </tr>
              <tr>
                <td className="p-2.5 pl-4 font-semibold text-[var(--text-secondary)] font-sans">Downstream Affected Services</td>
                <td className="p-2.5 text-center text-rose-400 font-bold">{baselineMetrics.affectedServices}</td>
                <td className="p-2.5 text-center font-bold text-[var(--text-secondary)]">{strategyAMetrics.affectedServices}</td>
                <td className="p-2.5 text-center font-bold text-emerald-400">{strategyBMetrics.affectedServices}</td>
              </tr>
              <tr>
                <td className="p-2.5 pl-4 font-semibold text-[var(--text-secondary)] font-sans">Total Recovery Duration</td>
                <td className="p-2.5 text-center text-rose-400 font-bold">
                  {baselineMetrics.recoveryTime > 0 ? `${baselineMetrics.recoveryTime}m` : '∞ (Unmitigated)'}
                </td>
                <td className="p-2.5 text-center font-bold text-[var(--text-secondary)]">{strategyAMetrics.recoveryTime}m</td>
                <td className="p-2.5 text-center font-bold text-emerald-400">{strategyBMetrics.recoveryTime}m</td>
              </tr>
              <tr>
                <td className="p-2.5 pl-4 font-semibold text-[var(--text-secondary)] font-sans">System Service Status</td>
                <td className="p-2.5 text-center text-rose-400 font-bold">{baselineMetrics.systemHealthPercentage}%</td>
                <td className="p-2.5 text-center font-bold text-[var(--text-secondary)]">{strategyAMetrics.systemHealthPercentage}%</td>
                <td className="p-2.5 text-center font-bold text-emerald-400">{strategyBMetrics.systemHealthPercentage}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#1e293b] border border-[#1e293b] font-mono"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
