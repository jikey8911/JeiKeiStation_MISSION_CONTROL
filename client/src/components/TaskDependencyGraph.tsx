import { useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  Position,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { trpc as api } from "@/lib/trpc";
import { Loader2, AlertCircle, Activity } from "lucide-react";

interface TaskDependencyGraphProps {
  sprintId: number;
}

const nodeStyles = {
  backlog: { border: "1px solid #94a3b8", background: "#f8fafc" },
  in_progress: { border: "1px solid #3b82f6", background: "#eff6ff" },
  review: { border: "1px solid #a855f7", background: "#faf5ff" },
  qa: { border: "1px solid #eab308", background: "#fefce8" },
  done: { border: "1px solid #22c55e", background: "#f0fdf4", opacity: 0.6 },
  blocked: { border: "2px solid #ef4444", background: "#fef2f2", color: "#b91c1c" },
};

export function TaskDependencyGraph({ sprintId }: TaskDependencyGraphProps) {
  const { data: graphData, isLoading } = api.sprints.getDependencyGraph.useQuery({ sprintId });

  const { nodes, edges } = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };

    const { tasks, dependencies } = graphData;
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Identificar tareas bloqueadas (tienen dependencias no completadas)
    const isBlockedMap = new Map<number, boolean>();
    dependencies.forEach(dep => {
      const dependentTask = taskMap.get(dep.taskId);
      const dependencyTask = taskMap.get(dep.dependsOnTaskId);
      if (dependentTask && dependencyTask && dependencyTask.status !== "done") {
        isBlockedMap.set(dependentTask.id, true);
      }
    });

    const flowNodes: Node[] = tasks.map((task, index) => {
      const isBlocked = isBlockedMap.get(task.id) ?? false;
      const style = isBlocked ? nodeStyles.blocked : (nodeStyles[task.status as keyof typeof nodeStyles] || nodeStyles.backlog);

      return {
        id: task.id.toString(),
        data: { 
          label: (
            <div className="flex flex-col items-center gap-1">
              <span className="font-bold text-[10px]">#{task.id}</span>
              <span className="text-xs text-center font-medium leading-tight">{task.title}</span>
              <span className={`text-[8px] uppercase px-1 rounded ${isBlocked ? 'bg-red-200' : 'bg-slate-200'}`}>
                {isBlocked ? 'BLOQUEADA' : task.status}
              </span>
            </div>
          )
        },
        position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 150 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          ...style,
          padding: "10px",
          borderRadius: "8px",
          width: 180,
        },
      };
    });

    const flowEdges: Edge[] = dependencies.map(dep => {
      const dependencyTask = taskMap.get(dep.dependsOnTaskId);
      const isBlocking = dependencyTask?.status !== "done";

      return {
        id: `e-${dep.dependsOnTaskId}-${dep.taskId}`,
        source: dep.dependsOnTaskId.toString(),
        target: dep.taskId.toString(),
        animated: isBlocking,
        style: {
          stroke: isBlocking ? "#ef4444" : "#22c55e",
          strokeWidth: isBlocking ? 2 : 1,
        },
        label: isBlocking ? "BLOQUEA" : "OK",
        labelStyle: { fontSize: 8, fill: isBlocking ? "#ef4444" : "#22c55e", fontWeight: 700 },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [graphData]);

  if (isLoading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500">Cargando topología de tareas...</p>
        </div>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card className="h-[400px] flex items-center justify-center bg-black/20 border-white/5">
        <div className="flex flex-col items-center gap-3 text-center p-8">
          <Activity className="w-12 h-12 text-white/10" />
          <p className="text-slate-500 font-medium">No hay topología de misiones disponible</p>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest max-w-[200px]">Establece misiones y dependencias para visualizar el mapa táctico.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] w-full overflow-hidden border-slate-200 dark:border-slate-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-slate-50 dark:bg-slate-950"
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls />
        <MiniMap nodeColor={(n) => (n.style?.background as string) || "#eee"} />
        <Panel position="top-left" className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-md border shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            Mapa de Dependencias
          </h3>
          <p className="text-[10px] text-slate-500">Rojo indica bloqueo activo</p>
        </Panel>
      </ReactFlow>
    </Card>
  );
}
