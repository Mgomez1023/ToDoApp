import { TaskForm } from "@/components/tasks/TaskForm";
import { Modal } from "@/components/ui/Modal";
import type { Task, TaskFormValues } from "@/types/task";
import type { TeamMember } from "@/types/team";

interface TaskModalProps {
  canManageAssignees: boolean;
  error: string | null;
  isDeleting: boolean;
  isSaving: boolean;
  members: TeamMember[];
  mode: "create" | "edit";
  onClose: () => void;
  onDelete?: () => Promise<void>;
  onManageTeam: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  open: boolean;
  task: Task | null;
}

export function TaskModal({
  canManageAssignees,
  error,
  isDeleting,
  isSaving,
  members,
  mode,
  onClose,
  onDelete,
  onManageTeam,
  onSubmit,
  open,
  task,
}: TaskModalProps) {
  const isEditing = mode === "edit";

  if (isEditing && !task) {
    return null;
  }

  return (
    <Modal
      description={
        isEditing
          ? "Update the task details, change its board status, or remove it from the workspace."
          : "Capture the next piece of work and it will land in To Do automatically."
      }
      onClose={onClose}
      open={open}
      title={isEditing ? "Edit task" : "New task"}
    >
      <TaskForm
        canManageAssignees={canManageAssignees}
        error={error}
        isDeleting={isDeleting}
        isSaving={isSaving}
        members={members}
        mode={mode}
        onDelete={onDelete}
        onManageTeam={onManageTeam}
        onSubmit={onSubmit}
        task={task}
      />
    </Modal>
  );
}
