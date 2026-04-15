import type {
  AssigneeFilter,
  BoardFilters,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/types/task";

export const BOARD_COLUMNS: Array<{
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  status: TaskStatus;
  title: string;
}> = [
  {
    status: "todo",
    title: "To Do",
    description: "Queued next",
    emptyTitle: "Create your first task",
    emptyDescription: "Capture the next piece of work and keep the backlog sharp.",
  },
  {
    status: "in_progress",
    title: "In Progress",
    description: "Moving now",
    emptyTitle: "Nothing in motion",
    emptyDescription: "Move active work here once execution starts.",
  },
  {
    status: "in_review",
    title: "In Review",
    description: "Awaiting eyes",
    emptyTitle: "Nothing in review yet",
    emptyDescription: "Move tasks here when they are ready for a final pass.",
  },
  {
    status: "done",
    title: "Done",
    description: "Closed cleanly",
    emptyTitle: "No wins logged yet",
    emptyDescription: "Finished work lands here so progress stays visible.",
  },
];

export const PRIORITY_FILTER_OPTIONS: Array<{
  label: string;
  value: TaskPriority | "all";
}> = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High priority" },
  { value: "normal", label: "Normal priority" },
  { value: "low", label: "Low priority" },
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

export function isTaskStatus(value: string | null | undefined): value is TaskStatus {
  return BOARD_COLUMNS.some((column) => column.status === value);
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function matchesAssignee(task: Task, assigneeId: AssigneeFilter) {
  if (assigneeId === "all") {
    return true;
  }

  return task.assignees.some((assignee) => assignee.id === assigneeId);
}

export function filterTasks(tasks: Task[], filters: BoardFilters) {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      task.title.toLowerCase().includes(normalizedQuery);

    const matchesPriority =
      filters.priority === "all" || task.priority === filters.priority;

    return matchesQuery && matchesPriority && matchesAssignee(task, filters.assigneeId);
  });
}

export function groupTasksByStatus(tasks: Task[]) {
  return tasks.reduce<Record<TaskStatus, Task[]>>(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    },
  );
}
