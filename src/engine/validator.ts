import { InfrastructureNode } from '../types/node';
import { DependencyEdge } from '../types/edge';
import { Scenario } from '../types/scenario';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateScenarioGraph(
  scenario: Scenario,
  nodes: InfrastructureNode[],
  edges: DependencyEdge[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID detected: "${node.id}". Node IDs must be unique.`);
    }
    nodeIds.add(node.id);
  }

  // 2. Check edge references & duplicate edge IDs
  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge ID detected: "${edge.id}".`);
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source)) {
      errors.push(`Invalid dependency edge "${edge.id}": Source node "${edge.source}" does not exist in graph.`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Invalid dependency edge "${edge.id}": Target node "${edge.target}" does not exist in graph.`);
    }
    if (edge.source === edge.target) {
      errors.push(`Self-referencing dependency detected on node "${edge.source}".`);
    }
    if (edge.propagationDelay < 0) {
      errors.push(`Negative propagation delay (${edge.propagationDelay}) on edge "${edge.id}". Delays must be >= 0.`);
    }
  }

  // 3. Check initial failures
  for (const failure of scenario.initialFailures) {
    if (!nodeIds.has(failure.nodeId)) {
      errors.push(`Initial failure refers to unknown node ID: "${failure.nodeId}".`);
    }
    if (failure.time < 0) {
      errors.push(`Initial failure time (${failure.time}) cannot be negative.`);
    }
  }

  // 4. Circular dependency detection (Cycle Detection in Directed Graph using DFS)
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting (in stack), 2: visited
  const cyclePath: string[] = [];

  function dfs(nodeId: string, path: string[]): boolean {
    visited.set(nodeId, 1);
    path.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const state = visited.get(neighbor) || 0;
      if (state === 1) {
        // Cycle found
        const cycleStartIndex = path.indexOf(neighbor);
        cyclePath.push(...path.slice(cycleStartIndex), neighbor);
        return true;
      }
      if (state === 0) {
        if (dfs(neighbor, path)) return true;
      }
    }

    visited.set(nodeId, 2);
    path.pop();
    return false;
  }

  nodes.forEach(node => {
    if ((visited.get(node.id) || 0) === 0) {
      if (dfs(node.id, [])) {
        errors.push(`Circular dependency detected: ${cyclePath.join(' -> ')}`);
      }
    }
  });

  if (nodes.length === 0) {
    errors.push("Graph contains no nodes.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
