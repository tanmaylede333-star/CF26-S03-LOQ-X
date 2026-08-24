import { NodeStatus } from './node';

export type SimulationEventType =
  | "FAILURE_INJECTED"
  | "STATE_CHANGED"
  | "FAILURE_PROPAGATED"
  | "RECOVERY_STARTED"
  | "RECOVERY_COMPLETED"
  | "SERVICE_ISOLATED"
  | "BACKUP_ACTIVATED"
  | "SCENARIO_STARTED"
  | "SCENARIO_COMPLETED";

export interface CausalReference {
  eventId?: string;
  sourceNodeId?: string;
  sourceNodeName?: string;
  reason: string;
  chain: string[]; // [rootFailureId, hop1Id, hop2Id, targetId]
  rootCauses?: string[]; // All contributing root origins
  propagationDelay?: number;
}

export interface SimulationEvent {
  id: string;
  timestamp: number; // Virtual simulation minute (T+XX)
  type: SimulationEventType;
  sourceNode?: string;
  sourceNodeName?: string;
  targetNode: string;
  targetNodeName: string;
  previousState: NodeStatus;
  newState: NodeStatus;
  cause?: CausalReference;
  contributingOrigins?: string[];
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  priority: number; // Deterministic sorting priority (lower executes first)
}
