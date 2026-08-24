import { InfrastructureNode, NodeRuntimeState } from './node';
import { DependencyEdge } from './edge';
import { SimulationEvent } from './event';
import { RecoveryAction } from './recovery';
import { Scenario } from './scenario';

export type SimulationStatus = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";

export interface SimulationMetrics {
  cascadeDepth: number;          // Longest causal chain distance from initial failure
  affectedServices: number;      // Downstream non-healthy nodes (excluding initial root failures)
  affectedNodeIds: string[];
  recoveryTime: number;          // Total virtual minutes spent until recovery completed
  criticalServicesAffected: number;
  timeToPeakImpact: number;      // Timestamp of worst system state
  stabilizationTime: number;     // Timestamp after which no new events occur
  systemHealthPercentage: number;// Current % of health across all nodes (0-100)
  totalNodes: number;
  healthyCount: number;
  atRiskCount: number;
  degradedCount: number;
  failedCount: number;
  recoveringCount: number;
}

export interface SimulationState {
  currentTime: number;
  scrubTime: number | null; // When non-null, views historical state at this virtual minute
  status: SimulationStatus;
  scenario: Scenario;
  nodes: InfrastructureNode[];
  edges: DependencyEdge[];
  nodeStates: Record<string, NodeRuntimeState>;
  events: SimulationEvent[];
  activeRecoveries: RecoveryAction[];
  metrics: SimulationMetrics;
  selectedNodeId: string | null;
  speed: number; // 1x, 2x, 5x, 10x
  isReplaying?: boolean;
  highlightPath?: { nodeIds: string[]; edgeIds: string[] } | null;
  blastRadiusNodeIds?: string[] | null;
}
