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
  Search,
  SearchX,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

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
import type { Label } from "@/types/label";
import type {
  BoardFilters,
  Task,
  TaskPriorityFilter,
  TaskStatus,
} from "@/types/task";
import type { TeamMember } from "@/types/team";

interface BoardProps {
  filters: BoardFilters;
  isLoading: boolean;
  labels: Label[];
  members: TeamMember[];
  mutationError: string | null;
  onAssigneeChange: (value: string | "all") => void;
  onCreateTask: () => void;
  onDismissMutationError: () => void;
  onLabelChange: (value: string | "all") => void;
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
  isLoading,
  labels,
  members,
  mutationError,
  onAssigneeChange,
  onCreateTask,
  onDismissMutationError,
  onLabelChange,
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
  const [isSearchOpen, setIsSearchOpen] = useState(
    () => filters.searchQuery.trim().length > 0,
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    filters.assigneeId !== "all" ||
    filters.labelId !== "all";

  const showNoResults = !isLoading && hasActiveFilters && filteredTasks.length === 0;
  const showBoardColumns =
    isLoading || filteredTasks.length > 0 || (!hasActiveFilters && tasks.length === 0);
  const searchQuery = filters.searchQuery.trim();
  const isSearchActive = searchQuery.length > 0;

  useEffect(() => {
    if (isSearchActive) {
      setIsSearchOpen(true);
    }
  }, [isSearchActive]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

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
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
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

            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button
                aria-controls="board-search-panel"
                aria-expanded={isSearchOpen}
                className={`${
                  isSearchOpen || isSearchActive
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : ""
                }`}
                onClick={() => setIsSearchOpen((currentValue) => !currentValue)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <Search className="size-4" />
                Search
              </Button>
              <Button
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

          <div
            aria-hidden={!isSearchOpen}
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isSearchOpen
                ? "max-h-[32rem] translate-y-0 opacity-100"
                : "pointer-events-none max-h-0 -translate-y-4 opacity-0"
            }`}
            id="board-search-panel"
          >
            <div className="rounded-[1.35rem] border border-white/80 bg-white/75 p-3 shadow-card backdrop-blur-xl sm:p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Search and filters</p>
                  <p className="text-xs text-ink-muted">
                    Narrow the board by title, priority, label, or assignee.
                  </p>
                </div>
                <Badge tone={isSearchActive ? "accent" : "neutral"}>
                  {isSearchActive
                    ? `${filteredTasks.length} visible task${
                        filteredTasks.length === 1 ? "" : "s"
                      }`
                    : ""}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-start">
                <SearchBar
                  className="w-full md:w-[15.5rem] md:flex-none"
                  inputRef={searchInputRef}
                  onChange={onSearchChange}
                  onClear={() => onSearchChange("")}
                  value={filters.searchQuery}
                />

                <div className="min-w-0 flex-1">
                  <FilterBar
                    assigneeId={filters.assigneeId}
                    hasActiveFilters={hasActiveFilters}
                    labelId={filters.labelId}
                    labels={labels}
                    members={members}
                    onAssigneeChange={onAssigneeChange}
                    onLabelChange={onLabelChange}
                    onPriorityChange={onPriorityChange}
                    onResetFilters={onResetFilters}
                    priority={filters.priority}
                  />
                </div>
              </div>
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
            description="No tasks match the current title, priority, assignee, or label filters."
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
