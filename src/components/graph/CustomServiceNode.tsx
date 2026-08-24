import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Zap,
  Droplets,
  Radio,
  Navigation,
  Building2,
  Siren,
  Waves,
  Train,
  Fuel,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  BatteryCharging,
  Wrench
} from 'lucide-react';
import { InfrastructureNode, NodeStatus, ServiceType } from '../../types/node';

const iconMap: Record<ServiceType, React.ElementType> = {
  POWER: Zap,
  WATER: Droplets,
  TELECOM: Radio,
  TRAFFIC: Navigation,
  HOSPITAL: Building2,
  EMERGENCY: Siren,
  SEWAGE: Waves,
  TRANSPORT: Train,
  FUEL: Fuel,
  MUNICIPAL: Landmark,
};

const statusStyles: Record<NodeStatus, {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  glowClass: string;
  dotColor: string;
}> = {
  HEALTHY: {
    border: 'border-emerald-500/40 hover:border-emerald-400',
    bg: 'bg-[var(--surface-bg)]',
    badgeBg: 'bg-emerald-950/80 border-emerald-800/80',
    badgeText: 'text-emerald-400',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    dotColor: 'bg-emerald-400',
  },
  AT_RISK: {
    border: 'border-amber-500/50 hover:border-amber-400',
    bg: 'bg-amber-950/20',
    badgeBg: 'bg-amber-950/80 border-amber-800/80',
    badgeText: 'text-amber-400',
    glowClass: 'shadow-[0_0_18px_rgba(251,191,36,0.2)]',
    dotColor: 'bg-amber-400 animate-pulse',
  },
  DEGRADED: {
    border: 'border-amber-500/60 hover:border-amber-400',
    bg: 'bg-amber-950/30',
    badgeBg: 'bg-amber-950/80 border-amber-800/80',
    badgeText: 'text-amber-400',
    glowClass: 'shadow-[0_0_20px_rgba(251,191,36,0.3)] pulse-degraded',
    dotColor: 'bg-amber-400 animate-pulse',
  },
  FAILED: {
    border: 'border-rose-500/80 hover:border-rose-400',
    bg: 'bg-rose-950/30',
    badgeBg: 'bg-rose-950/90 border-rose-800/90',
    badgeText: 'text-rose-400',
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.4)] pulse-failed',
    dotColor: 'bg-rose-400 animate-ping',
  },
  RECOVERING: {
    border: 'border-[#495464]',
    bg: 'bg-[#495464]/20',
    badgeBg: 'bg-[#495464] border-[#BBBFCA]',
    badgeText: 'text-white',
    glowClass: 'shadow-md',
    dotColor: 'bg-[#BBBFCA] animate-pulse',
  },
};

export const CustomServiceNode = memo(({ data, selected }: NodeProps) => {
  const node = data as unknown as InfrastructureNode & {
    isInHighlightPath?: boolean;
    isInBlastRadius?: boolean;
    isDimmed?: boolean;
    activeRecovery?: any;
    currentTime?: number;
  };
  const status = node.status || 'HEALTHY';
  const style = statusStyles[status];
  const Icon = iconMap[node.type] || Zap;

  const isDimmed = node.isDimmed && !selected;
  const isCausalPath = node.isInHighlightPath;
  const isBlast = node.isInBlastRadius;
  const activeRecovery = node.activeRecovery;
  const currentT = node.currentTime ?? 0;

  // Active recovery calculations
  let percent = 0;
  let remainingTime = 0;
  if (activeRecovery) {
    const elapsed = Math.max(0, currentT - activeRecovery.startTime);
    percent = activeRecovery.duration > 0 ? Math.min(100, Math.round((elapsed / activeRecovery.duration) * 100)) : 100;
    remainingTime = Math.max(0, (activeRecovery.startTime + activeRecovery.duration) - currentT);
  }

  return (
    <div
      className={`relative min-w-[220px] max-w-[245px] rounded-lg border p-3 backdrop-blur-md transition-all duration-200 cursor-pointer ${
        style.border
      } ${style.bg} ${style.glowClass} ${
        isDimmed ? 'opacity-30 grayscale-[40%] scale-95' : 'opacity-100'
      } ${
        activeRecovery
          ? 'ring-2 ring-[#495464] ring-offset-2 ring-offset-[var(--app-bg)] shadow-md !border-[#495464]'
          : isCausalPath
          ? 'ring-2 ring-[#495464] ring-offset-2 ring-offset-[var(--app-bg)] scale-105 shadow-md !border-[#495464]'
          : isBlast
          ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-[var(--app-bg)] scale-105 shadow-[0_0_25px_rgba(244,63,94,0.5)] !border-rose-500'
          : selected
          ? 'ring-2 ring-[#495464] ring-offset-2 ring-offset-[var(--app-bg)] scale-105'
          : ''
      }`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#495464] !border-2 !border-[var(--app-bg)]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2.5 !h-2.5 !bg-[#495464] !border-2 !border-[var(--app-bg)]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#495464] !border-2 !border-[var(--app-bg)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2.5 !h-2.5 !bg-[#495464] !border-2 !border-[var(--app-bg)]"
      />

      {/* Backup Active Badge */}
      {node.metrics?.backupActive && (
        <div className="absolute -top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#495464] border border-[#BBBFCA] text-[9px] font-mono text-white font-bold shadow-sm">
          <BatteryCharging className="w-3 h-3 text-white animate-pulse" />
          AUX POWER
        </div>
      )}

      {/* Header with Type Icon & Criticality */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)]">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block font-medium">
              {node.type}
            </span>
            <span className="text-[9px] text-[var(--text-tertiary)] block truncate max-w-[90px]">
              {node.zone}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
            activeRecovery
              ? 'bg-[#495464] border-[#BBBFCA] text-white shadow-sm'
              : `${style.badgeBg} ${style.badgeText}`
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeRecovery ? 'bg-white animate-ping' : style.dotColor}`} />
          {activeRecovery ? 'RECOVERING' : status}
        </div>
      </div>

      {/* Node Name */}
      <h4 className="text-xs font-semibold text-[var(--text-primary)] font-heading leading-tight line-clamp-2 mb-2">
        {node.name}
      </h4>

      {/* ACTIVE RECOVERY PROGRESS BAR DIRECTLY ON NODE */}
      {activeRecovery && (
        <div className="mb-2 p-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] shadow-sm flex flex-col gap-1 text-[10px] font-mono">
          <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <Wrench className="w-3 h-3 text-[var(--text-secondary)] animate-spin" />
              {activeRecovery.type.replace(/_/g, ' ')}
            </span>
            <span>{percent}%</span>
          </div>

          <div className="w-full bg-[var(--surface-bg)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className="h-full bg-[#495464] transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          <span className="text-[9px] text-[var(--text-secondary)] text-right">
            {remainingTime}m left (T+{activeRecovery.startTime + activeRecovery.duration})
          </span>
        </div>
      )}

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              node.criticality === 'CRITICAL'
                ? 'bg-rose-400'
                : node.criticality === 'HIGH'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          {node.criticality}
        </span>
        <span>Rec: {node.recoveryTime}m</span>
      </div>
    </div>
  );
});

CustomServiceNode.displayName = 'CustomServiceNode';
