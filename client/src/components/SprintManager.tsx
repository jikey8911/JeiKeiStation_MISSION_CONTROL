import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, CheckCircle2, RotateCcw, Users, History, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { trpc as api } from "@/lib/trpc";

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
  const [activeSprintId, setActiveSprintId] = useState<number | null>(sprints.find(s => s.status === 'active')?.id || sprints[0]?.id || null);

  const { data: tasks } = api.tasks.list.useQuery({ sprintId: activeSprintId || undefined }, { enabled: !!activeSprintId });

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

  const tasksInProgress = tasks?.filter(t => t.status === 'in_progress' || t.status === 'review') ?? [];
  const tasksDone = tasks?.filter(t => t.status === 'done') ?? [];

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="sprints" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="sprints" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Sprints
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Daily Standup
          </TabsTrigger>
          <TabsTrigger value="retro" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Retrospectiva
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Sprints (Original) */}
        <TabsContent value="sprints" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Sprints</h2>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Sprint
            </Button>
          </div>

          <div className="space-y-4">
            {sprints.map((sprint, idx) => {
              const nextStatus = getNextStatus(sprint.status);
              return (
                <motion.div
                  key={sprint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveSprintId(sprint.id)}
                  className={`cursor-pointer transition-all ${activeSprintId === sprint.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                >
                  <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <div className="space-y-4">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(sprint.id, nextStatus);
                            }}
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
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Pestaña de Daily Standup */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Daily Standup - {sprints.find(s => s.id === activeSprintId)?.name || 'Sprint Seleccionado'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">En Progreso / Revisión</h4>
                  {tasksInProgress.length > 0 ? (
                    <div className="space-y-2">
                      {tasksInProgress.map(task => (
                        <div key={task.id} className="p-3 bg-white dark:bg-slate-800 border rounded-lg shadow-sm flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</p>
                            <p className="text-xs text-slate-500">Agente: {task.assignedAgentId || 'Sin asignar'}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase">{task.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No hay tareas activas actualmente.</p>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Bloqueos Activos</h4>
                  <p className="text-sm text-slate-400 italic">Consulta el Grafo de Dependencias para ver bloqueos topológicos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Retrospectiva */}
        <TabsContent value="retro">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                Retrospectiva del Sprint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Tareas Completadas ("Done")</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tasksDone.map(task => (
                    <div key={task.id} className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Notas de la Sesión</h4>
                <Textarea 
                  placeholder="¿Qué salió bien? ¿Qué podemos mejorar? ¿Acciones para el próximo sprint?..." 
                  className="min-h-[150px]"
                />
                <Button className="w-full">Guardar Notas de Retrospectiva</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
