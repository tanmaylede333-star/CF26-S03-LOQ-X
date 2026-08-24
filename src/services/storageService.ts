import { Scenario } from '../types/scenario';
import { SimulationEvent } from '../types/event';
import { SimulationMetrics } from '../types/simulation';
import { SecurityValidator } from './SecurityValidator';

export interface SavedSimulationRun {
  id: string;
  scenarioId: string;
  scenarioName: string;
  savedAt: string;
  metrics: SimulationMetrics;
  eventCount: number;
  events: SimulationEvent[];
  scenarioSnapshot: Scenario;
}

const STORAGE_KEY_SCENARIOS = 'cascade_sim_custom_scenarios_v1';
const STORAGE_KEY_RUNS = 'cascade_sim_saved_runs_v1';

export class StorageService {
  /**
   * One-time cleanup of any legacy insecure keys or tokens stored in localStorage.
   */
  public static sanitizeStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Remove insecure stored keys
        localStorage.removeItem('cascade_gemini_key');
        localStorage.removeItem('role');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('admin');
        localStorage.removeItem('cascade_admin_token');
      }
    } catch {
      // Ignore if in headless / restricted environment
    }
  }

  public static getSavedScenarios(): Scenario[] {
    try {
      this.sanitizeStorage();
      const data = localStorage.getItem(STORAGE_KEY_SCENARIOS);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      // Validate every scenario on read to prevent stored XSS or corrupt state
      const validScenarios: Scenario[] = [];
      for (const item of parsed) {
        const result = SecurityValidator.validateScenario(item);
        if (result.isValid && result.sanitizedData) {
          validScenarios.push(result.sanitizedData);
        }
      }
      return validScenarios;
    } catch (e) {
      console.error('Failed to load scenarios from localStorage', e);
      return [];
    }
  }

  public static saveScenario(scenario: Scenario): void {
    try {
      const validation = SecurityValidator.validateScenario(scenario);
      if (!validation.isValid || !validation.sanitizedData) {
        console.error('Refusing to save invalid scenario to localStorage:', validation.errors);
        return;
      }

      const list = this.getSavedScenarios();
      const sanitized = validation.sanitizedData;
      const existingIndex = list.findIndex(s => s.id === sanitized.id);
      if (existingIndex >= 0) {
        list[existingIndex] = sanitized;
      } else {
        list.push(sanitized);
      }
      localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save scenario to localStorage', e);
    }
  }

  public static deleteScenario(scenarioId: string): void {
    try {
      const sanitizedId = SecurityValidator.sanitizeText(scenarioId, 100);
      const list = this.getSavedScenarios().filter(s => s.id !== sanitizedId);
      localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to delete scenario from localStorage', e);
    }
  }

  public static getSavedRuns(): SavedSimulationRun[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RUNS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error('Failed to load runs from localStorage', e);
      return [];
    }
  }

  public static saveRun(run: SavedSimulationRun): void {
    try {
      const runs = this.getSavedRuns();
      runs.unshift(run);
      // Keep last 20 runs
      const trimmed = runs.slice(0, 20);
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save simulation run', e);
    }
  }

  public static clearAllHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_RUNS);
    } catch (e) {
      console.error('Failed to clear runs', e);
    }
  }
}
