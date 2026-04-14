import { CalendarDays, GripVertical } from "lucide-react";
import type { HTMLAttributes } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { getDueDateMeta } from "@/lib/dates";
import { PRIORITY_LABELS, getInitials } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskCardProps extends HTMLAttributes<HTMLDivElement> {
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

export function TaskCard({ className, task, ...props }: TaskCardProps) {
  const dueDate = getDueDateMeta(task.due_date);

  return (
    <article
      className={cn(
        "group rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-card transition hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={priorityToneMap[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
        </div>
        <div className="rounded-xl bg-slate-100 p-2 text-ink-soft transition group-hover:bg-slate-200 group-hover:text-ink">
          <GripVertical className="size-4" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold leading-6 text-ink">{task.title}</h3>
        {task.description ? (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {task.description.length > 110
              ? `${task.description.slice(0, 110)}...`
              : task.description}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {dueDate ? (
            <Badge tone={dueDateToneMap[dueDate.tone]}>
              <CalendarDays className="mr-1 size-3.5" />
              {dueDate.shortLabel}
            </Badge>
          ) : (
            <Badge tone="neutral">No due date</Badge>
          )}
        </div>

        {task.assignees.length > 0 ? (
          <div className="flex -space-x-2">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div
                className="flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-card"
                key={assignee.id}
                style={{ backgroundColor: assignee.avatar_color }}
                title={assignee.name}
              >
                {getInitials(assignee.name)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
