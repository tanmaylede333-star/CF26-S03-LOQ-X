import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User } from '@supabase/supabase-js';
import { Sidebar, ActiveNavTab } from './components/layout/Sidebar';
import { MissionTopBar } from './components/layout/MissionTopBar';
import { LandingPage } from './components/landing/LandingPage';
import { SimulatorView } from './components/views/SimulatorView';
import { SettingsView } from './components/views/SettingsView';
import { ResilienceAdvisorView } from './components/views/ResilienceAdvisorView';
import { ScenarioView } from './components/views/ScenarioView';
import { ImpactAnalysisView } from './components/views/ImpactAnalysisView';
import { FailureInjectionModal } from './components/failure/FailureInjectionModal';
import { RecoveryModal } from './components/recovery/RecoveryModal';
import { AuthModal } from './components/auth/AuthModal';
import { GeminiChatDrawer } from './components/chat/GeminiChatDrawer';
import { AuthService } from './services/authService';
import { useSimulation } from './hooks/useSimulation';
import { Scenario } from './types/scenario';

export function App() {
  const [viewMode, setViewMode] = useState<'LANDING' | 'DASHBOARD'>('LANDING');
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('SIMULATOR');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    AuthService.getCurrentUser().then((user) => setCurrentUser(user));
    const { unsubscribe } = AuthService.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => unsubscribe();
  }, []);

  const {
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
  } = useSimulation(undefined, currentUser?.id);

  // Modals state
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Sync theme changes to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Confetti trigger when system reaches 100% health after being disrupted
  useEffect(() => {
    if (
      state.status === 'COMPLETED' &&
      state.metrics.systemHealthPercentage === 100 &&
      state.events.length > 3
    ) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#495464', '#BBBFCA', '#F4F4F2', '#10b981'],
      });
    }
  }, [state.status, state.metrics.systemHealthPercentage, state.events.length]);

  const handleLaunchSimulator = (scenario?: Scenario) => {
    if (scenario) {
      loadScenario(scenario);
    }
    setViewMode('DASHBOARD');
    setActiveTab('SIMULATOR');
  };

  const handleLaunchScenarioFromBuilder = (scenario: Scenario) => {
    loadScenario(scenario);
    setActiveTab('SIMULATOR');
    start();
  };

  const getTabTitle = (tab: ActiveNavTab) => {
    switch (tab) {
      case 'SIMULATOR':
        return 'SIMULATION EXPERIMENT ENGINE & GIS MAP';
      case 'SCENARIOS':
        return 'INCIDENT SCENARIO LAB & CONFIGURATION';
      case 'IMPACT_ANALYSIS':
        return 'CAUSAL IMPACT & PROPAGATION ANALYTICS';
      case 'RESILIENCE_ADVISOR':
        return 'RESILIENCE ADVISOR & STRATEGY EVALUATION';
      case 'SETTINGS':
        return 'SYSTEM PREFERENCES & ENGINE CONFIG';
      default:
        return 'MISSION CONTROL';
    }
  };

  // If in Landing mode, render the 1st landing page!
  if (viewMode === 'LANDING') {
    return <LandingPage onLaunchSimulator={handleLaunchSimulator} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[var(--app-bg)] text-[var(--text-primary)] overflow-hidden select-none font-body-md transition-colors duration-200">
      {/* 1. Streamlined Sidebar Navigation with User Auth & Theme Toggle */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onReturnToLanding={() => setViewMode('LANDING')}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 2. Main Mission Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--app-bg)] transition-colors duration-200">
        {/* Top Control Bar */}
        <MissionTopBar
          title={getTabTitle(activeTab)}
          state={state}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onNavigateToScenarios={() => setActiveTab('SCENARIOS')}
        />

        {/* Dynamic View Content (Streamlined 4-View Architecture) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--app-bg)]">
          {activeTab === 'SIMULATOR' && (
            <SimulatorView
              state={state}
              onStart={start}
              onPause={pause}
              onStep={step}
              onReset={reset}
              onReplay={replay}
              onSetSpeed={setSpeed}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onScrub={setScrubTime}
              onApplyRecovery={applyRecovery}
              onInjectFailure={injectFailure}
              onOpenFailureModal={() => setIsFailureModalOpen(true)}
              onOpenRecoveryModal={(id) => {
                if (id) setSelectedNodeId(id);
                setIsRecoveryModalOpen(true);
              }}
            />
          )}

          {activeTab === 'SCENARIOS' && (
            <ScenarioView
              activeScenario={activeScenario}
              onSelectScenario={loadScenario}
              onLaunchSimulation={handleLaunchScenarioFromBuilder}
              userId={currentUser?.id}
            />
          )}

          {activeTab === 'IMPACT_ANALYSIS' && (
            <ImpactAnalysisView
              state={state}
              onSelectNode={(id) => setSelectedNodeId(id)}
            />
          )}

          {activeTab === 'RESILIENCE_ADVISOR' && (
            <ResilienceAdvisorView
              scenario={activeScenario}
              onDeployStrategy={(action) => {
                applyRecovery(action);
                setActiveTab('SIMULATOR');
              }}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <SettingsView
              state={state}
              onResetState={reset}
              onUpdateParameters={updateSimulationParameters}
              onSetSpeed={setSpeed}
            />
          )}
        </div>

        {/* Bottom Technical Footer */}
        <footer className="h-8 bg-[var(--sidebar-bg)] border-t border-[var(--border-color)] px-5 flex items-center justify-between text-[10px] font-mono text-[var(--text-tertiary)] shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('LANDING')}
              className="text-[var(--text-primary)] hover:opacity-80 font-bold"
            >
              ← LANDING OVERVIEW
            </button>
            <span>|</span>
            <span>© 2024 CASCADE CITY INFRASTRUCTURE</span>
            <span>|</span>
            <span className="text-[var(--text-secondary)]">
              {currentUser ? `CLOUD PERSISTENCE: ${currentUser.email}` : 'OFFLINE STORAGE / GUEST'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[var(--text-primary)] hover:opacity-80 font-bold"
            >
              {currentUser ? 'ACCOUNT SETTINGS' : 'CONNECT CLOUD'}
            </button>
            <span className="hover:text-[var(--text-primary)] cursor-pointer">SYSTEM LOGS</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer">COMPLIANCE</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer">API DOCS</span>
          </div>
        </footer>
      </div>

      {/* Interactive Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={setCurrentUser}
      />

      <FailureInjectionModal
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        state={state}
        onInjectFailures={injectMultipleFailures}
      />

      <RecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        state={state}
        onApplyRecovery={applyRecovery}
      />

      {/* AI Mission Control Assistant (Gemini 2.5 Flash) */}
      <GeminiChatDrawer
        state={state}
        onApplyRecovery={applyRecovery}
        onSelectNode={setSelectedNodeId}
      />
    </div>
  );
}

export default App;
