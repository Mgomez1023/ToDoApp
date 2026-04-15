import type { Database } from "@/types/db";
import type { TeamMember } from "@/types/team";

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskPriorityFilter = TaskPriority | "all";
export type AssigneeFilter = string | "all";

export type TaskRecord = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskDraft = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export interface Task extends TaskRecord {
  assignees: TeamMember[];
}

export interface TaskFormValues {
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}

export interface TaskMutationInput {
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}

export interface BoardFilters {
  assigneeId: AssigneeFilter;
  priority: TaskPriorityFilter;
  searchQuery: string;
}
