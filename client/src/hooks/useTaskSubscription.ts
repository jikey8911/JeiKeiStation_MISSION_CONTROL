import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export const useTaskSubscription = () => {
  const utils = trpc.useUtils();

  trpc.tasks.onUpdate.useSubscription(undefined, {
    onData: (task) => {
      console.log("Task updated via WebSocket:", task);
      // Invalidate the cache for the tasks list to trigger a refetch
      utils.tasks.list.invalidate();
    },
    onError: (err) => {
      console.error("WebSocket subscription error:", err);
    },
  });
};
