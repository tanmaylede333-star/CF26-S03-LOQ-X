import { InfrastructureNode, NodeRuntimeState } from '../types/node';
import { RecoveryAction } from '../types/recovery';
import { SimulationEvent } from '../types/event';

export class RecoveryManager {
  /**
   * Generates events required to initiate and complete a recovery action.
   */
  public static createRecoveryEvents(
    action: RecoveryAction,
    nodes: InfrastructureNode[],
    runtimeStates: Record<string, NodeRuntimeState>
  ): { startEvent: SimulationEvent; completeEvent: SimulationEvent } {
    const node = nodes.find(n => n.id === action.nodeId);
    const nodeName = node?.name || action.nodeId;
    const currentStatus = runtimeStates[action.nodeId]?.status || "FAILED";

    const completionTime = action.startTime + action.duration;

    const actionLabel =
      action.type === "BACKUP_POWER" ? "Backup Generator Activation" :
      action.type === "ISOLATE" ? "Service Grid Isolation" :
      action.type === "REROUTE_NETWORK" ? "Telemetry Rerouting" : "Emergency Engineering Repair";

    const startEvent: SimulationEvent = {
      id: `rec-start-${action.nodeId}-${action.startTime}`,
      timestamp: action.startTime,
      type: "RECOVERY_STARTED",
      targetNode: action.nodeId,
      targetNodeName: nodeName,
      previousState: currentStatus,
      newState: "RECOVERING",
      cause: {
        reason: `${actionLabel} initiated. Duration: ${action.duration} min.`,
        chain: [action.nodeId],
      },
      message: `${nodeName} recovery initiated (${actionLabel}) at T+${action.startTime}`,
      severity: "INFO",
      priority: 1, // Recovery start priority
    };

    const completeEvent: SimulationEvent = {
      id: `rec-complete-${action.nodeId}-${completionTime}`,
      timestamp: completionTime,
      type: "RECOVERY_COMPLETED",
      targetNode: action.nodeId,
      targetNodeName: nodeName,
      previousState: "RECOVERING",
      newState: "HEALTHY",
      cause: {
        reason: `${actionLabel} completed successfully. Normal operations restored.`,
        chain: [action.nodeId],
      },
      message: `${nodeName} restored to HEALTHY at T+${completionTime} via ${actionLabel}`,
      severity: "SUCCESS",
      priority: 1, // Recovery completion priority
    };

    return { startEvent, completeEvent };
  }
}
