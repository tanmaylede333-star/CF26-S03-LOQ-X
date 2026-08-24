import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Wrench,
  BatteryCharging,
  Shield,
  Clock,
  Radio,
  Users,
  DollarSign,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { RecoveryAction, RecoveryType } from '../../types/recovery';
import { InfrastructureNode } from '../../types/node';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: SimulationState;
  onApplyRecovery: (action: RecoveryAction) => void;
}

interface StrategyPreset {
  id: string;
  name: string;
  duration: number;
  cost: number;
  crews: string;
  description: string;
  realWorldContext: string;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  state,
  onApplyRecovery,
}) => {
  // Default to first non-healthy node or selected node
  const nonHealthyNodes = state.nodes.filter((n) => n.status !== 'HEALTHY');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    state.selectedNodeId || nonHealthyNodes[0]?.id || state.nodes[0]?.id || ''
  );

  // Synchronize target node whenever modal opens or active selection changes
  useEffect(() => {
    if (isOpen) {
      if (state.selectedNodeId) {
        setSelectedNodeId(state.selectedNodeId);
      } else {
        const nonHealthy = state.nodes.filter((n) => n.status !== 'HEALTHY');
        if (nonHealthy.length > 0) {
          setSelectedNodeId(nonHealthy[0].id);
        } else if (state.nodes.length > 0) {
          setSelectedNodeId(state.nodes[0].id);
        }
      }
    }
  }, [isOpen, state.selectedNodeId, state.nodes]);

  const [recoveryType, setRecoveryType] = useState<RecoveryType>('REPAIR');
  const targetNode = state.nodes.find((n) => n.id === selectedNodeId) || state.nodes[0];
  const nodeStatus = state.nodeStates[targetNode?.id]?.status || targetNode?.status || 'HEALTHY';
  const isDegraded = nodeStatus === 'DEGRADED';

  // Compute domain-specific calibrated presets based on asset type and damage severity
  const presets: Record<RecoveryType, StrategyPreset[]> = useMemo(() => {
    if (!targetNode) {
      return {
        REPAIR: [],
        BACKUP_POWER: [],
        ISOLATE: [],
        REROUTE_NETWORK: [],
      };
    }

    const type = targetNode.type.toUpperCase();

    // 1. REPAIR PRESETS
    let repairPresets: StrategyPreset[] = [];
    if (type === 'POWER') {
      repairPresets = [
        {
          id: 'pwr-rep-overhaul',
          name: 'High-Voltage Step-Down Transformer Replacement',
          duration: isDegraded ? 35 : 60,
          cost: 65,
          crews: '4 Tier-1 High-Voltage Grid Engineers',
          description: 'Deploy replacement 400kV/33kV oil-immersed step-down transformer and recalibrate busbar breakers.',
          realWorldContext: 'Standard field replacement procedure for major utility substation catastrophic arc faults.',
        },
        {
          id: 'pwr-rep-bypass',
          name: 'Mobile Substation Rapid Trailer Deployment',
          duration: isDegraded ? 15 : 25,
          cost: 40,
          crews: '2 Rapid Response Utility Technicians',
          description: 'Connect mobile trailer-mounted emergency step-down substation to bypass damaged transformer bay.',
          realWorldContext: 'Standard emergency protocol to restore transmission feeds before permanent transformer rebuild.',
        },
        {
          id: 'pwr-rep-fast',
          name: 'Circuit Breaker Re-closure & Insulation Test',
          duration: isDegraded ? 8 : 15,
          cost: 20,
          crews: '2 Field Electrical Technicians',
          description: 'Clear transient trip conditions, test insulation resistance, and execute remote SCADA re-closure.',
          realWorldContext: 'Fast recovery for transient overvoltage or minor localized feeder faults.',
        },
      ];
    } else if (type === 'WATER') {
      repairPresets = [
        {
          id: 'wtr-rep-overhaul',
          name: 'Turbine Impeller & Hydraulic Motor Rebuild',
          duration: isDegraded ? 25 : 45,
          cost: 50,
          crews: '3 Hydraulic Mechanical Technicians',
          description: 'Disassemble seized intake turbine, replace worn impellers and high-pressure seals, and re-prime pumps.',
          realWorldContext: 'Municipal water authority protocol for riverfront intake cavitation and debris blockage.',
        },
        {
          id: 'wtr-rep-fast',
          name: 'Emergency Sluice Bypass & Siphon Activation',
          duration: isDegraded ? 10 : 20,
          cost: 25,
          crews: '2 Water Works Engineers',
          description: 'Manually open secondary gravity siphon channels and bypass offline primary intake pump.',
          realWorldContext: 'Restores baseline municipal line pressure within 20 minutes.',
        },
      ];
    } else if (type === 'TELECOM') {
      repairPresets = [
        {
          id: 'tel-rep-overhaul',
          name: 'Multi-Core Optical Fiber Fusion Splicing',
          duration: isDegraded ? 20 : 35,
          cost: 45,
          crews: '2 Certified Optical Fiber Technicians',
          description: 'Locate severed underground optical trunk, strip cladding, and execute precision fusion splicing for 96 fiber cores.',
          realWorldContext: 'Standard telecommunication restoration for municipal excavation severances.',
        },
        {
          id: 'tel-rep-fast',
          name: 'Microwave Transceiver Pointing & Reboot',
          duration: isDegraded ? 8 : 15,
          cost: 20,
          crews: '1 Wireless Communications Specialist',
          description: 'Realign rooftop microwave backhaul dishes and cold-boot SCADA router stacks.',
          realWorldContext: 'Rapid restoration for wireless backbone and telemetry channels.',
        },
      ];
    } else if (type === 'HOSPITAL') {
      repairPresets = [
        {
          id: 'hosp-rep-overhaul',
          name: 'Internal Medical Gas & Redundant Power Overhaul',
          duration: isDegraded ? 18 : 30,
          cost: 40,
          crews: '3 Certified Biomedical Facility Engineers',
          description: 'Repair internal dual-circuit transfer switch, re-pressurize medical oxygen loops, and calibrate ICU circuits.',
          realWorldContext: 'Critical hospital protocol ensuring full operational status of surgical suites and life support.',
        },
      ];
    } else {
      repairPresets = [
        {
          id: 'gen-rep-standard',
          name: 'Certified Engineering Crew Repair & Overhaul',
          duration: isDegraded ? 12 : 25,
          cost: 30,
          crews: '2 Field Service Technicians',
          description: `Deploy certified technical crew to replace damaged modules and restore ${targetNode.name} to full operational health.`,
          realWorldContext: 'Standard municipal utility restoration protocol.',
        },
      ];
    }

    // 2. AUXILIARY POWER PRESETS
    let backupPresets: StrategyPreset[] = [];
    if (type === 'POWER') {
      backupPresets = [
        {
          id: 'pwr-aux-gen',
          name: '1.5 MVA Mobile Diesel Generator Synchronization',
          duration: 12,
          cost: 35,
          crews: '2 Power Plant Operators',
          description: 'Dispatch mobile diesel generator unit and synchronize phase matching to sub-grid busbar.',
          realWorldContext: 'Supplies emergency power to critical downstream pumps and communications.',
        },
      ];
    } else if (type === 'HOSPITAL') {
      backupPresets = [
        {
          id: 'hosp-aux-gen',
          name: 'Dual Diesel Gen-Set Automated Failover',
          duration: 5,
          cost: 20,
          crews: '1 Hospital Facility Engineer',
          description: 'Engage hospital emergency diesel generator banks with automatic transfer switch (ATS) synchronization.',
          realWorldContext: 'Guarantees continuous electrical feed to ICU and emergency trauma units.',
        },
      ];
    } else if (type === 'TELECOM') {
      backupPresets = [
        {
          id: 'tel-aux-lfp',
          name: 'Lithium-Iron-Phosphate (LFP) Battery Rack Switchover',
          duration: 4,
          cost: 15,
          crews: 'Automated Remote SCADA Command',
          description: 'Activate continuous-duty UPS battery storage system at telecom transmission station.',
          realWorldContext: 'Provides 8+ hours of continuous communication network uptime.',
        },
      ];
    } else if (type === 'WATER') {
      backupPresets = [
        {
          id: 'wtr-aux-diesel',
          name: 'Intake Station Auxiliary Diesel Turbine Engagement',
          duration: 10,
          cost: 25,
          crews: '2 Water Station Engineers',
          description: 'Start dedicated 500kVA auxiliary diesel engine directly coupled to North Intake water pump.',
          realWorldContext: 'Bypasses regional electrical grid outages to maintain water supply.',
        },
      ];
    } else {
      backupPresets = [
        {
          id: 'gen-aux-battery',
          name: 'Auxiliary Generator / Battery Inverter Failover',
          duration: 6,
          cost: 20,
          crews: '1 Field Operator',
          description: `Activate emergency auxiliary power feed for ${targetNode.name} to bypass upstream electrical disruptions.`,
          realWorldContext: 'Fast failover to maintain operational availability.',
        },
      ];
    }

    // 3. GRID ISOLATION PRESETS
    const isolatePresets: StrategyPreset[] = [
      {
        id: 'iso-breaker',
        name: 'Rapid Circuit Breaker / Sluice Gate Islanding',
        duration: 2,
        cost: 10,
        crews: 'Automated SCADA Protocol',
        description: `Isolate ${targetNode.name} from interconnected cascade propagation pathways, containing damage to current perimeter.`,
        realWorldContext: 'Prevents electrical backfeed, water contamination, or telemetry flood from collapsing adjacent infrastructure.',
      },
    ];

    // 4. REROUTE PRESETS
    const reroutePresets: StrategyPreset[] = [
      {
        id: 'reroute-network',
        name: 'Automated SCADA & Telemetry Path Rerouting',
        duration: 5,
        cost: 15,
        crews: 'Network Operations Engineer',
        description: `Reroute data, traffic flow, or utility bypass around ${targetNode.name} through alternate municipal paths.`,
        realWorldContext: 'Dynamically shifts load to adjacent nodes to mitigate congestion and blackout propagation.',
      },
    ];

    return {
      REPAIR: repairPresets,
      BACKUP_POWER: backupPresets,
      ISOLATE: isolatePresets,
      REROUTE_NETWORK: reroutePresets,
    };
  }, [targetNode, isDegraded]);

  const activePresets = presets[recoveryType] || [];
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<number>(10);

  // Sync selected preset when recoveryType or targetNode changes
  useEffect(() => {
    if (activePresets.length > 0) {
      setSelectedPresetId(activePresets[0].id);
      setCustomDuration(activePresets[0].duration);
    } else {
      setSelectedPresetId('');
      setCustomDuration(recoveryType === 'ISOLATE' ? 2 : 15);
    }
  }, [recoveryType, targetNode]);

  const activePreset = activePresets.find((p) => p.id === selectedPresetId) || activePresets[0];

  // Downstream impact calculation: How many downstream nodes are protected?
  const downstreamImpactCount = useMemo(() => {
    if (!targetNode) return 0;
    const outgoing = state.edges.filter((e) => e.source === targetNode.id);
    return outgoing.length;
  }, [targetNode, state.edges]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNode) return;

    const finalDuration = recoveryType === 'ISOLATE' ? 0 : customDuration;

    const action: RecoveryAction = {
      id: `rec-action-${targetNode.id}-${Date.now()}`,
      nodeId: targetNode.id,
      nodeName: targetNode.name,
      type: recoveryType,
      startTime: state.currentTime,
      duration: finalDuration,
      cost: activePreset?.cost || 25,
      description: activePreset?.description || `${recoveryType.replace(/_/g, ' ')} deployed for ${targetNode.name}`,
      status: 'SCHEDULED',
    };

    onApplyRecovery(action);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-mono"
    >
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-5 sm:p-6 border border-[var(--border-color)] shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col gap-4 text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#495464] border border-[#BBBFCA] text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="recovery-modal-title" className="text-base font-bold text-[var(--text-primary)] font-heading">
                Deploy Engineering Recovery Intervention
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Execute calibrated field engineering procedures to restore services and halt cascade waves.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Service Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-mono text-[var(--text-secondary)] uppercase font-semibold">
                Target Urban Infrastructure Asset
              </label>
              <span className="text-[10px] text-[var(--text-primary)] font-semibold">
                Current Time: T+{state.currentTime}m
              </span>
            </div>

            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium focus:border-[#495464] focus:outline-none"
            >
              {state.nodes.map((node) => {
                const nStatus = state.nodeStates[node.id]?.status || node.status;
                return (
                  <option key={node.id} value={node.id}>
                    {node.code} — {node.name} ({nStatus}) [{node.zone}]
                  </option>
                );
              })}
            </select>
          </div>

          {/* Target Asset Status Banner */}
          <div className="p-3 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  nodeStatus === 'FAILED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : nodeStatus === 'DEGRADED'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                ● {nodeStatus}
              </span>
              <span className="text-[var(--text-primary)] font-bold">{targetNode?.name}</span>
              <span className="text-[var(--text-secondary)]">({targetNode?.type} — {targetNode?.criticality} Priority)</span>
            </div>

            <span className="text-[11px] text-[var(--text-primary)] font-semibold">
              Protects {downstreamImpactCount} downstream link(s)
            </span>
          </div>

          {/* Intervention Strategy Cards */}
          <div>
            <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase font-semibold">
              Intervention Strategy Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Strategy 1: REPAIR */}
              <div
                onClick={() => setRecoveryType('REPAIR')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  recoveryType === 'REPAIR'
                    ? 'bg-[#495464] border-[#1e293b] text-white shadow-sm ring-1 ring-[#BBBFCA]'
                    : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-slate-400 text-[var(--text-secondary)]'
                }`}
              >
                <Wrench className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold block">Engineering Repair</span>
                <span className="text-[10px] block mt-0.5 opacity-80">
                  Restores 100% nominal hardware health
                </span>
              </div>

              {/* Strategy 2: BACKUP POWER */}
              <div
                onClick={() => setRecoveryType('BACKUP_POWER')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  recoveryType === 'BACKUP_POWER'
                    ? 'bg-[#495464] border-[#1e293b] text-white shadow-sm ring-1 ring-[#BBBFCA]'
                    : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-slate-400 text-[var(--text-secondary)]'
                }`}
              >
                <BatteryCharging className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold block">Auxiliary Power</span>
                <span className="text-[10px] block mt-0.5 opacity-80">
                  Deploys localized generator
                </span>
              </div>

              {/* Strategy 3: ISOLATE */}
              <div
                onClick={() => setRecoveryType('ISOLATE')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  recoveryType === 'ISOLATE'
                    ? 'bg-[#495464] border-[#1e293b] text-white shadow-sm ring-1 ring-[#BBBFCA]'
                    : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-slate-400 text-[var(--text-secondary)]'
                }`}
              >
                <Radio className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold block">Isolate / Decouple</span>
                <span className="text-[10px] block mt-0.5 opacity-80">
                  Instantly disconnects dependencies
                </span>
              </div>
            </div>
          </div>

          {/* Domain-Calibrated Presets */}
          {activePresets.length > 0 && (
            <div>
              <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1.5 uppercase font-semibold">
                Calibrated Engineering Field Presets ({targetNode?.type})
              </label>

              <div className="space-y-2">
                {activePresets.map((preset) => {
                  const isPresetActive = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setCustomDuration(preset.duration);
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isPresetActive
                          ? 'bg-[var(--card-subtle)] border-[#495464] text-[var(--text-primary)] ring-1 ring-[#495464]'
                          : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-[#BBBFCA] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              isPresetActive ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'
                            }`}
                          />
                          <span className="text-xs font-bold font-heading">{preset.name}</span>
                        </div>

                          <span className="text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                          {preset.duration} virtual min
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 pt-1.5 border-t border-[var(--border-color)] text-[10px] text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[var(--text-primary)]" />
                          {preset.crews}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[var(--text-primary)]" />
                          Cost Index: {preset.cost} Units
                        </span>
                        <span className="italic text-[var(--text-tertiary)] font-sans">
                          ℹ {preset.realWorldContext}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-World Restoration Duration Slider */}
          {recoveryType !== 'ISOLATE' && (
            <div className="p-3 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div className="flex justify-between items-center text-xs font-mono text-[var(--text-primary)] mb-1.5">
                <span className="uppercase font-semibold flex items-center gap-1.5 font-heading">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> Fine-Tune Restoration Duration
                </span>
                <span className="font-bold text-lg text-[var(--text-primary)] font-mono">
                  {customDuration} virtual minutes
                </span>
              </div>

              <input
                type="range"
                min={recoveryType === 'BACKUP_POWER' ? 3 : isDegraded ? 8 : 15}
                max={recoveryType === 'BACKUP_POWER' ? 20 : 90}
                step={1}
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="w-full accent-[#495464] bg-[var(--surface-bg)] rounded-lg h-2 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                <span>Fast Deployment ({recoveryType === 'BACKUP_POWER' ? '3m' : '15m'})</span>
                <span>Calibrated Field Time</span>
                <span>Full System Overhaul ({recoveryType === 'BACKUP_POWER' ? '20m' : '90m'})</span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
              Dispatches at T+{state.currentTime} • Completes at T+{state.currentTime + (recoveryType === 'ISOLATE' ? 0 : customDuration)}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#1e293b] border border-[#1e293b] transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Execute Recovery</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
