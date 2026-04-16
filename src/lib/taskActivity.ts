import { format, parseISO } from "date-fns";

import type { TaskActivity, TaskActivityDraft } from "@/types/activity";
import type { Task } from "@/types/task";

type ActivityMetadata =
  | {
      title?: string;
      change?: "added" | "cleared" | "updated";
      from?: string | null;
      to?: string | null;
      added?: string[];
      removed?: string[];
      preview?: string;
    }
  | null
  | undefined;

interface BuildTaskActivityDraftsOptions {
  actorUserId: string;
  nextTask: Pick<Task, "description" | "due_date" | "id" | "priority" | "status" | "title">;
  nextAssigneeNames: string[];
  nextLabelNames: string[];
  previousAssigneeNames: string[];
  previousLabelNames: string[];
  previousTask:
    | Pick<Task, "description" | "due_date" | "id" | "priority" | "status" | "title">
    | null;
}

function sortNames(values: string[]) {
  return [...values].sort((leftValue, rightValue) => leftValue.localeCompare(rightValue));
}

function getAddedAndRemoved(previousValues: string[], nextValues: string[]) {
  const previousSet = new Set(previousValues);
  const nextSet = new Set(nextValues);

  return {
    added: sortNames(nextValues.filter((value) => !previousSet.has(value))),
    removed: sortNames(previousValues.filter((value) => !nextSet.has(value))),
  };
}

function formatStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Unknown";
  }

  if (status === "todo") {
    return "To Do";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPriorityLabel(priority: string | null | undefined) {
  if (!priority) {
    return "Unknown";
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDueDateLabel(dueDate: string | null | undefined) {
  if (!dueDate) {
    return null;
  }

  return format(parseISO(dueDate), "MMMM d");
}

function getMetadata(activity: TaskActivity): ActivityMetadata {
  if (!activity.metadata || typeof activity.metadata !== "object" || Array.isArray(activity.metadata)) {
    return null;
  }

  return activity.metadata as ActivityMetadata;
}

function getNamesList(values: string[] | undefined) {
  if (!values || values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

export function buildTaskActivityDrafts({
  actorUserId,
  nextAssigneeNames,
  nextLabelNames,
  nextTask,
  previousAssigneeNames,
  previousLabelNames,
  previousTask,
}: BuildTaskActivityDraftsOptions): TaskActivityDraft[] {
  const entries: TaskActivityDraft[] = [];

  if (!previousTask) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "task_created",
      metadata: nextTask.title ? { title: nextTask.title } : {},
      task_id: nextTask.id,
    });
  }

  if (previousTask && previousTask.title !== nextTask.title) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "title_changed",
      metadata: {
        from: previousTask.title,
        to: nextTask.title,
      },
      task_id: nextTask.id,
    });
  }

  if (previousTask && previousTask.description !== nextTask.description) {
    const previousDescription = previousTask.description?.trim() ?? "";
    const nextDescription = nextTask.description?.trim() ?? "";
    const change =
      previousDescription.length === 0 && nextDescription.length > 0
        ? "added"
        : previousDescription.length > 0 && nextDescription.length === 0
          ? "cleared"
          : "updated";

    entries.push({
      actor_user_id: actorUserId,
      event_type: "description_changed",
      metadata: {
        change,
      },
      task_id: nextTask.id,
    });
  }

  if (previousTask && previousTask.status !== nextTask.status) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "status_changed",
      metadata: {
        from: previousTask.status,
        to: nextTask.status,
      },
      task_id: nextTask.id,
    });
  }

  if (previousTask && previousTask.priority !== nextTask.priority) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "priority_changed",
      metadata: {
        from: previousTask.priority,
        to: nextTask.priority,
      },
      task_id: nextTask.id,
    });
  }

  if (previousTask && previousTask.due_date !== nextTask.due_date) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "due_date_changed",
      metadata: {
        from: previousTask.due_date,
        to: nextTask.due_date,
      },
      task_id: nextTask.id,
    });
  }

  const assigneeDiff = getAddedAndRemoved(previousAssigneeNames, nextAssigneeNames);

  if (assigneeDiff.added.length > 0 || assigneeDiff.removed.length > 0) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "assignees_changed",
      metadata: {
        added: assigneeDiff.added,
        removed: assigneeDiff.removed,
      },
      task_id: nextTask.id,
    });
  }

  const labelDiff = getAddedAndRemoved(previousLabelNames, nextLabelNames);

  if (labelDiff.added.length > 0 || labelDiff.removed.length > 0) {
    entries.push({
      actor_user_id: actorUserId,
      event_type: "labels_changed",
      metadata: {
        added: labelDiff.added,
        removed: labelDiff.removed,
      },
      task_id: nextTask.id,
    });
  }

  return entries;
}

