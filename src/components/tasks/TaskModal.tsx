import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import type { Label } from "@/types/label";
import type { Task, TaskFormValues } from "@/types/task";
import type { TeamMember } from "@/types/team";

interface TaskModalProps {
  canManageAssignees: boolean;
  canManageLabels: boolean;
  currentUserId: string | null;
  error: string | null;
  isCreatingLabel: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  labelError: string | null;
  labels: Label[];
  members: TeamMember[];
  mode: "create" | "edit";
  onClose: () => void;
  onCreateLabel: (input: { color: string; name: string }) => Promise<Label>;
  onDelete?: () => Promise<void>;
  onManageTeam: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  open: boolean;
  task: Task | null;
}

export function TaskModal({
  canManageAssignees,
  canManageLabels,
  currentUserId,
  error,
  isCreatingLabel,
  isDeleting,
  isSaving,
  labelError,
  labels,
  members,
  mode,
  onClose,
  onCreateLabel,
  onDelete,
  onManageTeam,
  onSubmit,
  open,
  task,
}: TaskModalProps) {
  if (mode === "edit" && !task) {
    return null;
  }

  return (
    <TaskDetailSheet
      canManageAssignees={canManageAssignees}
      canManageLabels={canManageLabels}
      currentUserId={currentUserId}
      error={error}
      isCreatingLabel={isCreatingLabel}
      isDeleting={isDeleting}
      isSaving={isSaving}
      labelError={labelError}
      labels={labels}
      members={members}
      mode={mode}
      onClose={onClose}
      onCreateLabel={onCreateLabel}
      onDelete={onDelete}
      onManageTeam={onManageTeam}
      onSubmit={onSubmit}
      open={open}
      task={task}
    />
  );
}
