import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Zap,
  Droplets,
  Radio,
  Truck,
  Building2,
  Crosshair,
  Maximize2,
  AlertTriangle,
  Activity,
  Layers,
  RotateCcw
} from 'lucide-react';
import { InfrastructureNode } from '../../types/node';
import { SimulationState } from '../../types/simulation';

interface SyntheticCityMapProps {
  state: SimulationState;
  onSelectNode: (nodeId: string) => void;
  onInjectFailure?: (nodeId: string) => void;
}

// Helper component to pan/zoom map programmatically
const MapController: React.FC<{ selectedNode?: InfrastructureNode | null }> = ({ selectedNode }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedNode && selectedNode.coordinates) {
      map.panTo([selectedNode.coordinates.lat, selectedNode.coordinates.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedNode, map]);

  return null;
};

// Helper to resolve coordinates or generate deterministic procedural ones (TICK-010 Fix)
export const getValidCoordinates = (node: InfrastructureNode, index: number = 0): { lat: number; lng: number } => {
  if (node.coordinates && (node.coordinates.lat !== 0 || node.coordinates.lng !== 0)) {
    return node.coordinates;
  }
  let hash = 0;
  for (let i = 0; i < node.id.length; i++) {
    hash = (hash << 5) - hash + node.id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = (((Math.abs(hash) + index * 37) % 1000) / 1000 - 0.5) * 0.07;
  const lngOffset = (((Math.abs(hash >> 3) + index * 41) % 1000) / 1000 - 0.5) * 0.07;

  return {
    lat: Number((19.0760 + latOffset).toFixed(6)),
    lng: Number((72.8777 + lngOffset).toFixed(6)),
  };
};

// Create custom HTML DivIcon matching the exact screenshot design
const createNodeIcon = (node: InfrastructureNode, isSelected: boolean, activeRecovery?: any) => {
  const isFailed = node.status === 'FAILED';
  const isDegraded = node.status === 'DEGRADED';
  const isRecovering = node.status === 'RECOVERING' || !!activeRecovery;

  const code = node.code || node.id.substring(0, 3).toUpperCase();

  let borderColor = '#10b981';
  let bgColor = 'rgba(16, 185, 129, 0.15)';
  let textColor = '#10b981';
  let glowColor = 'rgba(16, 185, 129, 0.6)';
  let pulseClass = '';

  if (isRecovering) {
    borderColor = '#495464';
    bgColor = 'rgba(73, 84, 100, 0.4)';
    textColor = '#F4F4F2';
    glowColor = 'rgba(73, 84, 100, 0.6)';
    pulseClass = 'animate-pulse';
  } else if (isFailed) {
    borderColor = '#ef4444';
    bgColor = 'rgba(239, 68, 68, 0.35)';
    textColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.8)';
    pulseClass = 'animate-pulse';
  } else if (isDegraded) {
    borderColor = '#f59e0b';
    bgColor = 'rgba(245, 158, 11, 0.3)';
    textColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.7)';
  }

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
      <div class="${pulseClass}" style="
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 2px solid ${borderColor};
        background: ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px ${glowColor};
        backdrop-filter: blur(4px);
        transition: all 0.2s ease-in-out;
        ${isSelected ? 'transform: scale(1.2); ring: 2px solid #fff;' : ''}
      ">
        <span style="
          color: ${textColor};
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: -0.05em;
        ">${isRecovering ? '⚡' + code : code}</span>
      </div>

      <div style="
        margin-top: 3px;
        background: rgba(27, 32, 40, 0.95);
        border: 1px solid ${isRecovering ? '#495464' : 'rgba(187, 191, 202, 0.3)'};
        border-radius: 3px;
        padding: 1px 4px;
        color: ${isRecovering ? '#F4F4F2' : '#BBBFCA'};
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(0,0,0,0.6);
      ">
        ${isRecovering ? 'REPAIR' : code}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [40, 55],
    iconAnchor: [20, 27],
  });
};

