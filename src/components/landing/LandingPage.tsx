import React, { useEffect, useRef } from 'react';
import {
  Zap,
  Droplets,
  BatteryWarning,
  Building2,
  Shield,
  CheckCircle,
  ArrowRight,
  Cpu,
  History,
  Activity,
  Waves,
  Radio,
  ExternalLink,
  GitBranch,
  HeartPulse,
  Share2
} from 'lucide-react';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';
import { Scenario } from '../../types/scenario';

interface LandingPageProps {
  onLaunchSimulator: (scenario?: Scenario) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchSimulator }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Network background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class NetworkNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#BBBFCA';
        ctx.fill();
      }
    }

    const nodes: NetworkNode[] = [];
    const connectionDistance = 140;
    for (let i = 0; i < 90; i++) {
      nodes.push(new NetworkNode());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        nodes[i].update();
        nodes[i].draw();

        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const opacity = 1 - dist / connectionDistance;
            ctx.strokeStyle = `rgba(187, 191, 202, ${opacity * 0.35})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLaunchIncident = (scenarioId: string) => {
    const found = PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId) || PREDEFINED_SCENARIOS[0];
    onLaunchSimulator(found);
  };

  return (
    <div className="min-h-screen bg-[#1b2028] text-[#F4F4F2] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#495464] selection:text-white">
      {/* 1. Landing Page Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#1b2028]/90 backdrop-blur-md border-b border-[#495464] h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#495464] border border-[#BBBFCA] flex items-center justify-center text-white shadow-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F4F4F2] font-heading">
            CASCADE CITY
          </span>
        </div>

        <div>
          <button
            onClick={() => onLaunchSimulator()}
            className="bg-[#495464] hover:bg-[#384252] text-white px-6 py-2 rounded-lg font-mono text-xs font-bold border-2 border-[#1e293b] shadow-[3px_3px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            LAUNCH SIMULATOR
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden pt-16">
        {/* Living Network Background Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />
        <div className="scanlines absolute inset-0 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b2028] via-transparent to-transparent z-10" />

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#BBBFCA] bg-[#495464]/30 text-[#F4F4F2] mb-2 shadow-sm">
            <HeartPulse className="w-3.5 h-3.5 text-[#BBBFCA]" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold">
              Synthetic Environment V-0.9.4
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#F4F4F2] leading-[1.1] font-heading">
            Understand How a City <span className="text-rose-400">Fails.</span>
          </h1>

          <p className="text-[#BBBFCA] max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Simulate cascading infrastructure failures, understand their causes, test recovery strategies, and identify the interventions that make urban systems more resilient.
          </p>

          <div className="mt-4">
            <button
              onClick={() => onLaunchSimulator()}
              className="group relative px-8 py-4 bg-[#495464] hover:bg-[#384252] text-white font-mono text-sm font-bold uppercase tracking-wider rounded-lg border-2 border-[#1e293b] shadow-[4px_4px_0px_#1e293b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Problem Section — Cascade Chain */}
      <section className="py-24 px-8 bg-[#0e0e0f] relative z-20 border-t border-[#1f2937]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading text-[#e5e2e3]">
              Cities Don't Fail One System at a Time.
            </h2>
            <p className="text-sm md:text-base text-[#bac9cc] max-w-2xl mx-auto">
              Complex dependencies mean a single point of failure propagates through the urban grid rapidly.
            </p>
          </div>

          {/* Visual Chain Layout */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full overflow-x-auto pb-8 snap-x">
            {/* Node 1: Power Failure */}
            <div className="flex flex-col items-center gap-3 snap-center shrink-0 w-48 relative">
              <div className="w-16 h-16 rounded border-2 border-[#ef4444] bg-[#131314] flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <Zap className="w-8 h-8 text-[#ef4444]" />
              </div>
              <div className="text-center font-mono">
                <div className="text-xs text-[#ef4444] font-bold tracking-wider">
                  POWER FAILURE
                </div>
                <div className="text-[11px] text-[#bac9cc] mt-1">
                  T+00:00:00
                </div>
              </div>
            </div>

            {/* Connector 1 */}
            <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-[#ef4444] to-[#f59e0b] relative">
              <div className="absolute inset-0 w-full h-full opacity-50 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,0.4)_50%)] bg-[length:10px_100%] animate-[flow_1s_linear_infinite]" />
            </div>

            {/* Node 2: Water Pump Degraded */}
            <div className="flex flex-col items-center gap-3 snap-center shrink-0 w-48 relative">
              <div className="w-16 h-16 rounded border border-[#f59e0b] bg-[#2a2a2b] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Droplets className="w-8 h-8 text-[#f59e0b]" />
              </div>
              <div className="text-center font-mono">
                <div className="text-xs text-[#f59e0b] font-bold tracking-wider">
                  WATER PUMP DEGRADED
                </div>
                <div className="text-[11px] text-[#bac9cc] mt-1">
                  T+00:04:12
                </div>
              </div>
            </div>

            {/* Connector 2 */}
            <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-[#f59e0b] to-[#ef4444] relative">
              <div className="absolute inset-0 w-full h-full opacity-50 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,0.4)_50%)] bg-[length:10px_100%] animate-[flow_1s_linear_infinite]" />
            </div>

            {/* Node 3: Backup Exhausted */}
            <div className="flex flex-col items-center gap-3 snap-center shrink-0 w-48 relative">
              <div className="w-16 h-16 rounded border-2 border-[#ef4444] bg-[#131314] flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <div className="absolute inset-0 bg-[#ef4444]/10" />
                <BatteryWarning className="w-8 h-8 text-[#ef4444] relative z-10" />
              </div>
              <div className="text-center font-mono">
                <div className="text-xs text-[#ef4444] font-bold tracking-wider">
                  BACKUP EXHAUSTED
                </div>
                <div className="text-[11px] text-[#bac9cc] mt-1">
                  T+02:15:00
                </div>
              </div>
            </div>

            {/* Connector 3 */}
            <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-[#ef4444] to-[#fbbf24] relative">
              <div className="absolute inset-0 w-full h-full opacity-50 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,0.4)_50%)] bg-[length:10px_100%] animate-[flow_1s_linear_infinite]" />
            </div>

            {/* Node 4: Hospital At Risk */}
            <div className="flex flex-col items-center gap-3 snap-center shrink-0 w-48 relative">
              <div className="w-16 h-16 rounded border-2 border-[#fbbf24] bg-[#201f20] flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <Building2 className="w-8 h-8 text-[#fbbf24]" />
              </div>
              <div className="text-center font-mono">
                <div className="text-xs text-[#fbbf24] font-bold tracking-wider">
                  HOSPITAL AT RISK
                </div>
                <div className="text-[11px] text-[#bac9cc] mt-1">
                  T+02:15:05
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Resilience Advisor / Intervention Section */}
      <section className="py-24 px-8 bg-[#131314] border-y border-[#1f2937] relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[#BBBFCA] mb-4">
                <Shield className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                  Resilience Advisor
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading text-[#F4F4F2] leading-tight">
                Don't Just Watch the Cascade.<br />Find Where to Intervene.
              </h2>
              <p className="text-[#BBBFCA] mb-8 leading-relaxed font-sans">
                The engine automatically identifies critical nodes in the dependency graph. Test interventions like adding localized generation or rerouting supply chains to observe the impact on systemic recovery times.
              </p>
              <ul className="space-y-4 font-mono text-xs text-[#F4F4F2]">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#BBBFCA] shrink-0" />
                  <span>Identify single points of failure instantly.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#BBBFCA] shrink-0" />
                  <span>Simulate physical mitigations (e.g., flood walls, backups).</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#BBBFCA] shrink-0" />
                  <span>Generate cost-benefit reports based on downtime reduction.</span>
                </li>
              </ul>
            </div>

            {/* Comparison Bento */}
            <div className="bg-[#1b2028] border border-[#495464] rounded-lg p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {/* Baseline */}
                <div className="bg-[#232a35] p-4 border border-[#495464] rounded flex flex-col gap-4 font-mono">
                  <div className="flex justify-between items-center border-b border-[#495464] pb-2">
                    <span className="text-xs text-[#BBBFCA]">
                      SCENARIO_BASE
                    </span>
                    <span className="text-rose-400 text-xs font-bold">
                      CRITICAL
                    </span>
                  </div>
                  <div className="h-24 flex items-end gap-1.5">
                    <div className="w-1/6 bg-emerald-500 h-[90%]" />
                    <div className="w-1/6 bg-emerald-500 h-[80%]" />
                    <div className="w-1/6 bg-amber-500 h-[40%]" />
                    <div className="w-1/6 bg-rose-500 h-[10%]" />
                    <div className="w-1/6 bg-rose-500 h-[5%]" />
                    <div className="w-1/6 bg-rose-500 h-[2%]" />
                  </div>
                  <div className="text-xs flex justify-between pt-2 border-t border-[#495464]">
                    <span className="text-[#BBBFCA]">RECOVERY</span>
                    <span className="text-rose-400 font-bold">72h+</span>
                  </div>
                </div>

                {/* Intervention */}
                <div className="bg-[#232a35] p-4 border border-[#BBBFCA] rounded flex flex-col gap-4 relative shadow-sm font-mono">
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#BBBFCA] rounded-full animate-ping" />
                  <div className="flex justify-between items-center border-b border-[#495464] pb-2">
                    <span className="text-xs text-[#F4F4F2] font-bold">
                      WITH_GENERATOR_NODE_B
                    </span>
                    <span className="text-emerald-400 text-xs font-bold">
                      STABLE
                    </span>
                  </div>
                  <div className="h-24 flex items-end gap-1.5">
                    <div className="w-1/6 bg-emerald-500 h-[90%]" />
                    <div className="w-1/6 bg-emerald-500 h-[85%]" />
                    <div className="w-1/6 bg-amber-500 h-[60%]" />
                    <div className="w-1/6 bg-emerald-500 h-[75%]" />
                    <div className="w-1/6 bg-emerald-500 h-[80%]" />
                    <div className="w-1/6 bg-emerald-500 h-[95%]" />
                  </div>
                  <div className="text-xs flex justify-between pt-2 border-t border-[#495464]">
                    <span className="text-[#BBBFCA]">RECOVERY</span>
                    <span className="text-emerald-400 font-bold">4h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Historical Incident Library */}
      <section className="py-24 px-8 bg-[#1b2028]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-heading text-[#F4F4F2]">
                Historical Incident Library
              </h2>
              <p className="text-sm text-[#BBBFCA] font-sans">
                Load verified configurations derived from real-world events.
              </p>
            </div>
            <button
              onClick={() => onLaunchSimulator()}
              className="hidden md:flex items-center gap-1.5 text-[#F4F4F2] font-mono text-xs hover:underline font-bold"
            >
              <span>VIEW ALL MODELS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Texas 2021 */}
            <div
              onClick={() => handleLaunchIncident('scenario-winter-freeze')}
              className="group border border-[#495464] bg-[#232a35] rounded overflow-hidden hover:border-[#BBBFCA] transition-colors cursor-pointer"
            >
              <div
                className="bg-cover bg-center w-full h-48 border-b border-[#495464] relative filter grayscale group-hover:grayscale-0 transition-all duration-500"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbPywwAgkTdnGMbOjVA6HaSfmFy00jZ3PYSgcfrwYGUOjZeTAMKo8Cb0mRgrS9kDpwKiw7fyDLjxAghHwwmRXCMe0MTUD_KBhF3oxYkbNY6ewcR-4gbOz84UTF6EnrUgIBOMWmnuvrQ_PFybtwBna9zEDWZ0afemAY6c7fx3dpTy5d9dMsWv5l5LiiG1rA6XiwC980kwia1DjNLCKOuakg5WEhIGbm8pE_O9Mdy_FpDJ3_KuPOaPnUEw')",
                }}
              >
                <div className="absolute top-2 right-2 bg-[#1b2028]/80 backdrop-blur px-2 py-1 rounded font-mono text-[10px] text-[#F4F4F2]">
                  TEXAS_2021
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-[#F4F4F2] font-heading">
                  Winter Storm Grid Collapse
                </h3>
                <p className="text-sm text-[#BBBFCA] mb-4 line-clamp-2 leading-relaxed font-sans">
                  Simulate the cascading failure of natural gas pipelines leading to state-wide electrical generation failure.
                </p>
                <div className="flex gap-2">
                  <span className="text-xs font-mono px-2 py-1 bg-[#1b2028] rounded text-[#BBBFCA] border border-[#495464]">
                    POWER
                  </span>
                  <span className="text-xs font-mono px-2 py-1 bg-[#1b2028] rounded text-[#BBBFCA] border border-[#495464]">
                    WATER
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Northeast 2003 */}
            <div
              onClick={() => handleLaunchIncident('scenario-power-substation')}
              className="group border border-[#495464] bg-[#232a35] rounded overflow-hidden hover:border-[#BBBFCA] transition-colors cursor-pointer"
            >
              <div
                className="bg-cover bg-center w-full h-48 border-b border-[#495464] relative filter grayscale group-hover:grayscale-0 transition-all duration-500"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBJ914KZA8Z3cFdoP4nQkn5HuVGWLPSX8GcPxC-NQKVoWlBVkPdBexN2QJ22_yarPmxeX1I8loQhZH2Xs6eplMTCRs-RU2TJE4GT1ojUh8KhisbkuVIfu50U58EFuMd3W3x5NjJd2nWemvUqLc8ymwO2Ivg3SPUZFWQVM91NTjfdSehGpliLmKTppAmRfyUr7dBmjo03pU7nUcRmKnPhdBCEQV_Ld4no4Y8fM7M9KXGaEj3xOXACGX1tg')",
                }}
              >
                <div className="absolute top-2 right-2 bg-[#1b2028]/80 backdrop-blur px-2 py-1 rounded font-mono text-[10px] text-[#F4F4F2]">
                  NE_2003
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-[#F4F4F2] font-heading">
                  Northeast 2003 Blackout
                </h3>
                <p className="text-sm text-[#BBBFCA] mb-4 line-clamp-2 leading-relaxed font-sans">
                  Analyze the software bug in the alarm system that prevented operators from redistributing load in time.
                </p>
                <div className="flex gap-2">
                  <span className="text-xs font-mono px-2 py-1 bg-[#1b2028] rounded text-[#BBBFCA] border border-[#495464]">
                    GRID
                  </span>
                  <span className="text-xs font-mono px-2 py-1 bg-[#1b2028] rounded text-[#BBBFCA] border border-[#495464]">
                    COMMS
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Storm Surge Inundation */}
            <div
              onClick={() => handleLaunchIncident('scenario-monsoon-with-recovery')}
              className="group border border-[#495464] bg-[#232a35] rounded overflow-hidden hover:border-[#BBBFCA] transition-colors cursor-pointer"
            >
              <div
                className="bg-cover bg-center w-full h-48 border-b border-[#495464] relative filter grayscale group-hover:grayscale-0 transition-all duration-500"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBtCFnV-eMoLPGe_TQgXfSEjyPoDyS8Wwrg-cYl10-x7jsf-GneyKDrfa691abFet_ldQRjXlIMK_vyC4ZhwG2zqF0naJGlcBw7dOwYcRqUrt4rjmveioaiMr2F-irAsF6bLX8pKEQgwKxbsw3EKDR7vnwsK2ZK8rUU8mgzF3zsUMTv83SV6LFd6BuFPRATAUG0yGbx3l0cyVbzz9I8Qv_K37jIXYnKKnP0A9U5AqHKPGFO6ci1BfSkTg')",
                }}
              >
                <div className="absolute top-2 right-2 bg-[#1b2028]/80 backdrop-blur px-2 py-1 rounded font-mono text-[10px] text-[#F4F4F2]">
                  COASTAL_FL
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-[#F4F4F2] font-heading">
                  Storm Surge Inundation
                </h3>
                <p className="text-sm text-[#BBBFCA] mb-4 line-clamp-2 leading-relaxed font-sans">
                  Model the physical destruction of substations due to saltwater intrusion and subsequent transport network failure.
                </p>
                <div className="flex gap-2">
                  <span className="text-xs font-mono px-2 py-1 bg-[#1b2028] rounded text-[#BBBFCA] border border-[#495464]">
                    TRANSIT
                  </span>
                  <span className="text-xs font-mono px-2 py-1 bg-[#1b2028] rounded text-[#BBBFCA] border border-[#495464]">
                    LOGISTICS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Tech Credibility Bar */}
      <section className="py-16 px-8 bg-[#232a35] border-t border-[#495464]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-3 text-[#BBBFCA]">
            <Cpu className="w-5 h-5 text-[#F4F4F2]" />
            <span className="font-mono text-sm uppercase font-bold tracking-wider">
              Deterministic Execution
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#BBBFCA]">
            <Activity className="w-5 h-5 text-[#F4F4F2]" />
            <span className="font-mono text-sm uppercase font-bold tracking-wider">
              Event-Driven Engine
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#BBBFCA]">
            <History className="w-5 h-5 text-[#F4F4F2]" />
            <span className="font-mono text-sm uppercase font-bold tracking-wider">
              Fully Replayable Logs
            </span>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[#1b2028] h-10 border-t border-[#495464] flex justify-between items-center px-8 w-full text-xs font-mono text-[#BBBFCA]">
        <div className="text-[#F4F4F2] font-semibold">
          SYNTHETIC MODEL DISCLAIMER | ENGINE V4.0.2
        </div>
        <div className="flex gap-4">
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>
    </div>
  );
};
