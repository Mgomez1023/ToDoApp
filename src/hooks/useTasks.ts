import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";
import { buildTaskActivityDrafts } from "@/lib/taskActivity";
import type { Database } from "@/types/db";
import type { Label, TaskLabelDraft } from "@/types/label";
import type { TeamMember } from "@/types/team";
import type {
  Task,
  TaskAssigneeDraft,
  TaskMutationRequest,
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

interface TaskAssigneeRowWithMember {
  task_id: string;
  team_member_id: string;
  team_members: TeamMember | TeamMember[] | null;
}

interface TaskLabelRowWithLabel {
  label_id: string;
  labels: Label | Label[] | null;
  position: number;
  task_id: string;
}

function toTask(
  task: TaskRecord,
  assignees: TeamMember[] = [],
  labels: Label[] = [],
): Task {
  return {
    ...task,
    assignees,
    labels,
  };
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort(
    (leftTask, rightTask) =>
      new Date(rightTask.created_at).getTime() -
      new Date(leftTask.created_at).getTime(),
  );
}

function sortMembers(members: TeamMember[]) {
  return [...members].sort((leftMember, rightMember) =>
    leftMember.name.localeCompare(rightMember.name),
  );
}

function mapConfirmedStatuses(tasks: Task[]) {
  return Object.fromEntries(
    tasks.map((task) => [task.id, task.status]),
  ) as Record<string, TaskStatus>;
}

function getTaskMutationSnapshot(task: Pick<Task, "description" | "due_date" | "id" | "priority" | "status" | "title">) {
  return {
    description: task.description,
    due_date: task.due_date,
    id: task.id,
    priority: task.priority,
    status: task.status,
    title: task.title,
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  ) {
    return "Supabase is reachable, but one or more task feature tables are missing in this project. Run supabase/schema.sql in the Supabase SQL editor, then refresh.";
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

async function requireAuthenticatedUserId(client: SupabaseClient<Database>) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Guest workspace is still starting. Refresh and try again.");
  }

  return user.id;
}

function getJoinedMember(row: TaskAssigneeRowWithMember) {
  if (Array.isArray(row.team_members)) {
    return row.team_members[0] ?? null;
  }

  return row.team_members;
}

function getJoinedLabel(row: TaskLabelRowWithLabel) {
  if (Array.isArray(row.labels)) {
    return row.labels[0] ?? null;
  }

  return row.labels;
}

async function loadTaskAssigneesByTaskIds(
  client: SupabaseClient<Database>,
  taskIds: string[],
) {
  if (taskIds.length === 0) {
    return new Map<string, TeamMember[]>();
  }

  const { data, error } = await client
    .from("task_assignees")
    .select("task_id, team_member_id, team_members(*)")
    .in("task_id", taskIds);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as TaskAssigneeRowWithMember[];
  const assigneesByTaskId = new Map<string, TeamMember[]>();

  for (const row of rows) {
    const member = getJoinedMember(row);

    if (!member) {
      continue;
    }

    const currentMembers = assigneesByTaskId.get(row.task_id) ?? [];
    assigneesByTaskId.set(row.task_id, [...currentMembers, member]);
  }

  for (const [taskId, members] of assigneesByTaskId.entries()) {
    assigneesByTaskId.set(taskId, sortMembers(members));
  }

  return assigneesByTaskId;
}

async function loadTaskLabelsByTaskIds(
  client: SupabaseClient<Database>,
  taskIds: string[],
) {
  if (taskIds.length === 0) {
    return new Map<string, Label[]>();
  }

  const { data, error } = await client
    .from("task_labels")
    .select("task_id, label_id, position, labels(*)")
    .in("task_id", taskIds);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as TaskLabelRowWithLabel[];
  const labelsByTaskId = new Map<
    string,
    Array<{
      label: Label;
      position: number;
    }>
  >();

  for (const row of rows) {
    const label = getJoinedLabel(row);

    if (!label) {
      continue;
    }

    const currentLabels = labelsByTaskId.get(row.task_id) ?? [];
    labelsByTaskId.set(row.task_id, [
      ...currentLabels,
      {
        label,
        position: row.position,
      },
    ]);
  }

  for (const [taskId, labels] of labelsByTaskId.entries()) {
    labelsByTaskId.set(
      taskId,
      [...labels].sort((leftEntry, rightEntry) => {
        if (leftEntry.position === rightEntry.position) {
          return leftEntry.label.name.localeCompare(rightEntry.label.name);
        }

        return leftEntry.position - rightEntry.position;
      }),
    );
  }

  return new Map(
    [...labelsByTaskId.entries()].map(([taskId, labels]) => [
      taskId,
      labels.map((entry) => entry.label),
    ]),
  );
}

async function hydrateTasks(
  client: SupabaseClient<Database>,
  taskRows: TaskRecord[],
) {
  const taskIds = taskRows.map((task) => task.id);
  const [assigneesByTaskId, labelsByTaskId] = await Promise.all([
    loadTaskAssigneesByTaskIds(client, taskIds),
    loadTaskLabelsByTaskIds(client, taskIds),
  ]);

  return taskRows.map((task) =>
    toTask(
      task,
      assigneesByTaskId.get(task.id) ?? [],
      labelsByTaskId.get(task.id) ?? [],
    ),
  );
}

async function syncTaskAssignees(
  client: SupabaseClient<Database>,
  taskId: string,
  previousAssigneeIds: string[],
  nextAssigneeIds: string[],
) {
  const previousSet = new Set(previousAssigneeIds);
  const nextSet = new Set(nextAssigneeIds);
  const assigneesToAdd = [...nextSet].filter((assigneeId) => !previousSet.has(assigneeId));
  const assigneesToRemove = [...previousSet].filter(
    (assigneeId) => !nextSet.has(assigneeId),
  );

  if (assigneesToAdd.length > 0) {
    const payload: TaskAssigneeDraft[] = assigneesToAdd.map((teamMemberId) => ({
      task_id: taskId,
      team_member_id: teamMemberId,
    }));
    const { error } = await client.from("task_assignees").insert(payload);

    if (error) {
      throw error;
    }
  }

  if (assigneesToRemove.length > 0) {
    const { error } = await client
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .in("team_member_id", assigneesToRemove);

    if (error) {
      throw error;
    }
  }
}

async function syncTaskLabels(
  client: SupabaseClient<Database>,
  taskId: string,
  previousLabelIds: string[],
  nextLabelIds: string[],
) {
  const previousSet = new Set(previousLabelIds);
  const labelsToRemove = [...previousSet].filter((labelId) => !nextLabelIds.includes(labelId));

  if (nextLabelIds.length > 0) {
    const payload: TaskLabelDraft[] = nextLabelIds.map((labelId, index) => ({
      label_id: labelId,
      position: index,
      task_id: taskId,
    }));
    const { error } = await client
      .from("task_labels")
      .upsert(payload, { onConflict: "task_id,label_id" });

    if (error) {
      throw error;
    }
  }

  if (labelsToRemove.length > 0) {
    const { error } = await client
      .from("task_labels")
      .delete()
      .eq("task_id", taskId)
      .in("label_id", labelsToRemove);

    if (error) {
      throw error;
    }
  }
}

async function insertTaskActivityEntries(
  client: SupabaseClient<Database>,
  entries: Database["public"]["Tables"]["task_activity"]["Insert"][],
) {
  if (entries.length === 0) {
    return;
  }

  const { error } = await client.from("task_activity").insert(entries);

  if (error) {
    throw error;
  }
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
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const nextTasks = await hydrateTasks(client, data ?? []);

        if (!isMounted) {
          return;
        }

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
    input: Omit<TaskMutationRequest, "status"> & {
      status?: TaskMutationRequest["status"];
    },
  ) => {
    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const client = supabase;
    let taskRecord: TaskRecord | null = null;
    let didCreateTask = false;

    setState((currentState) => ({
      ...currentState,
      isCreating: true,
      mutationError: null,
    }));

    try {
      const authenticatedUserId = await requireAuthenticatedUserId(client);

      const { data, error } = await client
        .from("tasks")
        .insert({
          description: input.description,
          due_date: input.due_date,
          priority: input.priority,
          status: input.status ?? "todo",
          title: input.title,
          user_id: authenticatedUserId,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      taskRecord = data;
      didCreateTask = true;

      await syncTaskAssignees(client, taskRecord.id, [], input.assigneeIds);
      await syncTaskLabels(client, taskRecord.id, [], input.labelIds);

      const [nextTask] = await hydrateTasks(client, [taskRecord]);

      try {
        await insertTaskActivityEntries(
          client,
          buildTaskActivityDrafts({
            actorUserId: authenticatedUserId,
            nextAssigneeNames: nextTask.assignees.map((assignee) => assignee.name),
            nextLabelNames: nextTask.labels.map((label) => label.name),
            nextTask: getTaskMutationSnapshot(nextTask),
            previousAssigneeNames: [],
            previousLabelNames: [],
            previousTask: null,
          }),
        );
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          mutationError:
            "Task created, but activity couldn't be recorded cleanly. Refresh to verify the timeline.",
        }));
      }

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
        didCreateTask
          ? "Task details were created, but related task details couldn't be fully synced. Refresh and try again."
          : "Couldn't create the task. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
        mutationError: message,
      }));

      if (didCreateTask && taskRecord) {
        confirmedStatusesRef.current[taskRecord.id] = taskRecord.status;
        desiredStatusesRef.current[taskRecord.id] = taskRecord.status;
        setAttempt((currentAttempt) => currentAttempt + 1);
      }

      throw new Error(message);
    }
  };

  const updateTask = async (taskId: string, input: TaskMutationRequest) => {
    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const currentTask = state.tasks.find((task) => task.id === taskId);
    const client = supabase;
    let didUpdateTask = false;

    setState((currentState) => ({
      ...currentState,
      isUpdating: true,
      mutationError: null,
    }));

    try {
      const authenticatedUserId = await requireAuthenticatedUserId(client);

      const { data, error } = await client
        .from("tasks")
        .update({
          description: input.description,
          due_date: input.due_date,
          priority: input.priority,
          status: input.status,
          title: input.title,
        })
        .eq("id", taskId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      didUpdateTask = true;

      await syncTaskAssignees(
        client,
        taskId,
        currentTask?.assignees.map((assignee) => assignee.id) ?? [],
        input.assigneeIds,
      );
      await syncTaskLabels(
        client,
        taskId,
        currentTask?.labels.map((label) => label.id) ?? [],
        input.labelIds,
      );

      const [nextTask] = await hydrateTasks(client, [data]);

      try {
        await insertTaskActivityEntries(
          client,
          buildTaskActivityDrafts({
            actorUserId: authenticatedUserId,
            nextAssigneeNames: nextTask.assignees.map((assignee) => assignee.name),
            nextLabelNames: nextTask.labels.map((label) => label.name),
            nextTask: getTaskMutationSnapshot(nextTask),
            previousAssigneeNames:
              currentTask?.assignees.map((assignee) => assignee.name) ?? [],
            previousLabelNames: currentTask?.labels.map((label) => label.name) ?? [],
            previousTask: currentTask ? getTaskMutationSnapshot(currentTask) : null,
          }),
        );
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          mutationError:
            "Task saved, but activity couldn't be recorded cleanly. Refresh to verify the timeline.",
        }));
      }

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
        didUpdateTask
          ? "Task details were saved, but related task details couldn't be fully updated. Refresh and try again."
          : "Couldn't save the task changes. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isUpdating: false,
        mutationError: message,
      }));

      if (didUpdateTask) {
        setAttempt((currentAttempt) => currentAttempt + 1);
      }

      throw new Error(message);
    }
  };

  const moveTask = async (taskId: string, nextStatus: TaskStatus) => {
    const currentTask = state.tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === nextStatus) {
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
        const authenticatedUserId = await requireAuthenticatedUserId(client);

        const { error } = await client
          .from("tasks")
          .update({ status: nextStatus })
          .eq("id", taskId)
          .select("id, status")
          .single();

        if (error) {
          throw error;
        }

        confirmedStatusesRef.current[taskId] = nextStatus;

        try {
          await insertTaskActivityEntries(
            client,
            buildTaskActivityDrafts({
              actorUserId: authenticatedUserId,
              nextAssigneeNames: currentTask.assignees.map((assignee) => assignee.name),
              nextLabelNames: currentTask.labels.map((label) => label.name),
              nextTask: getTaskMutationSnapshot({
                ...currentTask,
                status: nextStatus,
              }),
              previousAssigneeNames: currentTask.assignees.map((assignee) => assignee.name),
              previousLabelNames: currentTask.labels.map((label) => label.name),
              previousTask: getTaskMutationSnapshot(currentTask),
            }),
          );
        } catch (error) {
          setState((currentState) => ({
            ...currentState,
            mutationError:
              "Task moved, but activity couldn't be recorded cleanly. Refresh to verify the timeline.",
          }));
        }
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
      const authenticatedUserId = await requireAuthenticatedUserId(client);

      const { error } = await client
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", authenticatedUserId);

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
