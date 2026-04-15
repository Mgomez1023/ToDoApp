import { useEffect, useRef, useState } from "react";

import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";
import type {
  Task,
  TaskMutationInput,
  TaskRecord,
  TaskStatus,
} from "@/types/task";

interface UseTasksState {
  error: string | null;
  isCreating: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  mutationError: string | null;
  tasks: Task[];
}

function toTask(task: TaskRecord): Task {
  return {
    ...task,
    assignees: [],
  };
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort(
    (leftTask, rightTask) =>
      new Date(rightTask.created_at).getTime() -
      new Date(leftTask.created_at).getTime(),
  );
}

function mapConfirmedStatuses(tasks: Task[]) {
  return Object.fromEntries(
    tasks.map((task) => [task.id, task.status]),
  ) as Record<string, TaskStatus>;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  ) {
    return "Supabase is reachable, but the tasks table is missing in this project. Run supabase/schema.sql in the Supabase SQL editor, then refresh.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return fallbackMessage;
}

export function useTasks(userId: string | null | undefined) {
  const [state, setState] = useState<UseTasksState>({
    error: null,
    isCreating: false,
    isDeleting: false,
    isLoading: false,
    isUpdating: false,
    mutationError: null,
    tasks: [],
  });
  const [attempt, setAttempt] = useState(0);
  const confirmedStatusesRef = useRef<Record<string, TaskStatus>>({});
  const desiredStatusesRef = useRef<Record<string, TaskStatus>>({});
  const taskMoveQueuesRef = useRef<Record<string, Promise<void>>>({});

  useEffect(() => {
    if (!userId) {
      confirmedStatusesRef.current = {};
      desiredStatusesRef.current = {};
      taskMoveQueuesRef.current = {};
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: false,
        mutationError: null,
        tasks: [],
      }));
      return;
    }

    if (!supabase) {
      confirmedStatusesRef.current = {};
      desiredStatusesRef.current = {};
      taskMoveQueuesRef.current = {};
      setState((currentState) => ({
        ...currentState,
        error: SUPABASE_ENV_ERROR,
        isLoading: false,
        mutationError: null,
        tasks: [],
      }));
      return;
    }

    const client = supabase;
    let isMounted = true;

    const loadTasks = async () => {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));

      try {
        const { data, error } = await client
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const nextTasks = (data ?? []).map(toTask);
        confirmedStatusesRef.current = mapConfirmedStatuses(nextTasks);
        desiredStatusesRef.current = mapConfirmedStatuses(nextTasks);
        taskMoveQueuesRef.current = {};

        setState((currentState) => ({
          ...currentState,
          error: null,
          isLoading: false,
          tasks: nextTasks,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        confirmedStatusesRef.current = {};
        desiredStatusesRef.current = {};
        taskMoveQueuesRef.current = {};

        setState((currentState) => ({
          ...currentState,
          error: getErrorMessage(
            error,
            "Couldn't load tasks for this workspace. Retry in a moment.",
          ),
          isLoading: false,
          tasks: [],
        }));
      }
    };

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [attempt, userId]);

  const createTask = async (
    input: Omit<TaskMutationInput, "status"> & { status?: TaskMutationInput["status"] },
  ) => {
    if (!userId) {
      const message = "Guest workspace is still starting. Try again in a moment.";
      setState((currentState) => ({
        ...currentState,
        mutationError: message,
      }));
      throw new Error(message);
    }

    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const client = supabase;
    setState((currentState) => ({
      ...currentState,
      isCreating: true,
      mutationError: null,
    }));

    try {
      const { data, error } = await client
        .from("tasks")
        .insert({
          ...input,
          status: input.status ?? "todo",
          user_id: userId,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const nextTask = toTask(data);
      confirmedStatusesRef.current[nextTask.id] = nextTask.status;
      desiredStatusesRef.current[nextTask.id] = nextTask.status;

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
        tasks: sortTasks([nextTask, ...currentState.tasks]),
      }));

      return nextTask;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't create the task. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
        mutationError: message,
      }));

      throw new Error(message);
    }
  };

  const updateTask = async (taskId: string, input: TaskMutationInput) => {
    if (!userId) {
      const message = "Guest workspace is still starting. Try again in a moment.";
      setState((currentState) => ({
        ...currentState,
        mutationError: message,
      }));
      throw new Error(message);
    }

    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const client = supabase;
    setState((currentState) => ({
      ...currentState,
      isUpdating: true,
      mutationError: null,
    }));

    try {
      const { data, error } = await client
        .from("tasks")
        .update(input)
        .eq("id", taskId)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const nextTask = toTask(data);
      confirmedStatusesRef.current[taskId] = nextTask.status;
      desiredStatusesRef.current[taskId] = nextTask.status;

      setState((currentState) => ({
        ...currentState,
        isUpdating: false,
        tasks: sortTasks(
          currentState.tasks.map((task) => (task.id === taskId ? nextTask : task)),
        ),
      }));

      return nextTask;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't save the task changes. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isUpdating: false,
        mutationError: message,
      }));

      throw new Error(message);
    }
  };

  const moveTask = async (taskId: string, nextStatus: TaskStatus) => {
    const currentTask = state.tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === nextStatus) {
      return;
    }

    if (!userId) {
      const message = "Guest workspace is still starting. Try again in a moment.";
      setState((currentState) => ({
        ...currentState,
        mutationError: message,
      }));
      return;
    }

    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      return;
    }

    const client = supabase;
    desiredStatusesRef.current[taskId] = nextStatus;

    setState((currentState) => ({
      ...currentState,
      mutationError: null,
      tasks: sortTasks(
        currentState.tasks.map((task) =>
          task.id === taskId ? { ...task, status: nextStatus } : task,
        ),
      ),
    }));

    const persistMove = async () => {
      try {
        const { error } = await client
          .from("tasks")
          .update({ status: nextStatus })
          .eq("id", taskId)
          .eq("user_id", userId)
          .select("id, status")
          .single();

        if (error) {
          throw error;
        }

        confirmedStatusesRef.current[taskId] = nextStatus;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Couldn't move the task. Try again in a moment.",
        );

        if (desiredStatusesRef.current[taskId] !== nextStatus) {
          throw new Error(message);
        }

        const rollbackStatus = confirmedStatusesRef.current[taskId] ?? currentTask.status;
        desiredStatusesRef.current[taskId] = rollbackStatus;

        setState((currentState) => ({
          ...currentState,
          mutationError: message,
          tasks: sortTasks(
            currentState.tasks.map((task) =>
              task.id === taskId ? { ...task, status: rollbackStatus } : task,
            ),
          ),
        }));

        throw new Error(message);
      }
    };

    const previousMove = taskMoveQueuesRef.current[taskId] ?? Promise.resolve();
    const queuedMove = previousMove.catch(() => undefined).then(persistMove);
    const trackedMove = queuedMove.finally(() => {
      if (taskMoveQueuesRef.current[taskId] === trackedMove) {
        delete taskMoveQueuesRef.current[taskId];
      }
    });

    taskMoveQueuesRef.current[taskId] = trackedMove;

    await trackedMove.catch(() => undefined);
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) {
      const message = "Guest workspace is still starting. Try again in a moment.";
      setState((currentState) => ({
        ...currentState,
        mutationError: message,
      }));
      throw new Error(message);
    }

    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const client = supabase;
    setState((currentState) => ({
      ...currentState,
      isDeleting: true,
      mutationError: null,
    }));

    try {
      const { error } = await client
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      delete confirmedStatusesRef.current[taskId];
      delete desiredStatusesRef.current[taskId];
      delete taskMoveQueuesRef.current[taskId];

      setState((currentState) => ({
        ...currentState,
        isDeleting: false,
        tasks: currentState.tasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't delete the task. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isDeleting: false,
        mutationError: message,
      }));

      throw new Error(message);
    }
  };

  return {
    ...state,
    clearMutationError: () =>
      setState((currentState) => ({
        ...currentState,
        mutationError: null,
      })),
    createTask,
    deleteTask,
    moveTask,
    refetch: async () => {
      setAttempt((currentAttempt) => currentAttempt + 1);
    },
    updateTask,
  };
}
