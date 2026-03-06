import { useState, useEffect } from "react";
import { SignedIn, RedirectToSignIn } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { useTaskSubscription } from "@/hooks/useTaskSubscription";
import { 
  Shield, 
  Users, 
  Activity, 
  Search, 
  MoreVertical, 
  LayoutGrid, 
  CheckSquare, 
  Share2, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Circle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AIChatBox 
} from "@/components/AIChatBox";

export default function Dashboard() {
  useTaskSubscription();
  const [sparks, setSparks] = useState<{ id: number; left: string; top: string }[]>([]);

  // Queries (Mock engine will handle these)
  const { data: tasks = [] } = trpc.tasks.list.useQuery();
  const { data: agents = [] } = trpc.agents.list.useQuery();
  const { data: sprints = [] } = trpc.sprints.list.useQuery();

  // Metrics calculation
  const activeProjects = sprints.filter(s => s.status === "active").length;
  const completedMissions = tasks.filter(t => t.status === "done").length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedMissions / totalTasks) * 100) : 0;
  
  const totalCapacity = agents.reduce((acc, a) => acc + (a.maxCapacity || 0), 0);
  const currentWorkload = agents.reduce((acc, a) => acc + (a.currentWorkload || 0), 0);
  const teamUtilization = totalCapacity > 0 ? Math.round((currentWorkload / totalCapacity) * 100) : 0;

  useEffect(() => {
    const createSpark = () => {
      const id = Date.now();
      const left = Math.random() * 100 + "%";
      const top = Math.random() * 100 + "%";
      setSparks(prev => [...prev.slice(-20), { id, left, top }]);
    };
    const interval = setInterval(createSpark, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <SignedIn>
      <div className="min-h-screen bg-[#020202] text-white font-['Rajdhani',sans-serif] relative overflow-hidden flex flex-col">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@300;400;500;600;700&display=swap');
          @keyframes scanline {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
          }
          @keyframes spark {
            from { transform: scale(0.3); opacity: 1; }
            to { transform: scale(2); opacity: 0; }
          }
          .neural-spark {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: radial-gradient(circle, #00F2FF, transparent 70%);
            animation: spark 2s ease-out forwards;
            pointer-events: none;
            z-index: 1;
          }
          .glass-card {
            background: rgba(10, 10, 10, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 242, 255, 0.1);
          }
          .text-neon {
            color: #00F2FF;
            text-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
          }
        `}</style>

        {/* Neural Grid Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F2FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F2FF05_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00F2FF]/10 animate-scanline opacity-30"></div>
          {sparks.map(spark => (
            <div key={spark.id} className="neural-spark" style={{ left: spark.left, top: spark.top }} />
          ))}
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="flex-1 flex relative z-10 p-4 gap-4 h-screen overflow-hidden">
          
          {/* LEFT SIDEBAR: TACTICAL AGENTS */}
          <aside className="w-64 flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="w-8 h-8 rounded-full border border-[#00f2ff] flex items-center justify-center bg-[#00f2ff]/10">
                <div className="w-4 h-4 rounded-full border border-[#00f2ff] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-xl font-bold tracking-tighter uppercase italic">JK STATION</h1>
            </div>

            <div className="glass-card flex-1 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Tactical Agents</span>
                <MoreVertical className="w-4 h-4 text-white/20" />
              </div>
              
              <div className="space-y-4 overflow-y-auto pr-2">
                {agents.length > 0 ? agents.map((agent: any) => (
                  <div key={agent.id} className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden">
                         {agent.avatar ? <img src={agent.avatar} alt="" className="w-full h-full object-cover opacity-70" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><Users size={20}/></div>}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#020202] ${agent.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold group-hover:text-[#00f2ff] transition-colors">{agent.name}</span>
                      <span className="text-[9px] font-mono text-white/40 uppercase">ID: JK-{agent.id.toString().padStart(4, '0')}</span>
                    </div>
                  </div>
                )) : (
                   <div className="text-center py-10 text-white/20 italic text-xs uppercase tracking-widest border border-dashed border-white/5">No Agents Active</div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <nav className="space-y-2">
                  <div className="flex items-center gap-3 text-white/40 hover:text-white cursor-pointer px-2 py-1 transition-colors">
                    <LayoutGrid size={18}/> <span className="text-xs uppercase font-bold tracking-widest">Grid System</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#00f2ff] cursor-pointer px-2 py-1 bg-[#00f2ff]/5 border-r-2 border-[#00f2ff]">
                    <CheckSquare size={18}/> <span className="text-xs uppercase font-bold tracking-widest">Mission Tasks</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/40 hover:text-white cursor-pointer px-2 py-1 transition-colors">
                    <Share2 size={18}/> <span className="text-xs uppercase font-bold tracking-widest">Network Logic</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/40 hover:text-white cursor-pointer px-2 py-1 transition-colors">
                    <Shield size={18}/> <span className="text-xs uppercase font-bold tracking-widest">Security Hub</span>
                  </div>
                </nav>
                
                <div className="pt-4 flex items-center justify-between px-2">
                   <Settings size={18} className="text-white/20 hover:text-white cursor-pointer"/>
                   <LogOut size={18} className="text-white/20 hover:text-red-500 cursor-pointer"/>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER PANEL: PROJECT OVERVIEW */}
          <main className="flex-1 flex flex-col gap-4 overflow-hidden">
            
            {/* TOP BAR */}
            <header className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold tracking-tighter uppercase">Project Overview</h2>
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                  <span className="text-[#00f2ff]">Mission Control</span> // <span>Session Active</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative group w-64">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                   <Input 
                    placeholder="SEARCH SYSTEM..." 
                    className="bg-zinc-900/50 border-white/5 rounded-none h-9 pl-10 text-[10px] tracking-widest focus:border-[#00f2ff]/30 transition-all uppercase"
                   />
                </div>
                <div className="flex items-center gap-3 glass-card px-4 py-1.5 border-white/5">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Commander</span>
                      <span className="text-[8px] font-mono text-[#00f2ff] uppercase leading-none mt-1">Access Level 5</span>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                      <Users size={16} className="text-white/40"/>
                   </div>
                </div>
              </div>
            </header>

            {/* METRICS ROW */}
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-4 relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Active Projects</span>
                  <Activity size={14} className="text-[#00f2ff]/40" />
                </div>
                <div className="text-4xl font-bold tracking-tighter">{activeProjects}</div>
                <div className="flex items-center gap-1 text-[8px] text-green-500 font-bold uppercase mt-2">
                   <TrendingUp size={10}/> +12% VS LAST WEEK
                </div>
                <div className="absolute top-0 right-0 w-px h-1/2 bg-gradient-to-b from-[#00f2ff]/40 to-transparent"></div>
              </div>

              <div className="glass-card p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Completed Missions</span>
                  <CheckSquare size={14} className="text-[#00f2ff]/40" />
                </div>
                <div className="text-4xl font-bold tracking-tighter">{completedMissions.toLocaleString()}</div>
                <div className="text-[8px] text-[#00f2ff] font-bold uppercase mt-2 italic tracking-widest">SYSTEM OPTIMIZED</div>
              </div>

              <div className="glass-card p-4 flex items-center justify-between gap-4">
                 <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 mb-2">Total Progress</span>
                    <div className="text-4xl font-bold tracking-tighter">{progressPercent}%</div>
                    <span className="text-[8px] text-white/20 uppercase font-bold mt-2">Target: 90%</span>
                 </div>
                 <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-[#00f2ff]" strokeDasharray={176} strokeDashoffset={176 - (176 * progressPercent) / 100} />
                    </svg>
                 </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Team Utilization</span>
                  <Users size={14} className="text-[#00f2ff]/40" />
                </div>
                <div className="text-4xl font-bold tracking-tighter">{teamUtilization}%</div>
                <div className="mt-3">
                  <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00f2ff]/20 to-[#00f2ff]" style={{ width: `${teamUtilization}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* FEED ROW */}
            <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
               {/* LIVE ACTIVITY FEED */}
               <section className="col-span-3 glass-card flex flex-col p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping"></div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Live Activity Feed</span>
                    </div>
                    <span className="text-[8px] font-mono text-white/20 uppercase">Timestamp_Data_Stream</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-['JetBrains_Mono',monospace]">
                    {tasks.length > 0 ? tasks.slice(0, 10).map((task: any) => (
                      <div key={task.id} className="bg-white/5 border-l-2 border-[#00f2ff]/40 p-3 flex items-start gap-4 hover:bg-white/10 transition-all cursor-crosshair group">
                        <span className="text-[9px] text-[#00f2ff]/60 mt-0.5">{new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        <div className="flex-1 flex flex-col">
                           <div className="text-[10px] uppercase tracking-widest font-bold">
                              <span className="text-white/30">[TASK]</span> Mission <span className="text-white">"{task.title}"</span> marked as <span className={task.status === 'done' ? 'text-green-500' : 'text-[#00f2ff]'}>{task.status.toUpperCase()}</span>
                           </div>
                        </div>
                        <ChevronRight size={14} className="text-white/0 group-hover:text-white/20 transition-all"/>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 opacity-30 gap-4">
                        <Activity size={32} className="animate-pulse"/>
                        <span className="text-[10px] uppercase tracking-[0.5em]">No activity detected... standing by</span>
                      </div>
                    )}
                  </div>
               </section>

               {/* PROJECT STATUS & RADAR */}
               <section className="col-span-2 glass-card p-4 flex flex-col overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/5 blur-3xl pointer-events-none"></div>
                  
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8">Project Status</span>
                  
                  <div className="flex-1 flex flex-col items-center justify-center gap-8">
                     <div className="relative w-48 h-48 flex items-center justify-center">
                        {/* Circular Progress (Radar Style) */}
                        <svg className="w-full h-full -rotate-90">
                           <circle cx="96" cy="96" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                           <circle cx="96" cy="96" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-[#00f2ff]" strokeDasharray={440} strokeDashoffset={440 - (440 * progressPercent) / 100} />
                           {/* Outer ring glow */}
                           <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="1" className="text-[#00f2ff]/10" strokeDasharray="5,10" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                           <span className="text-5xl font-black tracking-tighter leading-none">{totalTasks}</span>
                           <span className="text-[10px] font-mono uppercase text-white/40 tracking-[0.3em]">Nodes</span>
                        </div>
                     </div>
                     
                     <div className="w-full space-y-3 px-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Circle size={8} fill="#00f2ff" className="text-[#00f2ff]"/>
                              <span className="text-[10px] uppercase font-bold tracking-widest">Active Missions</span>
                           </div>
                           <span className="text-[10px] font-mono">{activeProjects * 10}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Circle size={8} fill="rgba(255,255,255,0.1)" className="text-white/10"/>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">On Standby</span>
                           </div>
                           <span className="text-[10px] font-mono text-white/20">--</span>
                        </div>
                     </div>
                  </div>
               </section>
            </div>
          </main>
        </div>
      </div>
    </SignedIn>
  );
}
