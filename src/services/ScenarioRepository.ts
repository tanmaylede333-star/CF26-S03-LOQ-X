import { Scenario } from '../types/scenario';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { StorageService } from './storageService';
import { PREDEFINED_SCENARIOS } from '../data/scenarios';

export class ScenarioRepository {
  /**
   * Save a scenario.
   * Primary: Supabase PostgreSQL (when user is authenticated and online)
   * Fallback: localStorage
   */
  public static async saveScenario(scenario: Scenario, userId?: string | null): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
    // Always persist to local fallback first for offline resilience
    StorageService.saveScenario(scenario);

    if (isSupabaseConfigured() && supabase && userId) {
      try {
        const { error } = await supabase.from('scenarios').upsert({
          id: scenario.id,
          user_id: userId,
          name: scenario.name,
          category: scenario.category || 'CUSTOM',
          description: scenario.description || '',
          graph_version: scenario.graphVersion || 'city-v1',
          nodes: scenario.nodes || [],
          edges: scenario.edges || [],
          initial_failures: scenario.initialFailures || [],
          parameters: scenario.parameters || {},
          scheduled_recoveries: scenario.scheduledRecoveries || [],
          is_benchmark: false,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.warn('Supabase saveScenario warning, using local cache:', error.message);
          return { success: true, source: 'local', error: error.message };
        }

        return { success: true, source: 'supabase' };
      } catch (e: any) {
        console.warn('Supabase saveScenario exception, using local cache:', e);
        return { success: true, source: 'local', error: e.message };
      }
    }

    return { success: true, source: 'local' };
  }

  /**
   * List all scenarios available to the user (Predefined benchmarks + User cloud scenarios + Local offline scenarios).
   */
  public static async listScenarios(userId?: string | null): Promise<Scenario[]> {
    const localCustom = StorageService.getSavedScenarios();
    const scenarioMap = new Map<string, Scenario>();

    // 1. Add predefined benchmark scenarios
    PREDEFINED_SCENARIOS.forEach((s) => scenarioMap.set(s.id, s));

    // 2. Add local custom scenarios
    localCustom.forEach((s) => scenarioMap.set(s.id, s));

    // 3. If Supabase is online and user is authenticated, fetch cloud scenarios
    if (isSupabaseConfigured() && supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('scenarios')
          .select('*')
          .or(`user_id.eq.${userId},is_benchmark.eq.true`);

        if (!error && data) {
          data.forEach((row: any) => {
            const mapped: Scenario = {
              id: row.id,
              name: row.name,
              category: row.category,
              description: row.description,
              graphVersion: row.graph_version,
              nodes: row.nodes,
              edges: row.edges,
              initialFailures: row.initial_failures,
              parameters: row.parameters,
              scheduledRecoveries: row.scheduled_recoveries,
            };
            scenarioMap.set(mapped.id, mapped);
            // Cache locally
            StorageService.saveScenario(mapped);
          });
        }
      } catch (e) {
        console.warn('Failed to fetch scenarios from Supabase, using local cache:', e);
      }
    }

    return Array.from(scenarioMap.values());
  }

  /**
   * Delete a scenario from Supabase and local storage.
   */
  public static async deleteScenario(scenarioId: string, userId?: string | null): Promise<void> {
    StorageService.deleteScenario(scenarioId);

    if (isSupabaseConfigured() && supabase && userId) {
      try {
        await supabase
          .from('scenarios')
          .delete()
          .match({ id: scenarioId, user_id: userId });
      } catch (e) {
        console.warn('Failed to delete scenario from Supabase:', e);
      }
    }
  }
}
