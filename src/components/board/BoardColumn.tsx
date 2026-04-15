import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";

import { TaskCard } from "@/components/board/TaskCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { Task, TaskStatus } from "@/types/task";

interface BoardColumnProps {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  hasActiveFilters: boolean;
  isDraggingTask: boolean;
  isLoading: boolean;
  onTaskSelect: (taskId: string) => void;
  status: TaskStatus;
  tasks: Task[];
  title: string;
}

const statusAccentClassName: Record<TaskStatus, string> = {
  done: "bg-emerald-500",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  todo: "bg-slate-400",
};

export function BoardColumn({
  description,
  emptyDescription,
  emptyTitle,
  hasActiveFilters,
  isDraggingTask,
  isLoading,
  onTaskSelect,
  status,
  tasks,
  title,
}: BoardColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: {
      status,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[360px] w-[min(82vw,292px)] shrink-0 flex-col rounded-[1.25rem] border border-line/75 bg-slate-50/80 p-2.5 shadow-card backdrop-blur-sm transition-[background-color,border-color,box-shadow,transform] duration-200 sm:w-[300px] sm:p-3 xl:min-h-[420px] xl:w-auto",
        isDraggingTask && "border-slate-200/90",
        isOver &&
          "border-accent/35 bg-white shadow-lift ring-1 ring-accent/15 -translate-y-0.5",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line/70 px-0.5 pb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                statusAccentClassName[status],
              )}
            />
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
          </div>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
            {description}
          </p>
        </div>
        <Badge tone={isOver ? "accent" : "neutral"}>
          {isLoading ? "..." : tasks.length}
        </Badge>
      </header>

      <div
        className={cn(
          "mt-3 flex flex-1 flex-col gap-2 rounded-[1rem] transition-colors duration-200",
          isOver && "bg-accent/5",
        )}
      >
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-[1rem]" />
            <Skeleton className="h-24 rounded-[1rem]" />
            <Skeleton className="h-20 rounded-[1rem]" />
          </>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              onClick={() => onTaskSelect(task.id)}
              task={task}
            />
          ))
        ) : (
          <EmptyState
            className={cn(
              "min-h-[140px] flex-1 rounded-[1rem] border border-dashed border-transparent transition-colors duration-200 sm:min-h-[160px]",
              isOver && "border-accent/30 bg-white/80",
            )}
            description={
              hasActiveFilters
                ? "No tasks in this stage match the current search or priority filter."
                : emptyDescription
            }
            icon={Inbox}
            title={hasActiveFilters ? `No matches in ${title}` : emptyTitle}
          />
        )}
      </div>
    </section>
  );
}

interface DraggableTaskCardProps {
  onClick: () => void;
  task: Task;
}

function DraggableTaskCard({ onClick, task }: DraggableTaskCardProps) {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: task.id,
    data: {
      status: task.status,
      taskId: task.id,
    },
  });

  return (
    <TaskCard
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}. Drag to move between columns or click to edit.`}
      className={cn("relative", isDragging && "z-0")}
      isDragging={isDragging}
      onClick={onClick}
      task={task}
    />
  );
}
