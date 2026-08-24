import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Zap,
  Droplets,
  Radio,
  Truck,
  Building2,
  Crosshair,
  Filter,
  Eye,
  EyeOff,
  Navigation,
  ShieldAlert,
  Info
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { SyntheticCityMap } from '../map/SyntheticCityMap';
import { NodeInspector } from '../inspector/NodeInspector';
import { RecoveryAction } from '../../types/recovery';

interface SyntheticGISMapViewProps {
  state: SimulationState;
  onSelectNode: (nodeId: string) => void;
  onInjectFailure: (nodeId: string) => void;
  onApplyRecovery: (action: RecoveryAction) => void;
  onOpenRecoveryModal?: (nodeId?: string) => void;
}

export const SyntheticGISMapView: React.FC<SyntheticGISMapViewProps> = ({
  state,
  onSelectNode,
  onInjectFailure,
  onApplyRecovery,
  onOpenRecoveryModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [showVectors, setShowVectors] = useState<boolean>(true);

  // Available categories
  const categories = [
    { id: 'ALL', label: 'All Layers', icon: Layers },
    { id: 'POWER', label: 'Power Grid', icon: Zap },
    { id: 'WATER', label: 'Water Networks', icon: Droplets },
    { id: 'TELECOM', label: 'Telecom & 5G', icon: Radio },
    { id: 'TRAFFIC', label: 'Traffic ITMS', icon: Truck },
    { id: 'HOSPITAL', label: 'Medical District', icon: Building2 },
  ];

  // Available zones
  const zones = [
    { id: 'ALL', label: 'All Sectors' },
    { id: 'Sector 1', label: 'Sector 1 — North Riverfront' },
    { id: 'Sector 2', label: 'Sector 2 — Central Corridor' },
    { id: 'Sector 3', label: 'Sector 3 — East Heights' },
    { id: 'Sector 4', label: 'Sector 4 — Industrial South' },
  ];

  // Filtered nodes based on active filters
  const filteredNodes = useMemo(() => {
    return state.nodes.filter((node) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        node.type.toUpperCase() === selectedCategory;
      const matchZone =
        selectedZone === 'ALL' ||
        node.zone.toLowerCase().includes(selectedZone.toLowerCase());
      return matchCat && matchZone;
    });
  }, [state.nodes, selectedCategory, selectedZone]);

  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || null;

  return (
    <div className="flex-1 p-4 lg:p-5 flex flex-col gap-3 overflow-hidden bg-[var(--app-bg)] font-mono text-[var(--text-primary)] transition-colors duration-200">
      {/* 1. TOP SPATIAL HUD & LAYER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-[var(--surface-bg)] border border-[var(--border-color)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#495464] border border-[#BBBFCA] text-white text-xs font-bold shadow-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>GIS SPATIAL VIEWER</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-[#495464] text-white border border-[#1e293b] shadow-sm'
                      : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Sector Filter & Dependency Vector Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] focus:outline-none focus:border-[#495464]"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
              showVectors
                ? 'bg-[#495464] border-[#1e293b] text-white'
                : 'bg-[var(--card-subtle)] border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {showVectors ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3" />}
            <span>Flow Vectors</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN MAP CANVAS & ASSET INSPECTOR PANEL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Full Interactive Leaflet GIS Map */}
        <div
          className={`${
            selectedNode ? 'lg:col-span-8' : 'lg:col-span-12'
          } h-full flex flex-col transition-all rounded overflow-hidden border border-[var(--border-color)]`}
        >
          <SyntheticCityMap
            state={{
              ...state,
              nodes: filteredNodes,
              edges: showVectors ? state.edges : [],
            }}
            onSelectNode={onSelectNode}
            onInjectFailure={onInjectFailure}
          />
        </div>

        {/* Selected Asset Deep Diagnostics Drawer */}
        {selectedNode && (
          <div className="lg:col-span-4 h-full flex flex-col overflow-y-auto">
            <NodeInspector
              nodeId={selectedNode.id}
              state={state}
              onClose={() => onSelectNode('')}
              onInjectFailure={onInjectFailure}
              onApplyRecovery={onApplyRecovery}
              onSelectNode={onSelectNode}
              onOpenRecoveryModal={onOpenRecoveryModal}
            />
          </div>
        )}
      </div>

      {/* 3. BOTTOM GEOGRAPHIC CONTEXT FOOTER */}
      <div className="p-2.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-wrap items-center justify-between text-[11px] text-[var(--text-secondary)] shrink-0">
        <div className="flex items-center gap-4">
          <span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Nominal
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Degraded
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical Outage
          </span>
        </div>
      </div>
    </div>
  );
};
