import React from 'react';
import { X, Play, Zap, Radio, Droplets, CloudRain, Sparkles, Clock, Layers } from 'lucide-react';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';
import { Scenario } from '../../types/scenario';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'POWER':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'DUAL_FAILURE':
        return <Radio className="w-4 h-4 text-rose-400" />;
      case 'WATER':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'WEATHER':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-2xl flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-heading">
              Select Simulation Scenario
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans">
              Choose a predefined benchmark scenario to evaluate deterministic cascade propagation.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario List */}
        <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2.5">
          {PREDEFINED_SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === currentScenario.id;

            return (
              <div
                key={scenario.id}
                onClick={() => {
                  onSelectScenario(scenario);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--card-subtle)] border-[#495464] ring-1 ring-[#495464] shadow-sm'
                    : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-[#BBBFCA]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)]">
                      {getCategoryIcon(scenario.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                        {scenario.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] font-semibold uppercase">
                        {scenario.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {scenario.isIncidentInspired && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-bold">
                      INCIDENT-INSPIRED
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#495464] border border-[#1e293b] text-white font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--text-secondary)] mb-2 leading-relaxed font-sans">
                  {scenario.description}
                </p>

                {scenario.incidentReference && (
                  <p className="text-[10px] font-mono text-amber-400/80 mb-3 italic">
                    ℹ {scenario.incidentReference}
                  </p>
                )}

                {/* Scenario Meta Chips */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
                    Initial Failures: <strong className="text-[var(--text-primary)]">{scenario.initialFailures.length}</strong>
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                    Max Duration: <strong className="text-[var(--text-primary)]">{scenario.parameters.maxSimulationTime}m</strong>
                  </span>

                  {scenario.scheduledRecoveries && scenario.scheduledRecoveries.length > 0 && (
                    <span className="text-emerald-400 font-semibold">
                      • {scenario.scheduledRecoveries.length} Pre-scheduled Intervention
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium font-mono"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
