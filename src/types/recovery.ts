export type RecoveryType = "REPAIR" | "BACKUP_POWER" | "ISOLATE" | "REROUTE_NETWORK";

export interface RecoveryAction {
  id: string;
  nodeId: string;
  nodeName?: string;
  type: RecoveryType;
  startTime: number; // Virtual simulation timestamp when triggered
  duration: number;  // Virtual minutes to complete
  cost?: number;     // Conceptual resource cost (1-100)
  description?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
}
