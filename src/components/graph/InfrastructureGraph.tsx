import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Eye, EyeOff } from 'lucide-react';
import { CustomServiceNode } from './CustomServiceNode';
import { SimulationState } from '../../types/simulation';

interface GraphProps {
  state: SimulationState;
  onSelectNode: (nodeId: string) => void;
}

const nodeTypes = {
  serviceNode: CustomServiceNode,
};

export const InfrastructureGraph: React.FC<GraphProps> = ({
  state,
  onSelectNode,
}) => {
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);
  const hasHighlight = !!(state.highlightPath && state.highlightPath.nodeIds.length > 0);
  const hasBlastRadius = !!(state.blastRadiusNodeIds && state.blastRadiusNodeIds.length > 0);

  // Convert domain nodes to React Flow nodes with highlighting states
  const flowNodes: Node[] = useMemo(() => {
    return state.nodes.map((node) => {
      const isSelected = node.id === state.selectedNodeId;
      const isInHighlightPath = state.highlightPath?.nodeIds.includes(node.id) || false;
      const isInBlastRadius = state.blastRadiusNodeIds?.includes(node.id) || false;
      const activeRecovery = state.activeRecoveries.find(
        (r) => r.nodeId === node.id && r.status !== 'COMPLETED'
      );

      let isDimmed = false;
      if (hasHighlight && !isInHighlightPath) isDimmed = true;
      if (hasBlastRadius && !isInBlastRadius) isDimmed = true;

      return {
        id: node.id,
        type: 'serviceNode',
        position: node.position,
        data: {
          ...node,
          isInHighlightPath,
          isInBlastRadius,
          isDimmed,
          activeRecovery,
          currentTime: state.currentTime,
        } as any,
        selected: isSelected,
      };
    });
  }, [state.nodes, state.selectedNodeId, state.highlightPath, state.blastRadiusNodeIds, state.activeRecoveries, state.currentTime, hasHighlight, hasBlastRadius]);

  // Convert domain edges to React Flow edges with dynamic causal path styling
  const flowEdges: Edge[] = useMemo(() => {
    const nodeStateMap = new Map(state.nodes.map(n => [n.id, n.status]));

    return state.edges.map((edge) => {
      const sourceStatus = nodeStateMap.get(edge.source) || 'HEALTHY';
      const targetStatus = nodeStateMap.get(edge.target) || 'HEALTHY';

      const isDisrupted = sourceStatus === 'FAILED' || sourceStatus === 'DEGRADED';
      const isTargetAffected = targetStatus !== 'HEALTHY';
      const isCausalEdge = state.highlightPath?.edgeIds.includes(edge.id) || false;

      let strokeColor = '#334155'; // default dark slate
      let animated = false;
      let strokeWidth = 1.5;
      let opacity = 1;

      if (hasHighlight) {
        if (isCausalEdge) {
          strokeColor = '#BBBFCA'; // active causal hop in slate
          animated = true;
          strokeWidth = 3.5;
        } else {
          opacity = 0.2;
          strokeColor = '#1e293b';
        }
      } else {
        if (isDisrupted && isTargetAffected) {
          strokeColor = '#f43f5e'; // active coral failure path
          animated = true;
          strokeWidth = 2.5;
        } else if (isDisrupted) {
          strokeColor = '#fbbf24'; // propagating warning path
          animated = true;
          strokeWidth = 2;
        } else if (sourceStatus === 'RECOVERING' || targetStatus === 'RECOVERING') {
          strokeColor = '#BBBFCA'; // recovering path
          animated = true;
          strokeWidth = 2;
        }
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated,
        label: `+${edge.propagationDelay}m`,
        labelStyle: {
          fill: isCausalEdge ? '#F4F4F2' : isDisrupted ? '#fca5a5' : '#94a3b8',
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          fontWeight: isCausalEdge ? 800 : 600,
          opacity,
        },
        labelBgStyle: {
          fill: isCausalEdge ? '#495464' : '#161922',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [4, 2] as [number, number],
        style: {
          stroke: strokeColor,
          strokeWidth,
          opacity,
          strokeDasharray: animated ? '6,6' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: strokeColor,
        },
      };
    });
  }, [state.nodes, state.edges, state.highlightPath, hasHighlight]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  return (
    <div className="w-full h-full min-h-[460px] rounded-lg border border-[var(--border-color)] bg-[var(--app-bg)] relative overflow-hidden shadow-sm">
      {/* Visual Subtitle overlay */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest bg-[var(--surface-bg)] px-2.5 py-1 rounded-md border border-[var(--border-color)] shadow-sm">
          JanNagar Dynamic Dependency Grid
        </span>
        <span className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--card-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)]">
          {state.nodes.length} Nodes • {state.edges.length} Dependencies
        </span>

        {state.scrubTime !== null && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 font-bold animate-pulse">
            HISTORICAL TIMELINE VIEW: T+{state.scrubTime}m
          </span>
        )}

        {hasHighlight && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#495464] border border-[#BBBFCA] text-white font-bold">
            CAUSAL IMPACT PATH ACTIVE
          </span>
        )}

        {hasBlastRadius && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-300 font-bold">
            DOWNSTREAM BLAST RADIUS ACTIVE
          </span>
        )}
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.4}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(255, 255, 255, 0.04)"
        />
        <Controls 
          position="bottom-right" 
          showInteractive={false}
        />
        {showMiniMap && (
          <MiniMap
            nodeColor={(n) => {
              const status = (n.data as any)?.status;
              if (status === 'FAILED') return '#f43f5e';
              if (status === 'DEGRADED') return '#fbbf24';
              if (status === 'RECOVERING') return '#495464';
              if (status === 'AT_RISK') return '#fbbf24';
              return '#10b981';
            }}
            maskColor="rgba(11, 13, 19, 0.85)"
            className="!bg-[var(--surface-bg)] !border !border-[var(--border-color)] !rounded-md"
            position="bottom-left"
            zoomable={false}
            pannable={false}
            nodeStrokeWidth={2}
            nodeBorderRadius={2}
            style={{ width: 96, height: 64 }}
          />
        )}

        {/* Floating MiniMap Toggle (Bottom Left) */}
        <button
          onClick={() => setShowMiniMap(!showMiniMap)}
          className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-1.5 py-1 rounded bg-[var(--surface-bg)]/90 hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[9px] font-mono shadow-sm transition-all backdrop-blur-sm"
          title={showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
        >
          {showMiniMap ? (
            <>
              <EyeOff className="w-2.5 h-2.5 text-slate-400" />
              <span>Hide Map</span>
            </>
          ) : (
            <>
              <Eye className="w-2.5 h-2.5 text-slate-400" />
              <span>MiniMap</span>
            </>
          )}
        </button>
      </ReactFlow>
    </div>
  );
};
