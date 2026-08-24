import { InfrastructureNode, NodeRuntimeState, NodeStatus } from '../types/node';
import { DependencyEdge } from '../types/edge';
import { SimulationEvent } from '../types/event';
import { RecoveryAction } from '../types/recovery';
import { Scenario, InitialFailure, SimulationParameters } from '../types/scenario';
import { SimulationState, SimulationMetrics, SimulationStatus } from '../types/simulation';
import { EventQueue } from './EventQueue';
import { DependencyResolver } from './DependencyResolver';
import { FailurePropagation } from './FailurePropagation';
import { RecoveryManager } from './RecoveryManager';
import { MetricsCalculator } from './MetricsCalculator';
import { validateScenarioGraph } from './validator';

export interface RunComparisonResult {
  isIdentical: boolean;
  eventSequenceMatches: boolean;
  metricsMatch: boolean;
  originalEventCount: number;
  replayEventCount: number;
  mismatches: string[];
}

export class SimulationEngine {
  private scenario: Scenario;
  private nodes: InfrastructureNode[];
  private edges: DependencyEdge[];
  private runtimeStates: Record<string, NodeRuntimeState> = {};
  private eventQueue: EventQueue = new EventQueue();
  private eventHistory: SimulationEvent[] = [];
  private currentTime: number = 0;
  private status: SimulationStatus = "IDLE";
  private resolver: DependencyResolver;
  private initialFailureNodeIds: string[] = [];
  private activeRecoveries: RecoveryAction[] = [];
  private selectedNodeId: string | null = null;
  private speed: number = 1;
  private scrubTime: number | null = null;
  private highlightPath: { nodeIds: string[]; edgeIds: string[] } | null = null;
  private blastRadiusNodeIds: string[] | null = null;
  private eventCounter: number = 0;

  constructor(scenario: Scenario, nodes: InfrastructureNode[], edges: DependencyEdge[]) {
    this.scenario = scenario;
    this.nodes = JSON.parse(JSON.stringify(nodes));
    this.edges = JSON.parse(JSON.stringify(edges));
    this.resolver = new DependencyResolver(this.nodes, this.edges);
    this.initialize();
  }

  public initialize(): void {
    // Validate scenario first
    const validation = validateScenarioGraph(this.scenario, this.nodes, this.edges);
    if (!validation.isValid) {
      console.warn("Scenario validation warnings/errors:", validation.errors);
    }

    this.currentTime = 0;
    this.scrubTime = null;
    this.highlightPath = null;
    this.blastRadiusNodeIds = null;
    this.status = "IDLE";
    this.eventQueue.clear();
    this.eventHistory = [];
    this.runtimeStates = {};
    this.activeRecoveries = [];
    this.eventCounter = 0;
    this.initialFailureNodeIds = (this.scenario.initialFailures || []).map((f: InitialFailure) => f.nodeId);

    // Initialize clean node states
    for (const node of this.nodes) {
      this.runtimeStates[node.id] = {
        status: "HEALTHY",
        previousStatus: "HEALTHY",
        stateChangedAt: 0,
        failedAt: null,
        recoveryStartedAt: null,
        recoveredAt: null,
        causes: [],
        causalChain: [node.id],
        contributingOrigins: [],
        propagationPath: [],
        stateHistory: [{ time: 0, status: "HEALTHY", reason: "Grid initialized" }],
        isolated: false,
        backupActive: false,
      };
    }

    // Schedule initial failure events deterministically
    for (const initialFailure of this.scenario.initialFailures) {
      const node = this.nodes.find(n => n.id === initialFailure.nodeId);
      const nodeName = node?.name || initialFailure.nodeId;
      const targetState: NodeStatus = initialFailure.severity === "DEGRADED" ? "DEGRADED" : "FAILED";
      const originId = initialFailure.originId || initialFailure.nodeId;

      this.eventCounter++;
      const event: SimulationEvent = {
        id: `init-${initialFailure.nodeId}-${initialFailure.time}-${this.eventCounter}`,
        timestamp: initialFailure.time,
        type: "FAILURE_INJECTED",
        targetNode: initialFailure.nodeId,
        targetNodeName: nodeName,
        previousState: "HEALTHY",
        newState: targetState,
        cause: {
          sourceNodeId: initialFailure.nodeId,
          sourceNodeName: nodeName,
          reason: initialFailure.reason || "Primary disruption scheduled origin",
          chain: [initialFailure.nodeId],
          rootCauses: [originId],
          propagationDelay: 0,
        },
        contributingOrigins: [originId],
        message: `PRIMARY DISRUPTION [${originId}]: ${nodeName} entered ${targetState} state at T+${initialFailure.time}`,
        severity: targetState === "FAILED" ? "CRITICAL" : "WARNING",
        priority: 0, // Highest priority
      };

      this.eventQueue.push(event);
    }

    // Schedule any pre-configured recovery actions
    for (const recovery of this.scenario.scheduledRecoveries || []) {
      this.applyRecovery(recovery, false);
    }

    // Add initial scenario started event
    const startEvent: SimulationEvent = {
      id: `scenario-start-${this.scenario.id}`,
      timestamp: 0,
      type: "SCENARIO_STARTED",
      targetNode: "system",
      targetNodeName: "JanNagar Resilience Grid",
      previousState: "HEALTHY",
      newState: "HEALTHY",
      message: `Scenario "${this.scenario.name}" initialized with ${this.scenario.initialFailures.length} scheduled disruption(s). Ready for deterministic execution.`,
      severity: "INFO",
      priority: 0,
    };
    this.eventHistory.push(startEvent);
  }

