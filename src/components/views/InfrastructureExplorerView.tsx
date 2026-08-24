import React, { useState, useMemo } from 'react';
import {
  Zap,
  Droplets,
  Radio,
  Truck,
  Building2,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Shield,
  Activity,
  ArrowUp,
  ArrowDown,
  Clock,
  Gauge,
  Thermometer
} from 'lucide-react';
import { InfrastructureNode } from '../../types/node';
import { SimulationState } from '../../types/simulation';

interface ExplorerProps {
  state: SimulationState;
  onSelectNode: (nodeId: string) => void;
}

export const InfrastructureExplorerView: React.FC<ExplorerProps> = ({
  state,
  onSelectNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'ALL' | 'POWER' | 'WATER' | 'TELECOM' | 'TRANSPORT' | 'HOSPITAL' | 'EMERGENCY'
  >('ALL');

  const filteredNodes = useMemo(() => {
    return state.nodes.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'ALL' ||
        node.type.toUpperCase() === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [state.nodes, searchQuery, selectedCategory]);

  const selectedNode =
    state.nodes.find((n) => n.id === state.selectedNodeId) ||
    filteredNodes[0] ||
    state.nodes[0];

  // Incoming and outgoing dependencies for selected node
  const upstreamEdges = state.edges.filter((e) => e.target === selectedNode?.id);
  const downstreamEdges = state.edges.filter((e) => e.source === selectedNode?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-emerald-400 border-emerald-500/60 bg-emerald-950/30';
      case 'DEGRADED':
        return 'text-amber-400 border-amber-500/60 bg-amber-950/30';
      case 'FAILED':
        return 'text-red-400 border-red-500/60 bg-red-950/30';
      default:
        return 'text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--card-subtle)]';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'POWER':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'WATER':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'TELECOM':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'TRANSPORT':
        return <Truck className="w-4 h-4 text-blue-400" />;
      default:
        return <Building2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-4 overflow-y-auto bg-[var(--app-bg)] font-body-md text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Node ID, Name, or Type..."
              className="w-full pl-9 pr-3 py-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#495464] focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded font-bold transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setSelectedCategory('POWER')}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all ${
                selectedCategory === 'POWER'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Power
            </button>
            <button
              onClick={() => setSelectedCategory('WATER')}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all ${
                selectedCategory === 'WATER'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Droplets className="w-3 h-3 text-blue-400" />
              Water
            </button>
            <button
              onClick={() => setSelectedCategory('TELECOM')}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all ${
                selectedCategory === 'TELECOM'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Radio className="w-3 h-3 text-purple-400" />
              Telecom
            </button>
            <button
              onClick={() => setSelectedCategory('TRANSPORT')}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all ${
                selectedCategory === 'TRANSPORT'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Truck className="w-3 h-3 text-blue-400" />
              Transport
            </button>
            <button
              onClick={() => setSelectedCategory('HOSPITAL')}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all ${
                selectedCategory === 'HOSPITAL'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Building2 className="w-3 h-3 text-emerald-400" />
              Hospital
            </button>
            <button
              onClick={() => setSelectedCategory('EMERGENCY')}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all ${
                selectedCategory === 'EMERGENCY'
                  ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Shield className="w-3 h-3 text-rose-400" />
              Emergency
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <button className="p-1.5 rounded bg-[var(--surface-bg)] text-[var(--text-primary)] border border-[var(--border-color)]">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded bg-[var(--surface-bg)] hover:text-[var(--text-primary)] border border-[var(--border-color)]">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Area: Node Grid (Left) + Detail Telemetry Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[480px]">
        {/* Left: Node Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 content-start overflow-y-auto pr-1">
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isFailed = node.status === 'FAILED';
            const isDegraded = node.status === 'DEGRADED';

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`p-4 rounded border transition-all cursor-pointer flex flex-col justify-between gap-3 font-mono ${
                  isSelected
                    ? 'bg-[var(--card-subtle)] border-[#495464] shadow-sm ring-1 ring-[#495464]'
                    : 'bg-[var(--surface-bg)] border-[var(--border-color)] hover:border-[#BBBFCA]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
                      {getNodeIcon(node.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[130px] font-heading">
                        {node.name}
                      </h4>
                      <span className="text-[10px] text-[var(--text-tertiary)] block truncate">
                        ID: {node.id.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${getStatusColor(
                      node.status
                    )}`}
                  >
                    ● {node.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)] text-[10px]">
                  <div>
                    <span className="text-[var(--text-tertiary)] block">CURRENT LOAD</span>
                    <span className="text-[var(--text-primary)] font-bold text-xs">
                      {isFailed ? '0.0%' : isDegraded ? '94.2%' : '82.4%'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">CRITICALITY</span>
                    <span className="text-amber-400 font-bold text-xs">
                      {node.criticality === 'HIGH' ? 'TIER 1 (MAX)' : 'TIER 2'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Live Detailed Node Telemetry Panel (5 cols) */}
        <div className="lg:col-span-5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] p-5 flex flex-col gap-4 font-mono text-xs shadow-sm">
          {/* Header */}
          <div className="pb-3 border-b border-[var(--border-color)] flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#495464] border border-[#BBBFCA] text-white">
                  {selectedNode?.type}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{selectedNode?.id}</span>
              </div>
              <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] mt-1">
                {selectedNode?.name}
              </h3>
            </div>

            <button
              onClick={() => onSelectNode(selectedNode?.id || '')}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* System Status & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-tertiary)] block uppercase">SYSTEM STATUS</span>
              <span
                className={`font-bold text-xs mt-0.5 block ${
                  selectedNode?.status === 'HEALTHY'
                    ? 'text-emerald-400'
                    : selectedNode?.status === 'DEGRADED'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                ● {selectedNode?.status === 'HEALTHY' ? 'NOMINAL' : selectedNode?.status}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-tertiary)] block uppercase">CRITICALITY RATING</span>
              <span className="text-amber-400 font-bold text-xs mt-0.5 block">
                ⚠ {selectedNode?.criticality === 'HIGH' ? 'TIER 1 (MAX)' : 'TIER 2'}
              </span>
            </div>
          </div>

          {/* 4 Live Telemetry Tiles */}
          <div>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-2 font-bold font-heading">
              LIVE TELEMETRY
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-tertiary)]">CURRENT LOAD</span>
                <span className="text-base font-bold text-[var(--text-primary)] mt-1">
                  82.4 <span className="text-xs text-[var(--text-tertiary)]">%</span>
                </span>
              </div>

              <div className="p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-tertiary)]">OUTPUT VOLTAGE</span>
                <span className="text-base font-bold text-[var(--text-primary)] mt-1">
                  114.2 <span className="text-xs text-[var(--text-tertiary)]">kV</span>
                </span>
              </div>

              <div className="p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-tertiary)]">BACKUP CAPACITY</span>
                <span className="text-base font-bold text-amber-400 mt-1">
                  4.2 <span className="text-xs text-[var(--text-tertiary)]">HRS</span>
                </span>
              </div>

              <div className="p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col justify-between">
                <span className="text-[10px] text-[var(--text-tertiary)]">TEMP / AMBIENT</span>
                <span className="text-base font-bold text-[var(--text-primary)] mt-1">
                  42 <span className="text-xs text-[var(--text-tertiary)]">°C</span>
                </span>
              </div>
            </div>
          </div>

          {/* Dependency Graph Sub-tree */}
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-2 font-bold font-heading">
              DEPENDENCY GRAPH
            </span>
            <div className="p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col gap-2 flex-1 justify-center">
              {/* Upstream */}
              <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px]">
                <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {upstreamEdges[0]?.source || 'Grid Interconnect (National)'}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              {/* Self */}
              <div className="p-2 rounded bg-[#495464] border border-[#BBBFCA] text-[11px] text-center font-bold text-white shadow-sm">
                {selectedNode?.id.toUpperCase()} (THIS NODE)
              </div>

              {/* Downstream */}
              <div className="space-y-1.5">
                {downstreamEdges.length > 0 ? (
                  downstreamEdges.map((edge) => (
                    <div
                      key={edge.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate max-w-[170px]">{edge.target}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px]">
                    <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>District 4 Pump Station</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
