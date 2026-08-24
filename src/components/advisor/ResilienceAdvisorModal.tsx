import React, { useMemo } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  Activity,
  Clock,
  ArrowRight,
  TrendingDown,
  Wrench,
  BatteryCharging,
  Shield,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Scenario } from '../../types/scenario';
import { RecoveryAction } from '../../types/recovery';
import { ResilienceAdvisor, ResilienceAdvisorReport } from '../../engine/ResilienceAdvisor';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../../data/cityGraph';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: Scenario;
  onApplyIntervention: (action: RecoveryAction) => void;
}

export const ResilienceAdvisorModal: React.FC<AdvisorModalProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onApplyIntervention,
}) => {
  const report: ResilienceAdvisorReport = useMemo(() => {
    return ResilienceAdvisor.evaluateScenario(
      currentScenario,
      currentScenario.nodes || INITIAL_CITY_NODES,
      currentScenario.edges || INITIAL_CITY_EDGES
    );
  }, [currentScenario]);

  if (!isOpen) return null;

  const topRec = report.topRecommendation;

  const handleApply = (action: RecoveryAction) => {
    onApplyIntervention(action);
    onClose();
  };

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'BACKUP_POWER':
        return <BatteryCharging className="w-4 h-4 text-[var(--text-secondary)]" />;
      case 'ISOLATE':
        return <Shield className="w-4 h-4 text-[var(--text-secondary)]" />;
      default:
        return <Wrench className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm">
              <Cpu className="w-6 h-6 text-[var(--text-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-heading">
                  Resilience Advisor
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold">
                  DECISION SUPPORT
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-sans">
                Deterministic algorithmic optimization: Identifies the single most effective intervention to mitigate cascading failures.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* #1 Top Recommendation Card */}
        {topRec && (
          <div className="p-4 rounded-xl bg-[var(--card-subtle)] border-2 border-[#495464] shadow-sm flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#495464] text-white font-black uppercase tracking-wider">
                  #1 TOP RECOMMENDATION
                </span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  {topRec.impactReductionPercentage}% Simulated Impact Reduction
                </span>
              </div>

              <button
                onClick={() => handleApply(topRec.candidate.action)}
                className="px-4 py-1.5 rounded-lg bg-[#495464] hover:bg-[#334155] text-white text-xs font-bold transition-all shadow-[2px_2px_0px_#1e293b] border border-[#1e293b] active:scale-95 flex items-center gap-1.5 uppercase font-heading"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply This Strategy</span>
              </button>
            </div>

            <div>
              <h4 className="text-base font-bold text-[var(--text-primary)] font-heading flex items-center gap-2">
                {getStrategyIcon(topRec.candidate.type)}
                {topRec.candidate.name}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-sans">
                {topRec.candidate.description}
              </p>
            </div>

            {/* Metric Comparison Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[var(--border-color)] text-center font-mono">
              <div className="p-2 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold font-heading">Cascade Depth</span>
                <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                  <span className="text-rose-400 font-bold text-sm">{topRec.baselineMetrics.cascadeDepth}</span>
                  <span className="text-[var(--text-tertiary)]">→</span>
                  <span className="text-emerald-400 font-bold text-base">{topRec.candidateMetrics.cascadeDepth}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  -{topRec.depthReduction} hops
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold font-heading">Affected Services</span>
                <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                  <span className="text-rose-400 font-bold text-sm">{topRec.baselineMetrics.affectedServices}</span>
                  <span className="text-[var(--text-tertiary)]">→</span>
                  <span className="text-emerald-400 font-bold text-base">{topRec.candidateMetrics.affectedServices}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  -{topRec.affectedServicesReduction} saved
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold font-heading">Recovery Time</span>
                <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                  <span className="text-rose-400 font-bold text-sm">{topRec.baselineMetrics.recoveryTime > 0 ? `${topRec.baselineMetrics.recoveryTime}m` : '∞'}</span>
                  <span className="text-[var(--text-tertiary)]">→</span>
                  <span className="text-emerald-400 font-bold text-base">{topRec.candidateMetrics.recoveryTime}m</span>
                </div>
                <span className="text-[10px] text-[var(--text-primary)] font-bold">
                  -{topRec.recoveryTimeReduction}m faster
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[var(--text-secondary)] font-mono bg-[var(--surface-bg)] p-2 rounded-md border border-[var(--border-color)]">
              <strong className="text-[var(--text-primary)]">Rationale:</strong> {topRec.rationale}
            </div>
          </div>
        )}

        {/* Other Candidate Interventions Table */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-heading">
            All Evaluated Resilience Strategies ({report.evaluations.length})
          </span>

          <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-bg)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--card-subtle)] border-b border-[var(--border-color)] text-[var(--text-tertiary)] text-[10px] uppercase">
                <tr>
                  <th className="p-2.5 pl-3">Rank &amp; Strategy</th>
                  <th className="p-2.5">Target Service</th>
                  <th className="p-2.5 text-center">Depth</th>
                  <th className="p-2.5 text-center">Saved</th>
                  <th className="p-2.5 text-center">Score</th>
                  <th className="p-2.5 text-right pr-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                {report.evaluations.map((evalResult) => {
                  const isTop = evalResult.rank === 1;
                  return (
                    <tr key={evalResult.candidate.id} className={isTop ? 'bg-[var(--card-subtle)]' : 'hover:bg-[var(--card-subtle)]'}>
                      <td className="p-2.5 pl-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isTop ? 'bg-[#495464] text-white' : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                          }`}>
                            {evalResult.rank}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block font-heading">{evalResult.candidate.name}</span>
                            <span className="text-[10px] text-[var(--text-tertiary)]">{evalResult.candidate.type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-2.5 text-[var(--text-secondary)] truncate max-w-[140px]">
                        {evalResult.candidate.targetNodeName}
                      </td>

                      <td className="p-2.5 text-center font-bold text-[var(--text-primary)]">
                        {evalResult.candidateMetrics.cascadeDepth} <span className="text-[var(--text-tertiary)] font-normal">(-{evalResult.depthReduction})</span>
                      </td>

                      <td className="p-2.5 text-center font-bold text-emerald-400">
                        {evalResult.affectedServicesReduction} saved
                      </td>

                      <td className="p-2.5 text-center font-black text-[var(--text-primary)]">
                        {evalResult.overallScore}%
                      </td>

                      <td className="p-2.5 text-right pr-3">
                        <button
                          onClick={() => handleApply(evalResult.candidate.action)}
                          className="px-2.5 py-1 rounded bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] font-semibold transition-colors"
                        >
                          Apply
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking Methodology Explainer */}
        <div className="p-3 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--text-primary)] font-semibold block font-heading">Transparent Deterministic Scoring Basis:</strong>
            Candidates are executed against the active scenario and ranked via:
            <span className="text-[var(--text-primary)] font-bold"> 40% Affected-Service Reduction + 40% Recovery-Time Acceleration + 20% Cascade-Depth Prevention</span>.
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
