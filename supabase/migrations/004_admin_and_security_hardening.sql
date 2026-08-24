-- ============================================================================
-- CASCADE CITY: SECURITY HARDENING & ADMIN ACCESS CONTROL (004_admin_and_security_hardening.sql)
-- ============================================================================

-- 1. Ensure RLS is active on all core tables
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy permissive policies
DROP POLICY IF EXISTS "Users can view public benchmarks or own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON public.scenarios;

DROP POLICY IF EXISTS "Users can view own simulation runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "Users can insert own simulation runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "Users can delete own simulation runs" ON public.simulation_runs;

-- 3. HELPER FUNCTION: Verify Administrator Server JWT Claim
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SCENARIOS ROW LEVEL SECURITY POLICIES

-- (a) SELECT: Users can view public benchmarks OR scenarios they own
CREATE POLICY "scenarios_select_policy"
    ON public.scenarios
    FOR SELECT
    USING (
        is_benchmark = true
        OR user_id = auth.uid()
        OR public.is_admin()
    );

-- (b) INSERT: Authenticated users can insert their own scenarios (CANNOT set is_benchmark=true unless admin)
CREATE POLICY "scenarios_insert_policy"
    ON public.scenarios
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_benchmark = false)
        OR public.is_admin()
    );

-- (c) UPDATE: Users can only update their own scenarios (CANNOT alter benchmarks or user_id)
CREATE POLICY "scenarios_update_policy"
    ON public.scenarios
    FOR UPDATE
    USING (
        (auth.uid() = user_id AND is_benchmark = false)
        OR public.is_admin()
    )
    WITH CHECK (
        (auth.uid() = user_id AND is_benchmark = false)
        OR public.is_admin()
    );

-- (d) DELETE: Users can only delete their own scenarios (CANNOT delete benchmarks)
CREATE POLICY "scenarios_delete_policy"
    ON public.scenarios
    FOR DELETE
    USING (
        (auth.uid() = user_id AND is_benchmark = false)
        OR public.is_admin()
    );

-- 5. SIMULATION RUNS ROW LEVEL SECURITY POLICIES

-- (a) SELECT: Users can view only their own simulation runs (admins can view all for telemetry)
CREATE POLICY "simulation_runs_select_policy"
    ON public.simulation_runs
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_admin()
    );

-- (b) INSERT: Users can insert their own simulation runs
CREATE POLICY "simulation_runs_insert_policy"
    ON public.simulation_runs
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin()
    );

-- (c) DELETE: Users can only delete their own simulation runs
CREATE POLICY "simulation_runs_delete_policy"
    ON public.simulation_runs
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.is_admin()
    );