  /**
   * Advance simulation by one virtual minute tick (Continuous Virtual Time Clock).
   */
  public step(): SimulationState {
    if (this.status === "COMPLETED") {
      return this.getState();
    }

    this.status = "RUNNING";
    this.scrubTime = null; // Exit scrubbing mode on playback step

    // Check max simulation time threshold
    if (this.currentTime > this.scenario.parameters.maxSimulationTime) {
      this.status = "COMPLETED";
      return this.getState();
    }

    // Pop all events occurring at or before this exact timestamp (Batch multi-failure processing)
    const readyEvents = this.eventQueue.popEventsAtOrBefore(this.currentTime);

    // Group state evaluations by target node to prevent duplicate evaluation
    const processedTargets = new Set<string>();
    let triggeredAutoPause = false;

    for (const event of readyEvents) {
      this.eventHistory.push(event);

      const targetId = event.targetNode;
      if (targetId === "system") continue;

      const runtime = this.runtimeStates[targetId];
      if (!runtime) continue;

      let effectiveNewState: NodeStatus = event.newState;

      // NON-BLIND RECOVERY: If a repair finishes, check if critical upstream dependencies are missing
      if (event.type === "RECOVERY_COMPLETED") {
        if (!runtime.backupActive && !runtime.isolated) {
          const evalResult = this.resolver.evaluateNodeState(targetId, this.runtimeStates);
          if (evalResult.targetState !== "HEALTHY") {
            // Missing upstream dependencies prevent full nominal recovery
            effectiveNewState = evalResult.targetState === "FAILED" ? "DEGRADED" : evalResult.targetState;
            event.message = `${event.targetNodeName} repair finished, but operating in ${effectiveNewState} mode due to upstream constraints`;
          }
        }

        // Mark active recovery as completed
        this.activeRecoveries = this.activeRecoveries.map(r => 
          r.nodeId === targetId ? { ...r, status: "COMPLETED" as const } : r
        );
      }

      runtime.previousStatus = runtime.status;
      runtime.status = effectiveNewState;
      runtime.stateChangedAt = event.timestamp;

      // Track state history for timeline scrubber
      if (!runtime.stateHistory) runtime.stateHistory = [];
      runtime.stateHistory.push({
        time: event.timestamp,
        status: effectiveNewState,
        reason: event.message,
      });

      if (effectiveNewState === "FAILED") {
        runtime.failedAt = event.timestamp;
        const targetNode = this.nodes.find(n => n.id === targetId);
        if (
          targetNode?.criticality === "CRITICAL" &&
          this.scenario.parameters.autoPauseOnCriticalBreach
        ) {
          triggeredAutoPause = true;
        }
      } else if (effectiveNewState === "RECOVERING") {
        runtime.recoveryStartedAt = event.timestamp;
      } else if (effectiveNewState === "HEALTHY") {
        runtime.recoveredAt = event.timestamp;
      }

      if (event.cause?.chain) {
        runtime.causalChain = event.cause.chain;
      }
      if (event.cause?.sourceNodeId) {
        if (!runtime.causes.includes(event.cause.sourceNodeId)) {
          runtime.causes.push(event.cause.sourceNodeId);
        }
      }

      // Contributing origins tracking
      if (event.contributingOrigins && event.contributingOrigins.length > 0) {
        const originSet = new Set(runtime.contributingOrigins || []);
        event.contributingOrigins.forEach(o => originSet.add(o));
        runtime.contributingOrigins = Array.from(originSet);
      }

      processedTargets.add(targetId);
    }

    // After applying batch state transitions at this timestamp, calculate downstream propagation
    const delayMultiplier = this.scenario.parameters.propagationDelayMultiplier || 1.0;
    for (const changedNodeId of processedTargets) {
      const nodeStatus = this.runtimeStates[changedNodeId]?.status;
      if (nodeStatus === "FAILED" || nodeStatus === "DEGRADED") {
        const downstreamEvents = FailurePropagation.generateDownstreamEvents(
          changedNodeId,
          this.currentTime,
          this.nodes,
          this.edges,
          this.runtimeStates,
          this.resolver,
          delayMultiplier
        );
        this.eventQueue.pushMany(downstreamEvents);
      } else if (nodeStatus === "HEALTHY") {
        // If a node recovered to HEALTHY, re-evaluate its downstream nodes to see if they can recover!
        this.checkDownstreamRecovery(changedNodeId);
      }
    }

    if (triggeredAutoPause) {
      this.status = "PAUSED";
    } else if (this.eventQueue.size() === 0 && this.currentTime >= this.scenario.parameters.maxSimulationTime) {
      this.status = "COMPLETED";
    }

    // Advance clock by 1 virtual minute for next step
    this.currentTime += 1;

    return this.getState();
  }

