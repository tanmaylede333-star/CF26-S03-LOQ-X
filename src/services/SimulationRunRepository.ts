import { SavedSimulationRun, StorageService } from './storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SecurityValidator } from './SecurityValidator';
import { RateLimiter } from './RateLimiter';

export class SimulationRunRepository {
  private static submittedHashes = new Set<string>();

  /**
   * Compute a deterministic hash for a simulation run.
   */
  public static computeHash(run: SavedSimulationRun): string {
    const raw = `${run.scenarioId}-${(run.metrics as any)?.finalStateHash || ''}-${run.eventCount}-${run.metrics?.systemHealthPercentage || 0}-${run.metrics?.cascadeDepth || 0}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Save a completed simulation run to Supabase PostgreSQL (primary) with localStorage fallback.
   * Enforces rate-limiting, UUID validation, and prevents duplicate submissions.
   */
  public static async saveRun(
    run: SavedSimulationRun,
    userId?: string | null
  ): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
    // 1. Rate-limit check
    const rateCheck = RateLimiter.checkRunSaveLimit(userId || 'anonymous');
    if (!rateCheck.allowed) {
      return {
        success: false,
        source: 'local',
        error: `Rate limit reached. Please wait ${rateCheck.retryAfterSeconds}s before saving another run.`,
      };
    }

    if (!run || typeof run !== 'object') {
      return { success: false, source: 'local', error: 'Invalid simulation run data.' };
    }

    const hash = this.computeHash(run);

    // Prevent duplicate submissions in current session
    if (this.submittedHashes.has(hash)) {
      return { success: true, source: 'local' };
    }
    this.submittedHashes.add(hash);

    // Sanitize run object before storing
    const sanitizedRun: SavedSimulationRun = {
      id: SecurityValidator.sanitizeText(run.id, 100),
      scenarioId: SecurityValidator.sanitizeText(run.scenarioId, 100),
      scenarioName: SecurityValidator.sanitizeText(run.scenarioName || 'Unnamed Simulation', 120),
      savedAt: run.savedAt || new Date().toISOString(),
      metrics: run.metrics,
      eventCount: Math.max(0, Number(run.eventCount) || 0),
      events: Array.isArray(run.events) ? run.events.slice(0, 500) : [],
      scenarioSnapshot: run.scenarioSnapshot,
    };

    // Save to local storage for instant offline access
    StorageService.saveRun(sanitizedRun);

    if (isSupabaseConfigured() && supabase && userId && SecurityValidator.isValidUUID(userId)) {
      try {
        const { error } = await supabase.from('simulation_runs').insert({
          id: sanitizedRun.id,
          user_id: userId,
          scenario_id: sanitizedRun.scenarioId || null,
          scenario_name: sanitizedRun.scenarioName,
          graph_version: sanitizedRun.scenarioSnapshot?.graphVersion || 'city-v1',
          initial_failures: sanitizedRun.scenarioSnapshot?.initialFailures || [],
          metrics: sanitizedRun.metrics,
          event_log: sanitizedRun.events || [],
          deterministic_hash: hash,
          created_at: sanitizedRun.savedAt,
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

    if (isSupabaseConfigured() && supabase && userId && SecurityValidator.isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('simulation_runs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: SecurityValidator.sanitizeText(row.id, 100),
            scenarioId: SecurityValidator.sanitizeText(row.scenario_id || '', 100),
            scenarioName: SecurityValidator.sanitizeText(row.scenario_name, 120),
            savedAt: row.created_at,
            metrics: row.metrics,
            eventCount: row.event_log?.length || 0,
            events: row.event_log || [],
            scenarioSnapshot: {
              id: SecurityValidator.sanitizeText(row.scenario_id || 'snapshot', 100),
              name: SecurityValidator.sanitizeText(row.scenario_name, 120),
              category: 'CUSTOM',
              description: SecurityValidator.sanitizeText(row.scenario_name || '', 2000),
              graphVersion: SecurityValidator.sanitizeText(row.graph_version || 'city-v1', 50),
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

    if (isSupabaseConfigured() && supabase && userId && SecurityValidator.isValidUUID(userId)) {
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
