import { getDueDateMeta } from "@/lib/dates";
import type { Task } from "@/types/task";

export function useBoardStats(tasks: Task[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const overdueTasks = tasks.filter(
    (task) => getDueDateMeta(task.due_date)?.tone === "overdue",
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;

  return {
    completedTasks,
    inProgressTasks,
    overdueTasks,
    totalTasks,
  };
}
