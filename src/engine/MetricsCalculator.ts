import { InfrastructureNode, NodeRuntimeState } from '../types/node';
import { SimulationEvent } from '../types/event';
import { SimulationMetrics } from '../types/simulation';

export class MetricsCalculator {
  /**
   * Computes comprehensive simulation metrics deterministically from graph state and event history.
   */
  public static calculate(
    nodes: InfrastructureNode[],
    runtimeStates: Record<string, NodeRuntimeState>,
    events: SimulationEvent[],
    initialFailureNodeIds: string[]
  ): SimulationMetrics {
    const initialFailureSet = new Set(initialFailureNodeIds);

    let healthyCount = 0;
    let atRiskCount = 0;
    let degradedCount = 0;
    let failedCount = 0;
    let recoveringCount = 0;
    let criticalAffectedCount = 0;

    const affectedNodeIdSet = new Set<string>();

    for (const node of nodes) {
      const state = runtimeStates[node.id]?.status || "HEALTHY";

      switch (state) {
        case "HEALTHY":
          healthyCount++;
          break;
        case "AT_RISK":
          atRiskCount++;
          if (!initialFailureSet.has(node.id)) {
            affectedNodeIdSet.add(node.id);
          }
          break;
        case "DEGRADED":
          degradedCount++;
          if (!initialFailureSet.has(node.id)) {
            affectedNodeIdSet.add(node.id);
          }
          if (node.criticality === "CRITICAL" || node.criticality === "HIGH") {
            criticalAffectedCount++;
          }
          break;
        case "FAILED":
          failedCount++;
          if (!initialFailureSet.has(node.id)) {
            affectedNodeIdSet.add(node.id);
          }
          if (node.criticality === "CRITICAL" || node.criticality === "HIGH") {
            criticalAffectedCount++;
          }
          break;
        case "RECOVERING":
          recoveringCount++;
          if (!initialFailureSet.has(node.id)) {
            affectedNodeIdSet.add(node.id);
          }
          break;
      }
    }

    // Calculate Cascade Depth using the causal chains from events
    const cascadeDepth = this.calculateCascadeDepth(events, initialFailureSet);

    // Calculate Recovery Time (Simulated minutes spent from first failure to final recovery completion)
    const recoveryTime = this.calculateRecoveryTime(events);

    // Time to peak impact (timestamp with maximum concurrent non-healthy nodes)
    const stabilizationTime = events.length > 0 ? events[events.length - 1].timestamp : 0;

    // Calculate System Health percentage (0 - 100%)
    const totalNodes = nodes.length;
    let healthScore = 0;
    if (totalNodes > 0) {
      nodes.forEach(node => {
        const s = runtimeStates[node.id]?.status || "HEALTHY";
        if (s === "HEALTHY") healthScore += 100;
        else if (s === "AT_RISK") healthScore += 70;
        else if (s === "RECOVERING") healthScore += 50;
        else if (s === "DEGRADED") healthScore += 35;
        else if (s === "FAILED") healthScore += 0;
      });
      healthScore = Math.round(healthScore / totalNodes);
    }

    return {
      cascadeDepth,
      affectedServices: affectedNodeIdSet.size,
      affectedNodeIds: Array.from(affectedNodeIdSet),
      recoveryTime,
      criticalServicesAffected: criticalAffectedCount,
      timeToPeakImpact: this.calculateTimeToPeakImpact(events),
      stabilizationTime,
      systemHealthPercentage: healthScore,
      totalNodes,
      healthyCount,
      atRiskCount,
      degradedCount,
      failedCount,
      recoveringCount,
    };
  }

  /**
   * Determines maximum causal propagation depth from root failures.
   */
  private static calculateCascadeDepth(
    events: SimulationEvent[],
    initialFailureSet: Set<string>
  ): number {
    if (events.length === 0 || initialFailureSet.size === 0) {
      return 0;
    }

    // Node ID -> Max causal depth from root
    const depthMap = new Map<string, number>();
    initialFailureSet.forEach(id => depthMap.set(id, 0));

    // Traverse events chronologically to compute causal hops
    for (const event of events) {
      if (event.type === "FAILURE_INJECTED") {
        depthMap.set(event.targetNode, 0);
      } else if (event.type === "FAILURE_PROPAGATED" || event.type === "STATE_CHANGED") {
        if (event.cause?.sourceNodeId && depthMap.has(event.cause.sourceNodeId)) {
          const parentDepth = depthMap.get(event.cause.sourceNodeId)!;
          const currentDepth = depthMap.get(event.targetNode) || 0;
          depthMap.set(event.targetNode, Math.max(currentDepth, parentDepth + 1));
        } else if (event.cause?.chain && event.cause.chain.length > 1) {
          depthMap.set(event.targetNode, Math.max(depthMap.get(event.targetNode) || 0, event.cause.chain.length - 1));
        }
      }
    }

    let maxDepth = 0;
    for (const [nodeId, depth] of depthMap.entries()) {
      if (!initialFailureSet.has(nodeId) && depth > maxDepth) {
        maxDepth = depth;
      }
    }

    return maxDepth;
  }

  /**
   * Computes duration between first disruption and final restoration event.
   */
  private static calculateRecoveryTime(events: SimulationEvent[]): number {
    const recoveryEvents = events.filter(
      e => e.type === "RECOVERY_STARTED" || e.type === "RECOVERY_COMPLETED"
    );

    if (recoveryEvents.length === 0) {
      return 0;
    }

    const firstRecovery = recoveryEvents[0].timestamp;
    const lastRecovery = recoveryEvents[recoveryEvents.length - 1].timestamp;
    return Math.max(0, lastRecovery - firstRecovery);
  }

  private static calculateTimeToPeakImpact(events: SimulationEvent[]): number {
    const disruptionEvents = events.filter(
      e => e.type === "FAILURE_INJECTED" || e.type === "FAILURE_PROPAGATED"
    );
    return disruptionEvents.length > 0 ? disruptionEvents[disruptionEvents.length - 1].timestamp : 0;
  }
}
