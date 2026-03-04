import { useState } from "react";
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
import { ProjectInterviewV2 } from "@/components/ProjectInterviewV2";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { useTaskSubscription } from "@/hooks/useTaskSubscription";
import { Loader2, Plus, Upload, Shield, Activity, LayoutDashboard, Share2, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  status: "backlog" | "in_progress" | "review" | "qa" | "done";
  estimationHours?: number;
}

export default function Dashboard() {
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    requiredSkills: [] as string[],
    estimationHours: 0,
    status: "backlog" as string,
  });

  const utils = trpc.useUtils();
  useTaskSubscription();

  const { 
    data: rawTasks = [], 
    isLoading: tasksLoading,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks
  } = trpc.tasks.list.useQuery({});

  const tasks = rawTasks.map((task) => ({
    ...task,
    description: task.description || undefined,
    priority: (task.priority as "low" | "medium" | "high" | "critical") || "medium",
    status: (task.status as "backlog" | "in_progress" | "review" | "qa" | "done") || "backlog",
    estimationHours: task.estimationHours || 0,
    assignedAgentId: task.assignedAgentId ?? undefined,
  }));

  const { 
    data: agents = [], 
    isLoading: agentsLoading,
    isError: isAgentsError,
    error: agentsError
  } = trpc.agents.list.useQuery();

  const { 
    data: rawSprints = [],
    isError: isSprintsError,
    error: sprintsError
  } = trpc.sprints.list.useQuery();

  const sprints = rawSprints.map((sprint) => ({
    ...sprint,
    description: sprint.description ?? undefined,
    startDate: sprint.startDate ?? undefined,
    endDate: sprint.endDate ?? undefined,
    plannedVelocity: sprint.plannedVelocity ?? 0,
    actualVelocity: sprint.actualVelocity ?? 0,
  }));
  
  const currentSprint = sprints.find(s => s.status === "active") || sprints[0];

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Misión desplegada correctamente");
      setIsTaskOpen(false);
      setNewTaskData({
        title: "",
        description: "",
        priority: "medium",
        requiredSkills: [],
        estimationHours: 0,
        status: "backlog",
      });
      utils.tasks.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const importMarkdown = trpc.tasks.importFromMarkdown.useMutation({
    onSuccess: () => {
      toast.success("Backlog sincronizado");
      setIsImportOpen(false);
      setMarkdownContent("");
      utils.tasks.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createSprintMutation = trpc.sprints.create.useMutation({
    onSuccess: () => utils.sprints.list.invalidate(),
  });

  const updateSprintStatusMutation = trpc.sprints.updateStatus.useMutation({
    onSuccess: () => utils.sprints.list.invalidate(),
  });

  const updateTaskStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const handleAddTask = (columnStatus?: string) => {
    if (!newTaskData.title) return toast.error("El nombre de la misión es requerido");

    // Extraer campos que tRPC espera (sin 'status' si no está en el esquema)
    const { status: _, ...taskInput } = newTaskData;

    createTask.mutate({
      ...taskInput,
      sprintId: currentSprint?.id,
      estimationHours: newTaskData.estimationHours || undefined,
    });
  };

  const handleImportMarkdown = () => {
    if (!markdownContent) return toast.error("El contenido es requerido");
    importMarkdown.mutate({ 
      markdown: markdownContent,
      sprintId: currentSprint?.id
    });
  };

  if (tasksLoading || agentsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00f2ff] animate-spin" />
      </div>
    );
  }

  if (isTasksError || isAgentsError || isSprintsError) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-['Rajdhani',sans-serif]">
        <Shield className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold tracking-widest uppercase mb-2">Sistema Desconectado</h1>
        <p className="text-white/60 mb-8 text-center max-w-md">
          {(tasksError || agentsError || sprintsError)?.message || "Error crítico en la conexión con Mission Control."}
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-[#00f2ff] hover:bg-[#00d0db] text-black font-bold rounded-none uppercase tracking-widest px-8"
        >
          Reiniciar Sistema
        </Button>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === "done").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const blockedTasks = tasks.filter(t => t.status === "backlog" && !t.assignedAgentId).length;
  const velocity = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <SignedIn>
      <div className="min-h-screen bg-[#050505] text-white font-['Rajdhani',sans-serif] selection:bg-[#00f2ff]/30 selection:text-[#00f2ff]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@400;500;600;700&display=swap');
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f2ff33; border-radius: 2px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00f2ff80; }
        `}</style>

        <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-[#00f2ff]/20 border border-[#00f2ff]/5 flex items-center justify-center">
                <Shield className="h-5 w-5 text-[#00f2ff]" />
              </div>
              <h1 className="text-xl font-bold tracking-widest uppercase">Mission Control</h1>
            </div>
            <div className="flex items-center gap-6">
              <NotificationBell />
              <div className="h-8 w-[1px] bg-white/10"></div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
              <TabsList className="bg-black/40 border border-white/10 p-1 rounded-none h-auto flex-wrap justify-start">
                <TabsTrigger value="overview" className="rounded-none data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] px-6 py-3 uppercase tracking-widest text-[10px] font-bold">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="office" className="rounded-none data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] px-6 py-3 uppercase tracking-widest text-[10px] font-bold">
                  <Users className="w-4 h-4 mr-2" /> Virtual Office
                </TabsTrigger>
                <TabsTrigger value="topology" className="rounded-none data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] px-6 py-3 uppercase tracking-widest text-[10px] font-bold">
                  <Share2 className="w-4 h-4 mr-2" /> Topology
                </TabsTrigger>
                <TabsTrigger value="deployer" className="rounded-none data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] px-6 py-3 uppercase tracking-widest text-[10px] font-bold">
                  <Activity className="w-4 h-4 mr-2" /> Deployer
                </TabsTrigger>
                <TabsTrigger value="control" className="rounded-none data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] px-6 py-3 uppercase tracking-widest text-[10px] font-bold">
                  <Shield className="w-4 h-4 mr-2" /> Control
                </TabsTrigger>
                <TabsTrigger value="project-owner" className="rounded-none data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] px-6 py-3 uppercase tracking-widest text-[10px] font-bold border-l border-white/5">
                  <Sparkles className="w-4 h-4 mr-2" /> Project Owner
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportOpen(true)}
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-none uppercase tracking-widest text-[10px] px-6 h-12"
                >
                  <Upload className="w-4 h-4 mr-2" /> Sync Backlog
                </Button>
                <Button 
                  onClick={() => setIsTaskOpen(true)}
                  className="bg-[#00f2ff] hover:bg-[#00d0db] text-black font-bold rounded-none uppercase tracking-widest text-[10px] px-6 h-12 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Mission
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-8 m-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <TaskBoard
                    tasks={tasks}
                    onTaskStatusChange={(id, status) => updateTaskStatus.mutate({ taskId: id, status })}
                    onAddTask={(columnStatus) => {
                      if (columnStatus) {
                        setNewTaskData(prev => ({ ...prev, status: columnStatus }));
                      }
                      setIsTaskOpen(true);
                    }}
                  />
                  <div className="bg-black/40 border border-white/5 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Activity className="w-24 h-24" /></div>
                    <h3 className="text-[#00f2ff] uppercase tracking-widest text-xs font-bold mb-6">Misión: Grafo de Dependencias</h3>
                    <div className="h-[400px]">
                      {currentSprint && <TaskDependencyGraph sprintId={currentSprint.id} />}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <ControlPanel
                    totalTasks={tasks.length}
                    completedTasks={completedTasks}
                    inProgressTasks={inProgressTasks}
                    blockedTasks={blockedTasks}
                    velocity={velocity}
                    agentCount={agents.length}
                  />
                  {currentSprint && <SprintHealthIndicator sprintId={currentSprint.id} />}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="office" className="m-0 outline-none">
              <VirtualOffice />
            </TabsContent>

            <TabsContent value="topology" className="m-0 outline-none">
              <div className="bg-black/40 border border-white/5 p-8 h-[600px]">
                {currentSprint && <TaskDependencyGraph sprintId={currentSprint.id} />}
              </div>
            </TabsContent>
            <TabsContent value="control" className="space-y-8 m-0 outline-none">
              <ControlPanel />
            </TabsContent>

            <TabsContent value="project-owner" className="space-y-8 m-0 outline-none">
              <ProjectInterviewV2 />
            </TabsContent>
          </Tabs>
        </main>

        <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
          <DialogContent className="bg-[#0f0f0f] border border-[#00f2ff]/30 text-white max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="text-[#00f2ff] uppercase tracking-[0.2em] font-bold text-center">Protocolo de Nueva Misión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#00f2ff]/70">Nombre de la Misión</label>
                <Input
                  placeholder="ID de Misión / Título"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  className="bg-black/50 border-white/10 rounded-none focus:border-[#00f2ff]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#00f2ff]/70">Detalles Operativos</label>
                <Textarea
                  placeholder="Descripción detallada..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="bg-black/50 border-white/10 rounded-none min-h-[100px] focus:border-[#00f2ff]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#00f2ff]/70">Prioridad</label>
                  <Select
                    value={newTaskData.priority}
                    onValueChange={(val: any) => setNewTaskData({ ...newTaskData, priority: val })}
                  >
                    <SelectTrigger className="bg-black/50 border-white/10 rounded-none uppercase text-[10px]">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#00f2ff]/70">Estimación (H)</label>
                  <Input
                    type="number"
                    value={newTaskData.estimationHours}
                    onChange={(e) => setNewTaskData({ ...newTaskData, estimationHours: parseFloat(e.target.value) || 0 })}
                    className="bg-black/50 border-white/10 rounded-none focus:border-[#00f2ff]"
                  />
                </div>
              </div>
              <Button onClick={() => handleAddTask()} className="w-full bg-[#00f2ff] hover:bg-[#00d0db] text-black font-bold uppercase py-6 rounded-none shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                Desplegar Misión
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="bg-[#0f0f0f] border border-white/20 text-white max-w-2xl rounded-none">
            <DialogHeader>
              <DialogTitle className="text-white uppercase tracking-[0.2em] font-bold">Importar Backlog (Markdown)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea
                placeholder="Pega tu estructura de misiones aquí..."
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="min-h-64 bg-black/30 border-white/10 font-mono text-sm"
              />
              <Button onClick={handleImportMarkdown} className="w-full bg-white text-black hover:bg-[#e0e0e0] font-bold uppercase py-6 rounded-none">
                Sincronizar Datos
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SignedIn>
  );
}
