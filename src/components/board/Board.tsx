import {
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  Clock3,
  KanbanSquare,
  ListTodo,
  Plus,
  SearchX,
  Sparkles,
} from "lucide-react";

import { BoardColumn } from "@/components/board/BoardColumn";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchBar } from "@/components/filters/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBoardStats } from "@/hooks/useBoardStats";
import { BOARD_COLUMNS, filterTasks, groupTasksByStatus } from "@/lib/utils";
import type { BoardFilters, Task, TaskPriorityFilter } from "@/types/task";
import type { TeamMember } from "@/types/team";

interface BoardProps {
  filters: BoardFilters;
  guestUserId: string | null;
  isLoading: boolean;
  members: TeamMember[];
  onAssigneeChange: (value: string | "all") => void;
  onCreateTask: () => void;
  onPriorityChange: (value: TaskPriorityFilter) => void;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  sessionError: string | null;
  taskError: string | null;
  tasks: Task[];
}

export function Board({
  filters,
  guestUserId,
  isLoading,
  members,
  onAssigneeChange,
  onCreateTask,
  onPriorityChange,
  onRetry,
  onSearchChange,
  sessionError,
  taskError,
  tasks,
}: BoardProps) {
  const filteredTasks = filterTasks(tasks, filters);
  const groupedTasks = groupTasksByStatus(filteredTasks);
  const stats = useBoardStats(tasks);

  const hasActiveFilters =
    filters.searchQuery.trim().length > 0 ||
    filters.priority !== "all" ||
    filters.assigneeId !== "all";

  const showNoResults = !isLoading && tasks.length > 0 && filteredTasks.length === 0;
  const workspaceLabel = guestUserId
    ? `Guest ${guestUserId.slice(0, 8)}`
    : isLoading
      ? "Starting guest workspace"
      : "Guest workspace";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-hero-grid p-6 shadow-shell sm:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.06),_transparent_60%)] lg:block" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-xs font-medium text-ink-muted shadow-card">
              <Sparkles className="size-3.5 text-accent" />
              {workspaceLabel}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
              Pulse Board
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">
              A focused execution board for sharp teams. Guest auth spins up
              invisibly, the board stays private per user, and the workflow is
              tuned for fast daily movement.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreateTask} type="button" variant="primary">
              <Plus className="size-4" />
              New task
            </Button>
          </div>
        </div>
      </section>

      {(sessionError || taskError) && !isLoading ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/90 p-4 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white p-2.5 text-rose-500 shadow-card">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Couldn&apos;t load the workspace
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  {sessionError ?? taskError}
                </p>
              </div>
            </div>

            <Button onClick={onRetry} type="button" variant="secondary">
              Retry
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Everything across the board"
          icon={KanbanSquare}
          isLoading={isLoading}
          title="Total tasks"
          value={stats.totalTasks}
        />
        <StatCard
          description="Items shipped cleanly"
          icon={CheckCheck}
          isLoading={isLoading}
          title="Completed"
          value={stats.completedTasks}
        />
        <StatCard
          description="Needs attention now"
          icon={Clock3}
          isLoading={isLoading}
          title="Overdue"
          value={stats.overdueTasks}
        />
        <StatCard
          description="Currently moving"
          icon={ListTodo}
          isLoading={isLoading}
          title="In progress"
          value={stats.inProgressTasks}
        />
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/70 p-4 shadow-card backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <SearchBar
            onChange={onSearchChange}
            value={filters.searchQuery}
          />
          <FilterBar
            assigneeId={filters.assigneeId}
            members={members}
            onAssigneeChange={onAssigneeChange}
            onPriorityChange={onPriorityChange}
            priority={filters.priority}
          />
        </div>
      </section>

      {showNoResults ? (
        <EmptyState
          className="min-h-56 rounded-[1.75rem] bg-white/72 shadow-card"
          description={
            hasActiveFilters
              ? "No matches for the current search or filter set. Clear a filter and try again."
              : "No tasks have been added yet. The board will fill in once task creation lands."
          }
          icon={SearchX}
          title="No matches for current filters"
        />
      ) : null}

      <section className="overflow-x-auto pb-2">
        <div className="grid min-w-[1080px] gap-4 xl:grid-cols-4">
          {BOARD_COLUMNS.map((column) => (
            <BoardColumn
              description={column.description}
              emptyDescription={column.emptyDescription}
              emptyTitle={column.emptyTitle}
              isLoading={isLoading}
              key={column.status}
              tasks={groupedTasks[column.status]}
              title={column.title}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  description: string;
  icon: typeof KanbanSquare;
  isLoading: boolean;
  title: string;
  value: number;
}

function StatCard({
  description,
  icon: Icon,
  isLoading,
  title,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-card backdrop-blur-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">{title}</p>
          <div className="mt-3 flex items-end gap-3">
            {isLoading ? (
              <div className="h-10 w-20 animate-pulse rounded-2xl bg-slate-200/80" />
            ) : (
              <p className="text-3xl font-semibold tracking-[-0.04em] text-ink">
                {value}
              </p>
            )}
            <Badge className="mb-1" tone="neutral">
              Live board
            </Badge>
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white p-3 text-ink shadow-card">
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
        <ArrowRight className="size-4" />
        {description}
      </div>
    </div>
  );
}
