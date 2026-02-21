import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Zap } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  skills: string[];
  status: "available" | "busy" | "offline";
  currentWorkload: number;
  maxCapacity: number;
  avatar?: string;
}

interface Task {
  id: number;
  title: string;
  assignedAgentId?: number;
  status: "backlog" | "in_progress" | "review" | "qa" | "done";
}

interface VirtualOfficeProps {
  agents: Agent[];
  tasks: Task[];
}

const STATIONS = [
  { id: "in_progress", label: "En Progreso", x: 0, y: 0, color: "from-blue-500 to-blue-600" },
  { id: "review", label: "Revisión", x: 300, y: 0, color: "from-purple-500 to-purple-600" },
  { id: "qa", label: "QA", x: 600, y: 0, color: "from-orange-500 to-orange-600" },
  { id: "done", label: "Completado", x: 300, y: 300, color: "from-green-500 to-green-600" },
];

const skillIcons: Record<string, string> = {
  FRONTEND: "🎨",
  BACKEND: "⚙️",
  QA: "✓",
  DISEÑO: "🖌️",
  ANÁLISIS: "📊",
  DB: "🗄️",
};

export function VirtualOffice({ agents, tasks }: VirtualOfficeProps) {
  const [activeAgents, setActiveAgents] = useState<Agent[]>([]);

  useEffect(() => {
    setActiveAgents(agents.filter(a => a.status !== "offline"));
  }, [agents]);

  const getAgentTaskCount = (agentId: number) => {
    return tasks.filter(t => t.assignedAgentId === agentId).length;
  };

  const getAgentTasks = (agentId: number) => {
    return tasks.filter(t => t.assignedAgentId === agentId);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg p-8 overflow-hidden relative">
      {/* Grid de fondo animado */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Estaciones de trabajo */}
      <div className="relative h-full">
        {STATIONS.map((station, idx) => (
          <motion.div
            key={station.id}
            className="absolute"
            style={{ left: `${station.x}px`, top: `${station.y}px` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`w-64 bg-gradient-to-br ${station.color} border-0 shadow-2xl`}>
              <div className="p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{station.label}</h3>
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>

                {/* Agentes en esta estación */}
                <div className="space-y-2 mb-4">
                  {activeAgents.map((agent) => {
                    const agentTasks = getAgentTasks(agent.id);
                    const inThisStation = agentTasks.some(t => t.status === station.id);

                    if (!inThisStation) return null;

                    return (
                      <motion.div
                        key={agent.id}
                        className="bg-white/10 backdrop-blur-sm rounded p-2 flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{agent.name}</p>
                          <div className="flex gap-1 flex-wrap">
                            {agent.skills.slice(0, 2).map((skill) => (
                              <span key={skill} className="text-xs">
                                {skillIcons[skill] || "•"}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {agentTasks.length}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Tareas en esta estación */}
                <div className="space-y-1 pt-2 border-t border-white/20">
                  {tasks
                    .filter(t => t.status === station.id)
                    .slice(0, 3)
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        className="text-xs bg-white/10 rounded px-2 py-1 truncate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {task.title}
                      </motion.div>
                    ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Panel de resumen en la esquina inferior derecha */}
      <motion.div
        className="absolute bottom-8 right-8 bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-2 text-white text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Agentes activos: {activeAgents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Tareas en progreso: {tasks.filter(t => t.status === "in_progress").length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span>Completadas: {tasks.filter(t => t.status === "done").length}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
