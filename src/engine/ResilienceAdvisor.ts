import { Scenario } from '../types/scenario';
import { InfrastructureNode } from '../types/node';
import { DependencyEdge } from '../types/edge';
import { RecoveryAction } from '../types/recovery';
import { SimulationMetrics } from '../types/simulation';
import { SimulationEngine } from './SimulationEngine';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../data/cityGraph';

export interface CandidateIntervention {
  id: string;
  name: string;
  targetNodeId: string;
  targetNodeName: string;
  type: "BACKUP_POWER" | "REPAIR" | "ISOLATE" | "REROUTE_NETWORK";
  triggerTime: number; // Virtual minute T+XX
  duration: number;
  cost: number;
  description: string;
  action: RecoveryAction;
}

export interface AdvisorEvaluationResult {
  candidate: CandidateIntervention;
  baselineMetrics: SimulationMetrics;
  candidateMetrics: SimulationMetrics;
  depthReduction: number;
  affectedServicesReduction: number;
  recoveryTimeReduction: number;
  healthImprovement: number;
  overallScore: number; // 0 - 100
  impactReductionPercentage: number;
  rank: number;
  rationale: string;
}

export interface ResilienceAdvisorReport {
  scenarioId: string;
  scenarioName: string;
  baselineMetrics: SimulationMetrics;
  evaluations: AdvisorEvaluationResult[];
  topRecommendation: AdvisorEvaluationResult | null;
  timestamp: string;
}

export class ResilienceAdvisor {
  /**
   * Deterministic pool of resilience intervention candidates for urban infrastructure.
   */
  public static getCandidatePool(nodes: InfrastructureNode[]): CandidateIntervention[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    return [
      {
        id: "cand-backup-water-pump",
        name: "North Intake Auxiliary Diesel Turbine",
        targetNodeId: "water-pump-01",
        targetNodeName: nodeMap.get("water-pump-01")?.name || "North Intake Water Pump",
        type: "BACKUP_POWER",
        triggerTime: 5,
        duration: 5,
        cost: 25,
        description: "Engage automatic 500kVA auxiliary diesel turbine at North Water Intake station within 5 minutes of primary power disruption.",
        action: {
          id: "action-advisor-water-backup",
          nodeId: "water-pump-01",
          nodeName: "North Intake Water Pump",
          type: "BACKUP_POWER",
          startTime: 5,
          duration: 5,
          cost: 25,
          description: "Auxiliary diesel turbine generator engaged at North Water Pump",
          status: "SCHEDULED",
        }
      },
      {
        id: "cand-isolate-hospital",
        name: "Hospital Rapid Microgrid Islanding",
        targetNodeId: "hospital-metro-01",
        targetNodeName: nodeMap.get("hospital-metro-01")?.name || "Metro Hospital Trauma Center",
        type: "ISOLATE",
        triggerTime: 3,
        duration: 0,
        cost: 15,
        description: "Isolate Hospital Trauma Center into independent microgrid circuit breaker mode to prevent electrical/water brownout cascade.",
        action: {
          id: "action-advisor-hospital-iso",
          nodeId: "hospital-metro-01",
          nodeName: "Metro Hospital Trauma Center",
          type: "ISOLATE",
          startTime: 3,
          duration: 0,
          cost: 15,
          description: "Hospital isolated into microgrid island mode",
          status: "SCHEDULED",
        }
      },
      {
        id: "cand-backup-telecom",
        name: "Cellular Backbone Battery Reserve Activation",
        targetNodeId: "telecom-tower-01",
        targetNodeName: nodeMap.get("telecom-tower-01")?.name || "Central Telecom Tower & Fiber Hub",
        type: "BACKUP_POWER",
        triggerTime: 5,
        duration: 4,
        cost: 20,
        description: "Switch Central Telecom Tower to uninterrupted lithium-iron-phosphate (LFP) energy storage bank at T+5.",
        action: {
          id: "action-advisor-telecom-backup",
          nodeId: "telecom-tower-01",
          nodeName: "Central Telecom Tower & Fiber Hub",
          type: "BACKUP_POWER",
          startTime: 5,
          duration: 4,
          cost: 20,
          description: "Auxiliary UPS battery reserve activated for Telecom Hub",
          status: "SCHEDULED",
        }
      },
      {
        id: "cand-repair-substation-rapid",
        name: "Emergency Substation Rapid Transformer By-Pass",
        targetNodeId: "power-grid-main",
        targetNodeName: nodeMap.get("power-grid-main")?.name || "Central Power Substation #01",
        type: "REPAIR",
        triggerTime: 6,
        duration: 10,
        cost: 40,
        description: "Dispatch utility rapid-response crews to switch Central Substation to mobile step-down transformer substation by T+16.",
        action: {
          id: "action-advisor-substation-repair",
          nodeId: "power-grid-main",
          nodeName: "Central Power Substation #01",
          type: "REPAIR",
          startTime: 6,
          duration: 10,
          cost: 40,
          description: "Mobile rapid step-down transformer deployed at Substation #01",
          status: "SCHEDULED",
        }
      },
      {
        id: "cand-isolate-emergency-dispatch",
        name: "Emergency Dispatch Automated Failover",
        targetNodeId: "emergency-dispatch-01",
        targetNodeName: nodeMap.get("emergency-dispatch-01")?.name || "Emergency Dispatch (112 / EMS)",
        type: "ISOLATE",
        triggerTime: 4,
        duration: 0,
        cost: 15,
        description: "Isolate emergency dispatch systems to satellite uplinks and local backup power to preserve public safety dispatch.",
        action: {
          id: "action-advisor-dispatch-iso",
          nodeId: "emergency-dispatch-01",
          nodeName: "Emergency Dispatch (112 / EMS)",
          type: "ISOLATE",
          startTime: 4,
          duration: 0,
          cost: 15,
          description: "Emergency Dispatch isolated to satellite failover mode",
          status: "SCHEDULED",
        }
      },
      {
        id: "cand-backup-traffic",
        name: "ITMS Traffic Junction Solar-Battery Inverter",
        targetNodeId: "traffic-signals-01",
        targetNodeName: nodeMap.get("traffic-signals-01")?.name || "ITMS Traffic Control Junction",
        type: "BACKUP_POWER",
        triggerTime: 4,
        duration: 4,
        cost: 10,
        description: "Engage rooftop solar-battery inverters across major corridor traffic controllers to prevent gridlock.",
        action: {
          id: "action-advisor-traffic-backup",
          nodeId: "traffic-signals-01",
          nodeName: "ITMS Traffic Control Junction",
          type: "BACKUP_POWER",
          startTime: 4,
          duration: 4,
          cost: 10,
          description: "Solar-battery inverter engaged for Traffic Junction",
          status: "SCHEDULED",
        }
      },
    ];
  }

