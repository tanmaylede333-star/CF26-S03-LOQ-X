import { InfrastructureNode, NodeStatus, NodeRuntimeState } from '../types/node';
import { DependencyEdge } from '../types/edge';
import { SimulationEvent } from '../types/event';
import { DependencyResolver } from './DependencyResolver';

export class FailurePropagation {
  /**
   * Evaluates downstream effects of a state change on sourceNodeId and schedules resulting events.
   */
  public static generateDownstreamEvents(
    sourceNodeId: string,
    currentTimestamp: number,
    nodes: InfrastructureNode[],
    edges: DependencyEdge[],
    runtimeStates: Record<string, NodeRuntimeState>,
    resolver: DependencyResolver,
    delayMultiplier: number = 1.0
  ): SimulationEvent[] {
    const outgoingEdges = resolver.getOutgoingEdges(sourceNodeId);
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const sourceNode = nodeMap.get(sourceNodeId);
    const sourceRuntime = runtimeStates[sourceNodeId];

    const newEvents: SimulationEvent[] = [];

    for (const edge of outgoingEdges) {
      const targetNodeId = edge.target;
      const targetNode = nodeMap.get(targetNodeId);
      const targetRuntime = runtimeStates[targetNodeId];

      if (!targetNode || !targetRuntime) continue;

      // If already isolated, target does not degrade
      if (targetRuntime.isolated) continue;

      // Evaluate what target state should become
      const evaluation = resolver.evaluateNodeState(targetNodeId, runtimeStates);
      const newTargetState = evaluation.targetState;

      // Only schedule if state changes to a worse condition
      if (
        newTargetState !== targetRuntime.status &&
        newTargetState !== "HEALTHY" &&
        targetRuntime.status !== "FAILED" // If already FAILED, don't schedule DEGRADED
      ) {
        const effectiveDelay = Math.max(1, Math.round(edge.propagationDelay * delayMultiplier));
        const scheduledTime = currentTimestamp + effectiveDelay;

        // Build causal chain
        const parentChain = sourceRuntime?.causalChain || [sourceNodeId];
        const completeChain = [...parentChain, targetNodeId];

        // Combine contributing origins
        const parentOrigins = sourceRuntime?.contributingOrigins || [sourceNodeId];
        const combinedOrigins = Array.from(new Set(parentOrigins));

        const event: SimulationEvent = {
          id: `prop-${sourceNodeId}-${targetNodeId}-${scheduledTime}`,
          timestamp: scheduledTime,
          type: "FAILURE_PROPAGATED",
          sourceNode: sourceNodeId,
          sourceNodeName: sourceNode?.name || sourceNodeId,
          targetNode: targetNodeId,
          targetNodeName: targetNode.name,
          previousState: targetRuntime.status,
          newState: newTargetState,
          cause: {
            sourceNodeId: sourceNodeId,
            sourceNodeName: sourceNode?.name || sourceNodeId,
            reason: evaluation.reason || `Disruption propagated via ${edge.dependencyType} dependency from ${sourceNode?.name || sourceNodeId}`,
            chain: completeChain,
            rootCauses: combinedOrigins,
            propagationDelay: edge.propagationDelay,
          },
          contributingOrigins: combinedOrigins,
          message: `${targetNode.name} projected to become ${newTargetState} at T+${scheduledTime} (${edge.propagationDelay}m delay from ${sourceNode?.name || sourceNodeId})`,
          severity: newTargetState === "FAILED" ? "CRITICAL" : "WARNING",
          priority: 3, // Propagation priority
        };

        newEvents.push(event);
      }
    }

    return newEvents;
  }
}
