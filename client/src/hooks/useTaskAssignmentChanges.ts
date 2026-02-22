import { useState, useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';

interface Task {
  id: number;
  title: string;
  assignedAgentId?: number | null;
  status: string;
}

interface TaskAssignmentChange {
  taskId: number;
  previousAgentId: number | null | undefined;
  newAgentId: number | null | undefined;
  task: Task;
}

/**
 * Hook para detectar cambios en la asignación de tareas mediante polling.
 * Compara el estado anterior con el nuevo para identificar qué tarea ha sido reasignada.
 */
export const useTaskAssignmentChanges = (sprintId?: number) => {
  const [lastChangedTask, setLastChangedTask] = useState<TaskAssignmentChange | null>(null);
  const prevTasksRef = useRef<Task[]>([]);

  // 1. Query con polling para actualizaciones periódicas (cada 3 segundos)
  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery(
    { sprintId },
    {
      refetchInterval: 3000, // Polling cada 3 segundos
      onSuccess: (newTasks) => {
        if (prevTasksRef.current.length > 0) {
          // 2. Detección de cambios comparando con el estado anterior
          newTasks.forEach((newTask) => {
            const oldTask = prevTasksRef.current.find((t) => t.id === newTask.id);
            
            if (oldTask) {
              const agentChanged = oldTask.assignedAgentId !== newTask.assignedAgentId;
              const statusChanged = oldTask.status !== newTask.status;

              if (agentChanged || statusChanged) {
                console.log(`Cambio detectado en tarea ${newTask.id}:`, {
                  fromAgent: oldTask.assignedAgentId,
                  toAgent: newTask.assignedAgentId,
                  fromStatus: oldTask.status,
                  toStatus: newTask.status
                });

                setLastChangedTask({
                  taskId: newTask.id,
                  previousAgentId: oldTask.assignedAgentId,
                  newAgentId: newTask.assignedAgentId,
                  task: newTask as Task,
                });
              }
            }
          });
        }
        // Actualizar la referencia para la próxima comparación
        prevTasksRef.current = newTasks as Task[];
      }
    }
  );

  // Efecto para limpiar el estado de cambio después de un tiempo (para animaciones)
  useEffect(() => {
    if (lastChangedTask) {
      const timer = setTimeout(() => {
        setLastChangedTask(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastChangedTask]);

  return { tasks: tasks as Task[] | undefined, isLoading, lastChangedTask, refetch };
};
