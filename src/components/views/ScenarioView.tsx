import React, { useState } from 'react';
import {
  Plus,
  Play,
  Share2,
  Trash2,
  CheckCircle,
  Clock,
  Zap,
  Droplets,
  Radio,
  Truck,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Building2,
  Flame,
  CloudRain,
  ShieldAlert,
  HelpCircle,
  Wand2,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Compass,
  FileCheck
} from 'lucide-react';
import { Scenario, InitialFailure, SimulationParameters } from '../../types/scenario';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';
import { INITIAL_CITY_NODES } from '../../data/cityGraph';
import { RecoveryAction } from '../../types/recovery';
import { StorageService } from '../../services/storageService';
import { ScenarioRepository } from '../../services/ScenarioRepository';

interface ScenarioViewProps {
  activeScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onLaunchSimulation: (scenario: Scenario) => void;
  userId?: string | null;
}

const SAMPLE_AI_PROMPTS = [
  {
    title: '🌊 Coastal Monsoon Surge',
    prompt: 'Severe monsoon flood disabling the river intake water pumps and tripping north power grid with emergency hospital strain',
  },
  {
    title: '🔥 Heatwave Peak Grid Trip',
    prompt: 'Extreme heatwave overload tripping central electrical substation and causing widespread traffic signal blackout',
  },
  {
    title: '🛡️ SCADA Telecom Outage',
    prompt: 'Coordinated infrastructure incident simultaneously disrupting telecom cell towers and emergency dispatch telemetry',
  },
  {
    title: '⚡ Fuel Supply Rupture',
    prompt: 'Major supply chain rupture at coastal fuel storage hub halting diesel backup deliveries to secondary substations',
  },
];