  /**
   * Dynamically inject a failure into a node at the current virtual timestamp.
   */
  public injectFailure(nodeId: string, customReason?: string, severity: "FULL" | "DEGRADED" = "FULL"): SimulationState {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return this.getState();

    if (!this.initialFailureNodeIds.includes(nodeId)) {
      this.initialFailureNodeIds.push(nodeId);
    }

    const targetState: NodeStatus = severity === "DEGRADED" ? "DEGRADED" : "FAILED";
    this.eventCounter++;

    const event: SimulationEvent = {
      id: `manual-fail-${nodeId}-${this.currentTime}-${this.eventCounter}`,
      timestamp: this.currentTime,
      type: "FAILURE_INJECTED",
      targetNode: nodeId,
      targetNodeName: node.name,
      previousState: this.runtimeStates[nodeId]?.status || "HEALTHY",
      newState: targetState,
      cause: {
        sourceNodeId: nodeId,
        sourceNodeName: node.name,
        reason: customReason || "Manual operator disruption injection",
        chain: [nodeId],
        rootCauses: [nodeId],
        propagationDelay: 0,
      },
      contributingOrigins: [nodeId],
      message: `OPERATOR INJECTION: ${node.name} forced to ${targetState} at T+${this.currentTime}`,
      severity: targetState === "FAILED" ? "CRITICAL" : "WARNING",
      priority: 0,
    };

    this.eventQueue.push(event);
    return this.getState();
  }

