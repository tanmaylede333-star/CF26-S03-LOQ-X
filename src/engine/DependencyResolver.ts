import { InfrastructureNode, NodeStatus, NodeRuntimeState } from '../types/node';
import { DependencyEdge } from '../types/edge';

export class DependencyResolver {
  private incomingMap: Map<string, DependencyEdge[]> = new Map();
  private outgoingMap: Map<string, DependencyEdge[]> = new Map();
  private nodeMap: Map<string, InfrastructureNode> = new Map();

  constructor(nodes: InfrastructureNode[], edges: DependencyEdge[]) {
    this.rebuild(nodes, edges);
  }

  public rebuild(nodes: InfrastructureNode[], edges: DependencyEdge[]): void {
    this.incomingMap.clear();
    this.outgoingMap.clear();
    this.nodeMap.clear();

    nodes.forEach(node => {
      this.nodeMap.set(node.id, node);
      this.incomingMap.set(node.id, []);
      this.outgoingMap.set(node.id, []);
    });

    edges.forEach(edge => {
      if (this.incomingMap.has(edge.target)) {
        this.incomingMap.get(edge.target)!.push(edge);
      }
      if (this.outgoingMap.has(edge.source)) {
        this.outgoingMap.get(edge.source)!.push(edge);
      }
    });
  }

  public getIncomingEdges(nodeId: string): DependencyEdge[] {
    return this.incomingMap.get(nodeId) || [];
  }

  public getOutgoingEdges(nodeId: string): DependencyEdge[] {
    return this.outgoingMap.get(nodeId) || [];
  }

  public getDownstreamNodeIds(nodeId: string): string[] {
    return this.getOutgoingEdges(nodeId).map(edge => edge.target);
  }

  public getTransitiveDownstreamNodeIds(nodeId: string): string[] {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoing = this.getOutgoingEdges(current);
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    return Array.from(visited);
  }

  public getUpstreamNodeIds(nodeId: string): string[] {
    return this.getIncomingEdges(nodeId).map(edge => edge.source);
  }

  public getTransitiveUpstreamNodeIds(nodeId: string): string[] {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const incoming = this.getIncomingEdges(current);
      for (const edge of incoming) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Evaluate the target node's theoretical state given the runtime state of all upstream dependencies.
   */
  public evaluateNodeState(
    targetNodeId: string,
    runtimeStates: Record<string, NodeRuntimeState>
  ): { targetState: NodeStatus; primaryCauseNodeId?: string; reason?: string } {
    const targetRuntime = runtimeStates[targetNodeId];
    if (targetRuntime?.isolated) {
      return { targetState: "HEALTHY", reason: "Service isolated from network disruptions" };
    }

    const incomingEdges = this.getIncomingEdges(targetNodeId);
    if (incomingEdges.length === 0) {
      // Root node with no upstream dependencies
      return { targetState: "HEALTHY" };
    }

    let failedCount = 0;
    let degradedCount = 0;
    let atRiskCount = 0;
    let primaryFailedEdge: DependencyEdge | undefined;
    let primaryDegradedEdge: DependencyEdge | undefined;

    for (const edge of incomingEdges) {
      const sourceRuntime = runtimeStates[edge.source];
      const sourceStatus = sourceRuntime ? sourceRuntime.status : "HEALTHY";

      // If backup power is active and this is a power dependency, ignore power failure!
      if (edge.dependencyType === "POWER" && targetRuntime?.backupActive) {
        continue;
      }

      if (sourceStatus === "FAILED") {
        failedCount++;
        if (!primaryFailedEdge) primaryFailedEdge = edge;
      } else if (sourceStatus === "DEGRADED") {
        degradedCount++;
        if (!primaryDegradedEdge) primaryDegradedEdge = edge;
      } else if (sourceStatus === "AT_RISK") {
        atRiskCount++;
      }
    }

    // Determine state
    if (failedCount === 0 && degradedCount === 0 && atRiskCount === 0) {
      return { targetState: "HEALTHY" };
    }

    // Single or direct critical dependency failure
    if (failedCount > 0) {
      if (incomingEdges.length === 1 && primaryFailedEdge?.failureImpact === "FAIL") {
        return {
          targetState: "FAILED",
          primaryCauseNodeId: primaryFailedEdge.source,
          reason: `Critical dependency "${this.nodeMap.get(primaryFailedEdge.source)?.name || primaryFailedEdge.source}" is FAILED.`
        };
      }

      if (failedCount >= 2) {
        return {
          targetState: "FAILED",
          primaryCauseNodeId: primaryFailedEdge?.source,
          reason: `Multiple upstream dependencies failed (${failedCount} failed dependencies).`
        };
      }

      // 1 failed dependency out of multiple
      return {
        targetState: primaryFailedEdge?.failureImpact === "FAIL" ? "FAILED" : "DEGRADED",
        primaryCauseNodeId: primaryFailedEdge?.source,
        reason: `Upstream dependency "${this.nodeMap.get(primaryFailedEdge!.source)?.name || primaryFailedEdge!.source}" is FAILED.`
      };
    }

    if (degradedCount > 0) {
      return {
        targetState: "DEGRADED",
        primaryCauseNodeId: primaryDegradedEdge?.source,
        reason: `Upstream dependency "${this.nodeMap.get(primaryDegradedEdge!.source)?.name || primaryDegradedEdge!.source}" is DEGRADED.`
      };
    }

    if (atRiskCount > 0) {
      return {
        targetState: "AT_RISK",
        reason: "Upstream dependencies operating at elevated risk."
      };
    }

    return { targetState: "HEALTHY" };
  }
}
