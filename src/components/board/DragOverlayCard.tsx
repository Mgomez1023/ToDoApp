import { TaskCard } from "@/components/board/TaskCard";
import type { Task } from "@/types/task";

interface DragOverlayCardProps {
  task: Task;
  width?: number | null;
}

export function DragOverlayCard({ task, width }: DragOverlayCardProps) {
  return (
    <TaskCard
      aria-hidden="true"
      className="pointer-events-none rotate-1"
      isDragOverlay
      style={width ? { width } : undefined}
      tabIndex={-1}
      task={task}
    />
  );
}
