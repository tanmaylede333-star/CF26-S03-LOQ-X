import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Plus, Trash2, Zap, Clock, ShieldAlert } from 'lucide-react';
import { InfrastructureNode } from '../../types/node';
import { SimulationState } from '../../types/simulation';
import { InitialFailure } from '../../types/scenario';

interface FailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: SimulationState;
  onInjectFailures: (failures: InitialFailure[]) => void;
}

export const FailureInjectionModal: React.FC<FailureModalProps> = ({
  isOpen,
  onClose,
  state,
  onInjectFailures,
}) => {
  const [disruptions, setDisruptions] = useState<Array<{
    nodeId: string;
    time: number;
    severity: 'FULL' | 'DEGRADED';
    reason: string;
  }>>([
    {
      nodeId: state.nodes[0]?.id || 'power-grid-main',
      time: state.currentTime,
      severity: 'FULL',
      reason: 'Scheduled transformer failure'
    }
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddDisruption = () => {
    const unusedNode = state.nodes.find(n => !disruptions.some(d => d.nodeId === n.id));
    setDisruptions([
      ...disruptions,
      {
        nodeId: unusedNode?.id || state.nodes[0]?.id || 'telecom-tower-01',
        time: state.currentTime,
        severity: 'FULL',
        reason: 'Simultaneous secondary disruption'
      }
    ]);
  };

  const handleRemoveDisruption = (index: number) => {
    if (disruptions.length === 1) return;
    setDisruptions(disruptions.filter((_, i) => i !== index));
  };

  const handleUpdateDisruption = (index: number, key: string, value: any) => {
    const copy = [...disruptions];
    copy[index] = { ...copy[index], [key]: value };
    setDisruptions(copy);
  };

  const handleInjectAll = () => {
    const failures: InitialFailure[] = disruptions.map((d, i) => ({
      nodeId: d.nodeId,
      time: d.time,
      originId: `ORIGIN_MANUAL_${d.nodeId.toUpperCase().replace(/-/g, '_')}_${i + 1}`,
      severity: d.severity,
      reason: d.reason || 'Manual multi-node disaster injection'
    }));

    onInjectFailures(failures);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="failure-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] rounded-2xl p-5 border border-red-500/40 shadow-2xl flex flex-col gap-4 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="failure-modal-title" className="text-base font-bold text-slate-100 font-heading">
                Inject Infrastructure Disruptions
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure multiple simultaneous or staged infrastructure failures.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scheduled Disruptions List */}
        <div className="space-y-3">
          {disruptions.map((disruption, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-red-900/50 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-red-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Disruption Origin #{idx + 1}
                </span>

                {disruptions.length > 1 && (
                  <button
                    onClick={() => handleRemoveDisruption(idx)}
                    className="p-1 rounded bg-red-950/50 hover:bg-red-900 text-red-400 transition-colors"
                    title="Remove this disruption"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Node selector */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-slate-400 block uppercase mb-1">
                    Target Urban Service
                  </label>
                  <select
                    value={disruption.nodeId}
                    onChange={(e) => handleUpdateDisruption(idx, 'nodeId', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-red-500 focus:outline-none"
                  >
                    {state.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timing */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block uppercase mb-1">
                    Trigger Timestamp
                  </label>
                  <div className="flex items-center gap-1 bg-[var(--card-subtle)] px-2 py-1 rounded-lg border border-[var(--border-color)]">
                    <Clock className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
                    <span className="font-mono text-xs text-[var(--text-secondary)]">T+</span>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={disruption.time}
                      onChange={(e) => handleUpdateDisruption(idx, 'time', Number(e.target.value))}
                      className="w-full bg-transparent text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none"
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)]">min</span>
                  </div>
                </div>
              </div>

              {/* Severity & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block uppercase mb-1">
                    Failure Severity
                  </label>
                  <select
                    value={disruption.severity}
                    onChange={(e) => handleUpdateDisruption(idx, 'severity', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-red-500 focus:outline-none"
                  >
                    <option value="FULL">Full Outage (FAILED)</option>
                    <option value="DEGRADED">Partial Load (DEGRADED)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-slate-400 block uppercase mb-1">
                    Causal Reason / Incident Notes
                  </label>
                  <input
                    type="text"
                    value={disruption.reason}
                    onChange={(e) => handleUpdateDisruption(idx, 'reason', e.target.value)}
                    placeholder="e.g. Core fiber severed during excavation"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddDisruption}
            className="w-full py-2 rounded-xl border border-dashed border-red-800/80 hover:border-red-600 bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Another Disruption Origin</span>
          </button>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-400">
            Total origins: <strong className="text-red-400">{disruptions.length}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleInjectAll}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
            >
              Schedule & Inject ({disruptions.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
