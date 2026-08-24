import { Scenario } from '../types/scenario';
import { SimulationEvent } from '../types/event';
import { SimulationMetrics } from '../types/simulation';

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
  public static getSavedScenarios(): Scenario[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SCENARIOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load scenarios from localStorage', e);
      return [];
    }
  }

  public static saveScenario(scenario: Scenario): void {
    try {
      const list = this.getSavedScenarios();
      const existingIndex = list.findIndex(s => s.id === scenario.id);
      if (existingIndex >= 0) {
        list[existingIndex] = scenario;
      } else {
        list.push(scenario);
      }
      localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save scenario to localStorage', e);
    }
  }

  public static deleteScenario(scenarioId: string): void {
    try {
      const list = this.getSavedScenarios().filter(s => s.id !== scenarioId);
      localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to delete scenario from localStorage', e);
    }
  }

  public static getSavedRuns(): SavedSimulationRun[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RUNS);
      return data ? JSON.parse(data) : [];
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
