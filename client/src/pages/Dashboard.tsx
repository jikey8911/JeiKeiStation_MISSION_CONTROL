import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskBoard } from "@/components/TaskBoard";
import { VirtualOffice } from "@/components/VirtualOffice";
import { ControlPanel } from "@/components/ControlPanel";
import { NotificationBell } from "@/components/NotificationBell";
import { SprintHealthIndicator } from "@/components/SprintHealthIndicator";
import { TaskDependencyGraph } from "@/components/TaskDependencyGraph";
import { SprintManager } from "@/components/SprintManager";
import { OpenClawDeployer } from "@/components/OpenClawDeployer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTaskSubscription } from "@/hooks/useTaskSubscription";
import { Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  estimationHours?: number;
  assignedAgentId?: number;
  status: "backlog" | "in_progress" | "review" | "qa" | "done";
}

interface Agent {
  id: number;
  name: string;
  skills: string[];
  status: "available" | "busy" | "offline";
  currentWorkload: number;
  maxCapacity: number;
  avatar?: string;
}

export default function Dashboard() {
  useTaskSubscription();
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentSprint, setCurrentSprint] = useState<any>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    requiredSkills: [] as string[],
    estimationHours: 0,
  });
  const [markdownContent, setMarkdownContent] = useState("");

  // Queries
  const tasksQuery = trpc.tasks.list.useQuery({ sprintId: currentSprint?.id });
  const agentsQuery = trpc.agents.list.useQuery();
  const sprintsQuery = trpc.sprints.list.useQuery();

  // Mutations
  const createTaskMutation = trpc.tasks.create.useMutation();
  const updateTaskStatusMutation = trpc.tasks.updateStatus.useMutation();
  const importMarkdownMutation = trpc.tasks.importFromMarkdown.useMutation();
  const autoAssignMutation = trpc.tasks.autoAssign.useMutation();
  const createSprintMutation = trpc.sprints.create.useMutation();
  const updateSprintStatusMutation = trpc.sprints.updateStatus.useMutation();

  // Cargar datos
  useEffect(() => {
    if (tasksQuery.data) {
      const formattedTasks = tasksQuery.data.map((t: any) => ({
        ...t,
        estimationHours: t.estimationHours ? parseFloat(t.estimationHours) : undefined,
      }));
      setTasks(formattedTasks as Task[]);
    }
  }, [tasksQuery.data]);

  useEffect(() => {
    if (agentsQuery.data) {
      const formattedAgents = agentsQuery.data.map((a: any) => ({
        ...a,
        skills: typeof a.skills === 'string' ? JSON.parse(a.skills) : a.skills,
      }));
      setAgents(formattedAgents as Agent[]);
    }
  }, [agentsQuery.data]);

  useEffect(() => {
    if (sprintsQuery.data && sprintsQuery.data.length > 0) {
      // Seleccionar el sprint activo o el primero
      const activeSprint = sprintsQuery.data.find((s: any) => s.status === "active");
      setCurrentSprint(activeSprint || sprintsQuery.data[0]);
    }
  }, [sprintsQuery.data]);

  // Manejadores
  const handleAddTask = async () => {
    if (!newTaskData.title.trim()) {
      toast.error("El título de la tarea es requerido");
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        sprintId: currentSprint?.id,
        title: newTaskData.title,
        description: newTaskData.description,
        priority: newTaskData.priority,
        requiredSkills: newTaskData.requiredSkills,
        estimationHours: newTaskData.estimationHours || undefined,
      });

      toast.success("Tarea creada exitosamente");
      setIsAddTaskOpen(false);
      setNewTaskData({
        title: "",
        description: "",
        priority: "medium",
        requiredSkills: [],
        estimationHours: 0,
      });
      tasksQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la tarea");
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId,
        status: newStatus,
        agentId: tasks.find(t => t.id === taskId)?.assignedAgentId,
      });

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus as any } : t
      ));

      toast.success("Estado de la tarea actualizado");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la tarea");
    }
  };

  const handleImportMarkdown = async () => {
    if (!markdownContent.trim()) {
      toast.error("Por favor ingresa contenido Markdown");
      return;
    }

    try {
      const result = await importMarkdownMutation.mutateAsync({
        markdown: markdownContent,
        sprintId: currentSprint?.id,
      });

      toast.success(`${result.count} tareas importadas exitosamente`);
      setIsImportOpen(false);
      setMarkdownContent("");
      tasksQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al importar tareas");
    }
  };

  const handleAutoAssign = async (taskId: number) => {
    try {
      const result = await autoAssignMutation.mutateAsync({ taskId });
      toast.success(`Tarea asignada a ${result.agentName}`);
      tasksQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "No hay agentes disponibles");
    }
  };

  // Calcular métricas
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const blockedTasks = tasks.filter(t => t.status === "backlog" && !t.assignedAgentId).length;
  const velocity = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Por favor inicia sesión</h1>
          <p className="text-slate-600">Necesitas estar autenticado para acceder a JeiKeiStation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">JeiKeiStation</h1>
            <p className="text-slate-600 dark:text-slate-400">Centro de Control de Misiones - Orquestación de Agentes AI</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {currentSprint && (
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Sprint Actual</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{currentSprint.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Controles principales */}
        <div className="flex gap-2">
          <Button onClick={() => setIsAddTaskOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Importar Markdown
          </Button>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="kanban">Tablero Kanban</TabsTrigger>
            <TabsTrigger value="office">Oficina Virtual</TabsTrigger>
            <TabsTrigger value="topology">Topología y Salud</TabsTrigger>
            <TabsTrigger value="control">Panel de Control</TabsTrigger>
            <TabsTrigger value="deployer">Despliegue OpenClaw</TabsTrigger>
          </TabsList>

          {/* Tab: Tablero Kanban */}
          <TabsContent value="kanban" className="space-y-4">
            {tasksQuery.isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <TaskBoard
                tasks={tasks}
                onTaskStatusChange={handleTaskStatusChange}
                onAddTask={(status) => {
                  setNewTaskData({ ...newTaskData, title: "" });
                  setIsAddTaskOpen(true);
                }}
              />
            )}
          </TabsContent>

          {/* Tab: Oficina Virtual */}
          <TabsContent value="office" className="space-y-4">
            {agentsQuery.isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <VirtualOffice agents={agents} tasks={tasks} />
            )}
          </TabsContent>

          {/* Tab: Topología y Salud */}
          <TabsContent value="topology" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {currentSprint && <TaskDependencyGraph sprintId={currentSprint.id} />}
              </div>
              <div className="lg:col-span-1">
                {currentSprint && <SprintHealthIndicator sprintId={currentSprint.id} />}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Despliegue OpenClaw */}
          <TabsContent value="deployer" className="space-y-6">
            <OpenClawDeployer />
          </TabsContent>

          {/* Tab: Panel de Control */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SprintManager 
                  sprints={sprintsQuery.data || []} 
                  onCreateSprint={async (data) => { await createSprintMutation.mutateAsync(data); sprintsQuery.refetch(); }}
                  onUpdateSprintStatus={async (id, status) => { await updateSprintStatusMutation.mutateAsync({ sprintId: id, status }); sprintsQuery.refetch(); }}
                />
              </div>
              <div className="lg:col-span-1">
                <ControlPanel
                  totalTasks={tasks.length}
                  completedTasks={completedTasks}
                  inProgressTasks={inProgressTasks}
                  blockedTasks={blockedTasks}
                  velocity={velocity}
                  agentCount={agents.length}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Agregar Nueva Tarea */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título de la tarea"
              value={newTaskData.title}
              onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={newTaskData.description}
              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
            />
            <Select value={newTaskData.priority} onValueChange={(value) => 
              setNewTaskData({ ...newTaskData, priority: value as any })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Estimación (horas)"
              value={newTaskData.estimationHours}
              onChange={(e) => setNewTaskData({ ...newTaskData, estimationHours: parseFloat(e.target.value) || 0 })}
            />
            <Button onClick={handleAddTask} className="w-full">
              Crear Tarea
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Importar Markdown */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Tareas desde Markdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Pega tu contenido Markdown aquí..."
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="min-h-64"
            />
            <Button onClick={handleImportMarkdown} className="w-full">
              Importar Tareas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
