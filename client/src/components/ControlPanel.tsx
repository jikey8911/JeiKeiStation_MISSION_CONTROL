import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, TrendingUp, Users, CheckCircle2, Clock } from "lucide-react";

interface ControlPanelProps {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  velocity: number;
  agentCount: number;
  burndownData?: Array<{ day: number; remaining: number }>;
  velocityHistory?: Array<{ sprint: string; velocity: number }>;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function ControlPanel({
  totalTasks,
  completedTasks,
  inProgressTasks,
  blockedTasks,
  velocity,
  agentCount,
  burndownData = [],
  velocityHistory = [],
}: ControlPanelProps) {
  const taskDistribution = [
    { name: "Completadas", value: completedTasks },
    { name: "En Progreso", value: inProgressTasks },
    { name: "Bloqueadas", value: blockedTasks },
    { name: "Pendientes", value: totalTasks - completedTasks - inProgressTasks - blockedTasks },
  ];

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg p-8 overflow-auto">
      <div className="space-y-6">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-3xl font-bold text-white">Mission Control Dashboard</h1>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
            Sistema Operativo
          </Badge>
        </motion.div>

        {/* Grid de métricas principales */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {/* Métrica: Tareas Completadas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-semibold">Completadas</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{completedTasks}</p>
                  <p className="text-xs text-green-300/70 mt-1">{completionRate.toFixed(1)}% del total</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-500/30" />
              </div>
            </Card>
          </motion.div>

          {/* Métrica: En Progreso */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-semibold">En Progreso</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{inProgressTasks}</p>
                  <p className="text-xs text-blue-300/70 mt-1">Activas ahora</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500/30" />
              </div>
            </Card>
          </motion.div>

          {/* Métrica: Bloqueadas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-semibold">Bloqueadas</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{blockedTasks}</p>
                  <p className="text-xs text-red-300/70 mt-1">Requieren atención</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-500/30" />
              </div>
            </Card>
          </motion.div>

          {/* Métrica: Velocidad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-semibold">Velocidad</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">{velocity.toFixed(1)}%</p>
                  <p className="text-xs text-purple-300/70 mt-1">Progreso del sprint</p>
                </div>
                <Clock className="w-12 h-12 text-purple-500/30" />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Gráficos */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Burndown Chart */}
          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4">Burndown Chart</h3>
            {burndownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="remaining"
                    stroke="#3b82f6"
                    dot={{ fill: "#3b82f6" }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No hay datos disponibles
              </div>
            )}
          </Card>

          {/* Distribución de Tareas */}
          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4">Distribución de Tareas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Historial de Velocidad */}
        {velocityHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 p-6">
              <h3 className="text-white font-semibold mb-4">Historial de Velocidad</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={velocityHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis stroke="#94a3b8" dataKey="sprint" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="velocity" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