  /**
   * Apply a recovery action (REPAIR, BACKUP_POWER, ISOLATE).
   */
  public applyRecovery(action: RecoveryAction, updateActiveList: boolean = true): SimulationState {
    const node = this.nodes.find(n => n.id === action.nodeId);
    if (!node) return this.getState();

    const runtime = this.runtimeStates[action.nodeId];

    if (action.type === "ISOLATE") {
      if (runtime) runtime.isolated = true;
      const isolateEvent: SimulationEvent = {
        id: `isolate-${action.nodeId}-${this.currentTime}`,
        timestamp: this.currentTime,
        type: "SERVICE_ISOLATED",
        targetNode: action.nodeId,
        targetNodeName: node.name,
        previousState: runtime?.status || "HEALTHY",
        newState: runtime?.status || "HEALTHY",
        message: `GRID ISOLATION: ${node.name} isolated from cascade propagation pathways`,
        severity: "INFO",
        priority: 1,
      };
      this.eventHistory.push(isolateEvent);
      // Remove any pending propagation events directed to this node
      this.eventQueue.removeEventsForTarget(action.nodeId, ["FAILURE_PROPAGATED"]);
      return this.getState();
    }

    if (action.type === "BACKUP_POWER") {
      if (runtime) runtime.backupActive = true;
    }

    // Immediately reflect state transition in runtime
    if (runtime && action.startTime <= this.currentTime) {
      if (action.duration > 0) {
        runtime.previousStatus = runtime.status;
        runtime.status = "RECOVERING";
        runtime.recoveryStartedAt = this.currentTime;
        if (!runtime.stateHistory) runtime.stateHistory = [];
        runtime.stateHistory.push({
          time: this.currentTime,
          status: "RECOVERING",
          reason: action.description || `${action.type.replace(/_/g, ' ')} initiated`,
        });
      } else {
        runtime.previousStatus = runtime.status;
        runtime.status = "HEALTHY";
        runtime.recoveredAt = this.currentTime;
        if (!runtime.stateHistory) runtime.stateHistory = [];
        runtime.stateHistory.push({
          time: this.currentTime,
          status: "HEALTHY",
          reason: action.description || `${action.type.replace(/_/g, ' ')} completed`,
        });
        this.checkDownstreamRecovery(action.nodeId);
      }
    }

    const { startEvent, completeEvent } = RecoveryManager.createRecoveryEvents(
      action,
      this.nodes,
      this.runtimeStates
    );

    this.eventQueue.push(startEvent);
    this.eventQueue.push(completeEvent);

    if (updateActiveList) {
      // Remove any existing active recovery on the same node to avoid duplicate entries
      this.activeRecoveries = this.activeRecoveries.filter(r => r.nodeId !== action.nodeId);
      this.activeRecoveries.push({
        ...action,
        status: action.duration === 0 ? ("COMPLETED" as const) : ("IN_PROGRESS" as const),
      });
    }

    // If simulation was completed or past max time, expand max time and resume
    if (action.startTime + action.duration >= this.scenario.parameters.maxSimulationTime) {
      this.scenario.parameters.maxSimulationTime = action.startTime + action.duration + 45;
    }
    if (this.status === "COMPLETED" || this.status === "IDLE" || this.status === "PAUSED") {
      this.status = "RUNNING";
    }

    return this.getState();
  }

  /**
   * When an upstream node becomes healthy, test if downstream nodes can now recover.
   */
  private checkDownstreamRecovery(recoveredNodeId: string): void {
    const downstreamIds = this.resolver.getDownstreamNodeIds(recoveredNodeId);

    for (const targetId of downstreamIds) {
      const targetRuntime = this.runtimeStates[targetId];
      if (!targetRuntime || targetRuntime.status === "HEALTHY") continue;

      // Re-evaluate target state
      const evalResult = this.resolver.evaluateNodeState(targetId, this.runtimeStates);
      if (evalResult.targetState === "HEALTHY" || (evalResult.targetState === "DEGRADED" && targetRuntime.status === "FAILED")) {
        const targetNode = this.nodes.find(n => n.id === targetId);
        const restoreTime = this.currentTime + 2; // Short restoration latency

        // Remove any future failure events that were scheduled for this target
        this.eventQueue.removeEventsForTarget(targetId, ["FAILURE_PROPAGATED"]);

        const restoreEvent: SimulationEvent = {
          id: `downstream-restore-${targetId}-${restoreTime}`,
          timestamp: restoreTime,
          type: "RECOVERY_COMPLETED",
          targetNode: targetId,
          targetNodeName: targetNode?.name || targetId,
          previousState: targetRuntime.status,
          newState: evalResult.targetState,
          cause: {
            sourceNodeId: recoveredNodeId,
            reason: `Upstream dependency "${this.nodes.find(n => n.id === recoveredNodeId)?.name || recoveredNodeId}" restored`,
            chain: [recoveredNodeId, targetId],
          },
          message: `${targetNode?.name || targetId} recovered to ${evalResult.targetState} after upstream dependency restoration`,
          severity: evalResult.targetState === "HEALTHY" ? "SUCCESS" : "WARNING",
          priority: 1,
        };

        this.eventQueue.push(restoreEvent);
      }
    }
  }

  public updateParameters(params: Partial<SimulationParameters>): void {
    this.scenario.parameters = {
      ...this.scenario.parameters,
      ...params,
    };
  }

  public pause(): void {
    if (this.status === "RUNNING") {
      this.status = "PAUSED";
    }
  }

  public resume(): void {
    if (this.status === "PAUSED" || this.status === "IDLE") {
      this.status = "RUNNING";
    }
  }

  public reset(): SimulationState {
    this.initialize();
    return this.getState();
  }

  public runAll(): SimulationState {
    this.reset();
    this.status = "RUNNING";
    let iterations = 0;
    while (this.status === "RUNNING" && iterations < 1000) {
      this.step();
      iterations++;
    }
    this.status = "COMPLETED";
    return this.getState();
  }