  /**
   * Evaluates all candidate interventions using the deterministic Simulation Engine.
   */
  public static evaluateScenario(
    scenario: Scenario,
    nodes: InfrastructureNode[] = INITIAL_CITY_NODES,
    edges: DependencyEdge[] = INITIAL_CITY_EDGES
  ): ResilienceAdvisorReport {
    // 1. Run Baseline (No recovery actions)
    const baselineScenario: Scenario = {
      ...scenario,
      id: `${scenario.id}-advisor-baseline`,
      scheduledRecoveries: [],
    };
    const baselineEngine = new SimulationEngine(baselineScenario, nodes, edges);
    const baselineResult = baselineEngine.runAll();
    const baselineMetrics = baselineResult.metrics;

    const candidatePool = this.getCandidatePool(nodes);
    const evaluations: AdvisorEvaluationResult[] = [];

    // 2. Evaluate each candidate deterministically
    for (const candidate of candidatePool) {
      const candidateScenario: Scenario = {
        ...scenario,
        id: `${scenario.id}-adv-${candidate.id}`,
        scheduledRecoveries: [candidate.action],
      };

      const engine = new SimulationEngine(candidateScenario, nodes, edges);
      const result = engine.runAll();
      const candMetrics = result.metrics;

      // Delta calculations
      const depthDelta = Math.max(0, baselineMetrics.cascadeDepth - candMetrics.cascadeDepth);
      const affectedDelta = Math.max(0, baselineMetrics.affectedServices - candMetrics.affectedServices);
      const recoveryTimeDelta = Math.max(0, (baselineMetrics.recoveryTime || 45) - (candMetrics.recoveryTime || 20));
      const healthDelta = Math.max(0, candMetrics.systemHealthPercentage - baselineMetrics.systemHealthPercentage);

      // Scoring formula:
      // 40% affected service reduction + 40% recovery time reduction + 20% cascade depth reduction
      const maxPossibleAffected = Math.max(1, baselineMetrics.affectedServices);
      const maxPossibleRecovery = Math.max(1, baselineMetrics.recoveryTime || 40);
      const maxPossibleDepth = Math.max(1, baselineMetrics.cascadeDepth);

      const affectedScore = (affectedDelta / maxPossibleAffected) * 40;
      const recoveryScore = (recoveryTimeDelta / maxPossibleRecovery) * 40;
      const depthScore = (depthDelta / maxPossibleDepth) * 20;

      const overallScore = Math.min(100, Math.round(affectedScore + recoveryScore + depthScore));
      const impactReductionPercentage = Math.min(100, Math.round(
        ((affectedDelta / maxPossibleAffected) * 0.5 + (depthDelta / maxPossibleDepth) * 0.5) * 100
      ));

      let rationale = "";
      if (affectedDelta > 0 && depthDelta > 0) {
        rationale = `Prevents ${affectedDelta} downstream service outage(s) and halts cascade propagation ${depthDelta} hop(s) earlier.`;
      } else if (affectedDelta > 0) {
        rationale = `Protects ${affectedDelta} downstream critical service(s) from cascade degradation.`;
      } else if (recoveryTimeDelta > 0) {
        rationale = `Accelerates total system stabilization and recovery by ${recoveryTimeDelta} simulated minutes.`;
      } else {
        rationale = `Stabilizes local node ${candidate.targetNodeName} with localized resilience impact.`;
      }

      evaluations.push({
        candidate,
        baselineMetrics,
        candidateMetrics: candMetrics,
        depthReduction: depthDelta,
        affectedServicesReduction: affectedDelta,
        recoveryTimeReduction: recoveryTimeDelta,
        healthImprovement: healthDelta,
        overallScore,
        impactReductionPercentage,
        rank: 0,
        rationale,
      });
    }

    // Sort by overallScore descending, then by affectedServicesReduction descending
    evaluations.sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      return b.affectedServicesReduction - a.affectedServicesReduction;
    });

    // Assign ranks
    evaluations.forEach((evalResult, index) => {
      evalResult.rank = index + 1;
    });

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      baselineMetrics,
      evaluations,
      topRecommendation: evaluations[0] || null,
      timestamp: new Date().toISOString(),
    };
  }
}
