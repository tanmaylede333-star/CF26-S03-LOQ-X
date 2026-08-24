export type DependencyType = "REQUIRED" | "OPTIONAL" | "POWER" | "NETWORK" | "WATER" | "OPERATIONAL";

export type FailureImpact = "DEGRADE" | "FAIL";

export interface DependencyEdge {
  id: string;
  source: string; // Upstream node ID
  target: string; // Downstream dependent node ID
  dependencyType: DependencyType;
  propagationDelay: number; // Simulated minutes before disruption spreads
  failureImpact: FailureImpact; // Resulting impact on target if source fails
  isActive?: boolean;
  isPropagating?: boolean;
  lastPropagatedAt?: number;
  description?: string;
}
