import { CalendarDays, ChevronRight, Trash2, X } from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";

import { ActivityTimeline } from "@/components/tasks/ActivityTimeline";
import { CommentsSection } from "@/components/tasks/CommentsSection";
import { LabelPicker } from "@/components/tasks/LabelPicker";
import { AvatarGroup } from "@/components/team/AvatarGroup";
import { AssigneePicker } from "@/components/team/AssigneePicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getDueDateMeta } from "@/lib/dates";
import { PRIORITY_LABELS } from "@/lib/utils";
import { useTaskDetails } from "@/hooks/useTaskDetails";
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskFormValues } from "@/types/task";
import type { Label } from "@/types/label";
import type { TeamMember } from "@/types/team";

interface TaskDetailSheetProps {
  canManageAssignees: boolean;
  canManageLabels: boolean;
  currentUserId: string | null;
  error: string | null;
  isCreatingLabel: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  labelError: string | null;
  labels: Label[];
  members: TeamMember[];
  mode: "create" | "edit";
  onClose: () => void;
  onCreateLabel: (input: { color: string; name: string }) => Promise<Label>;
  onDelete?: () => Promise<void>;
  onManageTeam: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  open: boolean;
  task: Task | null;
}

const inputClassName =
  "w-full rounded-2xl border border-line bg-slate-50 px-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";
const defaultTaskSections = {
  activity: false,
  assignees: false,
  comments: false,
  details: false,
  labels: false,
};
type TaskSectionKey = keyof typeof defaultTaskSections;

function getInitialValues(task: Task | null): TaskFormValues {
  return {
    assigneeIds: task?.assignees.map((assignee) => assignee.id) ?? [],
    description: task?.description ?? "",
    dueDate: task?.due_date ?? "",
    labelIds: task?.labels.map((label) => label.id) ?? [],
    priority: task?.priority ?? "normal",
    status: task?.status ?? "todo",
    title: task?.title ?? "",
  };
}

