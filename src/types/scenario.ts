import { InfrastructureNode } from './node';
import { DependencyEdge } from './edge';
import { RecoveryAction } from './recovery';

export interface InitialFailure {
  nodeId: string;
  time: number; // Virtual timestamp, e.g. 0, 5, 10
  originId?: string;
  reason?: string;
  severity?: "FULL" | "DEGRADED" | "AT_RISK";
}

export interface SimulationParameters {
  maxSimulationTime: number; // in virtual minutes (e.g., 60, 120)
  defaultPropagationDelay: number;
  defaultRecoveryDuration: number;
  autoStopOnStabilization?: boolean;
  propagationDelayMultiplier?: number;
  autoPauseOnCriticalBreach?: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  category: "POWER" | "DUAL_FAILURE" | "WATER" | "WEATHER" | "CUSTOM";
  description: string;
  graphVersion: string;
  initialFailures: InitialFailure[];
  parameters: SimulationParameters;
  scheduledRecoveries: RecoveryAction[];
  nodes?: InfrastructureNode[];
  edges?: DependencyEdge[];
  isPredefined?: boolean;
  isIncidentInspired?: boolean;
  incidentReference?: string;
}
