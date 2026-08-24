import { InfrastructureNode } from '../types/node';
import { DependencyEdge } from '../types/edge';

export const INITIAL_CITY_NODES: InfrastructureNode[] = [
  {
    id: "power-grid-main",
    code: "P01",
    name: "Central Power Substation #01",
    type: "POWER",
    zone: "Sector 1 — North Grid",
    criticality: "CRITICAL",
    status: "HEALTHY",
    recoveryTime: 25,
    position: { x: 480, y: 40 },
    coordinates: { lat: 19.0830, lng: 72.8620 },
    description: "High-voltage transmission hub powering North & Central sectors including primary pumps, comms, and medical hubs.",
    metrics: { load: 88, affectedCitizens: 450000, backupAvailable: false, backupActive: false }
  },
  {
    id: "water-pump-01",
    code: "W01",
    name: "North Intake Water Pump",
    type: "WATER",
    zone: "Sector 1 — Riverfront",
    criticality: "HIGH",
    status: "HEALTHY",
    recoveryTime: 15,
    position: { x: 180, y: 190 },
    coordinates: { lat: 19.0980, lng: 72.8710 },
    description: "Main intake turbine lifting raw water to treatment reservoirs. Totally dependent on 33kV electrical feed.",
    metrics: { load: 74, affectedCitizens: 320000, backupAvailable: true, backupActive: false }
  },
  {
    id: "water-network-01",
    code: "W02",
    name: "City Water Distribution Network",
    type: "WATER",
    zone: "Sector 2 — Central Corridor",
    criticality: "HIGH",
    status: "HEALTHY",
    recoveryTime: 12,
    position: { x: 180, y: 350 },
    coordinates: { lat: 19.0820, lng: 72.9050 },
    description: "Pressurized municipal pipeline supplying civic infrastructure, fire hydrants, and tertiary hospitals.",
    metrics: { load: 82, affectedCitizens: 320000, backupAvailable: false, backupActive: false }
  },
  {
    id: "traffic-signals-01",
    code: "T01",
    name: "Intelligent Traffic Control (ITMS)",
    type: "TRAFFIC",
    zone: "Sector 2 — Central Arterials",
    criticality: "MEDIUM",
    status: "HEALTHY",
    recoveryTime: 10,
    position: { x: 480, y: 190 },
    coordinates: { lat: 19.0890, lng: 72.8680 },
    description: "Automated adaptive traffic signal grid managing emergency green corridors and major intersections.",
    metrics: { load: 91, affectedCitizens: 180000, backupAvailable: true, backupActive: false }
  },
  {
    id: "telecom-tower-01",
    code: "T02",
    name: "Apex Telecom & 5G Backbone",
    type: "TELECOM",
    zone: "Sector 3 — East Heights",
    criticality: "HIGH",
    status: "HEALTHY",
    recoveryTime: 20,
    position: { x: 780, y: 190 },
    coordinates: { lat: 19.0770, lng: 72.9120 },
    description: "Core packet exchange & microwave transmission tower handling emergency 112 data and civic telemetry.",
    metrics: { load: 80, affectedCitizens: 520000, backupAvailable: true, backupActive: false }
  },
  {
    id: "sewage-treatment-01",
    code: "S01",
    name: "South Effluent Treatment Plant",
    type: "SEWAGE",
    zone: "Sector 4 — Industrial South",
    criticality: "MEDIUM",
    status: "HEALTHY",
    recoveryTime: 18,
    position: { x: 1040, y: 190 },
    coordinates: { lat: 19.0380, lng: 72.8850 },
    description: "Wastewater processing and stormwater drainage station.",
    metrics: { load: 60, affectedCitizens: 120000, backupAvailable: false, backupActive: false }
  },
  {
    id: "emergency-dispatch-01",
    code: "E01",
    name: "Unified Emergency Dispatch (112)",
    type: "EMERGENCY",
    zone: "Sector 2 — Civic Plaza",
    criticality: "CRITICAL",
    status: "HEALTHY",
    recoveryTime: 15,
    position: { x: 780, y: 350 },
    coordinates: { lat: 19.0840, lng: 72.8760 },
    description: "Central command routing police, ambulance, and disaster response units across JanNagar.",
    metrics: { load: 65, affectedCitizens: 650000, backupAvailable: true, backupActive: false }
  },
  {
    id: "fuel-station-01",
    code: "F01",
    name: "Strategic Fuel & Energy Depot",
    type: "FUEL",
    zone: "Sector 4 — Logistics Park",
    criticality: "MEDIUM",
    status: "HEALTHY",
    recoveryTime: 14,
    position: { x: 1040, y: 350 },
    coordinates: { lat: 19.0550, lng: 72.8380 },
    description: "Automated diesel and gasoline pumping reserve for emergency vehicles, buses, and backup generators.",
    metrics: { load: 50, affectedCitizens: 90000, backupAvailable: true, backupActive: false }
  },
  {
    id: "hospital-metro-01",
    code: "H01",
    name: "JanNagar Apex Referral Hospital",
    type: "HOSPITAL",
    zone: "Sector 2 — Healthcare District",
    criticality: "CRITICAL",
    status: "HEALTHY",
    recoveryTime: 20,
    position: { x: 340, y: 490 },
    coordinates: { lat: 19.0910, lng: 72.8820 },
    description: "1,200-bed trauma center with ICUs and surgical suites requiring uninterrupted power, water, and dispatch lines.",
    metrics: { load: 95, affectedCitizens: 45000, backupAvailable: true, backupActive: false }
  },
  {
    id: "public-transport-01",
    code: "PT01",
    name: "City Metro & Transit Fleet Hub",
    type: "TRANSPORT",
    zone: "Sector 2 — Transit Terminal",
    criticality: "MEDIUM",
    status: "HEALTHY",
    recoveryTime: 16,
    position: { x: 620, y: 490 },
    coordinates: { lat: 19.0680, lng: 72.8590 },
    description: "Electric metro rail lines and municipal bus fleet servicing 300k daily commuters.",
    metrics: { load: 85, affectedCitizens: 300000, backupAvailable: false, backupActive: false }
  },
  {
    id: "municipal-control-01",
    code: "M01",
    name: "JanNagar Integrated Command Center (ICCC)",
    type: "MUNICIPAL",
    zone: "Sector 2 — Secretariat",
    criticality: "HIGH",
    status: "HEALTHY",
    recoveryTime: 15,
    position: { x: 480, y: 640 },
    coordinates: { lat: 19.0850, lng: 72.8870 },
    description: "Master civic resilience center coordinating citywide disaster protocols and inter-agency recovery.",
    metrics: { load: 70, affectedCitizens: 800000, backupAvailable: true, backupActive: false }
  },
  {
    id: "municipal-control-02",
    code: "M02",
    name: "North Civic Secretariat & Data Center",
    type: "MUNICIPAL",
    zone: "Sector 1 — Powai North",
    criticality: "HIGH",
    status: "HEALTHY",
    recoveryTime: 15,
    position: { x: 480, y: 780 },
    coordinates: { lat: 19.1060, lng: 72.8880 },
    description: "Secondary civic failover repository and cloud resilience hub.",
    metrics: { load: 62, affectedCitizens: 420000, backupAvailable: true, backupActive: false }
  },
  {
    id: "hospital-trauma-02",
    code: "H02",
    name: "East Suburban Trauma Center",
    type: "HOSPITAL",
    zone: "Sector 3 — Ghatkopar East",
    criticality: "HIGH",
    status: "HEALTHY",
    recoveryTime: 18,
    position: { x: 340, y: 640 },
    coordinates: { lat: 19.0790, lng: 72.8990 },
    description: "Secondary trauma center supporting eastern urban population.",
    metrics: { load: 80, affectedCitizens: 120000, backupAvailable: true, backupActive: false }
  },
  {
    id: "sewage-outfall-02",
    code: "S02",
    name: "East Stormwater Outfall & Siphon",
    type: "SEWAGE",
    zone: "Sector 3 — Mankhurd Marsh",
    criticality: "MEDIUM",
    status: "HEALTHY",
    recoveryTime: 15,
    position: { x: 1040, y: 490 },
    coordinates: { lat: 19.0520, lng: 72.9080 },
    description: "Stormwater runoff management station protecting low-lying eastern districts.",
    metrics: { load: 55, affectedCitizens: 180000, backupAvailable: false, backupActive: false }
  }
];

