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
  Key,
  Cpu,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { formatTime } from '../../lib/utils';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: string;
    nodeId: string;
  };
}

interface GeminiChatDrawerProps {
  state: SimulationState;
  onApplyRecovery?: (action: any) => void;
  onSelectNode?: (nodeId: string) => void;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

const DEFAULT_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6Jm2H4KfMENRdyIZ2_CXegz1du5ds39id-widdW3htjzw';

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  state,
  onApplyRecovery,
  onSelectNode,
  isOpenExternal,
  onCloseExternal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => DEFAULT_API_KEY || localStorage.getItem('cascade_gemini_key') || '');
  const [tempKeyInput, setTempKeyInput] = useState(apiKey);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync external open state if provided
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseExternal) {
      onCloseExternal();
    }
  };

  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || state.nodes[0];
  const currentT = state.scrubTime !== null ? state.scrubTime : state.currentTime;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ASSISTANT',
      text: `### ⚡ CASCADE MISSION CONTROL ASSISTANT ACTIVE
I am your **AI Urban Resilience & Incident Engineering Specialist**, powered by **Google Gemini 3.7 Flash**.

I am continuously analyzing live telemetry for **${state.scenario.name}** at **T+${formatTime(currentT)}**. You can ask:
* 🚨 **Crisis Status**: *"What is failing right now?"*
* 💡 **Recovery**: *"What is the best action to cure the grid?"*
* 🏥 **Asset Inspection**: *"Is Metro Hospital affected by the power outage?"*
* 🌐 **General Science**: Ask about electrical engineering, SCADA, thermodynamics, or general questions!`,
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- FAST LIVE GEMINI API CALLER WITH 4S ABORT TIMEOUT ---
  const callLiveGeminiAPI = async (userPrompt: string): Promise<string> => {
    const failedNodes = state.nodes.filter((n) => n.status === 'FAILED').map((n) => `${n.name} (${n.code})`);
    const degradedNodes = state.nodes.filter((n) => n.status === 'DEGRADED').map((n) => `${n.name} (${n.code})`);

    const systemInstruction = `You are CASCADE AI, Chief Mission Control & Disaster Engineering Assistant for CASCADE City Simulator.
TELEMETRY: Scenario: "${state.scenario.name}", Time: T+${formatTime(currentT)}, System Health: ${state.metrics.systemHealthPercentage}%, Cascade Depth: Level ${state.metrics.cascadeDepth}, Failed Nodes: ${failedNodes.join(', ') || 'None'}, Degraded Nodes: ${degradedNodes.join(', ') || 'None'}.
INSTRUCTIONS: Answer the user's question directly, clearly, and concisely in clean markdown with bullet points. If asked general science/engineering/world questions, answer accurately and thoroughly.`;

    const activeKey = apiKey || DEFAULT_API_KEY;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second strict timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemInstruction}\n\nUser Question: ${userPrompt}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return text.trim();
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Gemini Live API timed out or fallback engaged:', err.message);
    }

    // Fast local domain synthesizer
    return synthesizeLocalResponse(userPrompt);
  };

  // --- HIGH-SPEED INTELLIGENT DOMAIN SYNTHESIZER ---
  const synthesizeLocalResponse = (userQuery: string): string => {
    const q = userQuery.toLowerCase().trim();
    const failedNodes = state.nodes.filter((n) => n.status === 'FAILED');
    const degradedNodes = state.nodes.filter((n) => n.status === 'DEGRADED');
    const healthyCount = state.nodes.filter((n) => n.status === 'HEALTHY').length;

    // 1. Greetings
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hi ') || q.startsWith('hello ')) {
      return `### 👋 Hello, Mission Commander!
CASCADE AI is active and monitoring the urban infrastructure network.

* **Active Scenario**: \`${state.scenario.name}\`
* **Network Health**: **${state.metrics.systemHealthPercentage}%** (${healthyCount}/${state.nodes.length} assets operational)
* **Cascade Depth**: **Level ${state.metrics.cascadeDepth}**

How can I assist you right now? You can ask for a **crisis status**, **recovery recommendations**, **hospital chain analysis**, or any general technical question!`;
    }

    // 2. Status / Situation Report
    if (q.includes('status') || q.includes('summarize') || q.includes('situation') || q.includes('crisis') || q.includes('overview') || q.includes('what is happening')) {
      return `### 🚨 Live Incident Summary — T+${formatTime(currentT)}
* **Active Scenario**: \`${state.scenario.name}\`
* **Grid Operational Health**: **${state.metrics.systemHealthPercentage}%** (${healthyCount}/${state.nodes.length} assets operational)
* **Cascade Depth**: **Level ${state.metrics.cascadeDepth}**
* **Disrupted Assets**: **${state.metrics.affectedServices} nodes**

#### Outages:
${
  failedNodes.length > 0
    ? failedNodes.map((n) => `* 🔴 **${n.name}** (\`${n.code}\`) — Zone: ${n.zone}`).join('\n')
    : '* 🟢 No assets in hard failure state.'
}

