import { trpc as api } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Target, Users } from "lucide-react";

interface SprintHealthIndicatorProps {
  sprintId: number;
}

export function SprintHealthIndicator({ sprintId }: SprintHealthIndicatorProps) {
  const { data: metrics, isLoading, error } = api.sprints.getHealthMetrics.useQuery({ sprintId });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-12 bg-slate-100 dark:bg-slate-800 rounded-t-lg" />
        <CardContent className="h-40 bg-slate-50 dark:bg-slate-900 rounded-b-lg" />
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4 text-red-600 text-sm">
          Error al cargar métricas de salud.
        </CardContent>
      </Card>
    );
  }

  const { completionPercentage, totalTasks, completedTasks, skillDistribution } = metrics;

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Salud del Sprint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progreso General */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
              <Target className="w-4 h-4" />
              Progreso General
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {completedTasks} / {totalTasks} tareas
            </span>
          </div>
          <Progress value={completionPercentage} className="h-3 bg-slate-200 dark:bg-slate-800" />
          <p className="text-right text-2xl font-black text-slate-900 dark:text-white">
            {completionPercentage.toFixed(1)}%
          </p>
        </div>

        {/* Distribución de Carga */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4" />
            Carga por Habilidad
          </div>
          {skillDistribution.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {skillDistribution.map(({ skill, count }) => (
                <div key={skill} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full" 
                        style={{ width: `${(count / totalTasks) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">No hay habilidades asignadas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
