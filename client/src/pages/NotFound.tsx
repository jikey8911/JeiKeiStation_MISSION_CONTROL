import React, { useState, useEffect } from "react";
import { 
  TriangleAlert, 
  Bell, 
  Settings, 
  LogOut, 
  Unlock, 
  Thermometer, 
  RefreshCw, 
  Server, 
  Activity, 
  ShieldAlert, 
  Lock 
} from "lucide-react";

export default function NotFound() {
  // Custom colors defined in the design
  const colors = {
    primary: "#FF003C",
    primaryDim: "#5c0016",
    backgroundDark: "#050505",
    surfaceDark: "#0a0a0a",
    surfaceBorder: "#330b14",
  };

  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'warning' | 'error' | 'critical' | 'fatal' }>>([]);

  useEffect(() => {
    const now = new Date();
    const formatTime = (date: Date) => `[${date.toLocaleTimeString('en-GB', { hour12: false })}]`;
    const path = window.location.pathname;

    setLogs([
      { time: formatTime(new Date(now.getTime() - 2000)), message: "System heartbeat detected...", type: 'info' },
      { time: formatTime(new Date(now.getTime() - 1500)), message: `Initiating request for: ${path}`, type: 'info' },
      { time: formatTime(new Date(now.getTime() - 800)), message: "Resolving routing table...", type: 'info' },
      { time: formatTime(new Date(now.getTime() - 400)), message: `WARNING: Route '${path}' not mapped in sector.`, type: 'warning' },
      { time: formatTime(new Date(now.getTime() - 100)), message: `ALERT: 404_NOT_FOUND. Resource unavailable.`, type: 'error' },
      { time: formatTime(now), message: `CRITICAL: NAVIGATION FAILURE. CLIENT: ${navigator.userAgent.substring(0, 50)}...`, type: 'critical' },
      { time: formatTime(new Date(now.getTime() + 500)), message: "SYSTEM HALTED. MANUAL OVERRIDE REQUIRED.", type: 'fatal' },
    ]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#050505] text-slate-100 font-sans selection:bg-[#FF003C] selection:text-white">
      {/* Styles for custom fonts and scrollbars */}
      <style>{`
        :root {
          --font-display: 'Space Grotesk', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }
        .font-display { font-family: var(--font-display); }
        .font-mono { font-family: var(--font-mono); }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #330b14; }
        ::-webkit-scrollbar-thumb:hover { background: #FF003C; }
        
        .text-glow { text-shadow: 0 0 10px rgba(255, 0, 60, 0.5); }
        .border-glow { box-shadow: 0 0 15px rgba(255, 0, 60, 0.2) inset; }
        .bg-grid-pattern {
          background-image: linear-gradient(to right, #1a0508 1px, transparent 1px), linear-gradient(to bottom, #1a0508 1px, transparent 1px);
        }
        .bg-vignette-red {
          background-image: radial-gradient(circle, transparent 40%, rgba(255, 0, 60, 0.15) 100%);
        }
      `}</style>

      {/* Background Grid & Vignette */}
      <div className="fixed inset-0 z-0 bg-grid-pattern bg-[length:40px_40px] pointer-events-none opacity-40"></div>
      <div className="fixed inset-0 z-0 bg-vignette-red pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full grow font-display">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#330b14] bg-[#0a0a0a]/90 backdrop-blur-sm px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="size-8 text-[#FF003C] animate-pulse">
              <TriangleAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold leading-tight tracking-wider uppercase">
                JeiKei Station // <span className="text-[#FF003C] text-glow">SYSTEM ALERT</span>
              </h2>
              <p className="text-xs text-[#FF003C]/70 font-mono tracking-widest">ERR_CODE: 404_NOT_FOUND</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center justify-center overflow-hidden rounded h-9 bg-[#0a0a0a] border border-[#330b14] text-slate-400 hover:text-white hover:border-[#FF003C]/50 transition-colors px-3">
              <Bell className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center overflow-hidden rounded h-9 bg-[#0a0a0a] border border-[#330b14] text-slate-400 hover:text-white hover:border-[#FF003C]/50 transition-colors px-3">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded h-9 px-6 bg-[#FF003C]/10 border border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C] hover:text-white transition-all text-sm font-bold tracking-widest group"
            >
              <span className="mr-2">RETURN</span>
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
          {/* Hero Alert Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-[#330b14]">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center rounded-full bg-[#FF003C]/20 px-2.5 py-0.5 text-xs font-medium text-[#FF003C] border border-[#FF003C]/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C] mr-2"></span>
                  LEVEL 5 THREAT
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: #404-AZ-MISSING</span>
              </div>
              <h1 className="text-white text-5xl lg:text-6xl font-black leading-none tracking-tighter uppercase">
                CRITICAL <span className="text-[#FF003C] text-glow">SYSTEM FAILURE</span>
              </h1>
              <p className="text-[#FF003C]/80 text-lg font-mono mt-2 uppercase tracking-wide">
                &gt; Immediate Action Required: The requested resource could not be located in this sector.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="relative group w-full lg:w-auto overflow-hidden rounded-xl bg-[#0a0a0a] border border-[#FF003C] px-8 py-4 shadow-[0_0_20px_rgba(255,0,60,0.3)] hover:shadow-[0_0_40px_rgba(255,0,60,0.6)] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-[#FF003C]/10 group-hover:bg-[#FF003C]/20 transition-colors"></div>
              <div className="relative flex items-center justify-center gap-3">
                <Unlock className="w-7 h-7 text-[#FF003C] animate-bounce" />
                <span className="text-white text-lg font-bold tracking-[0.15em]">INITIATE SYSTEM OVERRIDE</span>
              </div>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="rounded-xl border border-[#FF003C]/40 bg-[#0a0a0a]/50 p-6 flex flex-col gap-2 border-glow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                <Thermometer className="w-16 h-16 text-[#FF003C]" />
              </div>
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Core Temp</p>
              <div className="flex items-end gap-3">
                <p className="text-white text-4xl font-bold leading-none">892°C</p>
                <p className="text-[#FF003C] text-sm font-mono mb-1 font-bold">CRITICAL</p>
              </div>
              <div className="w-full bg-[#330b14] h-1.5 rounded-full mt-2">
                <div className="bg-[#FF003C] h-1.5 rounded-full" style={{ width: "98%" }}></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-[#330b14] bg-[#0a0a0a]/50 p-6 flex flex-col gap-2 relative overflow-hidden">
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Network Integrity</p>
              <div className="flex items-end gap-3">
                <p className="text-[#FF003C] text-4xl font-bold leading-none">12%</p>
                <p className="text-[#FF003C]/60 text-sm font-mono mb-1">FAILING</p>
              </div>
              <div className="w-full bg-[#330b14] h-1.5 rounded-full mt-2 overflow-hidden">
                {/* Striped red warning bar */}
                <div className="bg-[repeating-linear-gradient(45deg,#FF003C,#FF003C_10px,#b9002b_10px,#b9002b_20px)] h-1.5 rounded-full animate-pulse" style={{ width: "12%" }}></div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-[#330b14] bg-[#0a0a0a]/50 p-6 flex flex-col gap-2 relative overflow-hidden">
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Breach Attempts</p>
              <div className="flex items-end gap-3">
                <p className="text-white text-4xl font-bold leading-none">2,405</p>
                <p className="text-[#FF003C] text-sm font-mono mb-1">+500%</p>
              </div>
              <div className="grid grid-cols-10 gap-1 mt-3 h-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-[#FF003C] h-full rounded-sm opacity-100"></div>
                ))}
                <div className="bg-[#FF003C] h-full rounded-sm opacity-80"></div>
                <div className="bg-[#FF003C] h-full rounded-sm opacity-40"></div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-xl border border-[#FF003C]/40 bg-[#0a0a0a]/50 p-6 flex flex-col gap-2 border-glow relative overflow-hidden">
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">System Load</p>
              <div className="flex items-end gap-3">
                <p className="text-white text-4xl font-bold leading-none">99.9%</p>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center rounded bg-[#FF003C]/10 px-2 py-0.5 text-xs font-mono text-[#FF003C] ring-1 ring-inset ring-[#FF003C]/20">CPU: OVERLOAD</span>
                <span className="inline-flex items-center rounded bg-[#FF003C]/10 px-2 py-0.5 text-xs font-mono text-[#FF003C] ring-1 ring-inset ring-[#FF003C]/20">RAM: FULL</span>
              </div>
            </div>
          </div>

          {/* Lower Section: Graph & Logs */}
          <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[400px]">
            {/* Main Graph Area */}
            <div className="flex-grow-[2] rounded-xl border border-[#330b14] bg-[#0a0a0a]/80 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-white text-lg font-bold tracking-wide">INTRUSION TRAFFIC ANALYSIS</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="size-2 bg-[#FF003C] rounded-full animate-pulse"></span>
                    <span className="text-[#FF003C] text-sm font-mono">LIVE FEED // UNENCRYPTED</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs font-mono text-[#FF003C] bg-[#FF003C]/10 px-3 py-1 rounded border border-[#FF003C]/30">1H</button>
                  <button className="text-xs font-mono text-slate-500 hover:text-slate-300 px-3 py-1 rounded border border-transparent">24H</button>
                </div>
              </div>
              
              {/* Chart Visualization */}
              <div className="relative flex-1 w-full overflow-hidden">
                <div className="absolute inset-0 flex items-end justify-between px-2 gap-1">
                  {/* Bars generated with inline styles to simulate chart */}
                  <div className="w-full bg-[#FF003C]/20 hover:bg-[#FF003C]/40 transition-all rounded-t-sm relative group" style={{ height: "30%" }}></div>
                  <div className="w-full bg-[#FF003C]/20 hover:bg-[#FF003C]/40 transition-all rounded-t-sm relative group" style={{ height: "45%" }}></div>
                  <div className="w-full bg-[#FF003C]/20 hover:bg-[#FF003C]/40 transition-all rounded-t-sm relative group" style={{ height: "35%" }}></div>
                  <div className="w-full bg-[#FF003C]/20 hover:bg-[#FF003C]/40 transition-all rounded-t-sm relative group" style={{ height: "60%" }}></div>
                  <div className="w-full bg-[#FF003C]/30 hover:bg-[#FF003C]/50 transition-all rounded-t-sm relative group" style={{ height: "50%" }}></div>
                  <div className="w-full bg-[#FF003C]/30 hover:bg-[#FF003C]/50 transition-all rounded-t-sm relative group" style={{ height: "75%" }}></div>
                  <div className="w-full bg-[#FF003C]/40 hover:bg-[#FF003C]/60 transition-all rounded-t-sm relative group" style={{ height: "65%" }}></div>
                  <div className="w-full bg-[#FF003C]/50 hover:bg-[#FF003C]/70 transition-all rounded-t-sm relative group" style={{ height: "85%" }}></div>
                  <div className="w-full bg-[#FF003C]/60 hover:bg-[#FF003C]/80 transition-all rounded-t-sm relative group" style={{ height: "90%" }}></div>
                  <div className="w-full bg-[#FF003C] hover:bg-red-400 transition-all rounded-t-sm relative group shadow-[0_0_15px_rgba(255,0,60,0.5)]" style={{ height: "98%" }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-[#FF003C] text-xs font-bold px-2 py-1 rounded border border-[#FF003C] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Current Load
                    </div>
                  </div>
                </div>
                
                {/* Jagged Line Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,70 L10,65 L20,75 L30,40 L40,50 L50,25 L60,35 L70,15 L80,20 L90,5 L100,2" fill="none" filter="drop-shadow(0 0 4px #FF003C)" stroke="#FF003C" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                  <path d="M0,100 L0,70 L10,65 L20,75 L30,40 L40,50 L50,25 L60,35 L70,15 L80,20 L90,5 L100,2 L100,100 Z" fill="url(#gradient-red)" opacity="0.2"></path>
                  <defs>
                    <linearGradient id="gradient-red" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#FF003C", stopOpacity: 0.5 }}></stop>
                      <stop offset="100%" style={{ stopColor: "#FF003C", stopOpacity: 0 }}></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              <div className="flex justify-between mt-4 text-xs font-mono text-slate-500">
                <span>T-60s</span>
                <span>T-45s</span>
                <span>T-30s</span>
                <span>T-15s</span>
                <span className="text-[#FF003C] font-bold">NOW</span>
              </div>
            </div>

            {/* Real-time Logs */}
            <div className="flex-grow-[1] lg:w-96 rounded-xl border border-[#FF003C]/50 bg-black/60 backdrop-blur-md flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <div className="px-5 py-4 border-b border-[#330b14] flex justify-between items-center bg-[#0a0a0a]/80">
                <h3 className="text-white text-sm font-bold tracking-widest uppercase">Real-time Transcript</h3>
                <RefreshCw className="w-4 h-4 text-[#FF003C] animate-spin" />
              </div>
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs flex flex-col gap-3">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`flex gap-3 ${
                      log.type === 'info' ? 'text-slate-400 opacity-60' :
                      log.type === 'warning' ? 'text-[#FF003C]/80' :
                      log.type === 'error' ? 'text-[#FF003C]' :
                      log.type === 'critical' ? 'text-[#FF003C] font-bold bg-[#FF003C]/10 p-1 -mx-1 rounded' :
                      'text-white border-l-2 border-[#FF003C] pl-2 animate-pulse'
                    }`}
                  >
                    <span className={`whitespace-nowrap ${log.type === 'fatal' ? 'text-[#FF003C]' : ''}`}>{log.time}</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 bg-[#FF003C] text-black text-xs font-mono font-bold text-center">
                CONNECTION UNSTABLE // RECONNECTING...
              </div>
            </div>
          </div>

          {/* Footer Status Bar */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-[#330b14] text-xs font-mono text-slate-500 justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="size-2 bg-green-500 rounded-full"></span>
                <span>POWER: ONLINE</span>
              </div>
              <div className="flex items-center gap-2 text-[#FF003C]">
                <span className="size-2 bg-[#FF003C] rounded-full animate-ping"></span>
                <span>SECURITY: COMPROMISED</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span>SERVER: US-EAST-1</span>
              </div>
            </div>
            <div>
              JEIKEI STATION v4.2.0 // BUILD 2291 // <span className="text-white">OPERATOR: ADMIN</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}