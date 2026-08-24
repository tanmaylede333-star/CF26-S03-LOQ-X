import React, { useState, useMemo } from 'react';
import {
  Shield,
  Zap,
  ArrowDown,
  CheckCircle2,
  Cpu,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Scenario } from '../../types/scenario';
import { RecoveryAction } from '../../types/recovery';
import { ResilienceAdvisor, ResilienceAdvisorReport, CandidateIntervention } from '../../engine/ResilienceAdvisor';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../../data/cityGraph';

interface AdvisorViewProps {
  scenario: Scenario;
  onDeployStrategy: (action: RecoveryAction) => void;
}

export const ResilienceAdvisorView: React.FC<AdvisorViewProps> = ({
  scenario,
  onDeployStrategy,
}) => {
  const report: ResilienceAdvisorReport = useMemo(() => {
    return ResilienceAdvisor.evaluateScenario(
      scenario,
      scenario.nodes || INITIAL_CITY_NODES,
      scenario.edges || INITIAL_CITY_EDGES
    );
  }, [scenario]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    report.topRecommendation?.candidate.id || report.evaluations[0]?.candidate.id || ''
  );

  const activeCandidate = report.evaluations.find(
    (e) => e.candidate.id === selectedCandidateId
  ) || report.topRecommendation || report.evaluations[0];

  const handleDeploy = () => {
    if (activeCandidate) {
      onDeployStrategy(activeCandidate.candidate.action);
    }
  };

  return (
    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto bg-[var(--app-bg)] font-mono text-[var(--text-primary)] transition-colors duration-200">
      {/* View Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-black tracking-wider text-[var(--text-primary)] uppercase">
            Strategy Comparison &amp; Advisory
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
            Evaluating Recovery Strategy Alpha vs Beta against {scenario.name.toUpperCase().replace(/\s+/g, '_')} cascade parameters.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ADVISOR ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Top 2-Column Section: Metrics Comparison & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Metrics Comparison (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-4 font-mono text-xs shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase text-[11px] font-heading">
              <Cpu className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              METRICS COMPARISON
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              SYNC: 14:02:09 UTC
            </span>
          </div>

          <div className="grid grid-cols-12 text-[10px] uppercase text-[var(--text-tertiary)] font-bold pb-1">
            <span className="col-span-4">PARAMETER</span>
            <span className="col-span-4 text-center">STRATEGY ALPHA (BASELINE)</span>
            <span className="col-span-4 text-right">STRATEGY BETA (PROPOSED)</span>
          </div>

          {/* Row 1: Cascade Depth */}
          <div className="flex flex-col gap-1.5 py-2 border-t border-[var(--border-color)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-secondary)]">Cascade Depth</span>
              <div className="flex items-center gap-3">
                <span className="text-rose-400 font-bold">{activeCandidate?.baselineMetrics.cascadeDepth || 5}</span>
                <div className="w-20 bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden">
                  <div className="bg-rose-500 h-full w-full" />
                </div>
                <span className="text-[var(--text-primary)] font-bold">{activeCandidate?.candidateMetrics.cascadeDepth || 2}</span>
                <div className="w-16 bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden">
                  <div className="bg-[#495464] h-full w-2/5" />
                </div>
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Row 2: Affected Services */}
          <div className="flex flex-col gap-1.5 py-2 border-t border-[var(--border-color)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-secondary)]">Affected Svcs</span>
              <div className="flex items-center gap-3">
                <span className="text-rose-400 font-bold">{activeCandidate?.baselineMetrics.affectedServices || 14}</span>
                <div className="w-20 bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden">
                  <div className="bg-rose-500 h-full w-full" />
                </div>
                <span className="text-[var(--text-primary)] font-bold">{activeCandidate?.candidateMetrics.affectedServices || 7}</span>
                <div className="w-16 bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden">
                  <div className="bg-[#495464] h-full w-1/2" />
                </div>
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Row 3: Recovery Time */}
          <div className="flex flex-col gap-1.5 py-2 border-t border-[var(--border-color)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-secondary)]">Recov. Time</span>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">4.2h</span>
                <div className="w-20 bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden">
                  <div className="bg-amber-500 h-full w-4/5" />
                </div>
                <span className="text-[var(--text-primary)] font-bold">1.8h</span>
                <div className="w-16 bg-[var(--card-subtle)] h-1.5 rounded overflow-hidden">
                  <div className="bg-[#495464] h-full w-1/3" />
                </div>
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Advisor Recommendations (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)] uppercase text-[11px] flex items-center gap-1.5 font-heading">
              <Shield className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              ADVISOR RECOMMENDATIONS
            </span>
          </div>

          <div className="space-y-2.5">
            {report.evaluations.slice(0, 3).map((evalResult, idx) => {
              const isSelected = activeCandidate?.candidate.id === evalResult.candidate.id;
              return (
                <div
                  key={evalResult.candidate.id}
                  onClick={() => setSelectedCandidateId(evalResult.candidate.id)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card-subtle)] border-[#495464] shadow-sm ring-1 ring-[#495464]'
                      : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-[#BBBFCA]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)] font-heading">
                        {evalResult.candidate.name}
                      </span>
                    </div>

                    <span className="text-[10px] text-[var(--text-primary)] font-bold bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                      {evalResult.impactReductionPercentage}% IMPACT REDUCTION
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">
                    {evalResult.candidate.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Intervention Detail */}
      <div className="p-5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Node Avatar graphic (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white">
            <Zap className="w-6 h-6" />
          </div>
          <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-heading">
            SUBSTATION 4 ISOLATION
          </span>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
            SYS_NODE_ID: AX-77B
          </span>
        </div>

        {/* Detail info & stats (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <span>Intervention Detail: Generator Deployment</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            Executing this intervention requires localized manual override. It successfully caps the cascade depth by injecting 4.2 MW into the isolated sub-grid.
          </p>

          {/* 4 Stat Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">CAPITAL COST</span>
              <span className="text-emerald-400 font-bold text-sm block mt-0.5">$14,500 ✓</span>
              <span className="text-[9px] text-[var(--text-tertiary)] block">APPROVED</span>
            </div>

            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">DEPLOY TIME</span>
              <span className="text-[var(--text-primary)] font-bold text-sm block mt-0.5">12 MIN</span>
            </div>

            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">RISK FACTOR</span>
              <span className="text-[var(--text-primary)] font-bold text-sm block mt-0.5">LOW (0.12)</span>
            </div>

            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">REQ. PERSONNEL</span>
              <span className="text-[var(--text-primary)] font-bold text-sm block mt-0.5">2 TIER-1 ENGS</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button className="px-4 py-2 rounded bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold font-mono transition-colors">
              REJECT CANDIDATE
            </button>

            <button
              onClick={handleDeploy}
              className="px-5 py-2 rounded bg-[#495464] hover:bg-[#334155] text-white font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_#1e293b] active:scale-95 flex items-center gap-1.5 border border-[#1e293b]"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>DEPLOY STRATEGY BETA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
