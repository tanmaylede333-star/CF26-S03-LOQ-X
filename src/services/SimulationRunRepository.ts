import { SavedSimulationRun, StorageService } from './storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export class SimulationRunRepository {
  private static submittedHashes = new Set<string>();

  /**
   * Compute a simple deterministic hash for a simulation run.
   */
  public static computeHash(run: SavedSimulationRun): string {
    const raw = `${run.scenarioId}-${(run.metrics as any).finalStateHash || ''}-${run.eventCount}-${run.metrics.systemHealthPercentage}-${run.metrics.cascadeDepth}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Save a completed simulation run to Supabase PostgreSQL (primary) with localStorage fallback.
   * Prevents duplicate run submissions.
   */
  public static async saveRun(
    run: SavedSimulationRun,
    userId?: string | null
  ): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
    const hash = this.computeHash(run);

    // Prevent duplicate duplicate submissions in current session
    if (this.submittedHashes.has(hash)) {
      return { success: true, source: 'local' };
    }
    this.submittedHashes.add(hash);

    // Save to local storage for instant offline access
    StorageService.saveRun(run);

    if (isSupabaseConfigured() && supabase && userId) {
      try {
        const { error } = await supabase.from('simulation_runs').insert({
          id: run.id,
          user_id: userId,
          scenario_id: run.scenarioId || null,
          scenario_name: run.scenarioName || 'Unnamed Simulation',
          graph_version: run.scenarioSnapshot?.graphVersion || 'city-v1',
          initial_failures: run.scenarioSnapshot?.initialFailures || [],
          metrics: run.metrics,
          event_log: run.events || [],
          deterministic_hash: hash,
          created_at: run.savedAt || new Date().toISOString(),
        });

        if (error) {
          console.warn('Supabase saveRun warning, using local cache:', error.message);
          return { success: true, source: 'local', error: error.message };
        }

        return { success: true, source: 'supabase' };
      } catch (e: any) {
        console.warn('Supabase saveRun exception, using local cache:', e);
        return { success: true, source: 'local', error: e.message };
      }
    }

    return { success: true, source: 'local' };
  }

  /**
   * List simulation runs for the current user (from Supabase when online, otherwise localStorage).
   */
  public static async listRuns(userId?: string | null): Promise<SavedSimulationRun[]> {
    const localRuns = StorageService.getSavedRuns();

    if (isSupabaseConfigured() && supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('simulation_runs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            scenarioId: row.scenario_id || '',
            scenarioName: row.scenario_name,
            savedAt: row.created_at,
            metrics: row.metrics,
            eventCount: row.event_log?.length || 0,
            events: row.event_log || [],
            scenarioSnapshot: {
              id: row.scenario_id || 'snapshot',
              name: row.scenario_name,
              category: 'CUSTOM',
              description: row.scenario_name || '',
              graphVersion: row.graph_version || 'city-v1',
              initialFailures: row.initial_failures || [],
              parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 15 },
              scheduledRecoveries: [],
            },
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch runs from Supabase, using local runs:', e);
      }
    }

    return localRuns;
  }

  /**
   * Clear all runs for the user.
   */
  public static async clearAll(userId?: string | null): Promise<void> {
    StorageService.clearAllHistory();

    if (isSupabaseConfigured() && supabase && userId) {
      try {
        await supabase
          .from('simulation_runs')
          .delete()
          .eq('user_id', userId);
      } catch (e) {
        console.warn('Failed to clear runs on Supabase:', e);
      }
    }
  }
}
