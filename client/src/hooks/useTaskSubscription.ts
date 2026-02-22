import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export const useTaskSubscription = () => {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();

  useEffect(() => {
    const unsubscribe = trpc.tasks.onUpdate.subscribe(undefined, {
      onData: (task) => {
        console.log("Task updated via WebSocket:", task);
        // Invalidate the cache for the tasks list to trigger a refetch
        utils.tasks.list.invalidate();
        // Optionally, update a specific task in the cache if needed
        // queryClient.setQueryData(["tasks", "get", { id: task.id }], task);
      },
      onError: (err) => {
        console.error("WebSocket subscription error:", err);
      },
    });

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [queryClient, utils]);
};
