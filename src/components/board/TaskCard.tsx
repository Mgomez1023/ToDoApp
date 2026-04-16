import { CalendarDays } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";

import { TaskLabels } from "@/components/tasks/TaskLabels";
import { AvatarGroup } from "@/components/team/AvatarGroup";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { getTaskCardColorStyles } from "@/lib/colors";
import { getDueDateMeta } from "@/lib/dates";
import { PRIORITY_LABELS } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isDragOverlay?: boolean;
  isDragging?: boolean;
  task: Task;
}

const priorityToneMap = {
  high: "warning",
  low: "neutral",
  normal: "accent",
} as const;

export const TaskCard = forwardRef<HTMLButtonElement, TaskCardProps>(function TaskCard(
  { className, isDragOverlay = false, isDragging = false, style, task, ...props },
  ref,
) {
  const accentLabel = task.labels[0] ?? null;
  const cardStyle = accentLabel
    ? ({ ...getTaskCardColorStyles(accentLabel.color), ...style } as CSSProperties)
    : style;
  const dueDate = getDueDateMeta(task.due_date);

  return (
    <button
      ref={ref}
      style={cardStyle}
      type="button"
      className={cn(
        "group w-full touch-none select-none rounded-[1rem] border px-3 py-3 text-left shadow-card transition-[transform,box-shadow,border-color,background-color] hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:px-3.5",
        accentLabel
          ? "border-transparent bg-[color:var(--task-card-bg)] hover:border-transparent hover:bg-[color:var(--task-card-bg-hover)]"
          : "border-transparent bg-white hover:border-transparent hover:bg-slate-50/95",
        "cursor-grab active:cursor-grabbing",
        isDragging &&
          "border-transparent bg-white/85 opacity-35 shadow-none ring-1 ring-accent/15",
        isDragOverlay &&
          "cursor-grabbing border-transparent bg-white/95 shadow-shell ring-1 ring-accent/10",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {task.labels.length > 0 ? (
            <TaskLabels labels={task.labels} limit={2} />
          ) : null}
        </div>
        <Badge className="shrCurrent teamink-0" tone={priorityToneMap[task.priority]}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>

      <div className="mt-2.5">
        <h3 className="text-[14px] font-semibold leading-5 text-ink sm:text-[15px]">
          {task.title}
        </h3>
        {task.description ? (
          <p className="mt-1.5 overflow-hidden text-[13px] leading-5 text-ink-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {task.description}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 flex items-center justify-between gap-3 border-t pt-2.5",
          accentLabel ? "border-t-[color:var(--task-card-divider)]" : "border-line/70",
        )}
      >
        <div className="min-w-0 flex-1">
          {dueDate ? (
            <div
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:text-[11px]",
                dueDate.tone === "overdue" &&
                  "border border-rose-200 bg-rose-50 text-rose-700",
                dueDate.tone === "today" &&
                  "border border-blue-200 bg-blue-50 text-blue-700",
                dueDate.tone === "soon" &&
                  "border border-amber-200 bg-amber-50 text-amber-700",
                dueDate.tone === "normal" &&
                  "border border-line/80 bg-slate-50 text-ink-muted",
              )}
            >
              <CalendarDays className="size-3 shrink-0 sm:size-3.5" />
              <span className="truncate">
                {dueDate.tone === "normal"
                  ? dueDate.formattedDate
                  : `${dueDate.shortLabel} · ${dueDate.formattedDate}`}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-ink-soft">No due date</span>
          )}
        </div>

        <AvatarGroup members={task.assignees} size="sm" />
      </div>
    </button>
  );
});

TaskCard.displayName = "TaskCard";
