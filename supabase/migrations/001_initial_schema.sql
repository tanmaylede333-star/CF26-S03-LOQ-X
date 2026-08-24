-- ============================================================================
-- CASCADE CITY: INITIAL DATABASE SCHEMA (001_initial_schema.sql)
-- ============================================================================

-- 1. SCENARIOS TABLE
CREATE TABLE IF NOT EXISTS public.scenarios (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'CUSTOM',
    description TEXT,
    graph_version TEXT NOT NULL DEFAULT 'city-v1',
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    initial_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_recoveries JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_benchmark BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. SIMULATION RUNS TABLE (Audit History & Deterministic Replay)
CREATE TABLE IF NOT EXISTS public.simulation_runs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id TEXT REFERENCES public.scenarios(id) ON DELETE SET NULL,
    scenario_name TEXT NOT NULL,
    graph_version TEXT NOT NULL DEFAULT 'city-v1',
    initial_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    deterministic_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PERFORMANCE & LOOKUP INDEXES
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_is_benchmark ON public.scenarios(is_benchmark);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_user_id ON public.simulation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_scenario_id ON public.simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_created_at ON public.simulation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_hash ON public.simulation_runs(deterministic_hash);
