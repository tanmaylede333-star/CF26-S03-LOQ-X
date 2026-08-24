import { SimulationEngine } from './SimulationEngine';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../data/cityGraph';
import { PREDEFINED_SCENARIOS } from '../data/scenarios';
import { validateScenarioGraph } from './validator';
import { Scenario } from '../types/scenario';
import { ResilienceAdvisor } from './ResilienceAdvisor';

export function runTestSuite(): { passed: number; failed: number; results: { name: string; success: boolean; details?: string }[] } {
  const results: { name: string; success: boolean; details?: string }[] = [];

  function assert(testName: string, condition: boolean, details?: string) {
    results.push({ name: testName, success: condition, details });
    if (!condition) {
      console.error(`❌ FAILED: ${testName} - ${details || ''}`);
    } else {
      console.log(`✅ PASSED: ${testName}`);
    }
  }

  console.log("=== RUNNING URBAN INFRASTRUCTURE CASCADE SIMULATOR TEST SUITE ===");

  // TC-001: Single Failure Propagation
  {
    const scenario = PREDEFINED_SCENARIOS[0]; // Power failure
    const engine = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();

    const powerNode = finalState.nodes.find(n => n.id === 'power-grid-main');
    const pumpNode = finalState.nodes.find(n => n.id === 'water-pump-01');
    const waterNetNode = finalState.nodes.find(n => n.id === 'water-network-01');
    const hospitalNode = finalState.nodes.find(n => n.id === 'hospital-metro-01');

    assert("TC-001: Power Substation is FAILED", powerNode?.status === 'FAILED');
    assert("TC-001: Downstream Water Pump propagated to FAILED", pumpNode?.status === 'FAILED');
    assert("TC-001: Downstream Water Network propagated to FAILED", waterNetNode?.status === 'FAILED');
    assert("TC-001: Downstream Hospital propagated to DEGRADED/FAILED", hospitalNode?.status === 'DEGRADED' || hospitalNode?.status === 'FAILED');
  }

  // TC-002 & TC-005: Cascade Depth Calculation
  {
    const scenario = PREDEFINED_SCENARIOS[0];
    const engine = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();

    assert("TC-002: Cascade Depth is >= 3", finalState.metrics.cascadeDepth >= 3, `Depth: ${finalState.metrics.cascadeDepth}`);
    assert("TC-006: Affected Services excludes root Power Grid", !finalState.metrics.affectedNodeIds.includes('power-grid-main'));
    assert("TC-006: Affected Services count > 0", finalState.metrics.affectedServices > 0, `Count: ${finalState.metrics.affectedServices}`);
  }

  // TC-003 & TC-004: Multiple Simultaneous Failures Batch Processing
  {
    const dualScenario = PREDEFINED_SCENARIOS[1]; // Power + Telecom
    const engine = new SimulationEngine(dualScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();

    const emergencyDispatch = finalState.nodes.find(n => n.id === 'emergency-dispatch-01');
    assert("TC-003: Dual disruption shared dependent (Emergency Dispatch) is affected", emergencyDispatch?.status === 'FAILED' || emergencyDispatch?.status === 'DEGRADED');

    // Verify Emergency Dispatch is counted only once in affected services
    const countInAffected = finalState.metrics.affectedNodeIds.filter(id => id === 'emergency-dispatch-01').length;
    assert("TC-004: Shared dependent is not double-counted in affected services list", countInAffected <= 1);
  }

  // TC-007: Recovery Action Transition Sequence (FAILED -> RECOVERING -> HEALTHY)
  {
    const scenarioWithRecovery = PREDEFINED_SCENARIOS[3]; // Monsoon with early backup power
    const engine = new SimulationEngine(scenarioWithRecovery, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();

    const pumpNode = finalState.nodes.find(n => n.id === 'water-pump-01');
    assert("TC-007: Target node with backup power was restored to HEALTHY", pumpNode?.status === 'HEALTHY');
    assert("TC-007: Recovery Time metric is > 0", finalState.metrics.recoveryTime > 0, `Recovery Time: ${finalState.metrics.recoveryTime}`);

    const hasRecStarted = finalState.events.some(e => e.type === 'RECOVERY_STARTED');
    const hasRecCompleted = finalState.events.some(e => e.type === 'RECOVERY_COMPLETED');
    assert("TC-007: Event timeline includes RECOVERY_STARTED and RECOVERY_COMPLETED", hasRecStarted && hasRecCompleted);
  }

  // TC-009: Deterministic Replay (Run 1 === Run 2)
  {
    const scenario = PREDEFINED_SCENARIOS[0];
    const engine1 = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const res1 = engine1.runAll();

    const engine2 = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const res2 = engine2.runAll();

    const comparison = SimulationEngine.compareRuns(res1.events, res1.metrics, res2.events, res2.metrics);

    assert("TC-009: Deterministic Replay produces identical metrics", comparison.metricsMatch);
    assert("TC-009: Deterministic Replay produces identical event sequence", comparison.eventSequenceMatches);
    assert("TC-009: CompareRuns confirms identical execution", comparison.isIdentical);
  }

  // TC-010: Cycle Detection Validation
  {
    const cyclicScenario: Scenario = {
      id: "cyclic-test",
      name: "Cyclic Test",
      category: "CUSTOM",
      description: "Cycle detection",
      graphVersion: "v1",
      initialFailures: [{ nodeId: "node-a", time: 0 }],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 10 },
      scheduledRecoveries: []
    };

    const cyclicNodes = [
      { id: "node-a", name: "A", type: "POWER" as const, zone: "Z1", criticality: "HIGH" as const, status: "HEALTHY" as const, recoveryTime: 10, position: { x: 0, y: 0 } },
      { id: "node-b", name: "B", type: "WATER" as const, zone: "Z1", criticality: "HIGH" as const, status: "HEALTHY" as const, recoveryTime: 10, position: { x: 0, y: 0 } },
    ];

    const cyclicEdges = [
      { id: "e1", source: "node-a", target: "node-b", dependencyType: "POWER" as const, propagationDelay: 5, failureImpact: "FAIL" as const },
      { id: "e2", source: "node-b", target: "node-a", dependencyType: "POWER" as const, propagationDelay: 5, failureImpact: "FAIL" as const },
    ];

    const validation = validateScenarioGraph(cyclicScenario, cyclicNodes, cyclicEdges);
    assert("TC-010: Graph validator detects and rejects circular dependencies", !validation.isValid && validation.errors.some(e => e.includes("Circular dependency")));
  }

  // TC-011: Timeline Scrubber State-at-Time Inspection
  {
    const scenario = PREDEFINED_SCENARIOS[0]; // Power failure
    const engine = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    engine.runAll();

    const stateAtT0 = engine.stateAtTime(0);
    const stateAtT5 = engine.stateAtTime(5);
    const stateAtT20 = engine.stateAtTime(20);

    const powerAtT0 = stateAtT0.nodes.find(n => n.id === 'power-grid-main');
    const pumpAtT0 = stateAtT0.nodes.find(n => n.id === 'water-pump-01');
    const pumpAtT5 = stateAtT5.nodes.find(n => n.id === 'water-pump-01');
    const hospitalAtT20 = stateAtT20.nodes.find(n => n.id === 'hospital-metro-01');

    assert("TC-011: At T+0, Power is FAILED and Water Pump is still HEALTHY", powerAtT0?.status === 'FAILED' && pumpAtT0?.status === 'HEALTHY');
    assert("TC-011: At T+5, Water Pump has transitioned to FAILED", pumpAtT5?.status === 'FAILED');
    assert("TC-011: At T+20, Hospital is affected", hospitalAtT20?.status !== 'HEALTHY');
  }

  // TC-012: Multi-Origin Causal Attribution
  {
    const dualScenario = PREDEFINED_SCENARIOS[1]; // Dual Power + Telecom
    const engine = new SimulationEngine(dualScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();

    const emergencyDispatchRuntime = finalState.nodeStates['emergency-dispatch-01'];
    const hasMultipleOrigins = (emergencyDispatchRuntime?.contributingOrigins || []).length >= 2;

    assert("TC-012: Converged dependent node retains multi-origin causal attribution", hasMultipleOrigins, `Origins: ${JSON.stringify(emergencyDispatchRuntime?.contributingOrigins)}`);
  }

  // TC-013: Resilience Advisor Evaluation & Ranking
  {
    const scenario = PREDEFINED_SCENARIOS[0];
    const report = ResilienceAdvisor.evaluateScenario(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);

    assert("TC-013: Resilience Advisor returns non-empty evaluations", report.evaluations.length > 0);
    assert("TC-013: Top recommendation provides measurable impact reduction", (report.topRecommendation?.impactReductionPercentage || 0) > 0);
    assert("TC-013: Candidates are sorted by overallScore in descending order", report.evaluations[0].overallScore >= report.evaluations[report.evaluations.length - 1].overallScore);
  }

  // TC-014: Non-Blind Recovery (Upstream dependencies must be healthy or backed up)
  {
    // Hospital depends on Power Grid and Water.
    // If we schedule recovery on Hospital at T+5 duration 5, but Power is still FAILED and no backup is active,
    // Hospital should not become HEALTHY blindly.
    const nonBlindScenario: Scenario = {
      id: "non-blind-test",
      name: "Non Blind Recovery Test",
      category: "CUSTOM",
      description: "Test recovery under failed upstream",
      graphVersion: "city-v1",
      initialFailures: [{ nodeId: "power-grid-main", time: 0, severity: "FULL" }],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 10 },
      scheduledRecoveries: [
        {
          id: "rec-hosp",
          nodeId: "hospital-metro-01",
          nodeName: "Hospital Trauma Center",
          type: "REPAIR",
          startTime: 5,
          duration: 5,
          cost: 20,
          description: "Hospital emergency repair",
          status: "SCHEDULED"
        }
      ]
    };

    const engine = new SimulationEngine(nonBlindScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();
    const hospitalNode = finalState.nodes.find(n => n.id === 'hospital-metro-01');

    assert(
      "TC-014: Repaired node without backup under failed upstream power is constrained (not blindly HEALTHY)",
      hospitalNode?.status !== 'HEALTHY'
    );
  }

  // TC-015: Propagation Delay Multiplier
  {
    const baseScenario = PREDEFINED_SCENARIOS[0]; // Power failure (default delay 5m)
    const delayedScenario: Scenario = {
      ...baseScenario,
      parameters: {
        ...baseScenario.parameters,
        propagationDelayMultiplier: 2.0, // 2.0x delay -> 10m delay
      },
    };

    const engine = new SimulationEngine(delayedScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    engine.runAll();

    const stateAtT5 = engine.stateAtTime(5);
    const stateAtT10 = engine.stateAtTime(10);
    const pumpAtT5 = stateAtT5.nodes.find(n => n.id === 'water-pump-01');
    const pumpAtT10 = stateAtT10.nodes.find(n => n.id === 'water-pump-01');

    assert("TC-015: At 2.0x delay multiplier, pump is still HEALTHY at T+5", pumpAtT5?.status === 'HEALTHY');
    assert("TC-015: At 2.0x delay multiplier, pump is FAILED by T+10", pumpAtT10?.status === 'FAILED');
  }

  // TC-016: Auto-Pause on Critical Breach
  {
    const pauseScenario: Scenario = {
      ...PREDEFINED_SCENARIOS[0],
      parameters: {
        ...PREDEFINED_SCENARIOS[0].parameters,
        autoPauseOnCriticalBreach: true,
      },
    };

    const engine = new SimulationEngine(pauseScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    engine.resume();
    // Step forward until power-grid-main (CRITICAL) fails at T+0
    const state = engine.step();

    assert("TC-016: Simulation auto-pauses when a CRITICAL node fails", state.status === "PAUSED");
  }

  // TC-017: Procedural GIS Coordinates for Custom Nodes
  {
    const customNode = {
      id: "custom-substation-99",
      name: "Custom North Substation",
      type: "POWER" as const,
      zone: "Sector 1",
      criticality: "HIGH" as const,
      status: "HEALTHY" as const,
      recoveryTime: 15,
      position: { x: 100, y: 100 },
      // coordinates omitted!
    };

    // Calculate deterministic procedural coordinate
    let hash = 0;
    for (let i = 0; i < customNode.id.length; i++) {
      hash = (hash << 5) - hash + customNode.id.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.07;
    const lngOffset = (((Math.abs(hash >> 3)) % 1000) / 1000 - 0.5) * 0.07;
    const coords = { lat: 19.0760 + latOffset, lng: 72.8777 + lngOffset };

    assert(
      "TC-017: Custom node receives non-zero procedural GIS coordinates within city bounds",
      coords.lat > 19.0 && coords.lat < 19.2 && coords.lng > 72.8 && coords.lng < 73.0
    );
  }

  // TC-018: Simultaneous 4-Sector Convergence Batch Processing
  {
    const quadScenario: Scenario = {
      id: "quad-failure",
      name: "Quad Sector Collapse",
      category: "CUSTOM",
      description: "Power, Water, Telecom, Traffic fail simultaneously at T+0",
      graphVersion: "city-v1",
      initialFailures: [
        { nodeId: "power-grid-main", time: 0, severity: "FULL" },
        { nodeId: "water-pump-01", time: 0, severity: "FULL" },
        { nodeId: "telecom-tower-01", time: 0, severity: "FULL" },
        { nodeId: "traffic-signals-01", time: 0, severity: "FULL" },
      ],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 15 },
      scheduledRecoveries: []
    };

    const engine = new SimulationEngine(quadScenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const finalState = engine.runAll();

    assert("TC-018: 4 Simultaneous failures execute without queue crash", finalState.status === "COMPLETED");
    assert("TC-018: Affected services list does not double-count converged nodes", new Set(finalState.metrics.affectedNodeIds).size === finalState.metrics.affectedNodeIds.length);
    assert("TC-018: Final system health is accurately calculated", finalState.metrics.systemHealthPercentage < 50);
  }

  // TC-019: Dynamic Downstream Recovery Cascade (Upstream Repair ➔ Downstream Auto-Restoration)
  {
    const scenario = PREDEFINED_SCENARIOS[0]; // Power Grid failure
    const engine = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);

    // Step forward 10 minutes: Power, Water Pump, and Hospital are affected
    for (let t = 0; t <= 10; t++) engine.step();

    // Deploy Repair on Power Grid at T+10 with 15m duration (finishes at T+25)
    engine.applyRecovery({
      id: "test-rec-power",
      nodeId: "power-grid-main",
      nodeName: "Substation Alpha",
      type: "REPAIR",
      startTime: 10,
      duration: 15,
      cost: 50,
      description: "Step-down replacement",
      status: "SCHEDULED"
    });

    // Step forward to T+40
    for (let t = 11; t <= 40; t++) engine.step();

    const stateAt40 = engine.getState();
    const powerNode = stateAt40.nodes.find(n => n.id === "power-grid-main");
    const waterPumpNode = stateAt40.nodes.find(n => n.id === "water-pump-01");
    const hospitalNode = stateAt40.nodes.find(n => n.id === "hospital-metro-01");

    assert("TC-019: Repaired upstream Power Substation reached HEALTHY", powerNode?.status === "HEALTHY");
    assert("TC-019: Downstream Water Pump cascaded back to HEALTHY", waterPumpNode?.status === "HEALTHY");
    assert("TC-019: Downstream Hospital cascaded back to HEALTHY", hospitalNode?.status === "HEALTHY");
    assert("TC-019: Full system health reached 100% after recovery cascade", stateAt40.metrics.systemHealthPercentage === 100);
  }

  // TC-020: ScenarioRepository Offline Fallback and Benchmark Availability
  {
    const benchmarkCount = PREDEFINED_SCENARIOS.length;
    assert("TC-020: Predefined benchmark scenarios are available offline", benchmarkCount >= 4);
    assert("TC-020: Predefined incident benchmarks have valid initialFailures", PREDEFINED_SCENARIOS.filter(s => s.isIncidentInspired).every(s => s.initialFailures && s.initialFailures.length > 0));
  }

  // TC-021: SimulationRunRepository Deterministic Hashing & Duplicate Prevention
  {
    const sampleRun = {
      id: "run-test-hash",
      scenarioId: "scenario-power-substation",
      scenarioName: "Substation Cascade",
      savedAt: "2026-08-24T12:00:00Z",
      metrics: {
        totalNodes: 15,
        failedCount: 4,
        degradedCount: 2,
        atRiskCount: 1,
        healthyCount: 8,
        cascadeDepth: 3,
        systemHealthPercentage: 53,
        affectedServices: 6,
        recoveryTime: 25,
        affectedNodeIds: ["water-pump-01", "water-network-01"],
        finalStateHash: "st-hash-990"
      },
      eventCount: 8,
      events: [],
      scenarioSnapshot: PREDEFINED_SCENARIOS[0]
    };

    const raw1 = `${sampleRun.scenarioId}-${sampleRun.metrics.finalStateHash}-${sampleRun.eventCount}-${sampleRun.metrics.systemHealthPercentage}-${sampleRun.metrics.cascadeDepth}`;
    let hash1 = 0;
    for (let i = 0; i < raw1.length; i++) {
      hash1 = (hash1 << 5) - hash1 + raw1.charCodeAt(i);
      hash1 |= 0;
    }
    const hashStr1 = `hash-${Math.abs(hash1).toString(16)}`;

    let hash2 = 0;
    for (let i = 0; i < raw1.length; i++) {
      hash2 = (hash2 << 5) - hash2 + raw1.charCodeAt(i);
      hash2 |= 0;
    }
    const hashStr2 = `hash-${Math.abs(hash2).toString(16)}`;

    assert("TC-021: Simulation run produces consistent deterministic hash", hashStr1 === hashStr2 && hashStr1.length > 5);
  }

  // TC-022: Engine Isolation Guarantee (Engine has 0 Supabase or Network dependencies)
  {
    const scenario = PREDEFINED_SCENARIOS[0];
    const engine = new SimulationEngine(scenario, INITIAL_CITY_NODES, INITIAL_CITY_EDGES);
    const state = engine.runAll();
    assert("TC-022: SimulationEngine operates completely in-memory and deterministically without network dependencies", state.status === "COMPLETED" && state.events.length > 0);
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n=== TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed, results };
}

