import { useEffect, useMemo, useState } from "react";

import { Board } from "@/components/board/Board";
import { AboutModal } from "@/components/layout/AboutModal";
import { WorkspaceRail } from "@/components/layout/WorkspaceRail";
import { TeamMembersModal } from "@/components/team/TeamMembersModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useGuestSession } from "@/hooks/useGuestSession";
import { useLabels } from "@/hooks/useLabels";
import { useTasks } from "@/hooks/useTasks";
import { useThemePreference } from "@/hooks/useThemePreference";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { filterTasks, getGuestCode } from "@/lib/utils";
import type {
  AssigneeFilter,
  Task,
  TaskFormValues,
  TaskMutationRequest,
  TaskPriorityFilter,
} from "@/types/task";

type TaskModalState =
  | { mode: "create"; open: false }
  | { mode: "create"; open: true }
  | { mode: "edit"; open: true; taskId: string };

function toTaskMutationInput(values: TaskFormValues): TaskMutationRequest {
  return {
    assigneeIds: values.assigneeIds,
    description: values.description.trim() || null,
    due_date: values.dueDate || null,
    labelIds: values.labelIds,
    priority: values.priority,
    status: values.status,
    title: values.title.trim(),
  };
}

export function App() {
  const { setTheme, theme } = useThemePreference();
  const guestSession = useGuestSession();
  const tasks = useTasks(guestSession.user?.id);
  const labels = useLabels(guestSession.user?.id);
  const teamMembers = useTeamMembers(guestSession.user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState<TaskPriorityFilter>("all");
  const [assigneeId, setAssigneeId] = useState<AssigneeFilter>("all");
  const [labelId, setLabelId] = useState<string | "all">("all");
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [taskSelectionFallback, setTaskSelectionFallback] = useState<Task | null>(null);
  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    mode: "create",
    open: false,
  });
  const boardFilters = useMemo(
    () => ({
      assigneeId,
      labelId,
      priority,
      searchQuery,
    }),
    [assigneeId, labelId, priority, searchQuery],
  );
  const visibleTaskCount = useMemo(
    () => filterTasks(tasks.tasks, boardFilters).length,
    [boardFilters, tasks.tasks],
  );
  const hasActiveFilters =
    boardFilters.searchQuery.trim().length > 0 ||
    boardFilters.priority !== "all" ||
    boardFilters.assigneeId !== "all" ||
    boardFilters.labelId !== "all";

  const selectedTask = useMemo(() => {
    if (!taskModalState.open || taskModalState.mode !== "edit") {
      return null;
    }

    return (
      tasks.tasks.find((task) => task.id === taskModalState.taskId) ??
      (taskSelectionFallback?.id === taskModalState.taskId
        ? taskSelectionFallback
        : null)
    );
  }, [taskModalState, taskSelectionFallback, tasks.tasks]);

  useEffect(() => {
    if (
      taskSelectionFallback &&
      tasks.tasks.some((task) => task.id === taskSelectionFallback.id)
    ) {
      setTaskSelectionFallback(null);
    }
  }, [taskSelectionFallback, tasks.tasks]);

  useEffect(() => {
    if (taskModalState.open && taskModalState.mode === "edit" && !selectedTask) {
      setTaskModalState({
        mode: "create",
        open: false,
      });
    }
  }, [selectedTask, taskModalState]);

  useEffect(() => {
    if (
      assigneeId !== "all" &&
      teamMembers.members.every((member) => member.id !== assigneeId)
    ) {
      setAssigneeId("all");
    }
  }, [assigneeId, teamMembers.members]);

  useEffect(() => {
    if (labelId !== "all" && labels.labels.every((label) => label.id !== labelId)) {
      setLabelId("all");
    }
  }, [labelId, labels.labels]);

  const handleRetry = () => {
    guestSession.retry();
    void labels.refetch();
    void tasks.refetch();
    void teamMembers.refetch();
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    const nextTask = await tasks.createTask(toTaskMutationInput(values));
    setTaskSelectionFallback(nextTask);
    setTaskModalState({
      mode: "edit",
      open: true,
      taskId: nextTask.id,
    });
  };

  const handleUpdateTask = async (values: TaskFormValues) => {
    if (!selectedTask) {
      return;
    }

    await tasks.updateTask(selectedTask.id, toTaskMutationInput(values));
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) {
      return;
    }

    await tasks.deleteTask(selectedTask.id);
    setTaskSelectionFallback(null);

    setTaskModalState({
      mode: "create",
      open: false,
    });
  };

  const handleCreateMember = async (input: {
    avatar_color: string;
    name: string;
  }) => {
    await teamMembers.createMember(input);
  };

  const handleDeleteMember = async (memberId: string) => {
    await teamMembers.deleteMember(memberId);
    void tasks.refetch();
  };

  const handleLinkGuestMember = async (guestCode: string) => {
    await teamMembers.linkGuestMember(guestCode);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriority("all");
    setAssigneeId("all");
    setLabelId("all");
  };

  const openTeamManager = () => {
    teamMembers.clearMutationError();
    setIsTeamModalOpen(true);
  };

  return (
    <>
      <div className="relative isolate min-h-screen overflow-hidden bg-canvas text-ink">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--page-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--page-grid-line)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--page-glow-a),transparent_26%),radial-gradient(circle_at_bottom_right,var(--page-glow-b),transparent_22%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row">
          <WorkspaceRail
            guestUserId={guestSession.user?.id ?? null}
            hasActiveFilters={hasActiveFilters}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onManageTeam={openTeamManager}
            onThemeChange={setTheme}
            tasks={tasks.tasks}
            theme={theme}
            visibleTaskCount={visibleTaskCount}
          />

          <main className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-shell backdrop-blur-xl lg:min-h-[calc(100vh-2rem)]">
            <Board
              filters={boardFilters}
              isDeletingTask={tasks.isDeleting}
              isLoading={guestSession.isLoading || tasks.isLoading}
              labels={labels.labels}
              members={teamMembers.members}
              mutationError={taskModalState.open ? null : tasks.mutationError}
              onAssigneeChange={setAssigneeId}
              onCreateTask={() => {
                tasks.clearMutationError();
                labels.clearMutationError();
                setTaskSelectionFallback(null);
                setTaskModalState({
                  mode: "create",
                  open: true,
                });
              }}
              onDismissMutationError={tasks.clearMutationError}
              onLabelChange={setLabelId}
              onPriorityChange={setPriority}
              onResetFilters={handleResetFilters}
              onRetry={handleRetry}
              onSearchChange={setSearchQuery}
              onTaskDelete={tasks.deleteTask}
              onTaskMove={tasks.moveTask}
              onTaskSelect={(taskId) => {
                tasks.clearMutationError();
                labels.clearMutationError();
                setTaskSelectionFallback(null);
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
        currentUserId={guestSession.user?.id ?? null}
        isDeleting={tasks.isDeleting}
        isCreatingLabel={labels.isCreating}
        isSaving={tasks.isCreating || tasks.isUpdating}
        canManageAssignees={
          taskModalState.mode !== "edit" ||
          selectedTask?.user_id === guestSession.user?.id
        }
        canManageLabels={
          taskModalState.mode !== "edit" ||
          selectedTask?.user_id === guestSession.user?.id
        }
        labelError={labels.mutationError}
        labels={
          taskModalState.mode === "edit" &&
          selectedTask?.user_id !== guestSession.user?.id
            ? selectedTask?.labels ?? []
            : labels.ownedLabels
        }
        members={teamMembers.ownedMembers}
        mode={taskModalState.mode === "edit" ? "edit" : "create"}
        onClose={() => {
          tasks.clearMutationError();
          labels.clearMutationError();
          setTaskSelectionFallback(null);
          setTaskModalState({
            mode: "create",
            open: false,
          });
        }}
        onCreateLabel={labels.createLabel}
        onDelete={
          taskModalState.mode === "edit" &&
          selectedTask?.user_id === guestSession.user?.id
            ? handleDeleteTask
            : undefined
        }
        onManageTeam={openTeamManager}
        onSubmit={
          taskModalState.mode === "edit" ? handleUpdateTask : handleCreateTask
        }
        open={taskModalState.open}
        task={selectedTask}
      />

      <TeamMembersModal
        deletingMemberId={teamMembers.deletingMemberId}
        guestCode={guestSession.user?.id ? getGuestCode(guestSession.user.id) : null}
        error={teamMembers.mutationError ?? teamMembers.error}
        isLinking={teamMembers.isLinking}
        isLoading={teamMembers.isLoading}
        isSaving={teamMembers.isCreating}
        members={teamMembers.ownedMembers}
        onClose={() => {
          teamMembers.clearMutationError();
          setIsTeamModalOpen(false);
        }}
        onCreateMember={handleCreateMember}
        onDeleteMember={handleDeleteMember}
        onLinkGuestMember={handleLinkGuestMember}
        open={isTeamModalOpen}
      />

      <AboutModal
        onClose={() => setIsAboutModalOpen(false)}
        open={isAboutModalOpen}
      />
    </>
  );
}