  public setScrubTime(time: number | null): SimulationState {
    this.scrubTime = time;
    return this.getState();
  }

  public setSelectedNodeId(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    if (nodeId) {
      this.calculateHighlightPathForNode(nodeId);
    } else {
      this.highlightPath = null;
      this.blastRadiusNodeIds = null;
    }
  }

  public setHighlightPath(path: { nodeIds: string[]; edgeIds: string[] } | null): void {
    this.highlightPath = path;
  }

  public calculateHighlightPathForNode(nodeId: string): void {
    const runtime = this.runtimeStates[nodeId];
    if (!runtime || !runtime.causalChain || runtime.causalChain.length <= 1) {
      // If no explicit causalChain yet, find direct upstream incoming edges or connected edges
      const incomingEdges = this.resolver.getIncomingEdges(nodeId);
      const edgeIds = incomingEdges.map(e => e.id);
      const nodeIds = [nodeId, ...incomingEdges.map(e => e.source)];
      this.highlightPath = { nodeIds, edgeIds };
      return;
    }

    const chain = runtime.causalChain;
    const nodeIds = [...chain];
    const edgeIds: string[] = [];

    for (let i = 0; i < chain.length - 1; i++) {
      const src = chain[i];
      const tgt = chain[i + 1];
      const matchingEdge = this.edges.find(
        e => (e.source === src && e.target === tgt) || (e.source === tgt && e.target === src)
      );
      if (matchingEdge) {
        edgeIds.push(matchingEdge.id);
      }
    }

    this.highlightPath = { nodeIds, edgeIds };
  }