export const SyntheticCityMap: React.FC<SyntheticCityMapProps> = ({
  state,
  onSelectNode,
  onInjectFailure,
}) => {
  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || null;

  // Center on Mumbai / Navapur
  const defaultCenter: [number, number] = [19.0760, 72.8777];

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#05070d] border border-[#1a2233] rounded overflow-hidden flex flex-col font-mono select-none">
      {/* Top Map HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[var(--surface-bg)]/90 backdrop-blur border border-[var(--border-color)] px-3 py-1.5 rounded pointer-events-auto shadow-xl">
          <Crosshair className="w-3.5 h-3.5 text-[var(--text-secondary)] animate-spin" />
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-heading">
            SYNTHETIC GIS GRID: MUMBAI / NAVAPUR
          </span>
          <span className="text-[10px] text-[var(--text-primary)] font-bold px-1.5 py-0.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
            19.0760° N, 72.8777° E
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#090d16]/90 backdrop-blur border border-[#1e293b] px-3 py-1.5 rounded pointer-events-auto shadow-xl text-xs">
          <span className="text-slate-400">STATUS:</span>
          <span
            className={`font-bold ${
              state.metrics.failedCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {state.metrics.failedCount > 0 ? '● CRITICAL FAILURES ACTIVE' : '● NOMINAL GRID'}
          </span>
        </div>
      </div>

      {/* Main Interactive Leaflet Map */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={defaultCenter}
          zoom={12.5}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
          style={{ background: '#05070d' }}
        >
          <MapController selectedNode={selectedNode} />

          {/* CartoDB Dark Matter Ultra-Dark Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Inter-Node Dependency Vector Polylines */}
          {state.edges.map((edge) => {
            const srcNode = state.nodes.find((n) => n.id === edge.source);
            const tgtNode = state.nodes.find((n) => n.id === edge.target);

            if (!srcNode || !tgtNode) return null;

            const srcCoords = getValidCoordinates(srcNode);
            const tgtCoords = getValidCoordinates(tgtNode);

            const isFailing =
              state.nodeStates[edge.source]?.status === 'FAILED' ||
              state.nodeStates[edge.target]?.status === 'FAILED';

            const isDegraded =
              state.nodeStates[edge.source]?.status === 'DEGRADED' ||
              state.nodeStates[edge.target]?.status === 'DEGRADED';

            const color = isFailing ? '#ef4444' : isDegraded ? '#f59e0b' : '#BBBFCA';

            return (
              <Polyline
                key={edge.id}
                positions={[
                  [srcCoords.lat, srcCoords.lng],
                  [tgtCoords.lat, tgtCoords.lng],
                ]}
                pathOptions={{
                  color,
                  weight: isFailing ? 3 : 2,
                  opacity: isFailing ? 0.9 : 0.5,
                  dashArray: isFailing ? '6, 6' : undefined,
                }}
              />
            );
          })}

          {/* Interactive Infrastructure Node Markers */}
          {state.nodes.map((node, idx) => {
            const coords = getValidCoordinates(node, idx);
            const isSelected = state.selectedNodeId === node.id;
            const activeRecovery = state.activeRecoveries?.find(
              (r) => r.nodeId === node.id && r.status !== 'COMPLETED'
            );
            const icon = createNodeIcon(node, isSelected, activeRecovery);

            return (
              <Marker
                key={node.id}
                position={[coords.lat, coords.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectNode(node.id),
                }}
              >
                <Popup className="custom-dark-leaflet-popup">
                  <div className="p-1.5 font-mono text-slate-100 bg-[#1b2028] text-xs border border-[#495464] rounded">
                    <div className="flex items-center justify-between border-b border-[#495464] pb-1 mb-1 font-bold">
                      <span className="text-[#F4F4F2]">{node.code || node.name}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          activeRecovery || node.status === 'RECOVERING'
                            ? 'text-slate-200 bg-[#495464] border border-[#BBBFCA]'
                            : node.status === 'FAILED'
                            ? 'text-red-400 bg-red-950 border border-red-900'
                            : node.status === 'DEGRADED'
                            ? 'text-amber-400 bg-amber-950 border border-amber-900'
                            : 'text-emerald-400 bg-emerald-950 border border-emerald-900'
                        }`}
                      >
                        ● {activeRecovery ? 'RECOVERING' : node.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-slate-200">{node.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{node.description}</div>

                    {/* Active Recovery in Popup */}
                    {activeRecovery && (
                      <div className="mt-1.5 p-1.5 rounded bg-[#232a35] border border-[#495464] text-[10px]">
                        <span className="text-slate-200 font-bold block">
                          ⚡ {activeRecovery.type.replace(/_/g, ' ')} IN PROGRESS
                        </span>
                        <span className="text-slate-400 block text-[9px]">
                          {Math.max(0, (activeRecovery.startTime + activeRecovery.duration) - state.currentTime)}m remaining (T+{activeRecovery.startTime + activeRecovery.duration})
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">TYPE:</span>
                        <span className="text-[var(--text-primary)] font-bold">{node.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ZONE:</span>
                        <span className="text-slate-300 truncate max-w-[80px] block">{node.zone}</span>
                      </div>
                    </div>

                    {onInjectFailure && !activeRecovery && (
                      <button
                        onClick={() => onInjectFailure(node.id)}
                        className="w-full mt-2 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-bold uppercase transition-colors"
                      >
                        ⚡ Trigger Disruption
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between text-[10px] pointer-events-none">
        <div className="flex items-center gap-3 bg-[var(--surface-bg)]/90 backdrop-blur border border-[var(--border-color)] px-3 py-1.5 rounded pointer-events-auto shadow-xl">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Healthy
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Degraded
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Failed
          </span>
          <span className="flex items-center gap-1 text-[#BBBFCA] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#495464]" />
            Recovering
          </span>
        </div>

        <div className="bg-[var(--surface-bg)]/90 backdrop-blur border border-[var(--border-color)] px-3 py-1.5 rounded pointer-events-auto text-[var(--text-secondary)]">
          Scroll to Zoom • Drag to Move • Click Nodes to Inspect &amp; Trigger Disruption
        </div>
      </div>
    </div>
  );
};
