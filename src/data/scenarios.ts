import { Scenario } from '../types/scenario';

export const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: "scenario-power-substation",
    name: "Central Power Grid Substation Failure",
    category: "POWER",
    description: "Catastrophic transformer arc failure at Central Substation #01 at T+0. Cascades rapidly across North Water Intake pump, ITMS traffic network, cellular backbone, and Hospital Trauma Center.",
    graphVersion: "city-v1",
    isPredefined: true,
    isIncidentInspired: true,
    incidentReference: "Incident-Inspired: 2012 Northern Grid Overload & Transformer Trip",
    initialFailures: [
      {
        nodeId: "power-grid-main",
        time: 0,
        originId: "ORIGIN_POWER_GRID_MAIN",
        severity: "FULL",
        reason: "Severe transformer arc explosion & circuit tripping at Substation #01"
      }
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
      autoStopOnStabilization: true
    },
    scheduledRecoveries: []
  },
  {
    id: "scenario-dual-power-telecom",
    name: "Dual Disruption: Power Grid + Telecom Backbone Outage",
    category: "DUAL_FAILURE",
    description: "Simultaneous multi-infrastructure failure at T+0 affecting Power Grid and Core Telecom Tower. Tests multi-upstream dependency convergence at Emergency Dispatch and Hospital without double-counting affected services.",
    graphVersion: "city-v1",
    isPredefined: true,
    isIncidentInspired: true,
    incidentReference: "Incident-Inspired: Urban Excavation Fiber Severance + Substation Trip",
    initialFailures: [
      {
        nodeId: "power-grid-main",
        time: 0,
        originId: "ORIGIN_POWER_GRID",
        severity: "FULL",
        reason: "Grid overload cascading breaker trip"
      },
      {
        nodeId: "telecom-tower-01",
        time: 0,
        originId: "ORIGIN_TELECOM_FIBER",
        severity: "FULL",
        reason: "Core multi-duct fiber severance during municipal excavation"
      }
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
      autoStopOnStabilization: true
    },
    scheduledRecoveries: []
  },
  {
    id: "scenario-water-pump-failure",
    name: "North River Intake Turbine Breakdown",
    category: "WATER",
    description: "Mechanical turbine seizure at North Riverfront Intake. Disruption propagates down to City Water Distribution and degrades Hospital sterilization systems while electrical and telecom networks remain healthy.",
    graphVersion: "city-v1",
    isPredefined: true,
    isIncidentInspired: true,
    incidentReference: "Incident-Inspired: Municipal River Intake Turbine Seizure",
    initialFailures: [
      {
        nodeId: "water-pump-01",
        time: 0,
        originId: "ORIGIN_WATER_TURBINE",
        severity: "FULL",
        reason: "Mechanical impeller seizure at primary river intake"
      }
    ],
    parameters: {
      maxSimulationTime: 50,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 12,
      autoStopOnStabilization: true
    },
    scheduledRecoveries: []
  },
  {
    id: "scenario-monsoon-with-recovery",
    name: "Monsoon Grid Collapse with Early Auxiliary Backup",
    category: "WEATHER",
    description: "Severe urban thunderstorm causes initial power substation failure at T+0. An automated auxiliary diesel generator is pre-scheduled for North Water Pump at T+10, successfully halting the downstream medical cascade.",
    graphVersion: "city-v1",
    isPredefined: true,
    isIncidentInspired: true,
    incidentReference: "Incident-Inspired: 2021 Cyclone Storm Surge with Hospital Microgrid Intervention",
    initialFailures: [
      {
        nodeId: "power-grid-main",
        time: 0,
        originId: "ORIGIN_STORM_LIGHTNING",
        severity: "FULL",
        reason: "Lightning strike on high-voltage stepdown transformer"
      }
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 10,
      autoStopOnStabilization: true
    },
    scheduledRecoveries: [
      {
        id: "recovery-water-pump-backup",
        nodeId: "water-pump-01",
        nodeName: "North Intake Water Pump",
        type: "BACKUP_POWER",
        startTime: 10,
        duration: 5,
        cost: 20,
        description: "Engage auxiliary diesel turbine generator at intake station",
        status: "SCHEDULED"
      }
    ]
  },
  {
    id: "scenario-winter-freeze",
    name: "Sub-Zero Freeze: Staged Multi-Sector Disruption",
    category: "WEATHER",
    description: "Extreme freezing event causes Power Substation trip at T+0, followed by freeze-up at North Water Pump at T+5 and Sewage Lift Station at T+10.",
    graphVersion: "city-v1",
    isPredefined: true,
    isIncidentInspired: true,
    incidentReference: "Incident-Inspired: 2021 Texas Deep Freeze Multi-Utility Collapse",
    initialFailures: [
      {
        nodeId: "power-grid-main",
        time: 0,
        originId: "ORIGIN_FREEZE_GRID",
        severity: "FULL",
        reason: "Extreme freeze demand spike and generator trip"
      },
      {
        nodeId: "water-pump-01",
        time: 5,
        originId: "ORIGIN_PUMP_FREEZE",
        severity: "DEGRADED",
        reason: "Intake pipe freezing and cavitation"
      }
    ],
    parameters: {
      maxSimulationTime: 65,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
      autoStopOnStabilization: true
    },
    scheduledRecoveries: []
  },
  {
    id: "scenario-custom",
    name: "Custom Multi-Disruption Workspace",
    category: "CUSTOM",
    description: "Configure custom multiple initial failure points, assign failure severities, simulate propagation timings, and apply dynamic recovery interventions on-the-fly.",
    graphVersion: "city-v1",
    isPredefined: true,
    isIncidentInspired: false,
    initialFailures: [],
    parameters: {
      maxSimulationTime: 90,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
      autoStopOnStabilization: false
    },
    scheduledRecoveries: []
  }
];
