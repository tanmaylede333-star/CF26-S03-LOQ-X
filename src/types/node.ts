export type NodeStatus =
  | "HEALTHY"
  | "AT_RISK"
  | "DEGRADED"
  | "FAILED"
  | "RECOVERING";

export type ServiceType =
  | "POWER"
  | "WATER"
  | "TELECOM"
  | "TRAFFIC"
  | "HOSPITAL"
  | "EMERGENCY"
  | "SEWAGE"
  | "TRANSPORT"
  | "FUEL"
  | "MUNICIPAL";

export type Criticality = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface InfrastructureNode {
  id: string;
  name: string;
  type: ServiceType;
  zone: string;
  criticality: Criticality;
  initialStatus?: NodeStatus;
  status: NodeStatus;
  previousStatus?: NodeStatus;
  capacity?: number; // percentage capacity remaining (0-100)
  recoveryTime: number; // default simulated time to repair (minutes)
  position: {
    x: number;
    y: number;
  };
  description?: string;
  code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  metrics?: {
    load?: number; // 0-100%
    affectedCitizens?: number;
    backupAvailable?: boolean;
    backupActive?: boolean;
  };
}

export interface NodeRuntimeState {
  status: NodeStatus;
  previousStatus: NodeStatus;
  stateChangedAt: number;
  failedAt: number | null;
  recoveryStartedAt: number | null;
  recoveredAt: number | null;
  causes: string[]; // IDs of causal upstream nodes or events
  causalChain?: string[]; // complete path of root failures leading here
  contributingOrigins?: string[]; // Names/IDs of root failure origins (e.g. ['power-grid-main', 'telecom-tower-01'])
  propagationPath?: Array<{ from: string; to: string; delay: number; reason?: string }>;
  stateHistory?: Array<{ time: number; status: NodeStatus; reason?: string }>;
  isolated?: boolean;
  backupActive?: boolean;
}
