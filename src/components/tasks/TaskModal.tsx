import { TaskForm } from "@/components/tasks/TaskForm";
import { Modal } from "@/components/ui/Modal";
import type { Task, TaskFormValues } from "@/types/task";

interface TaskModalProps {
  error: string | null;
  isDeleting: boolean;
  isSaving: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onDelete?: () => Promise<void>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  open: boolean;
  task: Task | null;
}

export function TaskModal({
  error,
  isDeleting,
  isSaving,
  mode,
  onClose,
  onDelete,
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
        error={error}
        isDeleting={isDeleting}
        isSaving={isSaving}
        mode={mode}
        onDelete={onDelete}
        onSubmit={onSubmit}
        task={task}
      />
    </Modal>
  );
}