  public calculateBlastRadius(nodeId: string): string[] {
    const downstream = this.resolver.getTransitiveDownstreamNodeIds(nodeId);
    this.blastRadiusNodeIds = [nodeId, ...downstream];
    return this.blastRadiusNodeIds;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Returns exact state snapshot of the simulation at virtual minute 'time'.
   */
  public stateAtTime(time: number): SimulationState {
    const eventsUpToTime = this.eventHistory.filter(e => e.timestamp <= time);

    // Compute node states at target time
    const computedRuntimeStates: Record<string, NodeRuntimeState> = {};
    for (const node of this.nodes) {
      const originalRuntime = this.runtimeStates[node.id];
      let nodeStateAtT: NodeStatus = "HEALTHY";

      if (originalRuntime?.stateHistory) {
        for (const historyItem of originalRuntime.stateHistory) {
          if (historyItem.time <= time) {
            nodeStateAtT = historyItem.status;
          }
        }
      }

      computedRuntimeStates[node.id] = {
        ...(originalRuntime || {}),
        status: nodeStateAtT,
        previousStatus: "HEALTHY",
        stateChangedAt: 0,
        failedAt: originalRuntime?.failedAt !== null && originalRuntime?.failedAt !== undefined && originalRuntime.failedAt <= time ? originalRuntime.failedAt : null,
        recoveryStartedAt: originalRuntime?.recoveryStartedAt !== null && originalRuntime?.recoveryStartedAt !== undefined && originalRuntime.recoveryStartedAt <= time ? originalRuntime.recoveryStartedAt : null,
        recoveredAt: originalRuntime?.recoveredAt !== null && originalRuntime?.recoveredAt !== undefined && originalRuntime.recoveredAt <= time ? originalRuntime.recoveredAt : null,
        causes: originalRuntime?.causes || [],
        causalChain: originalRuntime?.causalChain || [node.id],
        contributingOrigins: originalRuntime?.contributingOrigins || [],
        isolated: originalRuntime?.isolated || false,
        backupActive: originalRuntime?.backupActive || false,
      };
    }

    const synchronizedNodes: InfrastructureNode[] = this.nodes.map(node => {
      const runtime = computedRuntimeStates[node.id];
      return {
        ...node,
        status: runtime ? runtime.status : "HEALTHY",
        previousStatus: "HEALTHY",
        metrics: {
          ...node.metrics,
          backupActive: runtime?.backupActive,
        }
      };
    });

    const metrics: SimulationMetrics = MetricsCalculator.calculate(
      synchronizedNodes,
      computedRuntimeStates,
      eventsUpToTime,
      this.initialFailureNodeIds
    );

    return {
      currentTime: this.currentTime,
      scrubTime: time,
      status: this.status,
      scenario: this.scenario,
      nodes: synchronizedNodes,
      edges: this.edges,
      nodeStates: computedRuntimeStates,
      events: eventsUpToTime,
      activeRecoveries: this.activeRecoveries.filter(r => r.startTime <= time),
      metrics,
      selectedNodeId: this.selectedNodeId,
      speed: this.speed,
      highlightPath: this.highlightPath,
      blastRadiusNodeIds: this.blastRadiusNodeIds,
    };
  }

  public getState(): SimulationState {
    if (this.scrubTime !== null && this.scrubTime !== this.currentTime) {
      return this.stateAtTime(this.scrubTime);
    }

    // Synchronize node array statuses with runtimeStates
    const synchronizedNodes: InfrastructureNode[] = this.nodes.map(node => {
      const runtime = this.runtimeStates[node.id];
      return {
        ...node,
        status: runtime ? runtime.status : "HEALTHY",
        previousStatus: runtime ? runtime.previousStatus : "HEALTHY",
        metrics: {
          ...node.metrics,
          backupActive: runtime?.backupActive,
        }
      };
    });

    const metrics: SimulationMetrics = MetricsCalculator.calculate(
      synchronizedNodes,
      this.runtimeStates,
      this.eventHistory,
      this.initialFailureNodeIds
    );

    return {
      currentTime: this.currentTime,
      scrubTime: this.scrubTime,
      status: this.status,
      scenario: this.scenario,
      nodes: synchronizedNodes,
      edges: this.edges,
      nodeStates: { ...this.runtimeStates },
      events: [...this.eventHistory],
      activeRecoveries: [...this.activeRecoveries],
      metrics,
      selectedNodeId: this.selectedNodeId,
      speed: this.speed,
      highlightPath: this.highlightPath,
      blastRadiusNodeIds: this.blastRadiusNodeIds,
    };
  }

  /**
   * Verifies deterministic reproducibility between two simulation runs.
   */
  public static compareRuns(
    run1Events: SimulationEvent[],
    run1Metrics: SimulationMetrics,
    run2Events: SimulationEvent[],
    run2Metrics: SimulationMetrics
  ): RunComparisonResult {
    const mismatches: string[] = [];

    const eventCountMatches = run1Events.length === run2Events.length;
    if (!eventCountMatches) {
      mismatches.push(`Event count differs: Run 1 has ${run1Events.length} events, Run 2 has ${run2Events.length} events.`);
    }

    let eventSequenceMatches = true;
    const minLength = Math.min(run1Events.length, run2Events.length);

    for (let i = 0; i < minLength; i++) {
      const e1 = run1Events[i];
      const e2 = run2Events[i];

      if (e1.timestamp !== e2.timestamp || e1.targetNode !== e2.targetNode || e1.newState !== e2.newState || e1.type !== e2.type) {
        eventSequenceMatches = false;
        mismatches.push(`Difference at Event #${i + 1} (T+${e1.timestamp}): Run 1 [${e1.targetNode} → ${e1.newState}] vs Run 2 [${e2.targetNode} → ${e2.newState}]`);
        break;
      }
    }

    const metricsMatch =
      run1Metrics.cascadeDepth === run2Metrics.cascadeDepth &&
      run1Metrics.affectedServices === run2Metrics.affectedServices &&
      run1Metrics.recoveryTime === run2Metrics.recoveryTime &&
      run1Metrics.systemHealthPercentage === run2Metrics.systemHealthPercentage;

    if (!metricsMatch) {
      if (run1Metrics.cascadeDepth !== run2Metrics.cascadeDepth) {
        mismatches.push(`Cascade depth mismatch: ${run1Metrics.cascadeDepth} vs ${run2Metrics.cascadeDepth}`);
      }
      if (run1Metrics.affectedServices !== run2Metrics.affectedServices) {
        mismatches.push(`Affected services mismatch: ${run1Metrics.affectedServices} vs ${run2Metrics.affectedServices}`);
      }
      if (run1Metrics.recoveryTime !== run2Metrics.recoveryTime) {
        mismatches.push(`Recovery time mismatch: ${run1Metrics.recoveryTime} vs ${run2Metrics.recoveryTime}`);
      }
    }

    const isIdentical = eventCountMatches && eventSequenceMatches && metricsMatch;

    return {
      isIdentical,
      eventSequenceMatches,
      metricsMatch,
      originalEventCount: run1Events.length,
      replayEventCount: run2Events.length,
      mismatches,
    };
  }
}