function formatStatusLabel(status: TaskFormValues["status"]) {
  if (status === "todo") {
    return "To Do";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const priorityToneMap = {
  high: "warning",
  low: "neutral",
  normal: "accent",
} as const;

export function TaskDetailSheet({
  canManageAssignees,
  canManageLabels,
  currentUserId,
  error,
  isCreatingLabel,
  isDeleting,
  isSaving,
  labelError,
  labels,
  members,
  mode,
  onClose,
  onCreateLabel,
  onDelete,
  onManageTeam,
  onSubmit,
  open,
  task,
}: TaskDetailSheetProps) {
  const [values, setValues] = useState<TaskFormValues>(() => getInitialValues(task));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState(defaultTaskSections);
  const isEditing = mode === "edit";
  const isBusy = isSaving || isDeleting;
  const taskDetails = useTaskDetails(task?.id, open && isEditing && Boolean(task?.id));
  const dueDate = getDueDateMeta(values.dueDate || null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(task));
    setValidationError(null);
    setExpandedSections(defaultTaskSections);
  }, [mode, open, task]);

  useEffect(() => {
    if (!canManageLabels) {
      return;
    }

    const allowedLabelIds = new Set(labels.map((label) => label.id));

    setValues((currentValues) => {
      const nextLabelIds = currentValues.labelIds.filter((labelId) =>
        allowedLabelIds.has(labelId),
      );

      if (nextLabelIds.length === currentValues.labelIds.length) {
        return currentValues;
      }

      return {
        ...currentValues,
        labelIds: nextLabelIds,
      };
    });
  }, [canManageLabels, labels]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const toggleSection = (section: TaskSectionKey) => {
    setExpandedSections((currentValue) => ({
      ...currentValue,
      [section]: !currentValue[section],
    }));
  };

  const openSection = (section: TaskSectionKey) => {
    setExpandedSections((currentValue) => ({
      ...currentValue,
      [section]: true,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.title.trim().length === 0) {
      openSection("details");
      setValidationError("Title is required.");
      return;
    }

    setValidationError(null);

    try {
      await onSubmit({
        ...values,
        description: values.description,
        title: values.title,
      });

      if (isEditing && task?.id) {
        await taskDetails.refetch();
      }
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

  const detailsSectionContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="task-title">
          Title
        </label>
        <input
          className={cn(inputClassName, "h-12")}
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
          className={cn(inputClassName, "min-h-36 px-4 py-3")}
          disabled={isBusy}
          id="task-description"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              description: event.target.value,
            }))
          }
          placeholder="Capture the important context, then keep the board card concise."
          value={values.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-priority">
            Priority
          </label>
          <select
            className={cn(inputClassName, "h-12")}
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
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-status">
            Status
          </label>
          <select
            className={cn(inputClassName, "h-12")}
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
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="task-due-date">
          Due date
        </label>
        <input
          className={cn(inputClassName, "h-12")}
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
  );

  const assigneeSectionContent = canManageAssignees ? (
    <AssigneePicker
      disabled={isBusy}
      members={members}
      onChange={(assigneeIds) =>
        setValues((currentValues) => ({
          ...currentValues,
          assigneeIds,
        }))
      }
      onManageTeam={onManageTeam}
      value={values.assigneeIds}
    />
  ) : (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-ink">Assignees</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          This task is shared into your board from another workspace.
        </p>
      </div>
      <AvatarGroup members={task?.assignees ?? []} size="md" />
    </div>
  );

  const labelSectionContent = (
    <LabelPicker
      canManage={canManageLabels}
      disabled={isBusy}
      error={labelError}
      isCreatingLabel={isCreatingLabel}
      labels={labels}
      onChange={(labelIds) =>
        setValues((currentValues) => ({
          ...currentValues,
          labelIds,
        }))
      }
      onCreateLabel={onCreateLabel}
      value={values.labelIds}
    />
  );

  const commentsSectionContent = (
    <CommentsSection
      comments={taskDetails.comments}
      currentUserId={currentUserId}
      disabled={!isEditing || !task || !currentUserId}
      error={taskDetails.mutationError}
      isCommenting={taskDetails.isCommenting}
      isLoading={taskDetails.isLoading}
      onSubmit={async (body) => {
        if (!task || !currentUserId) {
          return;
        }

        await taskDetails.createComment({
          body,
          taskId: task.id,
          userId: currentUserId,
        });
      }}
    />
  );

  const activitySectionContent = (
    <ActivityTimeline
      activity={taskDetails.activity}
      currentUserId={currentUserId}
      disabled={!isEditing || !task}
      isLoading={taskDetails.isLoading}
    />
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "flex h-full items-center justify-center px-5 py-3 sm:px-8",
        )}
      >
        <section
          aria-labelledby="task-detail-title"
          aria-modal="true"
          className={cn(
            "flex w-full max-w-[50rem] max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[2rem] border border-line bg-surface-elevated shadow-shell",
          )}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
        >
          <header className="border-b border-line/80 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={isEditing ? "accent" : "neutral"}>
                    {isEditing ? "Task details" : "New task"}
                  </Badge>
                  <Badge tone={priorityToneMap[values.priority]}>
                    {PRIORITY_LABELS[values.priority]}
                  </Badge>
                  <Badge tone="neutral">{formatStatusLabel(values.status)}</Badge>
                </div>

                <h2
                  className="mt-3 text-lg font-semibold text-ink sm:text-xl"
                  id="task-detail-title"
                >
                  {isEditing ? values.title || "Untitled task" : "Create a task"}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    <span>
                      {dueDate
                        ? `${dueDate.shortLabel} · ${dueDate.formattedDate}`
                        : "No due date yet"}
                    </span>
                  </div>

                  {values.labelIds.length > 0 ? (
                    <span>{values.labelIds.length} label{values.labelIds.length === 1 ? "" : "s"}</span>
                  ) : null}

                  {values.assigneeIds.length > 0 ? (
                    <span>
                      {values.assigneeIds.length} assignee
                      {values.assigneeIds.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              </div>

              <Button
                aria-label="Close task details"
                className="shrink-0"
                onClick={onClose}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </div>
          </header>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-4">
                {isEditing && taskDetails.error ? (
                  <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {taskDetails.error}
                  </div>
                ) : null}

                <TaskAccordionSection
                  onToggle={() => toggleSection("details")}
                  open={expandedSections.details}
                  title="Task details"
                >
                  {detailsSectionContent}
                </TaskAccordionSection>

                <TaskAccordionSection
                  onToggle={() => toggleSection("assignees")}
                  open={expandedSections.assignees}
                  title="Assignees"
                >
                  {assigneeSectionContent}
                </TaskAccordionSection>

                <TaskAccordionSection
                  onToggle={() => toggleSection("labels")}
                  open={expandedSections.labels}
                  title="Labels"
                >
                  {labelSectionContent}
                </TaskAccordionSection>

                {isEditing ? (
                  <TaskAccordionSection
                    onToggle={() => toggleSection("comments")}
                    open={expandedSections.comments}
                    title="Comments"
                  >
                    {commentsSectionContent}
                  </TaskAccordionSection>
                ) : null}

                {isEditing ? (
                  <TaskAccordionSection
                    onToggle={() => toggleSection("activity")}
                    open={expandedSections.activity}
                    title="Activity"
                  >
                    {activitySectionContent}
                  </TaskAccordionSection>
                ) : null}
              </div>
            </div>

            {(validationError || error) && (
              <div className="border-t border-line/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 sm:px-6">
                {validationError ?? error}
              </div>
            )}

            <footer className="border-t border-line/80 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {isEditing && onDelete ? (
                    <Button
                      disabled={isBusy}
                      onClick={() => void handleDelete()}
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                      {isDeleting ? "Deleting..." : "Delete task"}
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={isBusy}
                    onClick={onClose}
                    type="button"
                    variant="secondary"
                  >
                    Close
                  </Button>
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
              </div>
            </footer>
          </form>
        </section>
      </div>
    </div>,
    document.body,
  );
}

interface TaskAccordionSectionProps extends PropsWithChildren {
  onToggle: () => void;
  open: boolean;
  title: string;
}

function TaskAccordionSection({
  children,
  onToggle,
  open,
  title,
}: TaskAccordionSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-line/80 bg-white/80 shadow-card transition-all duration-[360ms]",
        open ? "border-slate-200 bg-white/90" : "hover:bg-white/90",
      )}
    >
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border border-line/80 bg-slate-50/90 text-ink-muted shadow-card transition-all duration-[360ms]",
            open ? "bg-white text-ink shadow-sm" : "",
          )}
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "rotate-90" : "rotate-0",
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-line/70 px-4 pb-4 pt-4 transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
