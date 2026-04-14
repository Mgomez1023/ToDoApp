import { Inbox } from "lucide-react";

import { TaskCard } from "@/components/board/TaskCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Task } from "@/types/task";

interface BoardColumnProps {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  isLoading: boolean;
  tasks: Task[];
  title: string;
}

export function BoardColumn({
  description,
  emptyDescription,
  emptyTitle,
  isLoading,
  tasks,
  title,
}: BoardColumnProps) {
  return (
    <section className="flex min-h-[540px] flex-col rounded-[1.85rem] border border-white/80 bg-white/75 p-4 shadow-card backdrop-blur-sm">
      <header className="flex items-start justify-between gap-3 border-b border-line/70 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        <Badge tone="neutral">{isLoading ? "..." : tasks.length}</Badge>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-36 rounded-[1.5rem]" />
            <Skeleton className="h-28 rounded-[1.5rem]" />
            <Skeleton className="h-32 rounded-[1.5rem]" />
          </>
        ) : tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <EmptyState
            className="min-h-[300px] flex-1"
            description={emptyDescription}
            icon={Inbox}
            title={emptyTitle}
          />
        )}
      </div>
    </section>
  );
}
