import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DependencyEditorModal } from "./DependencyEditorModal";

interface TaskCardProps {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  estimationHours?: number;
  assignedAgentId?: number;
  status: string;
  isBlocked?: boolean;
  blockingTaskTitles?: string[];
  onDragStart?: (e: React.DragEvent) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const skillColors: Record<string, string> = {
  FRONTEND: "bg-purple-100 text-purple-800",
  BACKEND: "bg-green-100 text-green-800",
  QA: "bg-pink-100 text-pink-800",
  DISEÑO: "bg-indigo-100 text-indigo-800",
  ANÁLISIS: "bg-cyan-100 text-cyan-800",
  DB: "bg-amber-100 text-amber-800",
};

export function TaskCard({
  id,
  title,
  description,
  priority,
  requiredSkills,
  estimationHours,
  assignedAgentId,
  status,
  isBlocked = false,
  blockingTaskTitles = [],
  onDragStart,
}: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
      <Card className={`p-4 mb-3 hover:shadow-md transition-shadow bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-l-4 ${
        isBlocked ? "border-l-red-500 opacity-75" : "border-l-blue-500"
      }`}>
        <div className="space-y-3">
          {/* Encabezado con título y prioridad */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              {isBlocked && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bloqueada por: {blockingTaskTitles.join(", ")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex-1 line-clamp-2">
                {title}
              </h3>
            </div>
            <Badge className={`flex-shrink-0 ${priorityColors[priority]}`}>
              {priority}
            </Badge>
          </div>

          {/* Descripción */}
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {description}
            </p>
          )}

          {/* Habilidades requeridas */}
          {requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {requiredSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className={`text-xs ${skillColors[skill] || "bg-gray-100 text-gray-800"}`}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Pie de página con estimación y estado de asignación */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1">
              {estimationHours && (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{estimationHours}h</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DependencyEditorModal taskId={id} />
              {assignedAgentId ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </Card>
      </motion.div>
    </div>
  );
}
