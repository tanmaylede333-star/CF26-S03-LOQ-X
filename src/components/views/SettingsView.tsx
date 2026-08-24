import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  MapPin,
  Database,
  Cpu,
  Shield,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';

import { Scenario } from '../../types/scenario';

interface SettingsViewProps {
  state: SimulationState;
  onResetState: () => void;
  onUpdateParameters?: (params: Partial<Scenario['parameters']>) => void;
  onSetSpeed?: (speed: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onResetState,
  onUpdateParameters,
  onSetSpeed,
}) => {
  // Local settings state initialized from props/localStorage
  const [systemName, setSystemName] = useState(() => localStorage.getItem('cascade_system_name') || 'JanNagar Municipal Control');
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('cascade_sound_alerts') !== 'false');
  const [defaultSpeed, setDefaultSpeed] = useState(`${state.speed || 2}x`);
  const [autoPauseOnCascade, setAutoPauseOnCascade] = useState(
    state.scenario.parameters?.autoPauseOnCriticalBreach ?? true
  );
  const [propagationDelayMultiplier, setPropagationDelayMultiplier] = useState(
    state.scenario.parameters?.propagationDelayMultiplier ?? 1.0
  );
  const [mapTheme, setMapTheme] = useState(() => localStorage.getItem('cascade_map_theme') || 'dark-matter');
  const [showDependencyVectors, setShowDependencyVectors] = useState(
    () => localStorage.getItem('cascade_vectors') !== 'false'
  );
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSave = () => {
    localStorage.setItem('cascade_system_name', systemName);
    localStorage.setItem('cascade_sound_alerts', String(soundAlerts));
    localStorage.setItem('cascade_map_theme', mapTheme);
    localStorage.setItem('cascade_vectors', String(showDependencyVectors));

    const numericSpeed = parseInt(defaultSpeed.replace('x', ''), 10) || 1;
    if (onSetSpeed) onSetSpeed(numericSpeed);

    if (onUpdateParameters) {
      onUpdateParameters({
        propagationDelayMultiplier,
        autoPauseOnCriticalBreach: autoPauseOnCascade,
      });
    }

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cascade_run_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto bg-[var(--app-bg)] font-mono text-[var(--text-primary)] transition-colors duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white shadow-sm">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-[var(--text-primary)]">
              System Configuration &amp; Preferences
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              Control room environment, deterministic engine parameters, and GIS layer preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-4 h-4" /> Preferences Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs transition-all shadow-[2px_2px_0px_#1e293b] border border-[#1e293b]"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. GENERAL PREFERENCES */}
        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 font-heading">
            <Sliders className="w-4 h-4" />
            <span>GENERAL PREFERENCES</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-sans">Control Room / System Name</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block font-sans">Critical Audio Alerts</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                  Play acoustic cue on cascade level escalation (Level 3+)
                </span>
              </div>
              <button
                onClick={() => setSoundAlerts(!soundAlerts)}
                className={`p-2 rounded border transition-colors ${
                  soundAlerts
                    ? 'bg-[#495464] border-[#1e293b] text-white'
                    : 'bg-[var(--surface-bg)] border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block font-sans">Interface Theme</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                  Curated Nordic Slate Palette with Dual Light/Dark Mode
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#495464] border border-[#BBBFCA] text-white text-[10px] font-bold">
                NORDIC_SLATE (ACTIVE)
              </span>
            </div>
          </div>
        </div>

        {/* 2. SIMULATION ENGINE PARAMETERS */}
        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 font-heading">
            <Cpu className="w-4 h-4" />
            <span>SIMULATION ENGINE CONFIG</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-sans">Default Execution Speed</label>
              <div className="grid grid-cols-4 gap-2">
                {['1x', '2x', '5x', '10x'].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setDefaultSpeed(speed)}
                    className={`py-1.5 rounded font-bold transition-colors ${
                      defaultSpeed === speed
                        ? 'bg-[#495464] text-white shadow-sm border border-[#1e293b]'
                        : 'bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block font-sans">Auto-Pause on Critical Breach</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                  Pause simulation immediately if a Tier-1 Hospital or Emergency Dispatch fails
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoPauseOnCascade}
                onChange={(e) => setAutoPauseOnCascade(e.target.checked)}
                className="w-4 h-4 accent-[#495464] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-1 font-sans">
                <span>Propagation Delay Multiplier</span>
                <span className="text-[var(--text-primary)] font-bold font-mono">{propagationDelayMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={propagationDelayMultiplier}
                onChange={(e) => setPropagationDelayMultiplier(parseFloat(e.target.value))}
                className="w-full accent-[#495464] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. GIS & MAPPING PREFERENCES */}
        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 font-heading">
            <MapPin className="w-4 h-4" />
            <span>GIS &amp; SPATIAL PREFERENCES</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-sans">Base Tile Provider</label>
              <select
                value={mapTheme}
                onChange={(e) => setMapTheme(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
              >
                <option value="dark-matter">CartoDB Dark Matter (Midnight Vector)</option>
                <option value="positron">CartoDB Positron (High Contrast)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block font-sans">Dependency Flow Vectors</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                  Render animated polylines between connected nodes on GIS Map
                </span>
              </div>
              <input
                type="checkbox"
                checked={showDependencyVectors}
                onChange={(e) => setShowDependencyVectors(e.target.checked)}
                className="w-4 h-4 accent-[#495464] rounded cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
              Default Coordinates: <span className="text-[var(--text-primary)] font-bold">19.0760° N, 72.8777° E</span> (Navapur / Mumbai Metropolitan Grid)
            </div>
          </div>
        </div>

        {/* 4. DATA MANAGEMENT & EXPORT */}
        <div className="p-4 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 font-heading">
            <Database className="w-4 h-4" />
            <span>DATA MANAGEMENT &amp; EXPORT</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block font-sans">Export Run Telemetry (JSON)</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                  Download full state snapshot, event timeline, and cascade telemetry
                </span>
              </div>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center gap-1.5 font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block font-sans">Reset Simulation Engine State</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                  Restore nominal grid health and clear event buffer
                </span>
              </div>
              <button
                onClick={onResetState}
                className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 flex items-center gap-1.5 font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Diagnostics Bar */}
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>SYSTEM VERSION: V.2.4.0-RESILIENCE</span>
              <span>DETERMINISTIC SEED: 0x8F91A</span>
              <span className="text-emerald-400 font-bold">● ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
