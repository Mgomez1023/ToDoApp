import { TaskCard } from "@/components/board/TaskCard";
import type { Task } from "@/types/task";

interface DragOverlayCardProps {
  task: Task;
}

export function DragOverlayCard({ task }: DragOverlayCardProps) {
  return <TaskCard className="rotate-1 shadow-lift" task={task} />;
}
