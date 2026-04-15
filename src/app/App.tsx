import { useEffect, useMemo, useState } from "react";

import { Board } from "@/components/board/Board";
import { WorkspaceRail } from "@/components/layout/WorkspaceRail";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useGuestSession } from "@/hooks/useGuestSession";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import type {
  AssigneeFilter,
  TaskFormValues,
  TaskMutationInput,
  TaskPriorityFilter,
} from "@/types/task";

type TaskModalState =
  | { mode: "create"; open: false }
  | { mode: "create"; open: true }
  | { mode: "edit"; open: true; taskId: string };

function toTaskMutationInput(values: TaskFormValues): TaskMutationInput {
  return {
    description: values.description.trim() || null,
    due_date: values.dueDate || null,
    priority: values.priority,
    status: values.status,
    title: values.title.trim(),
  };
}

export function App() {
  const guestSession = useGuestSession();
  const tasks = useTasks(guestSession.user?.id);
  const teamMembers = useTeamMembers(guestSession.user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState<TaskPriorityFilter>("all");
  const [assigneeId, setAssigneeId] = useState<AssigneeFilter>("all");
  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    mode: "create",
    open: false,
  });

  const selectedTask = useMemo(() => {
    if (!taskModalState.open || taskModalState.mode !== "edit") {
      return null;
    }

    return tasks.tasks.find((task) => task.id === taskModalState.taskId) ?? null;
  }, [taskModalState, tasks.tasks]);

  useEffect(() => {
    if (taskModalState.open && taskModalState.mode === "edit" && !selectedTask) {
      setTaskModalState({
        mode: "create",
        open: false,
      });
    }
  }, [selectedTask, taskModalState]);

  const handleRetry = () => {
    guestSession.retry();
    void tasks.refetch();
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    await tasks.createTask({
      ...toTaskMutationInput(values),
      status: "todo",
    });

    setTaskModalState({
      mode: "create",
      open: false,
    });
  };

  const handleUpdateTask = async (values: TaskFormValues) => {
    if (!selectedTask) {
      return;
    }

    await tasks.updateTask(selectedTask.id, toTaskMutationInput(values));

    setTaskModalState({
      mode: "create",
      open: false,
    });
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) {
      return;
    }

    await tasks.deleteTask(selectedTask.id);

    setTaskModalState({
      mode: "create",
      open: false,
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriority("all");
    setAssigneeId("all");
  };

  return (
    <>
      <div className="relative isolate min-h-screen overflow-hidden bg-canvas text-ink">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.07),_transparent_22%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row">
          <WorkspaceRail guestUserId={guestSession.user?.id ?? null} />

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/60 shadow-shell backdrop-blur-xl lg:min-h-[calc(100vh-2rem)]">
            <Board
              filters={{
                assigneeId,
                priority,
                searchQuery,
              }}
              guestUserId={guestSession.user?.id ?? null}
              isLoading={guestSession.isLoading || tasks.isLoading}
              members={teamMembers.members}
              mutationError={taskModalState.open ? null : tasks.mutationError}
              onAssigneeChange={setAssigneeId}
              onCreateTask={() => {
                tasks.clearMutationError();
                setTaskModalState({
                  mode: "create",
                  open: true,
                });
              }}
              onDismissMutationError={tasks.clearMutationError}
              onPriorityChange={setPriority}
              onResetFilters={handleResetFilters}
              onRetry={handleRetry}
              onSearchChange={setSearchQuery}
              onTaskMove={tasks.moveTask}
              onTaskSelect={(taskId) => {
                tasks.clearMutationError();
                setTaskModalState({
                  mode: "edit",
                  open: true,
                  taskId,
                });
              }}
              sessionError={guestSession.error}
              tasks={tasks.tasks}
              taskError={tasks.error}
            />
          </main>
        </div>
      </div>

      <TaskModal
        error={tasks.mutationError}
        isDeleting={tasks.isDeleting}
        isSaving={tasks.isCreating || tasks.isUpdating}
        mode={taskModalState.mode === "edit" ? "edit" : "create"}
        onClose={() => {
          tasks.clearMutationError();
          setTaskModalState({
            mode: "create",
            open: false,
          });
        }}
        onDelete={taskModalState.mode === "edit" ? handleDeleteTask : undefined}
        onSubmit={
          taskModalState.mode === "edit" ? handleUpdateTask : handleCreateTask
        }
        open={taskModalState.open}
        task={selectedTask}
      />
    </>
  );
}
