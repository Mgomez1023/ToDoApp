import type { Database } from "@/types/db";

export const TASK_ACTIVITY_EVENT_TYPES = [
  "task_created",
  "title_changed",
  "description_changed",
  "status_changed",
  "priority_changed",
  "due_date_changed",
  "assignees_changed",
  "labels_changed",
  "comment_added",
] as const;

export type TaskActivityEventType = (typeof TASK_ACTIVITY_EVENT_TYPES)[number];
export type TaskActivity = Database["public"]["Tables"]["task_activity"]["Row"];
export type TaskActivityDraft = Database["public"]["Tables"]["task_activity"]["Insert"];
export type TaskActivityUpdate = Database["public"]["Tables"]["task_activity"]["Update"];
