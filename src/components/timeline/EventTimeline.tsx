import React, { useState } from 'react';
import { Clock, AlertTriangle, ShieldCheck, ArrowRight, Zap, RefreshCw, Layers } from 'lucide-react';
import { SimulationEvent } from '../../types/event';
import { formatTime } from '../../lib/utils';

interface TimelineProps {
  events: SimulationEvent[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
}

export const EventTimeline: React.FC<TimelineProps> = ({
  events,
  onSelectNode,
  selectedNodeId,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAILURES' | 'RECOVERIES'>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filter === 'FAILURES') {
      return e.type === 'FAILURE_INJECTED' || e.type === 'FAILURE_PROPAGATED';
    }
    if (filter === 'RECOVERIES') {
      return e.type === 'RECOVERY_STARTED' || e.type === 'RECOVERY_COMPLETED' || e.type === 'SERVICE_ISOLATED';
    }
    return true;
  });

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col h-[580px] lg:h-[620px] bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-sm">
      {/* Header & Filter Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-heading">
            Causal Event Timeline
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
            {filteredEvents.length}
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-[var(--card-subtle)] p-0.5 rounded-lg border border-[var(--border-color)] text-[10px] font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filter === 'ALL' ? 'bg-[#495464] text-white font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('FAILURES')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filter === 'FAILURES' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Disruptions
          </button>
          <button
            onClick={() => setFilter('RECOVERIES')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filter === 'RECOVERIES' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Recoveries
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative font-mono">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-tertiary)] p-6 font-sans">
            <Clock className="w-8 h-8 mb-2 opacity-30 text-[var(--text-tertiary)]" />
            <p className="text-xs">No simulation events recorded yet.</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Press RUN or inject a disruption to start the cascade.</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const isFailure = event.type === 'FAILURE_INJECTED' || event.type === 'FAILURE_PROPAGATED';
            const isRecovery = event.type === 'RECOVERY_STARTED' || event.type === 'RECOVERY_COMPLETED';
            const isScenarioStart = event.type === 'SCENARIO_STARTED';
            const isSelected = selectedNodeId === event.targetNode;

            return (
              <div
                key={event.id || index}
                onClick={() => event.targetNode !== 'system' && onSelectNode(event.targetNode)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#495464] bg-[var(--card-subtle)] ring-1 ring-[#495464] shadow-sm'
                    : isFailure
                    ? 'border-rose-900/40 bg-rose-950/20 hover:border-rose-700/60'
                    : isRecovery
                    ? 'border-emerald-900/40 bg-emerald-950/20 hover:border-emerald-700/60'
                    : 'border-[var(--border-color)] bg-[var(--card-subtle)] hover:border-[#BBBFCA]'
                }`}
              >
                {/* Event Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--surface-bg)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
                      {formatTime(event.timestamp)}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        isFailure
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : isRecovery
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-[var(--surface-bg)] text-[var(--text-primary)] border border-[var(--border-color)]'
                      }`}
                    >
                      {event.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {event.newState && event.newState !== 'HEALTHY' && (
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        event.newState === 'FAILED'
                          ? 'text-rose-400'
                          : event.newState === 'DEGRADED'
                          ? 'text-amber-400'
                          : event.newState === 'RECOVERING'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      → {event.newState}
                    </span>
                  )}
                </div>

                {/* Target Node Name & Description */}
                <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 font-heading">
                  {isFailure ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : isRecovery ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                  )}
                  <span>{event.targetNodeName}</span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">{event.message}</p>

                {/* Explainability Causal Chain */}
                {event.cause && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex flex-col gap-1">
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)] font-semibold">CAUSE:</span>
                      <span className="text-[var(--text-primary)] truncate">{event.cause.reason}</span>
                    </div>

                    {event.cause?.chain && event.cause.chain.length > 1 && (
                      <div className="flex items-center gap-1 text-[9px] font-mono text-[var(--text-secondary)] overflow-x-auto py-0.5">
                        <Layers className="w-2.5 h-2.5 shrink-0" />
                        <span>Path:</span>
                        {event.cause.chain.map((hop, idx) => (
                          <React.Fragment key={idx}>
                            <span className="px-1 py-0.2 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-primary)] truncate max-w-[90px]">
                              {hop}
                            </span>
                            {idx < (event.cause?.chain?.length || 0) - 1 && (
                              <ArrowRight className="w-2 h-2 text-[var(--text-tertiary)] shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