export function buildCommentActivityDraft(options: {
  actorUserId: string;
  body: string;
  taskId: string;
}): TaskActivityDraft {
  return {
    actor_user_id: options.actorUserId,
    event_type: "comment_added",
    metadata: {
      preview: options.body.trim().slice(0, 120),
    },
    task_id: options.taskId,
  };
}

export function getTaskActivityCopy(activity: TaskActivity) {
  const metadata = getMetadata(activity);

  switch (activity.event_type) {
    case "task_created":
      return {
        detail: null,
        summary: "Created this task",
      };
    case "title_changed":
      return {
        detail: metadata?.to ? `Now "${metadata.to}"` : null,
        summary: "Renamed the task",
      };
    case "description_changed":
      return {
        detail: null,
        summary:
          metadata?.change === "added"
            ? "Added a description"
            : metadata?.change === "cleared"
              ? "Cleared the description"
              : "Updated the description",
      };
    case "status_changed":
      return {
        detail:
          metadata?.from || metadata?.to
            ? `${formatStatusLabel(metadata?.from)} to ${formatStatusLabel(metadata?.to)}`
            : null,
        summary: "Moved the task",
      };
    case "priority_changed":
      return {
        detail:
          metadata?.from || metadata?.to
            ? `${formatPriorityLabel(metadata?.from)} to ${formatPriorityLabel(metadata?.to)}`
            : null,
        summary: "Changed priority",
      };
    case "due_date_changed": {
      const nextLabel = formatDueDateLabel(metadata?.to ?? null);
      const previousLabel = formatDueDateLabel(metadata?.from ?? null);

      return {
        detail: nextLabel ?? previousLabel,
        summary:
          !metadata?.to
            ? "Cleared the due date"
            : metadata?.from
              ? "Updated the due date"
              : "Set the due date",
      };
    }
    case "assignees_changed": {
      const added = metadata?.added ?? [];
      const removed = metadata?.removed ?? [];

      if (added.length === 1 && removed.length === 0) {
        return {
          detail: null,
          summary: `Assigned ${added[0]}`,
        };
      }

      if (removed.length === 1 && added.length === 0) {
        return {
          detail: null,
          summary: `Removed ${removed[0]}`,
        };
      }

      return {
        detail: [added.length > 0 ? `Added ${getNamesList(added)}` : null, removed.length > 0 ? `Removed ${getNamesList(removed)}` : null]
          .filter(Boolean)
          .join(" · "),
        summary: "Updated assignees",
      };
    }
    case "labels_changed": {
      const added = metadata?.added ?? [];
      const removed = metadata?.removed ?? [];

      if (added.length === 1 && removed.length === 0) {
        return {
          detail: null,
          summary: `Added label ${added[0]}`,
        };
      }

      if (removed.length === 1 && added.length === 0) {
        return {
          detail: null,
          summary: `Removed label ${removed[0]}`,
        };
      }

      return {
        detail: [added.length > 0 ? `Added ${getNamesList(added)}` : null, removed.length > 0 ? `Removed ${getNamesList(removed)}` : null]
          .filter(Boolean)
          .join(" · "),
        summary: "Updated labels",
      };
    }
    case "comment_added":
      return {
        detail: metadata?.preview ? `"${metadata.preview}"` : null,
        summary: "Added a comment",
      };
    default:
      return {
        detail: null,
        summary: "Updated the task",
      };
  }
}
