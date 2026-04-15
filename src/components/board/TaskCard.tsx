import { CalendarDays, GripVertical } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { AvatarGroup } from "@/components/team/AvatarGroup";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
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

const dueDateToneMap = {
  normal: "neutral",
  overdue: "danger",
  soon: "warning",
  today: "accent",
} as const;

export const TaskCard = forwardRef<HTMLButtonElement, TaskCardProps>(function TaskCard(
  { className, isDragOverlay = false, isDragging = false, task, ...props },
  ref,
) {
  const dueDate = getDueDateMeta(task.due_date);
  const showUrgencyBadge = dueDate && dueDate.tone !== "normal";

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group w-full select-none rounded-[1rem] border border-slate-200/90 bg-white px-3 py-3 text-left shadow-card transition-[transform,box-shadow,border-color,background-color] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:px-3.5",
        "cursor-grab active:cursor-grabbing",
        isDragging &&
          "border-accent/30 bg-white/85 opacity-35 shadow-none ring-1 ring-accent/15",
        isDragOverlay &&
          "cursor-grabbing border-accent/30 bg-white/95 shadow-shell ring-1 ring-accent/10",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={priorityToneMap[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          {showUrgencyBadge ? (
            <Badge tone={dueDateToneMap[dueDate.tone]}>
              {dueDate.shortLabel}
            </Badge>
          ) : null}
        </div>
        <div
          className={cn(
            "rounded-lg border border-line/70 bg-slate-50 p-1.5 text-ink-soft transition group-hover:border-slate-200 group-hover:bg-slate-100 group-hover:text-ink",
            (isDragging || isDragOverlay) && "bg-accent/10 text-accent",
          )}
        >
          <GripVertical className="size-3.5" />
        </div>
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

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/70 pt-2.5">
        <div className="min-w-0">
          {dueDate ? (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-medium",
                dueDate.tone === "overdue" && "text-rose-700",
                dueDate.tone === "today" && "text-blue-700",
                dueDate.tone === "soon" && "text-amber-700",
                dueDate.tone === "normal" && "text-ink-muted",
              )}
            >
              <CalendarDays className="size-3.5" />
              <span className="truncate">{dueDate.formattedDate}</span>
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
