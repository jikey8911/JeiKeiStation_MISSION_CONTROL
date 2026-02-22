import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Task {
  id: number;
  title: string;
  status: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface Dependency {
  taskId: number;
  dependsOnTaskId: number;
}

interface TaskDependencyGraphProps {
  tasks: Task[];
  dependencies: Dependency[];
  selectedTaskId?: number;
}

export function TaskDependencyGraph({
  tasks,
  dependencies,
  selectedTaskId,
}: TaskDependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calcular posiciones de las tareas en una disposición circular
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const positions = new Map<number, { x: number; y: number }>();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    tasks.forEach((task, index) => {
      const angle = (index / tasks.length) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.set(task.id, { x, y });
    });

    // Dibujar líneas de dependencias
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    dependencies.forEach(dep => {
      const from = positions.get(dep.dependsOnTaskId);
      const to = positions.get(dep.taskId);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Dibujar flecha
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowSize = 10;
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - arrowSize * Math.cos(angle - Math.PI / 6), to.y - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - arrowSize * Math.cos(angle + Math.PI / 6), to.y - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    });

    // Dibujar nodos de tareas
    tasks.forEach(task => {
      const pos = positions.get(task.id);
      if (!pos) return;

      const isSelected = task.id === selectedTaskId;
      const radius = isSelected ? 30 : 25;

      // Fondo del nodo
      ctx.fillStyle = isSelected ? "#3b82f6" : "#e2e8f0";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Borde del nodo
      ctx.strokeStyle = isSelected ? "#1e40af" : "#94a3b8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto del ID de la tarea
      ctx.fillStyle = isSelected ? "#ffffff" : "#1e293b";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`T${task.id}`, pos.x, pos.y);
    });
  }, [tasks, dependencies, selectedTaskId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Grafo de Dependencias
            </h3>
            {dependencies.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dependencies.length} dependencias
              </Badge>
            )}
          </div>

          {dependencies.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-600">
              <p className="text-sm">No hay dependencias entre tareas</p>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Las líneas indican dependencias: A → B significa que B depende de A
              </div>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
