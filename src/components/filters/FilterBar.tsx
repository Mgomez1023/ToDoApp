import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PRIORITY_FILTER_OPTIONS } from "@/lib/utils";
import type { Label } from "@/types/label";
import type { TaskPriorityFilter } from "@/types/task";
import type { TeamMember } from "@/types/team";

interface FilterBarProps {
  assigneeId: string | "all";
  hasActiveFilters: boolean;
  labelId: string | "all";
  labels: Label[];
  members: TeamMember[];
  onAssigneeChange: (value: string | "all") => void;
  onLabelChange: (value: string | "all") => void;
  onPriorityChange: (value: TaskPriorityFilter) => void;
  onResetFilters: () => void;
  priority: TaskPriorityFilter;
}

export function FilterBar({
  assigneeId,
  hasActiveFilters,
  labelId,
  labels,
  members,
  onAssigneeChange,
  onLabelChange,
  onPriorityChange,
  onResetFilters,
  priority,
}: FilterBarProps) {
  const assigneeSelectDisabled = members.length === 0;
  const labelSelectDisabled = labels.length === 0;
  const selectClassName =
    "h-10 min-w-0 rounded-xl border border-line/80 bg-slate-50/85 px-3 text-sm text-ink shadow-card outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-soft sm:min-w-[156px]";

  return (
    <div className="flex flex-wrap items-start gap-2">
      <select
        className={`${selectClassName} flex-1 sm:flex-none`}
        onChange={(event) =>
          onPriorityChange(event.target.value as TaskPriorityFilter)
        }
        value={priority}
      >
        {PRIORITY_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className={`${selectClassName} flex-1 sm:flex-none`}
        disabled={labelSelectDisabled}
        onChange={(event) => onLabelChange(event.target.value)}
        value={labelId}
      >
        <option value="all">
          {labelSelectDisabled ? "No labels yet" : "All labels"}
        </option>
        {labels.map((label) => (
          <option key={label.id} value={label.id}>
            {label.name}
          </option>
        ))}
      </select>

      <select
        className={`${selectClassName} flex-1 sm:flex-none`}
        disabled={assigneeSelectDisabled}
        onChange={(event) => onAssigneeChange(event.target.value)}
        value={assigneeId}
      >
        <option value="all">
          {assigneeSelectDisabled ? "No team members yet" : "All assignees"}
        </option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>

      {hasActiveFilters ? (
        <Button
          className="w-full sm:w-auto"
          onClick={onResetFilters}
          size="sm"
          type="button"
          variant="secondary"
        >
          <X className="size-4" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