export const ScenarioView: React.FC<ScenarioViewProps> = ({
  activeScenario,
  onSelectScenario,
  onLaunchSimulation,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'BUILDER'>('LIBRARY');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [allScenarios, setAllScenarios] = useState<Scenario[]>(() => [
    ...PREDEFINED_SCENARIOS,
    ...StorageService.getSavedScenarios(),
  ]);

  // Load scenarios from repository (Supabase cloud + local offline)
  React.useEffect(() => {
    ScenarioRepository.listScenarios(userId).then((list) => {
      setAllScenarios(list);
    });
  }, [userId]);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [synthesizedScenario, setSynthesizedScenario] = useState<Scenario | null>(null);

  // Builder Form State
  const [scenarioName, setScenarioName] = useState(activeScenario.name);
  const [scenarioDescription, setScenarioDescription] = useState(activeScenario.description);
  const [scenarioCategory, setScenarioCategory] = useState<Scenario['category']>(activeScenario.category || 'CUSTOM');
  const [maxDuration, setMaxDuration] = useState(activeScenario.parameters?.maxSimulationTime || 60);
  const [initialFailures, setInitialFailures] = useState<InitialFailure[]>(
    activeScenario.initialFailures?.length > 0
      ? activeScenario.initialFailures
      : [{ nodeId: 'power-grid-main', time: 0, severity: 'FULL', reason: 'Primary substation busbar trip' }]
  );

  // --- AI NATURAL LANGUAGE SCENARIO SYNTHESIS ENGINE ---
  const handleGenerateAIScenario = (promptText?: string) => {
    const text = (promptText || aiPrompt).trim().toLowerCase();
    if (!text) return;

    setIsGenerating(true);

    setTimeout(() => {
      // Intelligent semantic extraction & node mapping
      const generatedFailures: InitialFailure[] = [];
      let detectedCategory: Scenario['category'] = 'CUSTOM';
      let titleName = 'AI Generated Disaster Incident';

      // 1. Check for Power triggers
      if (text.includes('power') || text.includes('substation') || text.includes('grid') || text.includes('electricity') || text.includes('heatwave')) {
        detectedCategory = 'POWER';
        titleName = text.includes('heatwave')
          ? 'Thermal Grid Overload & Substation Trip'
          : 'High-Voltage Transmission Grid Fault';
        generatedFailures.push({
          nodeId: 'power-grid-main',
          time: 0,
          severity: 'FULL',
          reason: text.includes('heatwave') ? 'Thermal overload circuit trip' : 'Primary transformer arc fault',
        });
      }

      // 2. Check for Water / Flood triggers
      if (text.includes('water') || text.includes('flood') || text.includes('surge') || text.includes('monsoon') || text.includes('pump') || text.includes('drainage')) {
        if (detectedCategory === 'POWER') detectedCategory = 'DUAL_FAILURE';
        else detectedCategory = 'WATER';

        if (titleName === 'AI Generated Disaster Incident') {
          titleName = text.includes('monsoon') || text.includes('flood')
            ? 'Monsoon Inundation & Hydraulic Collapse'
            : 'Municipal Water Distribution Rupture';
        }

        generatedFailures.push({
          nodeId: 'water-pump-01',
          time: generatedFailures.length > 0 ? 10 : 0,
          severity: text.includes('flood') ? 'FULL' : 'DEGRADED',
          reason: text.includes('flood') ? 'Submerged motor intake failure' : 'Pressure sensor anomaly',
        });
      }

      // 3. Check for Telecom / Cyber triggers
      if (text.includes('telecom') || text.includes('cyber') || text.includes('scada') || text.includes('cell') || text.includes('communication')) {
        if (detectedCategory === 'POWER' || detectedCategory === 'WATER') detectedCategory = 'DUAL_FAILURE';

        if (titleName === 'AI Generated Disaster Incident') {
          titleName = 'Cyber-Physical Telecom Infrastructure Breach';
        }

        generatedFailures.push({
          nodeId: 'telecom-tower-01',
          time: generatedFailures.length > 0 ? 5 : 0,
          severity: 'FULL',
          reason: 'Optical fiber backhaul outage',
        });
      }

      // 4. Check for Traffic / Evacuation triggers
      if (text.includes('traffic') || text.includes('signal') || text.includes('road') || text.includes('gridlock')) {
        generatedFailures.push({
          nodeId: 'traffic-signals-01',
          time: generatedFailures.length > 0 ? 15 : 0,
          severity: 'DEGRADED',
          reason: 'Controller synchronization failure',
        });
      }

      // 5. Check for Hospital / Medical triggers
      if (text.includes('hospital') || text.includes('medical') || text.includes('icu') || text.includes('triage') || text.includes('emergency')) {
        generatedFailures.push({
          nodeId: 'hospital-metro-01',
          time: generatedFailures.length > 0 ? 20 : 0,
          severity: 'DEGRADED',
          reason: 'Emergency department patient overflow & low water pressure',
        });
      }

      // Fallback if no specific node keywords matched
      if (generatedFailures.length === 0) {
        generatedFailures.push({
          nodeId: 'power-grid-main',
          time: 0,
          severity: 'FULL',
          reason: 'Unspecified primary grid anomaly',
        });
        generatedFailures.push({
          nodeId: 'water-pump-01',
          time: 15,
          severity: 'DEGRADED',
          reason: 'Downstream pressure degradation',
        });
      }

      const newScenario: Scenario = {
        id: `ai-scenario-${Date.now()}`,
        name: titleName,
        category: detectedCategory,
        description: `AI Synthesized Scenario from prompt: "${promptText || aiPrompt}". Validated multi-asset disruption model.`,
        graphVersion: '2.4.0',
        isPredefined: false,
        initialFailures: generatedFailures,
        parameters: {
          maxSimulationTime: 60,
          defaultPropagationDelay: 5,
          defaultRecoveryDuration: 20,
        },
        scheduledRecoveries: [],
      };

      setSynthesizedScenario(newScenario);
      setIsGenerating(false);
    }, 500);
  };

  // Actions for Synthesized Scenario
  const handleReviewInBuilder = (sc: Scenario) => {
    setScenarioName(sc.name);
    setScenarioDescription(sc.description);
    setScenarioCategory(sc.category);
    setInitialFailures(sc.initialFailures);
    setMaxDuration(sc.parameters.maxSimulationTime);
    setActiveTab('BUILDER');
  };

  const handleAddSynthesizedToLibrary = async (sc: Scenario) => {
    await ScenarioRepository.saveScenario(sc, userId);
    const updatedList = await ScenarioRepository.listScenarios(userId);
    setAllScenarios(updatedList);
    setSynthesizedScenario(null);
  };

  const handleLaunchSynthesizedDirectly = async (sc: Scenario) => {
    await ScenarioRepository.saveScenario(sc, userId);
    const updatedList = await ScenarioRepository.listScenarios(userId);
    setAllScenarios(updatedList);
    onSelectScenario(sc);
    onLaunchSimulation(sc);
  };

  const handleAddFailure = () => {
    const nextNode = INITIAL_CITY_NODES[initialFailures.length % INITIAL_CITY_NODES.length].id;
    setInitialFailures([
      ...initialFailures,
      {
        nodeId: nextNode,
        time: (initialFailures.length + 1) * 10,
        severity: 'DEGRADED',
        reason: 'Secondary strain propagation',
      },
    ]);
  };

  const handleRemoveFailure = (index: number) => {
    if (initialFailures.length <= 1) return;
    setInitialFailures(initialFailures.filter((_, i) => i !== index));
  };

  const handleUpdateFailure = (index: number, field: keyof InitialFailure, val: any) => {
    const updated = [...initialFailures];
    updated[index] = { ...updated[index], [field]: val };
    setInitialFailures(updated);
  };

  const handleLaunchCurrentBuilder = async () => {
    if (!initialFailures || initialFailures.length === 0) {
      alert('Scenario must contain at least 1 initial failure point.');
      return;
    }

    const customScenario: Scenario = {
      id: `custom-scenario-${Date.now()}`,
      name: scenarioName.trim() || 'Custom Scenario',
      category: scenarioCategory,
      description: scenarioDescription.trim() || 'User configured custom simulation scenario',
      graphVersion: '2.4.0',
      isPredefined: false,
      initialFailures,
      parameters: {
        maxSimulationTime: maxDuration,
        defaultPropagationDelay: 5,
        defaultRecoveryDuration: 20,
      },
      scheduledRecoveries: [],
    };

    await ScenarioRepository.saveScenario(customScenario, userId);
    const updatedList = await ScenarioRepository.listScenarios(userId);
    setAllScenarios(updatedList);
    onSelectScenario(customScenario);
    onLaunchSimulation(customScenario);
  };

  const handleDeleteCustomScenario = async (e: React.MouseEvent, scenarioId: string) => {
    e.stopPropagation();
    await ScenarioRepository.deleteScenario(scenarioId, userId);
    const updatedList = await ScenarioRepository.listScenarios(userId);
    setAllScenarios(updatedList);
  };

  return (
    <div className="flex-1 p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto bg-[var(--app-bg)] font-mono text-[var(--text-primary)] select-none transition-colors duration-200">
      {/* 1. TOP HEADER & TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-heading font-black uppercase tracking-wider text-[var(--text-primary)]">
            SCENARIO ARCHITECTURE &amp; SIMULATION BUILDER
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Select verified disaster scenarios or synthesize customized cascade experiments.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-xs">
          <button
            onClick={() => setActiveTab('LIBRARY')}
            className={`px-4 py-1.5 rounded font-bold transition-all ${
              activeTab === 'LIBRARY'
                ? 'bg-[#495464] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Scenario Library ({allScenarios.length})
          </button>
          <button
            onClick={() => setActiveTab('BUILDER')}
            className={`px-4 py-1.5 rounded font-bold transition-all ${
              activeTab === 'BUILDER'
                ? 'bg-[#495464] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Custom Builder
          </button>
        </div>
      </div>

      {/* 2. COMPACT AI NATURAL LANGUAGE SCENARIO GENERATOR BOX */}
      <div className="rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)] p-3.5 shadow-sm relative overflow-hidden flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                AI Scenario Synthesizer
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] block">
                Type an incident premise to generate a validated cascade topology configuration.
              </span>
            </div>
          </div>
        </div>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAIScenario()}
            placeholder="e.g. Severe cyclone flooding water pump stations and causing hospital ICU power outages..."
            className="flex-1 px-3 py-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#495464] focus:outline-none"
          />
          <button
            onClick={() => handleGenerateAIScenario()}
            disabled={isGenerating || !aiPrompt.trim()}
            className="px-4 py-1.5 rounded bg-[#495464] hover:bg-[#334155] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            {isGenerating ? (
              <Wand2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Scenario'}</span>
          </button>
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">
            Prompt Chips:
          </span>
          {SAMPLE_AI_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setAiPrompt(sample.prompt);
                handleGenerateAIScenario(sample.prompt);
              }}
              className="px-2 py-0.5 rounded bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#495464] transition-all flex items-center gap-1"
            >
              <span>{sample.title}</span>
            </button>
          ))}
        </div>

        {/* AI GENERATED DEFINITION PREVIEW CARD */}
        {synthesizedScenario && (
          <div className="mt-1 p-3 rounded-lg bg-[var(--card-subtle)] border border-[#495464] flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">
                  AI SYNTHESIZED DEFINITION
                </span>
                <span className="text-xs font-bold text-white">
                  {synthesizedScenario.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                TMax: {synthesizedScenario.parameters.maxSimulationTime}m • Failures: {synthesizedScenario.initialFailures.length}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {synthesizedScenario.description}
            </p>

            {/* Target Nodes Breakdown */}
            <div className="flex flex-wrap gap-1.5">
              {synthesizedScenario.initialFailures.map((f, i) => {
                const node = INITIAL_CITY_NODES.find((n) => n.id === f.nodeId);
                return (
                  <span
                    key={i}
                    className="text-[9px] px-2 py-0.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-rose-300 font-mono"
                  >
                    T+{f.time}m: {node?.code || f.nodeId} ({f.severity}) — {f.reason}
                  </span>
                );
              })}
            </div>

            {/* 3 Explicit Validated Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-color)]">
              <button
                onClick={() => handleReviewInBuilder(synthesizedScenario)}
                className="px-3 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Review in Builder</span>
              </button>

              <button
                onClick={() => handleAddSynthesizedToLibrary(synthesizedScenario)}
                className="px-3 py-1.5 rounded bg-[var(--surface-bg)] hover:bg-[var(--card-subtle)] border border-[var(--border-color)] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Add to Library</span>
              </button>

              <button
                onClick={() => handleLaunchSynthesizedDirectly(synthesizedScenario)}
                className="px-4 py-1.5 rounded bg-[#495464] hover:bg-[#334155] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto border border-[#1e293b]"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Simulator</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. SCENARIO LIBRARY TAB CONTENT WITH PROGRESSIVE DISCLOSURE ACCORDIONS */}
      {activeTab === 'LIBRARY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allScenarios.map((sc) => {
            const isCurrent = activeScenario.id === sc.id;
            const isExpanded = expandedCardId === sc.id;

            return (
              <div
                key={sc.id}
                className={`p-4 rounded-lg bg-[var(--surface-bg)] border transition-all flex flex-col justify-between gap-3 shadow-sm ${
                  isCurrent
                    ? 'border-[#495464] ring-1 ring-[#495464] shadow-md'
                    : 'border-[var(--border-color)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        sc.category === 'POWER'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : sc.category === 'WATER'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : sc.category === 'WEATHER'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : sc.category === 'DUAL_FAILURE'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {sc.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold">
                        TMax: {sc.parameters.maxSimulationTime}m
                      </span>
                      {!sc.isPredefined && (
                        <button
                          onClick={(e) => handleDeleteCustomScenario(e, sc.id)}
                          className="p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Custom Scenario"
                          aria-label="Delete Custom Scenario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading leading-snug">
                    {sc.name}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {sc.description}
                  </p>

                  {/* Summary Bar */}
                  <div className="mt-1 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                    <span>
                      Failures: <strong className="text-rose-400">{sc.initialFailures.length} Nodes</strong>
                    </span>
                    <button
                      onClick={() => setExpandedCardId(isExpanded ? null : sc.id)}
                      className="text-slate-300 hover:text-white flex items-center gap-0.5 text-[10px] font-bold underline"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Target Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Progressive Disclosure Details Accordion */}
                  {isExpanded && (
                    <div className="p-2.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col gap-2 text-[10px] animate-fadeIn mt-1">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">
                        Initial Disruption Targets:
                      </span>
                      <div className="space-y-1">
                        {sc.initialFailures.map((f, idx) => {
                          const targetNode = INITIAL_CITY_NODES.find((n) => n.id === f.nodeId);
                          return (
                            <div key={idx} className="flex flex-col text-[10px] border-b border-[var(--border-color)]/60 pb-1 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-300">
                                  T+{f.time}m: {targetNode ? `${targetNode.code} — ${targetNode.name}` : f.nodeId}
                                </span>
                                <span className="text-rose-400 font-mono text-[9px] uppercase">
                                  {f.severity}
                                </span>
                              </div>
                              {f.reason && (
                                <span className="text-slate-400 text-[9px] italic">
                                  Cause: {f.reason}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {sc.scheduledRecoveries && sc.scheduledRecoveries.length > 0 && (
                        <div className="pt-1 border-t border-[var(--border-color)] text-emerald-300 text-[9px]">
                          Scheduled Recoveries: {sc.scheduledRecoveries.length} automated interventions
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => onSelectScenario(sc)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#495464] border border-[#1e293b] text-white'
                        : 'bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    {isCurrent ? '✓ Active Scenario' : 'Select Scenario'}
                  </button>

                  <button
                    onClick={() => {
                      onSelectScenario(sc);
                      onLaunchSimulation(sc);
                    }}
                    className="p-1.5 rounded bg-[#495464] hover:bg-[#334155] text-white transition-all shadow-sm"
                    title="Launch directly in Simulation Canvas"
                    aria-label="Launch Scenario in Simulator"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. SCENARIO BUILDER TAB CONTENT */}
      {activeTab === 'BUILDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Metadata & Parameters (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] pb-2 border-b border-[var(--border-color)]">
              Scenario Specifications
            </h3>

            <div>
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold block mb-1">
                Scenario Name
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold block mb-1">
                Category
              </label>
              <select
                value={scenarioCategory}
                onChange={(e) => setScenarioCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
              >
                <option value="POWER">POWER (Substation & Transmission)</option>
                <option value="WATER">WATER (Treatment & Hydraulic)</option>
                <option value="WEATHER">WEATHER (Flood & Monsoons)</option>
                <option value="DUAL_FAILURE">DUAL_FAILURE (Multi-sector Complex)</option>
                <option value="CUSTOM">CUSTOM (User Defined)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold block mb-1">
                Description &amp; Operational Context
              </label>
              <textarea
                rows={4}
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:border-[#495464] focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold block mb-1">
                Max Simulation Time ({maxDuration} minutes)
              </label>
              <input
                type="range"
                min={30}
                max={180}
                step={10}
                value={maxDuration}
                onChange={(e) => setMaxDuration(Number(e.target.value))}
                className="w-full accent-[#495464]"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleLaunchCurrentBuilder}
                className="w-full py-2.5 rounded bg-[#495464] hover:bg-[#334155] text-white font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#1e293b] flex items-center justify-center gap-2 border border-[#1e293b]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Save &amp; Run Simulation Experiment</span>
              </button>
            </div>
          </div>

          {/* Right Column: Initial Failure Injectors (7 cols) */}
          <div className="lg:col-span-7 p-4 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Primary Failure Injections ({initialFailures.length})
                </h3>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Specify initial origin failure points that trigger downstream cascades.
                </span>
              </div>

              <button
                onClick={handleAddFailure}
                className="px-3 py-1 rounded bg-[var(--card-subtle)] hover:bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px] text-[var(--text-primary)] font-bold transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Failure Node</span>
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {initialFailures.map((failure, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex flex-col gap-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">
                      Failure Point #{idx + 1}
                    </span>

                    {initialFailures.length > 1 && (
                      <button
                        onClick={() => handleRemoveFailure(idx)}
                        className="text-[var(--text-tertiary)] hover:text-rose-400 transition-colors p-1"
                        title="Remove failure point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Node Selector */}
                    <div>
                      <label className="text-[9px] text-[var(--text-secondary)] uppercase block mb-0.5">
                        Target Asset
                      </label>
                      <select
                        value={failure.nodeId}
                        onChange={(e) => handleUpdateFailure(idx, 'nodeId', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px] text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
                      >
                        {INITIAL_CITY_NODES.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.code} - {node.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trigger Time */}
                    <div>
                      <label className="text-[9px] text-[var(--text-secondary)] uppercase block mb-0.5">
                        Trigger Time (T+X min)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={failure.time}
                        onChange={(e) => handleUpdateFailure(idx, 'time', Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px] text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
                      />
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="text-[9px] text-[var(--text-secondary)] uppercase block mb-0.5">
                        Severity
                      </label>
                      <select
                        value={failure.severity || 'FULL'}
                        onChange={(e) => handleUpdateFailure(idx, 'severity', e.target.value as any)}
                        className="w-full px-2 py-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px] text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
                      >
                        <option value="FULL">FULL OUTAGE</option>
                        <option value="DEGRADED">DEGRADED (50% capacity)</option>
                        <option value="AT_RISK">AT RISK (Warning)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reason Description */}
                  <div>
                    <label className="text-[9px] text-[var(--text-secondary)] uppercase block mb-0.5">
                      Failure Root Reason
                    </label>
                    <input
                      type="text"
                      value={failure.reason || ''}
                      onChange={(e) => handleUpdateFailure(idx, 'reason', e.target.value)}
                      placeholder="e.g. Transformer explosive surge, high floodwater level..."
                      className="w-full px-2 py-1 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[11px] text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
