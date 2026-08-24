import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
  Minimize2,
  Maximize2,
  ChevronDown,
  Clock,
  Shield,
  HelpCircle,
  Copy,
  Check,
  Key
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  text: string;
  timestamp: string;
  isQuickPrompt?: boolean;
}

interface GeminiChatDrawerProps {
  state: SimulationState;
  onApplyRecovery?: (action: any) => void;
  onSelectNode?: (nodeId: string) => void;
}

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  state,
  onApplyRecovery,
  onSelectNode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('cascade_gemini_key') || '');
  const [tempKeyInput, setTempKeyInput] = useState(apiKey);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || state.nodes[0];
  const currentT = state.scrubTime !== null ? state.scrubTime : state.currentTime;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ASSISTANT',
      text: `Hello! I am your AI Mission Assistant. Ask me anything about the city grid, root-cause failures, recovery priorities, or general engineering questions.`,
      timestamp: '00:00',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  const handleSaveApiKey = () => {
    const trimmed = tempKeyInput.trim();
    setApiKey(trimmed);
    localStorage.setItem('cascade_gemini_key', trimmed);
    setShowKeyModal(false);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setTempKeyInput('');
    localStorage.removeItem('cascade_gemini_key');
    setShowKeyModal(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showKeyModal) {
          setShowKeyModal(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showKeyModal]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- LIVE GEMINI API CALLER ---
  const callLiveGeminiAPI = async (userPrompt: string): Promise<string> => {
    const failedNodes = state.nodes.filter((n) => n.status === 'FAILED').map((n) => `${n.name} (${n.code}) - Zone: ${n.zone}`);
    const degradedNodes = state.nodes.filter((n) => n.status === 'DEGRADED').map((n) => `${n.name} (${n.code})`);
    
    const telemetryContext = `
You are the Chief AI Mission Control Assistant for "Cascade City" (an urban infrastructure disaster simulator).
Current Telemetry:
- Active Disaster Scenario: "${state.scenario.name}"
- Virtual Time: T+${formatTime(currentT)}
- Grid Health: ${state.metrics.systemHealthPercentage}%
- Cascade Depth: Level ${state.metrics.cascadeDepth}
- Total Affected Downstream Nodes: ${state.metrics.affectedServices}
- Nodes in Outage (FAILED): ${failedNodes.join(', ') || 'None'}
- Nodes Degraded: ${degradedNodes.join(', ') || 'None'}
- Selected Asset: ${selectedNode.name} (${selectedNode.code} - ${selectedNode.status})

Instructions:
Answer the user's question directly, clearly, and concisely in clean markdown. No unnecessary robotic boilerplate.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: telemetryContext },
                  { text: `User Question: ${userPrompt}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return answer || 'No response received from Gemini API.';
    } catch (err: any) {
      console.warn('Live API request failed, using local engine:', err);
      return synthesizeLocalResponse(userPrompt);
    }
  };

  // --- LOCAL INTELLIGENCE ENGINE (CLEAN & DIRECT) ---
  const synthesizeLocalResponse = (userQuery: string): string => {
    const q = userQuery.toLowerCase().trim();
    const failedNodes = state.nodes.filter((n) => n.status === 'FAILED');
    const degradedNodes = state.nodes.filter((n) => n.status === 'DEGRADED');
    const healthyCount = state.nodes.filter((n) => n.status === 'HEALTHY').length;

    // 1. Status / Situation Report
    if (q.includes('status') || q.includes('summarize') || q.includes('situation') || q.includes('crisis') || q.includes('overview')) {
      return `### 🚨 Live Incident Summary — T+${formatTime(currentT)}
* **Active Scenario**: \`${state.scenario.name}\`
* **Grid Health**: **${state.metrics.systemHealthPercentage}%** (${healthyCount}/${state.nodes.length} Operational)
* **Cascade Depth**: **Level ${state.metrics.cascadeDepth}**
* **Disrupted Nodes**: **${state.metrics.affectedServices} nodes**

#### Outages:
${
  failedNodes.length > 0
    ? failedNodes.map((n) => `* 🔴 **${n.name}** (\`${n.code}\`) — ${n.zone}`).join('\n')
    : '* 🟢 No assets in hard failure state.'
}

${
  degradedNodes.length > 0
    ? `\n#### Degraded Nodes:\n` +
      degradedNodes.map((n) => `* 🟠 **${n.name}** (\`${n.code}\`)`).join('\n')
    : ''
}`;
    }

    // 2. Specific Node Inquiries
    if (q.includes('hospital') || q.includes('h01') || q.includes('icu')) {
      const hosp = state.nodes.find((n) => n.id === 'hospital-metro-01');
      return `### 🏥 Metro Hospital Trauma Center (H01)
* **Status**: **${hosp?.status}**
* **Location**: Sector 2 (Medical District)
* **Dependencies**: Power Substation (P01) and Water Network (W02).
* **Cascade Risk**: Auxiliary diesel backup provides up to 20 minutes of power before ICU systems degrade.`;
    }

    if (q.includes('water pump') || q.includes('w01') || q.includes('intake')) {
      const pump = state.nodes.find((n) => n.id === 'water-pump-01');
      return `### 💧 North Intake Water Pump (W01)
* **Status**: **${pump?.status}**
* **Function**: Primary river water intake lifting raw supply to filtration reservoirs.
* **Dependency**: Requires uninterrupted electrical feed from **Power Substation P01**.`;
    }

    if (q.includes('power') || q.includes('p01') || q.includes('substation') || q.includes('grid')) {
      const pwr = state.nodes.find((n) => n.id === 'power-grid-main');
      return `### ⚡ Central Power Substation #01 (P01)
* **Status**: **${pwr?.status}**
* **Function**: High-voltage regional transmission hub.
* **Impact**: Primary Single Point of Failure (SPOF). Disruption causes cascading outages across water pumps, telecom, and traffic grids.`;
    }

    if (q.includes('scada') || q.includes('telecom') || q.includes('c01')) {
      return `### 📡 Telecommunication & SCADA Backbone (C01)
* **Status**: **${state.nodes.find((n) => n.id === 'telecom-tower-01')?.status}**
* **Function**: Transmits cellular communications and automated remote switching telemetry to mission control.`;
    }

    // 3. Civil / Infrastructure Concepts
    if (q.includes('what is scada') || q.includes('explain scada')) {
      return `**SCADA** (*Supervisory Control and Data Acquisition*) is the control framework that collects real-time sensor measurements (voltage, water pressure, flow rates) and enables operators to remotely trip breakers and open valves.`;
    }

    if (q.includes('cascade depth') || q.includes('what is depth')) {
      return `**Cascade Depth** measures the length of sequential failure chains:
* **Level 0**: Root failure injection (e.g. Substation P01).
* **Level 1**: Direct dependent failure (Water Pump W01 stops).
* **Level 2**: Secondary failure (Water Network W02 loses pressure).
* **Level 3**: Downstream impact (Hospital H01 cooling loops fail).`;
    }

    if (q.includes('microgrid') || q.includes('islanding')) {
      return `**Microgrid Islanding** allows a facility (like a Hospital or Data Center) to disconnect from the failing main grid and operate independently on local battery storage and backup generators.`;
    }

    // 4. Route & Causal Path Solving
    if (q.includes('route') || q.includes('path') || q.includes('chain') || q.includes('propagation') || q.includes('blast') || q.includes('reach')) {
      const target = selectedNode;
      const incoming = state.edges.filter(e => e.target === target.id);
      const outgoing = state.edges.filter(e => e.source === target.id);
      const runtime = state.nodeStates[target.id];

      return `### 🛣️ Causal Route & Propagation Flow: ${target.name} (${target.code})
* **Current Status**: **${runtime?.status || target.status}**
* **Upstream Inbound Dependencies**: ${incoming.length > 0 ? incoming.map(e => {
        const src = state.nodes.find(n => n.id === e.source);
        return `\`${src?.name} (${e.dependencyType}, +${e.propagationDelay}m)\``;
      }).join(', ') : 'Root origin (0 inbound dependencies)'}
* **Downstream Outbound Cascade Flow**: ${outgoing.length > 0 ? outgoing.map(e => {
        const tgt = state.nodes.find(n => n.id === e.target);
        return `\`${tgt?.name} (${e.dependencyType}, +${e.propagationDelay}m)\``;
      }).join(', ') : 'Terminal leaf node (0 downstream links)'}

**Causal Trace Chain**:
${(runtime?.causalChain && runtime.causalChain.length > 1)
  ? runtime.causalChain.map((id, idx) => {
      const n = state.nodes.find(node => node.id === id);
      return `${idx + 1}. **${n?.name || id}** (${n?.code || id}) [Status: ${state.nodeStates[id]?.status || 'HEALTHY'}]`;
    }).join(' ➔ ')
  : `Direct origin point or operating within nominal limits.`}

> **Mitigation Route**: Deploying an **Auxiliary Generator** or **Microgrid Islanding** at \`${target.name}\` severs this dependency chain and halts the cascade immediately.`;
    }

    // 5. Why did a specific node fail? / Root Cause
    if (q.includes('why') || q.includes('cause') || q.includes('root') || q.includes('reason')) {
      const target = selectedNode;

      if (target.status === 'HEALTHY') {
        return `**${target.name} (${target.code})** is currently **HEALTHY** and operating nominally with all upstream utilities within tolerance.`;
      }

      const relevantEvent = state.events.find((e) => e.targetNode === target.id);
      const rootCauses = relevantEvent?.cause?.rootCauses || [];
      const upstreamEdges = state.edges.filter((e) => e.target === target.id);

      return `### 🔍 Root Cause for ${target.name} (${target.code})
* **Current State**: **${target.status}**
* **Root Origin**: ${rootCauses.length > 0 ? `\`${rootCauses.join(', ')}\`` : 'Direct Primary Disruption'}
* **Trigger Mechanism**: ${relevantEvent?.message || relevantEvent?.cause?.reason || 'Upstream dependency failure'}

**Upstream Failure Links**:
${upstreamEdges.map((e) => {
  const src = state.nodes.find((n) => n.id === e.source);
  return `* Fed by **${src?.name}** [Status: ${src?.status}, Propagation Delay: +${e.propagationDelay}m, Failure Impact: ${e.failureImpact}]`;
}).join('\n')}`;
    }

    // 6. Realistic Recovery Times & Engineering Durations
    if (q.includes('recovery time') || q.includes('how long') || q.includes('duration') || q.includes('time to fix')) {
      return `### ⏱️ Real-World Engineering Restoration Benchmarks
Our simulation applies calibrated field restoration durations based on utility industry standards:

1. **Power Substation (P01)**:
   * *Full Step-Down Transformer Replacement*: **~45–60 min** (Heavy crane & busbar oil immersion)
   * *Mobile Transformer Trailer Bypass*: **~25 min** (Rapid field interconnect)
   * *Automatic Diesel Generator Synchronize*: **~10–12 min**
   * *HV Breaker Islanding*: **~2 min** (Remote SCADA trip)

2. **North Intake Water Pump (W01)**:
   * *Turbine Impeller & Seal Rebuild*: **~35–50 min**
   * *Auxiliary Diesel Turbine Engagement*: **~10–15 min**

3. **Apex Telecom & Fiber Backbone (T02)**:
   * *96-Core Precision Optical Fusion Splicing*: **~25–40 min**
   * *UPS Lithium Battery Rack Failover*: **~3–5 min**

4. **Metro Hospital Trauma Center (H01)**:
   * *Trauma Microgrid Islanding*: **~2 min**
   * *Dual Emergency Diesel Gen-Set Synchronization*: **~5–8 min**`;
    }

    // 7. Priority Fix
    if (q.includes('fix') || q.includes('priority') || q.includes('first') || q.includes('recommend') || q.includes('best')) {
      if (failedNodes.length === 0) {
        return `All assets are currently **HEALTHY**. No emergency repairs needed.`;
      }

      const topNode = failedNodes.find((n) => n.criticality === 'CRITICAL') || failedNodes[0];

      return `### ⚡ Top Priority Recovery Action
**Restore ${topNode.name} (\`${topNode.code}\`)**
* **Recommended Strategy**: **Auxiliary Backup Generator** (~10m) or **Engineering Repair** (~${topNode.recoveryTime}m)
* **Cascade Impact**: Restoring ${topNode.code} protects **${state.metrics.affectedServices} downstream assets** (including ${state.nodes.find(n => n.type === 'HOSPITAL')?.name || 'Hospitals'} and Water Networks).`;
    }

    // 8. Cost & Financials
    if (q.includes('cost') || q.includes('budget') || q.includes('money') || q.includes('financial')) {
      const estCost = failedNodes.length * 40 + degradedNodes.length * 15;
      return `### 💰 Recovery Resource & Cost Breakdown
* **Estimated Stabilization Time**: **${state.metrics.recoveryTime > 0 ? `${state.metrics.recoveryTime} min` : '45 min'}**
* **Projected Resource Expenditure**: **$${estCost},000 USD**
* **Crews Mobilized**: **${failedNodes.length * 2 + degradedNodes.length} Specialized Engineering Teams**
* **Operational Availability Ratio**: **${Math.round((healthyCount / state.nodes.length) * 100)}%**`;
    }

    // 9. General Telemetry
    return `### 🌐 JanNagar Grid Operational Telemetry
* **Scenario**: \`${state.scenario.name}\`
* **Virtual Simulation Time**: **T+${formatTime(currentT)}**
* **Systemic Health**: **${state.metrics.systemHealthPercentage}%**
* **Cascade Depth**: **Level ${state.metrics.cascadeDepth}**
* **Active Outages**: ${failedNodes.length} nodes (${failedNodes.map((n) => n.code).join(', ') || 'None'})

Ask me to trace causal routes, explain failure root causes, or calculate realistic restoration times for any node!`;
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: formatTime(currentT),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    let responseText = '';
    if (apiKey) {
      responseText = await callLiveGeminiAPI(text);
    } else {
      await new Promise((r) => setTimeout(r, 350));
      responseText = synthesizeLocalResponse(text);
    }

    const assistantMsg: ChatMessage = {
      id: `ast-${Date.now()}`,
      sender: 'ASSISTANT',
      text: responseText,
      timestamp: formatTime(currentT),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  const quickChips = [
    { label: '🚨 Crisis Status', query: 'Summarize current crisis status and failed assets' },
    { label: '🔍 Why is Asset Down?', query: `Why did ${selectedNode.name} fail or degrade?` },
    { label: '⚡ Best Fix Priority', query: 'What is the top priority fix to stop the cascade?' },
    { label: '💰 Recovery Cost', query: 'What will total recovery cost and how long will it take?' },
    { label: '🛰️ What is SCADA?', query: 'Explain what a SCADA system is' },
  ];

  return (
    <>
      {/* 1. FLOATING ASSISTANT TRIGGER BUTTON (BOTTOM RIGHT) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#495464] hover:bg-[#384252] border-2 border-[#1e293b] text-white font-mono text-xs font-bold shadow-[3px_3px_0px_#1e293b] transition-all hover:scale-105 active:scale-95 group select-none cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-[#334155] flex items-center justify-center border border-[#BBBFCA]">
            <Sparkles className="w-3 h-3 text-white animate-pulse" />
          </div>
          <span>AI ASSISTANT</span>
          <span className="px-1.5 py-0.2 rounded bg-[#1e242d] border border-[#334155] text-[10px] text-slate-200">
            T+{formatTime(currentT)}
          </span>
        </button>
      )}

      {/* 2. ASSISTANT CHAT DRAWER PANEL */}
      {isOpen && (
        <div
          className={`fixed bottom-5 right-5 z-50 w-[94vw] sm:w-[480px] rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-[0_12px_45px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden font-mono transition-all duration-200 select-none ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="h-14 px-4 bg-[var(--card-subtle)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--text-primary)] font-heading tracking-wide">
                    MISSION CONTROL ASSISTANT
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] block truncate max-w-[220px]">
                  T+{formatTime(currentT)} • Health: {state.metrics.systemHealthPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyModal(true)}
                className={`p-1.5 rounded transition-colors ${
                  apiKey
                    ? 'text-[var(--text-primary)] hover:bg-[var(--card-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-subtle)]'
                }`}
                title={apiKey ? 'Gemini API Key Connected' : 'Set Gemini API Key'}
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded hover:bg-[#1e212b] text-slate-400 hover:text-slate-200 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-rose-400 transition-colors"
                title="Close Assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showKeyModal && (
            <div className="absolute inset-0 z-20 bg-[var(--app-bg)]/95 p-5 flex flex-col justify-between backdrop-blur-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[var(--text-primary)]" />
                    <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] font-heading">
                      Google Gemini API Key
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  Enter your Google Gemini API key to enable live AI reasoning. Stored securely in your browser's <code className="text-[var(--text-primary)] bg-[var(--card-subtle)] px-1 py-0.5 rounded">localStorage</code>.
                </p>

                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1 font-semibold">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:border-[#495464] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-color)]">
                {apiKey ? (
                  <button
                    onClick={handleClearApiKey}
                    className="px-2.5 py-1.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-colors"
                  >
                    Clear Key
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 rounded bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-1.5 rounded bg-[#495464] hover:bg-[#334155] border border-[#1e293b] text-white font-bold text-xs shadow-sm"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Body Content (if not minimized) */}
          {!isMinimized && (
            <>
              {/* Quick Action Chips Bar */}
              <div className="p-2.5 bg-[var(--card-subtle)] border-b border-[var(--border-color)] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.query)}
                    className="px-2.5 py-1 rounded bg-[var(--surface-bg)] hover:bg-[#1e212b] border border-[var(--border-color)] hover:border-[#495464] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shrink-0 whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs bg-[var(--app-bg)]">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'USER';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          isUser
                            ? 'bg-[#495464] text-white shadow-sm'
                            : 'bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="whitespace-pre-line break-words text-[11px] leading-relaxed">
                          {msg.text}
                        </div>

                        {!isUser && (
                          <div className="mt-2 pt-1 border-t border-[var(--border-color)] flex items-center justify-between text-[9px] text-[var(--text-tertiary)]">
                            <span>T+{msg.timestamp}</span>
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] pl-8">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#495464] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#495464] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#495464] animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>Assistant thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[var(--surface-bg)] border-t border-[var(--border-color)] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask Assistant any question..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#495464] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="p-2 rounded-lg bg-[#495464] hover:bg-[#334155] disabled:opacity-40 text-white transition-all shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
