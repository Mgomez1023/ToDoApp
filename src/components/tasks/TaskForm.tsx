import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskFormValues } from "@/types/task";

interface TaskFormProps {
  error: string | null;
  isDeleting: boolean;
  isSaving: boolean;
  mode: "create" | "edit";
  onDelete?: () => Promise<void>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  task: Task | null;
}

const inputClassName =
  "w-full rounded-2xl border border-line bg-slate-50 px-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

function getInitialValues(task: Task | null): TaskFormValues {
  return {
    description: task?.description ?? "",
    dueDate: task?.due_date ?? "",
    priority: task?.priority ?? "normal",
    status: task?.status ?? "todo",
    title: task?.title ?? "",
  };
}

export function TaskForm({
  error,
  isDeleting,
  isSaving,
  mode,
  onDelete,
  onSubmit,
  task,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(() => getInitialValues(task));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValues(getInitialValues(task));
    setValidationError(null);
  }, [mode, task]);

  const isEditing = mode === "edit";
  const isBusy = isSaving || isDeleting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.title.trim().length === 0) {
      setValidationError("Title is required.");
      return;
    }

    setValidationError(null);

    try {
      await onSubmit(values);
    } catch {
      return;
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !task) {
      return;
    }

    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`Delete "${task.title}" from this workspace?`);

    if (!confirmed) {
      return;
    }

    try {
      await onDelete();
    } catch {
      return;
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="task-title">
          Title
        </label>
        <input
          className={`${inputClassName} h-12`}
          disabled={isBusy}
          id="task-title"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              title: event.target.value,
            }))
          }
          placeholder="Plan launch checklist"
          type="text"
          value={values.title}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="task-description">
          Description
        </label>
        <textarea
          className={`${inputClassName} min-h-32 px-4 py-3`}
          disabled={isBusy}
          id="task-description"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              description: event.target.value,
            }))
          }
          placeholder="Capture the important context, then keep the card concise."
          value={values.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-priority">
            Priority
          </label>
          <select
            className={`${inputClassName} h-12`}
            disabled={isBusy}
            id="task-priority"
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                priority: event.target.value as TaskFormValues["priority"],
              }))
            }
            value={values.priority}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority === "normal"
                  ? "Normal"
                  : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-due-date">
            Due date
          </label>
          <input
            className={`${inputClassName} h-12`}
            disabled={isBusy}
            id="task-due-date"
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                dueDate: event.target.value,
              }))
            }
            type="date"
            value={values.dueDate}
          />
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-status">
            Status
          </label>
          <select
            className={`${inputClassName} h-12`}
            disabled={isBusy}
            id="task-status"
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                status: event.target.value as TaskFormValues["status"],
              }))
            }
            value={values.status}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "todo"
                  ? "To Do"
                  : status
                      .split("_")
                      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(" ")}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-3 text-sm leading-6 text-ink-muted">
          New tasks start in the To Do column. You can update status once the task is on the board.
        </div>
      )}

      {validationError || error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {validationError ?? error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isEditing && onDelete ? (
            <Button
              disabled={isBusy}
              onClick={() => void handleDelete()}
              type="button"
              variant="ghost"
            >
              {isDeleting ? "Deleting..." : "Delete task"}
            </Button>
          ) : null}
        </div>

        <Button disabled={isBusy} type="submit">
          {isSaving
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save changes"
              : "Create task"}
        </Button>
      </div>
    </form>
  );
}