export const INITIAL_CITY_EDGES: DependencyEdge[] = [
  {
    id: "edge-power-to-water-pump",
    source: "power-grid-main",
    target: "water-pump-01",
    dependencyType: "POWER",
    propagationDelay: 5,
    failureImpact: "FAIL",
    description: "Water pump motors cease immediately when high-voltage grid feed is lost."
  },
  {
    id: "edge-water-pump-to-network",
    source: "water-pump-01",
    target: "water-network-01",
    dependencyType: "WATER",
    propagationDelay: 5,
    failureImpact: "FAIL",
    description: "Main line pressure drops after intake pump shutdown."
  },
  {
    id: "edge-water-to-hospital",
    source: "water-network-01",
    target: "hospital-metro-01",
    dependencyType: "WATER",
    propagationDelay: 5,
    failureImpact: "DEGRADE",
    description: "Hospital sanitation, sterilization, and cooling towers degrade without municipal water."
  },
  {
    id: "edge-power-to-traffic",
    source: "power-grid-main",
    target: "traffic-signals-01",
    dependencyType: "POWER",
    propagationDelay: 4,
    failureImpact: "FAIL",
    description: "Signal controllers and detection cameras go dark."
  },
  {
    id: "edge-power-to-telecom",
    source: "power-grid-main",
    target: "telecom-tower-01",
    dependencyType: "POWER",
    propagationDelay: 5,
    failureImpact: "FAIL",
    description: "Base station switchboards fail once local UPS capacitors deplete."
  },
  {
    id: "edge-power-to-sewage",
    source: "power-grid-main",
    target: "sewage-treatment-01",
    dependencyType: "POWER",
    propagationDelay: 8,
    failureImpact: "DEGRADE",
    description: "Aeration pumps and filtration beds lose primary power."
  },
  {
    id: "edge-telecom-to-emergency",
    source: "telecom-tower-01",
    target: "emergency-dispatch-01",
    dependencyType: "NETWORK",
    propagationDelay: 4,
    failureImpact: "FAIL",
    description: "Inability to receive incoming 112 emergency calls or dispatch field units."
  },
  {
    id: "edge-power-to-emergency",
    source: "power-grid-main",
    target: "emergency-dispatch-01",
    dependencyType: "POWER",
    propagationDelay: 6,
    failureImpact: "DEGRADE",
    description: "Dispatch console screens lose grid supply."
  },
  {
    id: "edge-traffic-to-hospital",
    source: "traffic-signals-01",
    target: "hospital-metro-01",
    dependencyType: "OPERATIONAL",
    propagationDelay: 6,
    failureImpact: "DEGRADE",
    description: "Gridlock delays emergency ambulance arrivals to hospital trauma ward."
  },
  {
    id: "edge-emergency-to-hospital",
    source: "emergency-dispatch-01",
    target: "hospital-metro-01",
    dependencyType: "OPERATIONAL",
    propagationDelay: 5,
    failureImpact: "DEGRADE",
    description: "Lack of triage telemetry slows incoming critical patient admissions."
  },
  {
    id: "edge-power-to-transport",
    source: "power-grid-main",
    target: "public-transport-01",
    dependencyType: "POWER",
    propagationDelay: 5,
    failureImpact: "FAIL",
    description: "Overhead catenary power lost, halting metro rail transit."
  },
  {
    id: "edge-traffic-to-transport",
    source: "traffic-signals-01",
    target: "public-transport-01",
    dependencyType: "OPERATIONAL",
    propagationDelay: 4,
    failureImpact: "DEGRADE",
    description: "Bus fleets congested in unmanaged road intersections."
  },
  {
    id: "edge-power-to-fuel",
    source: "power-grid-main",
    target: "fuel-station-01",
    dependencyType: "POWER",
    propagationDelay: 10,
    failureImpact: "DEGRADE",
    description: "Automated dispenser pumps switch to manual hand valves."
  },
  {
    id: "edge-fuel-to-transport",
    source: "fuel-station-01",
    target: "public-transport-01",
    dependencyType: "OPERATIONAL",
    propagationDelay: 12,
    failureImpact: "DEGRADE",
    description: "Bus depot refueling slowed down."
  },
  {
    id: "edge-hospital-to-municipal",
    source: "hospital-metro-01",
    target: "municipal-control-01",
    dependencyType: "OPERATIONAL",
    propagationDelay: 5,
    failureImpact: "DEGRADE",
    description: "Crisis escalation reported to city administration."
  },
  {
    id: "edge-emergency-to-municipal",
    source: "emergency-dispatch-01",
    target: "municipal-control-01",
    dependencyType: "OPERATIONAL",
    propagationDelay: 5,
    failureImpact: "DEGRADE",
    description: "Emergency incident volume exceeds capacity, triggering civic emergency."
  },
  {
    id: "edge-municipal-to-sec-secretariat",
    source: "municipal-control-01",
    target: "municipal-control-02",
    dependencyType: "NETWORK",
    propagationDelay: 4,
    failureImpact: "DEGRADE",
    description: "Failover synchronisation to secondary secretariat."
  },
  {
    id: "edge-water-to-hospital-02",
    source: "water-network-01",
    target: "hospital-trauma-02",
    dependencyType: "WATER",
    propagationDelay: 5,
    failureImpact: "DEGRADE",
    description: "East trauma hospital potable water pressure drop."
  },
  {
    id: "edge-power-to-sewage-02",
    source: "power-grid-main",
    target: "sewage-outfall-02",
    dependencyType: "POWER",
    propagationDelay: 8,
    failureImpact: "DEGRADE",
    description: "East stormwater pump electrical feed loss."
  }
];
