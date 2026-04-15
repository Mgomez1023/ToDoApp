import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  AlertTriangle,
  Plus,
  SearchX,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo, useState } from "react";

import { BoardColumn } from "@/components/board/BoardColumn";
import { DragOverlayCard } from "@/components/board/DragOverlayCard";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchBar } from "@/components/filters/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BOARD_COLUMNS,
  filterTasks,
  groupTasksByStatus,
  isTaskStatus,
} from "@/lib/utils";
import type {
  BoardFilters,
  Task,
  TaskPriorityFilter,
  TaskStatus,
} from "@/types/task";
import type { TeamMember } from "@/types/team";

interface BoardProps {
  filters: BoardFilters;
  guestUserId: string | null;
  isLoading: boolean;
  members: TeamMember[];
  mutationError: string | null;
  onAssigneeChange: (value: string | "all") => void;
  onCreateTask: () => void;
  onDismissMutationError: () => void;
  onPriorityChange: (value: TaskPriorityFilter) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  onTaskMove: (taskId: string, nextStatus: TaskStatus) => Promise<void>;
  onTaskSelect: (taskId: string) => void;
  sessionError: string | null;
  taskError: string | null;
  tasks: Task[];
}

export function Board({
  filters,
  guestUserId,
  isLoading,
  members,
  mutationError,
  onAssigneeChange,
  onCreateTask,
  onDismissMutationError,
  onPriorityChange,
  onResetFilters,
  onRetry,
  onSearchChange,
  onTaskMove,
  onTaskSelect,
  sessionError,
  taskError,
  tasks,
}: BoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null);
  const filteredTasks = filterTasks(tasks, filters);
  const groupedTasks = groupTasksByStatus(filteredTasks);
  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  const hasActiveFilters =
    filters.searchQuery.trim().length > 0 ||
    filters.priority !== "all" ||
    filters.assigneeId !== "all";

  const showNoResults = !isLoading && hasActiveFilters && filteredTasks.length === 0;
  const showBoardColumns =
    isLoading || filteredTasks.length > 0 || (!hasActiveFilters && tasks.length === 0);
  const workspaceLabel = guestUserId
    ? `Guest ${guestUserId.slice(0, 8)}`
    : isLoading
      ? "Starting workspace"
      : "Guest workspace";

  const resetActiveDrag = (_event?: DragCancelEvent | DragEndEvent) => {
    setActiveTaskId(null);
    setActiveTaskWidth(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
    setActiveTaskWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    resetActiveDrag(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const overId = String(event.over?.id ?? "");
    const nextStatus = isTaskStatus(overId) ? overId : null;
    const currentTask = tasks.find((task) => task.id === taskId);

    resetActiveDrag(event);

    if (!currentTask || !nextStatus || currentTask.status === nextStatus) {
      return;
    }

    void onTaskMove(taskId, nextStatus);
  };

  const dragOverlay = (
    <DragOverlay>
      {activeTask ? <DragOverlayCard task={activeTask} width={activeTaskWidth} /> : null}
    </DragOverlay>
  );

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-line/80 bg-white/40 px-4 py-4 backdrop-blur-xl sm:px-5 sm:py-5 lg:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                <span>Workspace</span>
                <span className="size-1 rounded-full bg-slate-300" />
                <span>{workspaceLabel}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-[-0.04em] text-ink sm:text-[1.65rem]">
                  Pulse Board
                </h1>
                {hasActiveFilters ? (
                  <Badge tone="accent">
                    {filteredTasks.length} visible task
                    {filteredTasks.length === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <Button
                className="w-full sm:w-auto"
                onClick={onCreateTask}
                size="sm"
                type="button"
                variant="primary"
              >
                <Plus className="size-4" />
                New task
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 xl:flex-row xl:items-center">
              <SearchBar
                onChange={onSearchChange}
                onClear={() => onSearchChange("")}
                value={filters.searchQuery}
              />
              <FilterBar
                assigneeId={filters.assigneeId}
                hasActiveFilters={hasActiveFilters}
                members={members}
                onAssigneeChange={onAssigneeChange}
                onPriorityChange={onPriorityChange}
                onResetFilters={onResetFilters}
                priority={filters.priority}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        {(sessionError || taskError) && !isLoading ? (
          <section className="rounded-[1.1rem] border border-rose-200 bg-rose-50/90 p-3.5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="rounded-xl bg-white p-2.5 text-rose-500 shadow-card">
                  <AlertTriangle className="size-[18px]" />
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

              <Button onClick={onRetry} size="sm" type="button" variant="secondary">
                Retry
              </Button>
            </div>
          </section>
        ) : null}

        {mutationError && !isLoading ? (
          <section className="rounded-[1.1rem] border border-rose-200 bg-rose-50/90 p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="rounded-xl bg-white p-2.5 text-rose-500 shadow-card">
                  <AlertTriangle className="size-[18px]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Couldn&apos;t save the latest board move
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    {mutationError}
                  </p>
                </div>
              </div>

              <Button
                aria-label="Dismiss board error"
                onClick={onDismissMutationError}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </div>
          </section>
        ) : null}

        {showNoResults ? (
          <EmptyState
            className="min-h-[180px] rounded-[1.25rem] bg-slate-50/75 shadow-card sm:min-h-[220px]"
            description="No tasks match the current title, priority, or assignee filters."
            icon={SearchX}
            title="No matching tasks"
          >
            <Button onClick={onResetFilters} size="sm" type="button" variant="secondary">
              Clear filters
            </Button>
          </EmptyState>
        ) : null}

        {showBoardColumns ? (
          <DndContext
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
            <section className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
              <div className="flex min-w-max gap-2.5 sm:gap-3 xl:grid xl:min-w-0 xl:grid-cols-4">
                {BOARD_COLUMNS.map((column) => (
                  <BoardColumn
                    description={column.description}
                    emptyDescription={column.emptyDescription}
                    emptyTitle={column.emptyTitle}
                    hasActiveFilters={hasActiveFilters}
                    isDraggingTask={activeTaskId !== null}
                    isLoading={isLoading}
                    key={column.status}
                    onTaskSelect={onTaskSelect}
                    status={column.status}
                    tasks={groupedTasks[column.status]}
                    title={column.title}
                  />
                ))}
              </div>
            </section>

            {typeof document !== "undefined"
              ? createPortal(dragOverlay, document.body)
              : dragOverlay}
          </DndContext>
        ) : null}
      </div>
    </div>
  );
}
