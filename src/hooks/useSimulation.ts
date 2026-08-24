import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine, RunComparisonResult } from '../engine/SimulationEngine';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../data/cityGraph';
import { PREDEFINED_SCENARIOS } from '../data/scenarios';
import { Scenario, InitialFailure } from '../types/scenario';
import { RecoveryAction } from '../types/recovery';
import { SimulationState } from '../types/simulation';
import { SavedSimulationRun } from '../services/storageService';
import { SimulationRunRepository } from '../services/SimulationRunRepository';

export function useSimulation(
  initialScenario: Scenario = PREDEFINED_SCENARIOS[0],
  userId?: string | null
) {
  const [activeScenario, setActiveScenario] = useState<Scenario>(initialScenario);
  const engineRef = useRef<SimulationEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(
      initialScenario,
      INITIAL_CITY_NODES,
      INITIAL_CITY_EDGES
    );
  }

  const [state, setState] = useState<SimulationState>(() => engineRef.current!.getState());
  const timerRef = useRef<number | null>(null);

  // Sync state helper
  const syncState = useCallback(() => {
    if (engineRef.current) {
      setState(engineRef.current.getState());
    }
  }, []);

  // Auto-save completed simulation run to Supabase/local repository
  useEffect(() => {
    if (state.status === "COMPLETED" && state.events.length > 0) {
      const run: SavedSimulationRun = {
        id: `run-${Date.now()}`,
        scenarioId: state.scenario.id,
        scenarioName: state.scenario.name,
        savedAt: new Date().toISOString(),
        metrics: state.metrics,
        eventCount: state.events.length,
        events: [...state.events],
        scenarioSnapshot: state.scenario,
      };
      SimulationRunRepository.saveRun(run, userId);
    }
  }, [state.status, state.events, state.metrics, state.scenario, userId]);

  // Interval timer for playback
  useEffect(() => {
    if (state.status === "RUNNING") {
      const intervalMs = Math.max(100, Math.floor(1000 / state.speed));
      timerRef.current = window.setInterval(() => {
        if (engineRef.current) {
          const nextState = engineRef.current.step();
          setState(nextState);
          if (nextState.status === "COMPLETED") {
            if (timerRef.current) clearInterval(timerRef.current);
          }
        }
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.status, state.speed]);

  const start = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    syncState();
  }, [syncState]);

  const pause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    syncState();
  }, [syncState]);

  const step = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.step();
    syncState();
  }, [syncState]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!engineRef.current) return;
    engineRef.current.reset();
    syncState();
  }, [syncState]);

  const replay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!engineRef.current) return;
    engineRef.current.reset();
    engineRef.current.resume();
    syncState();
  }, [syncState]);

  const setSpeed = useCallback((speed: number) => {
    if (!engineRef.current) return;
    engineRef.current.setSpeed(speed);
    syncState();
  }, [syncState]);

  const setSelectedNodeId = useCallback((nodeId: string | null) => {
    if (!engineRef.current) return;
    engineRef.current.setSelectedNodeId(nodeId);
    syncState();
  }, [syncState]);

  const setScrubTime = useCallback((time: number | null) => {
    if (!engineRef.current) return;
    if (time !== null && engineRef.current.getState().status === 'RUNNING') {
      engineRef.current.pause();
    }
    engineRef.current.setScrubTime(time);
    syncState();
  }, [syncState]);

  const updateSimulationParameters = useCallback((params: Partial<Scenario['parameters']>) => {
    if (!engineRef.current) return;
    engineRef.current.updateParameters(params);
    setActiveScenario(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        ...params,
      },
    }));
    syncState();
  }, [syncState]);

  const setHighlightPath = useCallback((path: { nodeIds: string[]; edgeIds: string[] } | null) => {
    if (!engineRef.current) return;
    engineRef.current.setHighlightPath(path);
    syncState();
  }, [syncState]);

  const calculateBlastRadius = useCallback((nodeId: string) => {
    if (!engineRef.current) return [];
    const radius = engineRef.current.calculateBlastRadius(nodeId);
    syncState();
    return radius;
  }, [syncState]);

  const injectFailure = useCallback((nodeId: string, customReason?: string, severity: "FULL" | "DEGRADED" = "FULL") => {
    if (!engineRef.current) return;
    engineRef.current.injectFailure(nodeId, customReason, severity);
    syncState();
  }, [syncState]);

  const injectMultipleFailures = useCallback((failures: InitialFailure[]) => {
    // If simulation hasn't started yet, add them as initial scheduled failures in the active scenario
    if (state.currentTime === 0 && state.status === 'IDLE') {
      const updatedScenario: Scenario = {
        ...activeScenario,
        initialFailures: [...failures],
      };
      setActiveScenario(updatedScenario);
      engineRef.current = new SimulationEngine(
        updatedScenario,
        INITIAL_CITY_NODES,
        INITIAL_CITY_EDGES
      );
      syncState();
    } else {
      // If simulation is in progress, inject all failures at current timestamp
      failures.forEach((f) => {
        engineRef.current?.injectFailure(
          f.nodeId,
          f.reason,
          f.severity === 'DEGRADED' ? 'DEGRADED' : 'FULL'
        );
      });
      syncState();
    }
  }, [activeScenario, state.currentTime, state.status, syncState]);

  const applyRecovery = useCallback((action: RecoveryAction) => {
    if (!engineRef.current) return;
    engineRef.current.applyRecovery(action);
    engineRef.current.resume();
    syncState();
  }, [syncState]);

  const loadScenario = useCallback((scenario: Scenario) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActiveScenario(scenario);
    engineRef.current = new SimulationEngine(
      scenario,
      scenario.nodes || INITIAL_CITY_NODES,
      scenario.edges || INITIAL_CITY_EDGES
    );
    syncState();
  }, [syncState]);

  const saveCurrentRun = useCallback(() => {
    if (!state) return;
    const run: SavedSimulationRun = {
      id: `run-${Date.now()}`,
      scenarioId: state.scenario.id,
      scenarioName: state.scenario.name,
      savedAt: new Date().toISOString(),
      metrics: state.metrics,
      eventCount: state.events.length,
      events: [...state.events],
      scenarioSnapshot: state.scenario,
    };
    SimulationRunRepository.saveRun(run, userId);
    return run;
  }, [state, userId]);

  const verifyDeterministicReplay = useCallback((): RunComparisonResult => {
    // 1. Run fresh replay simulation from active scenario
    const replayEngine = new SimulationEngine(
      activeScenario,
      activeScenario.nodes || INITIAL_CITY_NODES,
      activeScenario.edges || INITIAL_CITY_EDGES
    );
    const replayResult = replayEngine.runAll();

    // 2. Run reference baseline of active scenario
    const originalEngine = new SimulationEngine(
      activeScenario,
      activeScenario.nodes || INITIAL_CITY_NODES,
      activeScenario.edges || INITIAL_CITY_EDGES
    );
    const originalResult = originalEngine.runAll();

    return SimulationEngine.compareRuns(
      originalResult.events,
      originalResult.metrics,
      replayResult.events,
      replayResult.metrics
    );
  }, [activeScenario]);

  return {
    state,
    activeScenario,
    start,
    pause,
    step,
    reset,
    replay,
    setSpeed,
    setSelectedNodeId,
    setScrubTime,
    setHighlightPath,
    calculateBlastRadius,
    injectFailure,
    injectMultipleFailures,
    applyRecovery,
    loadScenario,
    updateSimulationParameters,
    saveCurrentRun,
    verifyDeterministicReplay,
  };
}
