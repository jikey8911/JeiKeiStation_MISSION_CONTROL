import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface TaskBoardProps {
  tasks: Task[];
  onTaskStatusChange?: (taskId: number, newStatus: string) => void;
  onAddTask?: (columnStatus: string) => void;
}

const COLUMNS = [
  { id: "backlog", label: "Pendientes", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "in_progress", label: "En Progreso", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "review", label: "Revisión", color: "bg-purple-100 dark:bg-purple-900" },
  { id: "qa", label: "QA", color: "bg-orange-100 dark:bg-orange-900" },
  { id: "done", label: "Finalizada", color: "bg-green-100 dark:bg-green-900" },
];

export function TaskBoard({ tasks, onTaskStatusChange, onAddTask }: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask(task);
    setDraggedFromColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (columnId: string) => {
    if (draggedTask && draggedFromColumn !== columnId) {
      onTaskStatusChange?.(draggedTask.id, columnId);
    }
    setDraggedTask(null);
    setDraggedFromColumn(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getTotalEstimation = (columnTasks: Task[]) => {
    return columnTasks.reduce((sum, task) => sum + (task.estimationHours || 0), 0);
  };

  return (
    <div className="w-full h-full overflow-x-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 rounded-lg">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const totalEstimation = getTotalEstimation(columnTasks);

          return (
            <motion.div
              key={column.id}
              className="flex-shrink-0 w-80"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`h-full flex flex-col ${column.color} border-t-4 border-t-blue-500`}>
                {/* Encabezado de la columna */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-slate-900 dark:text-slate-100">
                      {column.label}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  {totalEstimation > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {totalEstimation}h estimadas
                    </p>
                  )}
                </div>

                {/* Área de drop para tareas */}
                <motion.div
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                  className={`flex-1 p-4 space-y-3 overflow-y-auto transition-all ${
                    draggedTask && draggedFromColumn !== column.id
                      ? "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-400"
                      : ""
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {columnTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <TaskCard
                          {...task}
                          onDragStart={(e) => handleDragStart(task, column.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {columnTasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      className="text-center py-8 text-slate-400 dark:text-slate-600"
                    >
                      <p className="text-sm">No hay tareas</p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Botón para agregar tarea */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onAddTask?.(column.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar tarea
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
