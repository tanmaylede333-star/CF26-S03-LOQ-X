-- ============================================================================
-- CASCADE CITY: USER-SCOPED ROW LEVEL SECURITY (002_user_scoped_rls.sql)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

-- 1. SCENARIOS POLICIES
-- Public benchmarks and user's own scenarios can be viewed
CREATE POLICY "Users can view public benchmarks or own scenarios"
    ON public.scenarios
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_benchmark = true
        OR user_id IS NULL
    );

-- Authenticated users can insert their own scenarios
CREATE POLICY "Users can insert their own scenarios"
    ON public.scenarios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own scenarios
CREATE POLICY "Users can update their own scenarios"
    ON public.scenarios
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own scenarios
CREATE POLICY "Users can delete their own scenarios"
    ON public.scenarios
    FOR DELETE
    USING (auth.uid() = user_id);

-- 2. SIMULATION RUNS POLICIES
-- Users can view only their own simulation runs
CREATE POLICY "Users can view own simulation runs"
    ON public.simulation_runs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own simulation runs (or anonymous local sessions if user_id is null)
CREATE POLICY "Users can insert own simulation runs"
    ON public.simulation_runs
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Users can delete their own simulation runs
CREATE POLICY "Users can delete own simulation runs"
    ON public.simulation_runs
    FOR DELETE
    USING (auth.uid() = user_id);
