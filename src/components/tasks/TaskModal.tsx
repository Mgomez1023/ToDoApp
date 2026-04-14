import { TaskForm } from "@/components/tasks/TaskForm";
import { Modal } from "@/components/ui/Modal";

interface TaskModalProps {
  onClose: () => void;
  open: boolean;
}

export function TaskModal({ onClose, open }: TaskModalProps) {
  return (
    <Modal
      description="Task creation will be connected in the next phase. The layout, spacing, and field structure are already in place."
      onClose={onClose}
      open={open}
      title="New task"
    >
      <TaskForm />
    </Modal>
  );
}
