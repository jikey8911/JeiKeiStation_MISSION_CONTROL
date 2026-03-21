import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";


interface Agent {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  skills: string[];
  status: "available" | "busy" | "offline";
  currentWorkload: number;
  maxCapacity: number;
}

interface AgentsManagerProps {
  agents: Agent[];
  onAddAgent?: (data: any) => Promise<void>;
  onEditAgent?: (id: number, data: any) => Promise<void>;
  onDeleteAgent?: (id: number) => Promise<void>;
}

const AVAILABLE_SKILLS = ["FRONTEND", "BACKEND", "QA", "DISEÑO", "ANÁLISIS", "DB"];

const skillColors: Record<string, string> = {
  FRONTEND: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  BACKEND: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  QA: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  DISEÑO: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  ANÁLISIS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  DB: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  busy: "bg-yellow-500",
  offline: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  available: "Disponible",
  busy: "Ocupado",
  offline: "Desconectado",
};

export function AgentsManager({
  agents,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
}: AgentsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    skills: [] as string[],
    maxCapacity: 10,
  });

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        description: agent.description || "",
        skills: agent.skills,
        maxCapacity: agent.maxCapacity,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: "",
        description: "",
        skills: [],
        maxCapacity: 10,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del agente es requerido");
      return;
    }

    if (formData.skills.length === 0) {
      toast.error("Selecciona al menos una habilidad");
      return;
    }

    try {
      if (editingAgent) {
        await onEditAgent?.(editingAgent.id, formData);
        toast.success("Agente actualizado");
      } else {
        await onAddAgent?.(formData);
        toast.success("Agente creado");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar agente");
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  return (
    <div className="w-full space-y-6">
      {/* Encabezado y botón */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Agentes AI</h2>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Agente
        </Button>
      </div>

      {/* Grid de agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              {/* Encabezado de tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{agent.name}</h3>
                    <div
                      className={`w-3 h-3 rounded-full ${statusColors[agent.status]}`}
                      title={statusLabels[agent.status]}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {statusLabels[agent.status]}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(agent)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteAgent?.(agent.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Descripción */}
              {agent.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {agent.description}
                </p>
              )}

              {/* Habilidades */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Habilidades
                </p>
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map(skill => (
                    <Badge
                      key={skill}
                      className={skillColors[skill] || "bg-gray-100 text-gray-800"}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Carga de trabajo */}
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Carga de trabajo</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {agent.currentWorkload}/{agent.maxCapacity}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(agent.currentWorkload / agent.maxCapacity) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {agent.currentWorkload >= agent.maxCapacity ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Capacidad máxima</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        {agent.maxCapacity - agent.currentWorkload} espacios disponibles
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dialog para crear/editar agente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? "Editar Agente" : "Crear Nuevo Agente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre del agente"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div>
              <label className="text-sm font-semibold mb-2 block">Habilidades</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SKILLS.map(skill => (
                  <Button
                    key={skill}
                    variant={formData.skills.includes(skill) ? "default" : "outline"}
                    onClick={() => toggleSkill(skill)}
                    className="justify-start"
                  >
                    {formData.skills.includes(skill) && "✓ "}
                    {skill}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Capacidad máxima</label>
              <Input
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingAgent ? "Actualizar Agente" : "Crear Agente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
