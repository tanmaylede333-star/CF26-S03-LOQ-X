# CASCADE COMMAND // Urban Infrastructure Cascade Simulator (S-03)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e?logo=supabase)](https://supabase.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS%201.9-199900?logo=leaflet)](https://leafletjs.com/)
[![Tests](https://img.shields.io/badge/Tests-67%20Passed%20%7C%200%20Failed-success)](#automated-testing-suite)
[![Security](https://img.shields.io/badge/Security-Hardened%20RLS%20%2B%20CSP-emerald)](#security--authorization-architecture)

> **CASCADE** is a deterministic, physics-informed urban infrastructure cascade simulator and GIS mission-control platform. It models, visualizes, and mitigates multi-hop cascading failures across interconnected power grids, municipal water networks, telecommunications, trauma hospitals, transportation systems, and emergency services.

---

## 📸 Key Features & Capabilities

### ⚡ 1. Deterministic Multi-Sector Simulation Engine
* **Physics-Informed Discrete-Event Propagation**: Simulates multi-origin failure propagation with configurable delay multipliers ($0.1\times - 10.0\times$) and virtual minute timestamps.
* **Causal Attribution Tracking**: Nodes track distinct root-cause origins across converged dependencies, ensuring failure cascades never lose provenance.
* **Zero-Latency In-Memory Execution**: Entire cascade graphs compute deterministically without external network roundtrips, producing verifiable SHA-256 state hashes.

### 🗺️ 2. Dual-Layer Visualization (Topological Graph + Geospatial GIS)
* **Interactive Node-Link Topological Graph**: Powered by `@xyflow/react` with custom sector styling (Energy, Water, Telecom, Medical, Mobility, Civil Defense).
* **Leaflet Geospatial Map**: Geospatial coordinates mapped across city sectors with layer switching:
  * **DARK MATTER** (CartoDB Vector Dark)
  * **SATELLITE** (ArcGIS High-Resolution World Imagery)
  * **TACTICAL** (High-Contrast Night Grid)
* **Blast Radius & Downstream Highlighting**: Click any infrastructure asset to visualize upstream power sources and downstream failure paths.

### 🛡️ 3. Resilience Advisor & Counterfactual Evaluator
* **Parallel Strategy Benchmarking**: Runs baseline ("Strategy Alpha") vs proposed interventions ("Strategy Beta") in parallel in memory.
* **Multi-Criteria Optimization Scoring**:
  $$\text{Score} = \left(\frac{\Delta \text{Affected}}{\text{Max}} \times 40\%\right) + \left(\frac{\Delta \text{Recovery Time}}{\text{Max}} \times 40\%\right) + \left(\frac{\Delta \text{Depth}}{\text{Max}} \times 20\%\right)$$
* **1-Click Field Procedure Deployment**: Directly injects auxiliary generators, microgrid islanding, or mobile transformers into active simulation runs.

### 🧪 4. Incident Scenario Lab & Natural Language Synthesizer
* **Historical Incident Benchmarks**: Pre-loaded with disaster models (2003 Northeast Blackout, 2021 Texas Winter Storm Uri, Monsoon Inundations).
* **AI Scenario Synthesizer**: Converts natural language disaster prompts (*"Heatwave causes grid overload in North Substation and trips water pump"*) into validated graph failure schedules.
* **Custom Scenario Builder**: Create, parameterize, and save custom disaster models with multi-point failure injection.

### 📊 5. Causal Impact & Post-Incident Forensics
* **Interactive Event Timeline & Time Scrubber**: Step forward, jump to timestamps, or scrub across cascade progression.
* **Downstream Outage Sankey Diagrams**: Track dependency failure distribution across critical city sectors.
* **Deterministic Run Replay & Comparator**: Compare two simulation runs side-by-side to verify intervention impact and hash parity.

---

## 🔒 Security & Authorization Architecture

CASCADE incorporates a defense-in-depth security model:

* **Server-Signed Admin Verification ([`AdminGuard.ts`](file:///c:/Users/tanma/Desktop/cascade/src/services/AdminGuard.ts))**: Administrative routes (`/admin`, `/admin/*`) require server-signed JWT claims (`app_metadata.role = 'admin'`). URL parameter tampering (`?role=admin`) and `localStorage` manipulation are strictly rejected with `403 Forbidden`.
* **Database Row Level Security (RLS)**: PostgreSQL policies isolate user scenarios and simulation runs (`auth.uid() = user_id`), preventing cross-tenant IDOR attacks and locking public benchmarks.
* **Schema Validation & XSS Sanitization ([`SecurityValidator.ts`](file:///c:/Users/tanma/Desktop/cascade/src/services/SecurityValidator.ts))**: Sanitizes user inputs, enforces payload bounds ($<1\text{MB}$), strips prototype pollution attempts (`__proto__`), and neutralizes script injection.
* **Token Bucket Rate Limiting ([`RateLimiter.ts`](file:///c:/Users/tanma/Desktop/cascade/src/services/RateLimiter.ts))**: Protects AI synthesis, scenario saving, and simulation run creation from burst abuse.
* **Content Security Policy (CSP)**: Restricts script, style, and tile-layer network connections in `index.html` and `vite.config.ts`.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/), Custom Mission-Control Dark Theme, Glassmorphism |
| **Graph & Flow Engine** | [@xyflow/react](https://reactflow.dev/) (React Flow) |
| **Geospatial & Mapping** | [Leaflet](https://leafletjs.com/), [React Leaflet](https://react-leaflet.js.org/), CartoDB, ArcGIS |
| **Data Visualization** | [Recharts](https://recharts.org/), Lucide React Icons, Canvas Confetti |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15 with Row Level Security) |
| **Testing Framework** | [TSX](https://github.com/privatenumber/tsx) Deterministic Simulation & Security Test Runner |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/tanmaylede333-star/CF26-S03-LOQ-X.git
cd CF26-S03-LOQ-X
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Note: If Supabase credentials are not supplied, CASCADE automatically operates in full offline-resilient mode using `localStorage` caching).*

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 🧪 Automated Testing Suite

CASCADE includes a rigorous automated test suite covering simulation mathematics, graph integrity, deterministic replay, recovery cascade propagation, and cybersecurity controls:

```bash
npm test
```

### Test Suite Results (67/67 Tests Passing)
```text
=== RUNNING URBAN INFRASTRUCTURE CASCADE SIMULATOR TEST SUITE ===
✅ TC-001: Single Failure Propagation (Power -> Pump -> Water -> Hospital)
✅ TC-002: Cascade Depth Calculation (Depth >= 3)
✅ TC-003: Dual Disruption Shared Dependent Resolution
✅ TC-004: Convergence Deduplication in Affected Services Count
✅ TC-005: Multi-hop Cascade Delay Timing Buffering
✅ TC-006: Affected Services Metric excludes Root Node
✅ TC-007: Target Node Backup Power Restoration & Lifecycle
✅ TC-008: Simultaneous Multiple Failures Array Batching
✅ TC-009: Deterministic Run Replay & State Hash Parity
✅ TC-010: Graph Validator Cyclic Dependency Detection
✅ TC-011: Virtual Minute Timeline Stepwise Simulation
✅ TC-012: Converged Dependent Node Causal Attribution
✅ TC-013: Resilience Advisor Multi-Criteria Optimization Scoring
✅ TC-014: Constraint Check (Power Downstream Node requires Upstream Active)
✅ TC-015: Propagation Delay Multiplier Calibration
✅ TC-016: Auto-Pause on Critical Hospital / Water Breach
✅ TC-017: Procedural GIS Coordinate Bounds Verification
✅ TC-018: 4-Point Simultaneous Crisis Injection Execution
✅ TC-019: Full Recovery Cascade (Substation -> Pump -> Hospital -> 100% Health)
✅ TC-020: Offline Predefined Benchmark Scenario Availability
✅ TC-021: Deterministic Run Hashing Output Parity
✅ TC-022: In-Memory Zero-Network Engine Execution

=== RUNNING CASCADE CYBERSECURITY & HARDENING TEST SUITE ===
✅ SEC-001: Anonymous access to /admin is denied with 401
✅ SEC-002: Invalid UUID user session is rejected by repository
✅ SEC-003: SQL injection string is rejected as invalid UUID
✅ SEC-004: Normal user access to /admin is rejected with 403
✅ SEC-005: Normal user access to /admin/users is rejected with 403
✅ SEC-006: Normal user query parameter ?role=admin spoof is rejected with 403
✅ SEC-007: Verified admin user with server claim is ALLOWED with 200
✅ SEC-008: Scenario validator strips unprivileged is_benchmark flag
✅ SEC-009: Parameters with NaN/Infinity/Negatives are rejected and bounded
✅ SEC-010: Prototype pollution payloads (__proto__) are strictly rejected
✅ SEC-011: Oversized strings are strictly bounded to max length (120)
✅ SEC-012: <script> tags are neutralized to HTML entities
✅ SEC-013: javascript: URI and unquoted tags are neutralized
✅ SEC-014: SQL injection single quotes and hyphens are escaped safely
✅ SEC-015: Initial AI requests within limit are allowed
✅ SEC-016: Burst AI synthesis requests exceeding limit are THROTTLED
✅ SEC-017: Malformed non-JSON import string is safely rejected
✅ SEC-018: Valid JSON structure is safely parsed without eval()
✅ SEC-019: Storage sanitizer clears unauthorized local credentials
✅ SEC-020: Missing authentication token for /admin/database returns 401
✅ SEC-021: Negative recovery duration is bounded to safe non-negative integer
✅ SEC-022: Prompt injection with script tag is completely escaped
✅ SEC-023: Excessive initial failures list (>50) is bounded with validation error
✅ SEC-024: Non-UUID userId string rejected in repository operations
✅ SEC-025: Simulation time exceeding 1440m bounded to safe default
✅ SEC-026: Graph version metadata string is sanitized against HTML markup
✅ SEC-027: Deterministic run hash is repeatable and non-empty

==================================================
GRAND TOTAL: 67 PASSED, 0 FAILED
==================================================
```

---

## 📂 Project Architecture

```text
cascade/
├── src/
│   ├── components/
│   │   ├── advisor/          # Resilience Advisor modal & recommendation cards
│   │   ├── auth/             # Supabase Authentication modal
│   │   ├── failure/          # Failure injection modal & manual disruption triggers
│   │   ├── graph/            # React Flow interactive network & node components
│   │   ├── layout/           # Sidebar, mission top bar, navigation headers
│   │   ├── map/              # Leaflet GIS Map & tactical layer switcher
│   │   ├── recovery/         # Recovery console modal & field procedure dispatch
│   │   └── views/            # Simulator, Scenarios, Analytics, Advisor, Settings
│   ├── data/                 # City graph baseline (nodes/edges) & incident benchmarks
│   ├── engine/               # SimulationEngine, ResilienceAdvisor, validator, test runners
│   ├── hooks/                # useSimulation state controller & playback loop
│   ├── lib/                  # Supabase client & environment initialization
│   ├── services/             # SecurityValidator, AdminGuard, RateLimiter, Repositories
│   ├── styles/               # Design tokens, CSS variables, Leaflet dark styles
│   ├── types/                # TypeScript interfaces (Node, Edge, Scenario, Event, Metrics)
│   └── App.tsx               # Root application shell & layout coordinator
├── supabase/
│   └── migrations/           # 001 Schema, 002 User RLS, 003 Benchmarks, 004 Security
├── index.html                # Application entrypoint & Content Security Policy
├── runTests.ts               # Automated CLI test runner
├── vite.config.ts            # Vite configuration & security response headers
└── package.json              # Project dependencies & npm scripts
```

---

## 📜 License

This project is licensed under the **MIT License**.