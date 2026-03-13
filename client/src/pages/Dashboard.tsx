import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import {
  Search,
  LayoutGrid,
  ClipboardList,
  LineChart,
  Shield,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [sparks, setSparks] = useState<{ id: number; left: string; top: string }[]>([]);
  const [view, setView] = useState<"overview" | "projects">("overview");
  const [, setLocation] = useLocation();

  const { data: tasks = [] } = trpc.tasks.list.useQuery({});
  const { data: agentsRaw = [] } = trpc.agents.list.useQuery();
  const { data: sprints = [] } = trpc.sprints.list.useQuery();

  const agents = useMemo(() => {
    const list = (agentsRaw as any[]) || [];
    // Filtrar agentes que no den error y estén habilitados/conectados.
    return list.filter((a: any) => 
      a.status !== "error" && 
      a.status !== "failed" && 
      a.status !== "offline"
    );
  }, [agentsRaw]);

  const activeProjects = sprints.filter((s: any) => s.status === "active").length;
  const completedMissions = tasks.filter((t: any) => t.status === "done").length;
  const totalProgress = tasks.length > 0 ? Math.round((completedMissions / tasks.length) * 100) : 0;
  const teamUtilization =
    agentsRaw.length > 0
      ? Math.round(
          ((agentsRaw as any[]).reduce((a, b) => a + (b.currentWorkload || 0), 0) /
            Math.max((agentsRaw as any[]).reduce((a, b) => a + (b.maxCapacity || 0), 1), 1)) *
            100,
        )
      : 0;

  const getAgentBadge = (agent: any): { label: string; dot: string; text: string; bg: string } => {
    const status = String(agent?.status || "").toLowerCase();
    const connected = agent?.connected === true || status === "connected" || status === "online" || status === "available";
    const busy = status === "busy" || status === "working" || status === "in_progress";

    if (connected && !busy) {
      return { label: "Conectado", dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10" };
    }
    if (busy) {
      return { label: "Activo", dot: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-500/10" };
    }
    return { label: "Sin señal", dot: "bg-rose-400", text: "text-rose-300", bg: "bg-rose-500/10" };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      setSparks((prev) => [
        ...prev.slice(-35),
        { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, id },
      ]);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-[#030405] text-white relative overflow-hidden font-['Rajdhani',sans-serif]">
          <style>{`
            @keyframes spark { from { transform: scale(.4); opacity: 1; } to { transform: scale(2.2); opacity: 0; } }
            @keyframes scanline { 0% { transform: translateY(-100%);} 100% { transform: translateY(100%);} }
            .neural-spark { position:absolute; width:5px; height:5px; border-radius:999px; background: radial-gradient(circle, #00ff9c, #00e7ff 50%, transparent 75%); box-shadow: 0 0 14px #00ff9c; animation: spark 1.5s ease-out forwards; }
            .glass { background: rgba(7,10,13,.65); backdrop-filter: blur(8px); border: 1px solid rgba(0,242,255,.16); }
            .soft { border: 1px solid rgba(255,255,255,.08); }
          `}</style>

          {/* background */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,156,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,156,.12)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,242,255,.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,255,156,.1),transparent_40%)]" />
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00f2ff]/25 animate-[scanline_9s_linear_infinite]" />
            {sparks.map((s) => (
              <div key={s.id} className="neural-spark" style={{ left: s.left, top: s.top }} />
            ))}
          </div>

          <div className="relative z-10 p-4 h-screen grid grid-cols-[74px_1fr_310px] gap-4">
            {/* left icon menu */}
            <aside className="glass rounded-2xl p-3 flex flex-col items-center gap-3">
              <button
                onClick={() => setView("overview")}
                className={`w-11 h-11 rounded-xl soft flex items-center justify-center ${view === "overview" ? "bg-cyan-400/20 text-cyan-200" : "text-cyan-300/80 hover:bg-cyan-400/10"}`}
                title="Overview"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView("projects")}
                className={`w-11 h-11 rounded-xl soft flex items-center justify-center ${view === "projects" ? "bg-cyan-400/20 text-cyan-200" : "text-cyan-300/80 hover:bg-cyan-400/10"}`}
                title="Projects"
              >
                <ClipboardList size={18} />
              </button>
              <button className="w-11 h-11 rounded-xl soft flex items-center justify-center text-cyan-300/80 hover:bg-cyan-400/10" title="Metrics">
                <LineChart size={18} />
              </button>
              <button className="w-11 h-11 rounded-xl soft flex items-center justify-center text-cyan-300/80 hover:bg-cyan-400/10" title="Security">
                <Shield size={18} />
              </button>
              <button className="w-11 h-11 rounded-xl soft flex items-center justify-center text-cyan-300/80 hover:bg-cyan-400/10" title="Logs">
                <FileText size={18} />
              </button>
              <div className="mt-auto" />
              <button className="w-11 h-11 rounded-xl soft flex items-center justify-center text-white/50 hover:text-white"><Settings size={18} /></button>
              <button className="w-11 h-11 rounded-xl soft flex items-center justify-center text-red-400/70 hover:text-red-300"><LogOut size={18} /></button>
            </aside>

            {/* center */}
            <main className="flex flex-col gap-4 overflow-hidden">
              <header className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight">
                    {view === "projects" ? "Projects" : "Project Overview"}
                  </h1>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/60">Mission Control // Session Active</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setLocation('/projects/new')} className="px-3 py-2 rounded-xl border border-cyan-500/30 text-cyan-200 text-sm hover:bg-cyan-500/10">+ proyecto</button>
                  <button onClick={() => setLocation('/projects/assisted')} className="px-3 py-2 rounded-xl border border-cyan-500/30 text-cyan-200 text-sm hover:bg-cyan-500/10">+ proyecto asistido</button>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <Input placeholder="SEARCH SYSTEM..." className="w-80 pl-9 bg-black/40 border-cyan-500/20 rounded-xl" />
                  </div>
                  <div className="glass rounded-xl px-3 py-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-400/25" />
                    <div className="leading-tight">
                      <p className="text-xs font-bold">COMMANDER</p>
                      <p className="text-[10px] text-cyan-300/70">ACCESS LEVEL 5</p>
                    </div>
                  </div>
                </div>
              </header>

              {view === "overview" ? (
                <>
                  <section className="grid grid-cols-4 gap-4">
                    <Metric title="Active Projects" value={activeProjects} subtitle="Real count" />
                    <Metric title="Completed Missions" value={completedMissions} subtitle="Real count" />
                    <Metric title="Total Progress" value={`${totalProgress}%`} subtitle="Based on tasks" />
                    <Metric title="Team Utilization" value={`${teamUtilization}%`} subtitle="Based on agents" />
                  </section>

                  <section className="grid grid-cols-[2fr_1fr] gap-4 flex-1 min-h-0">
                    <div className="glass rounded-2xl p-4 overflow-y-auto">
                      <h2 className="text-cyan-300 font-bold tracking-widest text-sm mb-3">● LIVE ACTIVITY FEED</h2>
                      <div className="space-y-2">
                        {tasks.length > 0 ? (
                          tasks.slice(0, 10).map((t: any, i: number) => (
                            <div key={t.id ?? i} className="bg-black/50 border border-cyan-500/10 rounded-lg p-3 text-sm">
                              <span className="text-cyan-400/70 mr-2">[TASK]</span>
                              <span className="text-white/90">{t.title || "Untitled mission"}</span>
                              <span className="ml-2 text-cyan-300/70 uppercase text-xs">{t.status || "todo"}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-white/30 text-sm italic border border-dashed border-white/10 rounded-lg p-4">
                            No activity yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center">
                      <h2 className="text-cyan-300 font-bold tracking-widest text-sm mb-4 self-start">PROJECT STATUS</h2>
                      <div className="w-40 h-40 rounded-full border-[12px] border-cyan-300/20 flex items-center justify-center text-3xl font-bold text-cyan-300">
                        {tasks.length}
                      </div>
                      <div className="mt-4 w-full text-xs text-white/70 space-y-1">
                        <div className="flex justify-between"><span>Active Missions</span><span>{activeProjects}</span></div>
                        <div className="flex justify-between"><span>On Standby</span><span>{Math.max(tasks.length - completedMissions, 0)}</span></div>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <section className="glass rounded-2xl p-4 flex-1 overflow-y-auto">
                  <h2 className="text-cyan-300 font-bold tracking-widest text-sm mb-4">USER PROJECTS</h2>
                  {sprints.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sprints.map((p: any, i: number) => (
                        <div key={p.id ?? i} className="bg-black/50 border border-cyan-500/10 rounded-lg p-4">
                          <p className="text-lg font-bold text-cyan-200">{p.name || `Project ${i + 1}`}</p>
                          <p className="text-xs text-white/50 mt-1 uppercase">Status: {p.status || "unknown"}</p>
                          <p className="text-sm text-white/70 mt-3">{p.description || "No description"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/40 border border-dashed border-white/10 rounded-lg p-6">
                      No hay proyectos creados todavía.
                    </div>
                  )}
                </section>
              )}
            </main>

            {/* right: logo + agents */}
            <aside className="glass rounded-2xl p-4 flex flex-col gap-4">
              <div className="glass rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-400/20 border border-cyan-300/40" />
                <div className="font-bold text-xl">JK STATION</div>
              </div>

              <div className="flex-1 glass rounded-xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-cyan-300 text-sm font-bold tracking-widest">TACTICAL AGENTS</h3>
                  <button onClick={() => setLocation('/agents')} className="px-2 py-1 text-xs rounded-md border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10">Agregar agentes</button>
                </div>
                <div className="space-y-3">
                  {agents.map((a: any, i: number) => {
                    const badge = getAgentBadge(a);
                    return (
                      <div key={a.id ?? i} className="flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-cyan-500/10">
                        <div className="w-9 h-9 rounded-full bg-cyan-300/20" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-none truncate">{a.name || "Agent"}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="text-[10px] text-white/40">ID: JK-{String(a.id ?? i + 1).padStart(4, "0")}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border border-white/10 inline-flex items-center gap-1 ${badge.text} ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function Metric({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-cyan-300/60">{title}</p>
      <h3 className="text-4xl font-extrabold text-cyan-200 mt-2 leading-none">{value}</h3>
      <p className="text-[10px] uppercase tracking-widest text-cyan-300/40 mt-2">{subtitle}</p>
    </div>
  );
}
