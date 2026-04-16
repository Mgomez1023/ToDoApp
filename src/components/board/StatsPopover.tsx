import { cn } from "@/lib/cn";
import { useBoardStats } from "@/hooks/useBoardStats";
import type { Task } from "@/types/task";

interface StatsPopoverPanelProps {
  className?: string;
  hasActiveFilters: boolean;
  tasks: Task[];
  visibleTaskCount: number;
}

export function StatsPopoverPanel({
  className,
  hasActiveFilters,
  tasks,
  visibleTaskCount,
}: StatsPopoverPanelProps) {
  const stats = useBoardStats(tasks);

  return (
    <div
      className={cn(
        "w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-shell backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Board snapshot</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatCard label="Completed" value={stats.completedTasks} />
        <StatCard label="In progress" value={stats.inProgressTasks} />
        <StatCard label="Overdue" value={stats.overdueTasks} />
        <StatCard label="High priority" value={stats.highPriorityTasks} />
      </div>

      {hasActiveFilters ? (
        <div className="mt-3 rounded-2xl border border-line/80 bg-slate-50/85 px-3 py-2.5 text-sm text-ink-muted">
          {visibleTaskCount} task{visibleTaskCount === 1 ? "" : "s"} visible with the
          current filters.
        </div>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border-line/80 bg-slate-50/85 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
