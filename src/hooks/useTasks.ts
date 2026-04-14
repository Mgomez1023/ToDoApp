import { useEffect, useState } from "react";

import type { Task } from "@/types/task";

export function useTasks(userId: string | null | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Phase 2+ will load the authenticated user's rows from Supabase.
    setTasks([]);
    setError(null);
    setIsLoading(false);
  }, [userId]);

  return {
    error,
    isLoading,
    refetch: async () => undefined,
    setTasks,
    tasks,
  };
}
