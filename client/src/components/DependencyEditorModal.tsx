import { useState } from "react";
import { toast } from "sonner";
import { trpc as api } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DependencyEditorModalProps {
  taskId: number;
  sprintId?: number;
}

export function DependencyEditorModal({ taskId, sprintId }: DependencyEditorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNewDep, setSelectedNewDep] = useState<string | null>(null);
  const utils = api.useUtils();

  // Queries
  const { data: currentDependencies, isLoading: isLoadingDeps } = api.dependencies.list.useQuery({ taskId });
  const { data: availableTasks, isLoading: isLoadingTasks } = api.tasks.list.useQuery({ sprintId });

  // Mutations
  const addDependencyMutation = api.dependencies.create.useMutation({
    onSuccess: () => {
      toast.success("Dependencia agregada correctamente.");
      utils.dependencies.list.invalidate({ taskId });
      setSelectedNewDep(null);
    },
    onError: (error) => {
      toast.error(error.message || "Error al agregar dependencia");
    },
  });

  const removeDependencyMutation = api.dependencies.delete.useMutation({
    onSuccess: () => {
      toast.info("Dependencia eliminada.");
      utils.dependencies.list.invalidate({ taskId });
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar la dependencia.");
    },
  });

  const handleAddDependency = () => {
    if (!selectedNewDep) return;
    addDependencyMutation.mutate({ taskId, dependsOnTaskId: parseInt(selectedNewDep) });
  };

  // Filtrar tareas elegibles (no la actual, no las que ya son dependencias)
  const eligibleTasks = availableTasks?.filter(
    (task) => task.id !== taskId && !currentDependencies?.some(dep => dep.dependsOnTaskId === task.id)
  ) ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="w-3 h-3" />
          Dependencias
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestionar Dependencias</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Lista de dependencias actuales */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-500">Depende de:</h4>
            {isLoadingDeps ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando dependencias...
              </div>
            ) : currentDependencies?.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Sin dependencias asignadas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentDependencies?.map((dep) => {
                  const taskInfo = availableTasks?.find(t => t.id === dep.dependsOnTaskId);
                  return (
                    <Badge key={dep.dependsOnTaskId} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                      <span className="max-w-[150px] truncate">{taskInfo?.title || `Tarea #${dep.dependsOnTaskId}`}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-slate-200 rounded-full"
                        onClick={() => removeDependencyMutation.mutate({ taskId, dependsOnTaskId: dep.dependsOnTaskId })}
                        disabled={removeDependencyMutation.isPending}
                      >
                        <X className="h-3 h-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agregar nueva dependencia */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-slate-500">Agregar nueva dependencia:</h4>
            <div className="flex items-center gap-2">
              <Select onValueChange={setSelectedNewDep} value={selectedNewDep ?? ""}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar tarea..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTasks ? (
                    <SelectItem value="loading" disabled>Cargando tareas...</SelectItem>
                  ) : eligibleTasks.length === 0 ? (
                    <SelectItem value="none" disabled>No hay tareas disponibles</SelectItem>
                  ) : (
                    eligibleTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddDependency}
                disabled={!selectedNewDep || addDependencyMutation.isPending}
                size="sm"
              >
                {addDependencyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Agregar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
