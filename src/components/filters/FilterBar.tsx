import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PRIORITY_FILTER_OPTIONS } from "@/lib/utils";
import type { TaskPriorityFilter } from "@/types/task";
import type { TeamMember } from "@/types/team";

interface FilterBarProps {
  assigneeId: string | "all";
  hasActiveFilters: boolean;
  members: TeamMember[];
  onAssigneeChange: (value: string | "all") => void;
  onPriorityChange: (value: TaskPriorityFilter) => void;
  onResetFilters: () => void;
  priority: TaskPriorityFilter;
}

export function FilterBar({
  assigneeId,
  hasActiveFilters,
  members,
  onAssigneeChange,
  onPriorityChange,
  onResetFilters,
  priority,
}: FilterBarProps) {
  const assigneeSelectDisabled = members.length === 0;
  const selectClassName =
    "h-10 min-w-0 rounded-xl border border-line/80 bg-slate-50/85 px-3 text-sm text-ink shadow-card outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-soft sm:min-w-[156px]";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
      <div className="hidden items-center gap-2 rounded-xl border border-line/80 bg-white/80 px-3 text-xs font-medium text-ink-muted shadow-card xl:inline-flex">
        <SlidersHorizontal className="size-4" />
        Filters
      </div>

      <select
        className={selectClassName}
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
        className={selectClassName}
        disabled={assigneeSelectDisabled}
        onChange={(event) => onAssigneeChange(event.target.value)}
        value={assigneeId}
      >
        <option value="all">
          {assigneeSelectDisabled ? "Assignees in Phase 6" : "All assignees"}
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
