import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Sprint {
  id: number;
  name: string;
  description?: string;
  status: "planning" | "active" | "review" | "retrospective" | "closed";
  startDate?: Date;
  endDate?: Date;
  plannedVelocity: number;
  actualVelocity: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SprintManagerProps {
  sprints: Sprint[];
  onCreateSprint?: (data: any) => Promise<void>;
  onUpdateSprintStatus?: (id: number, status: string) => Promise<void>;
}

const statusLabels: Record<string, string> = {
  planning: "Planificación",
  active: "Activo",
  review: "Revisión",
  retrospective: "Retrospectiva",
  closed: "Cerrado",
};

const statusColors: Record<string, string> = {
  planning: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  retrospective: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

export function SprintManager({ sprints, onCreateSprint, onUpdateSprintStatus }: SprintManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plannedVelocity: 0,
  });

  const handleCreateSprint = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del sprint es requerido");
      return;
    }

    try {
      await onCreateSprint?.(formData);
      toast.success("Sprint creado exitosamente");
      setIsDialogOpen(false);
      setFormData({ name: "", description: "", plannedVelocity: 0 });
    } catch (error: any) {
      toast.error(error.message || "Error al crear sprint");
    }
  };

  const handleStatusChange = async (sprintId: number, newStatus: string) => {
    try {
      await onUpdateSprintStatus?.(sprintId, newStatus);
      toast.success("Estado del sprint actualizado");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar sprint");
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      planning: "active",
      active: "review",
      review: "retrospective",
      retrospective: "closed",
      closed: "planning",
    };
    return statusFlow[currentStatus] || null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Encabezado y botón */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sprints</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Sprint
        </Button>
      </div>

      {/* Lista de sprints */}
      <div className="space-y-4">
        {sprints.map((sprint, idx) => {
          const nextStatus = getNextStatus(sprint.status);

          return (
            <motion.div
              key={sprint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="space-y-4">
                  {/* Encabezado */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {sprint.name}
                        </h3>
                        <Badge className={statusColors[sprint.status]}>
                          {statusLabels[sprint.status]}
                        </Badge>
                      </div>
                      {sprint.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {sprint.description}
                        </p>
                      )}
                    </div>
                    {nextStatus && (
                      <Button
                        onClick={() => handleStatusChange(sprint.id, nextStatus)}
                        size="sm"
                        className="gap-2"
                      >
                        {sprint.status === "planning" && <Play className="w-4 h-4" />}
                        {sprint.status === "active" && <CheckCircle2 className="w-4 h-4" />}
                        {sprint.status === "review" && <RotateCcw className="w-4 h-4" />}
                        {sprint.status === "retrospective" && <CheckCircle2 className="w-4 h-4" />}
                        {statusLabels[nextStatus]}
                      </Button>
                    )}
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Velocidad Planeada
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {sprint.plannedVelocity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Velocidad Real
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {sprint.actualVelocity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Inicio
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {sprint.startDate
                          ? new Date(sprint.startDate).toLocaleDateString()
                          : "No iniciado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Fin
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {sprint.endDate
                          ? new Date(sprint.endDate).toLocaleDateString()
                          : "No definido"}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {sprint.plannedVelocity > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Progreso
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {((sprint.actualVelocity / sprint.plannedVelocity) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (sprint.actualVelocity / sprint.plannedVelocity) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog para crear sprint */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre del sprint (ej: Sprint 1 - Q1 2026)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Velocidad planeada (puntos)"
              value={formData.plannedVelocity}
              onChange={(e) => setFormData({ ...formData, plannedVelocity: parseInt(e.target.value) || 0 })}
            />
            <Button onClick={handleCreateSprint} className="w-full">
              Crear Sprint
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