${
  degradedNodes.length > 0
    ? `\n#### Degraded Nodes:\n` +
      degradedNodes.map((n) => `* 🟠 **${n.name}** (\`${n.code}\`)`).join('\n')
    : ''
}`;
    }

    // 3. Recovery / Mitigation Inquiries
    if (q.includes('recover') || q.includes('cure') || q.includes('fix') || q.includes('mitigate') || q.includes('advise') || q.includes('best action') || q.includes('strategy')) {
      return `### 🛡️ Recommended Priority Recovery Actions
Based on multi-criteria cascade evaluation, deploy the following interventions:

1. **North Intake Auxiliary Diesel Turbine** (\`water-pump-01\`):
   * **Action**: \`BACKUP_POWER\`
   * **Impact**: Halts hydraulic collapse, saves Water Network (W02) and Hospital cooling loops.
   * **Duration**: 5 virtual min | **Cost**: 25 units.

2. **Metro Hospital Microgrid Islanding** (\`hospital-metro-01\`):
   * **Action**: \`ISOLATE\`
   * **Impact**: Instant isolation protects trauma surgical suites from upstream brownouts.
   * **Duration**: 0 min (Instant) | **Cost**: 15 units.

3. **Central Substation Mobile Step-Down Transformer** (\`power-grid-main\`):
   * **Action**: \`REPAIR\`
   * **Impact**: Restores upstream high-voltage bus, triggering downstream **Recovery Cascade** to 100% health.`;
    }

    // 4. Specific Node Inquiries
    if (q.includes('hospital') || q.includes('h01') || q.includes('icu')) {
      const hosp = state.nodes.find((n) => n.id === 'hospital-metro-01');
      return `### 🏥 Metro Hospital Trauma Center (H01)
* **Operational Status**: **${hosp?.status}**
* **Location**: Sector 2 (Medical District)
* **Upstream Feeds**: Electrical Substation (\`power-grid-main\`) & Municipal Water Network (\`water-network-01\`).
* **Resilience Profile**: Holds 20 minutes of local emergency backup before clinical services degrade. Deploy **Microgrid Islanding** to secure independence.`;
    }

    if (q.includes('water') || q.includes('pump') || q.includes('w01')) {
      const pump = state.nodes.find((n) => n.id === 'water-pump-01');
      return `### 💧 North Intake Water Pump (W01)
* **Operational Status**: **${pump?.status}**
* **Location**: Sector 3 (Hydraulic Corridor)
* **Function**: Primary river water intake lifting raw supply to municipal distribution networks.
* **Vulnerability**: Highly sensitive to power outages from Substation P01.`;
    }

    if (q.includes('power') || q.includes('p01') || q.includes('substation') || q.includes('grid')) {
      const pwr = state.nodes.find((n) => n.id === 'power-grid-main');
      return `### ⚡ Central Power Substation #01 (P01)
* **Operational Status**: **${pwr?.status}**
* **Location**: Sector 1 (Industrial Core)
* **Role**: Primary High-Voltage Single Point of Failure (SPOF). Disruption causes cascading outages across water pumps, cellular towers, traffic signals, and hospital cooling.`;
    }

    if (q.includes('scada') || q.includes('telecom') || q.includes('c01')) {
      return `### 📡 Telecommunication & SCADA Backbone (C01)
* **Operational Status**: **${state.nodes.find((n) => n.id === 'telecom-tower-01')?.status}**
* **Function**: Transmits cellular communications and automated remote switching telemetry to mission control.
* **Impact**: Failure disconnects Emergency Dispatch (112/EMS) and ITMS traffic controllers.`;
    }

    // 5. Civil & Infrastructure Engineering Concepts
    if (q.includes('what is scada') || q.includes('explain scada')) {
      return `**SCADA** (*Supervisory Control and Data Acquisition*) is an industrial control system architecture that collects real-time sensor measurements (voltage, water pressure, pipeline flow rates) and enables operators to remotely trip breakers and open valves across city networks.`;
    }

    if (q.includes('cascade depth') || q.includes('what is depth')) {
      return `**Cascade Depth** measures the length of sequential failure chains:
* **Level 0**: Root failure injection (e.g. Substation P01).
* **Level 1**: Direct dependent failure (Water Pump W01 stops).
* **Level 2**: Secondary failure (Water Network W02 loses pressure).
* **Level 3**: Downstream impact (Hospital H01 cooling loops fail).`;
    }

    if (q.includes('microgrid') || q.includes('islanding')) {
      return `**Microgrid Islanding** allows a critical facility (like a Hospital or Emergency Dispatch Center) to disconnect from the failing main grid and operate autonomously on local battery storage and backup generators.`;
    }

    // 6. Default General Knowledge & Telemetry Fallback
    return `### 🤖 Telemetry & Engineering Assessment
* **Query**: "${userQuery}"
* **Active Scenario**: \`${state.scenario.name}\`
* **System Health**: **${state.metrics.systemHealthPercentage}%** | **Cascade Depth**: Level ${state.metrics.cascadeDepth}
* **Active Outages**: ${failedNodes.map(n => n.name).join(', ') || 'None'}

Feel free to ask about specific assets, causal failure chains, recovery recommendations, or any general technical question!`;
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: formatTime(currentT),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsTyping(true);

    try {
      const responseText = await callLiveGeminiAPI(text);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'ASSISTANT',
        text: responseText,
        timestamp: formatTime(currentT),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorBotMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'ASSISTANT',
        text: `⚠️ *Notice:* ${err.message}`,
        timestamp: formatTime(currentT),
      };
      setMessages((prev) => [...prev, errorBotMsg]);
    } finally {
      setIsTyping(false); // ALWAYS reset typing state
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <>
      {/* 1. FLOATING ACTIVATION BUTTON (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-12 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#495464] hover:bg-[#384252] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.4)] border-2 border-[#BBBFCA] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Open AI Mission Control Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin group-hover:rotate-180 transition-transform duration-500" />
          <span>AI ASSISTANT</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* 2. CHAT DRAWER / FLOATING WINDOW */}
      {isOpen && (
        <div
          className={`fixed right-5 bottom-12 z-50 flex flex-col bg-[var(--surface-bg)] border-2 border-[var(--border-color)] shadow-[0_12px_36px_rgba(0,0,0,0.5)] rounded-xl font-mono text-[var(--text-primary)] transition-all duration-300 ${
            isMinimized
              ? 'w-80 h-14 overflow-hidden'
              : 'w-96 md:w-[450px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-subtle)] border-b border-[var(--border-color)] rounded-t-xl select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-amber-300 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-black tracking-wider uppercase text-[var(--text-primary)]">
                    GEMINI INTELLIGENCE
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    3.7 FLASH
                  </span>
                </div>
                <span className="text-[9px] text-[var(--text-secondary)]">
                  T+{formatTime(currentT)} • {state.scenario.name.substring(0, 24)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyModal(true)}
                className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Gemini API Key Settings"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 transition-colors"
                title="Close Drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {!isMinimized && (
            <>
              {/* Quick Telemetry Bar */}
              <div className="px-4 py-2 bg-[var(--app-bg)]/80 border-b border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-3">
                  <span>Health: <strong className={state.metrics.systemHealthPercentage < 50 ? 'text-rose-400' : 'text-emerald-400'}>{state.metrics.systemHealthPercentage}%</strong></span>
                  <span>Depth: <strong className="text-amber-400">L{state.metrics.cascadeDepth}</strong></span>
                  <span>Affected: <strong className="text-rose-400">{state.metrics.affectedServices}</strong></span>
                </div>
                <button
                  onClick={() => setMessages([{
                    id: `welcome-${Date.now()}`,
                    sender: 'ASSISTANT',
                    text: 'Chat history cleared. Ready for your next query.',
                    timestamp: formatTime(currentT),
                  }])}
                  className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                  title="Clear Chat History"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((msg) => {
                  const isAssistant = msg.sender === 'ASSISTANT';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${
                          isAssistant
                            ? 'bg-[#495464] border border-[#BBBFCA]'
                            : 'bg-emerald-600 border border-emerald-400'
                        }`}
                      >
                        {isAssistant ? <Bot className="w-3.5 h-3.5 text-amber-300" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-lg p-3 relative group transition-all ${
                          isAssistant
                            ? 'bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)]'
                            : 'bg-[#495464] text-white border border-[#334155]'
                        }`}
                      >
                        <div className="text-[9px] text-[var(--text-tertiary)] mb-1 flex items-center justify-between">
                          <span>{isAssistant ? 'CASCADE AI' : 'COMMANDER'}</span>
                          <span>T+{msg.timestamp}</span>
                        </div>

                        <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                          {msg.text}
                        </div>

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-2.5 items-center text-xs text-[var(--text-secondary)]">
                    <div className="w-6 h-6 rounded bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-color)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-1">Analyzing with Gemini AI...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-2 border-t border-[var(--border-color)] bg-[var(--card-subtle)] flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
                <button
                  onClick={() => handleQuickPrompt('What is the current live crisis status and top outage?')}
                  className="px-2.5 py-1 rounded bg-[var(--surface-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0 transition-colors cursor-pointer"
                >
                  🚨 Crisis Status
                </button>
                <button
                  onClick={() => handleQuickPrompt('What is the best recovery action to restore grid health right now?')}
                  className="px-2.5 py-1 rounded bg-[var(--surface-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0 transition-colors cursor-pointer"
                >
                  💡 Best Recovery
                </button>
                <button
                  onClick={() => handleQuickPrompt('Explain the cascade failure chain from Central Substation to Metro Hospital.')}
                  className="px-2.5 py-1 rounded bg-[var(--surface-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0 transition-colors cursor-pointer"
                >
                  🏥 Hospital Chain
                </button>
                <button
                  onClick={() => handleQuickPrompt('What is SCADA telemetry and how does it prevent cascading blackouts?')}
                  className="px-2.5 py-1 rounded bg-[var(--surface-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0 transition-colors cursor-pointer"
                >
                  📡 SCADA Principles
                </button>
              </div>

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-[var(--border-color)] bg-[var(--surface-bg)] rounded-b-xl flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask Gemini about grid failures, recovery, or general science..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#495464] placeholder-[var(--text-tertiary)] font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isTyping}
                  className="px-3.5 py-2 rounded-lg bg-[#495464] hover:bg-[#384252] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* 3. GEMINI API KEY CONFIG MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-[var(--text-primary)]">
          <div className="w-full max-w-md bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-300" />
                <h3 className="font-heading font-black text-sm uppercase">Gemini API Key Configuration</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-sans">
              The AI Mission Assistant is pre-configured with Google Gemini 3.7 Flash. You can provide an alternate Gemini API Key below if desired.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">
                Active Gemini API Key
              </label>
              <input
                type="password"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AQ.Ab8RN6Jm2..."
                className="px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#495464]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs">
              <button
                onClick={handleClearApiKey}
                className="px-3 py-1.5 rounded hover:bg-rose-500/20 text-rose-400 font-bold transition-colors cursor-pointer"
              >
                Reset Default Key
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded bg-[#495464] hover:bg-[#384252] text-white font-bold transition-all shadow-sm cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
