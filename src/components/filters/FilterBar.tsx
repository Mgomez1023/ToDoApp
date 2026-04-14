import { SlidersHorizontal } from "lucide-react";

import { PRIORITY_FILTER_OPTIONS } from "@/lib/utils";
import type { TaskPriorityFilter } from "@/types/task";
import type { TeamMember } from "@/types/team";

interface FilterBarProps {
  assigneeId: string | "all";
  members: TeamMember[];
  onAssigneeChange: (value: string | "all") => void;
  onPriorityChange: (value: TaskPriorityFilter) => void;
  priority: TaskPriorityFilter;
}

export function FilterBar({
  assigneeId,
  members,
  onAssigneeChange,
  onPriorityChange,
  priority,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-3 text-sm text-ink-muted shadow-card">
        <SlidersHorizontal className="size-4" />
        Filters
      </div>

      <select
        className="h-12 min-w-[180px] rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-card outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100"
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
        className="h-12 min-w-[180px] rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-card outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onAssigneeChange(event.target.value)}
        value={assigneeId}
      >
        <option value="all">All assignees</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
    </div>
  );
}
