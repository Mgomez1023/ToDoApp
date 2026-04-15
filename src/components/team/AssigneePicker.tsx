import { Check, UserPlus, Users } from "lucide-react";

import { AvatarGroup } from "@/components/team/AvatarGroup";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/utils";
import type { TeamMember } from "@/types/team";

interface AssigneePickerProps {
  disabled?: boolean;
  members: TeamMember[];
  onChange: (assigneeIds: string[]) => void;
  onManageTeam: () => void;
  value: string[];
}

export function AssigneePicker({
  disabled = false,
  members,
  onChange,
  onManageTeam,
  value,
}: AssigneePickerProps) {
  const selectedMembers = members.filter((member) => value.includes(member.id));

  const toggleMember = (memberId: string) => {
    if (disabled) {
      return;
    }

    if (value.includes(memberId)) {
      onChange(value.filter((currentId) => currentId !== memberId));
      return;
    }

    onChange([...value, memberId]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-sm font-medium text-ink">Assignees</label>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Keep ownership visible without adding noise to the card.
          </p>
        </div>

        <Button
          disabled={disabled}
          onClick={onManageTeam}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Users className="size-4" />
          Manage team
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          <p>No team members yet. Create a few lightweight collaborators first.</p>
          <Button
            className="mt-3"
            disabled={disabled}
            onClick={onManageTeam}
            size="sm"
            type="button"
            variant="secondary"
          >
            <UserPlus className="size-4" />
            Add team member
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-line/80 bg-slate-50/85 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Selected
              </p>
              <p className="mt-1 text-sm font-medium text-ink">
                {selectedMembers.length === 0
                  ? "Unassigned"
                  : `${selectedMembers.length} assignee${
                      selectedMembers.length === 1 ? "" : "s"
                    }`}
              </p>
            </div>

            <AvatarGroup members={selectedMembers} size="md" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {members.map((member) => {
              const isSelected = value.includes(member.id);

              return (
                <button
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                    isSelected
                      ? "border-accent/30 bg-blue-50 shadow-card"
                      : "border-line/80 bg-white/70 hover:border-slate-300 hover:bg-white",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                  disabled={disabled}
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  type="button"
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-card"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {getInitials(member.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                    <p className="text-xs text-ink-muted">
                      {isSelected ? "Assigned to this task" : "Tap to assign"}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-white text-transparent",
                    )}
                  >
                    <Check className="size-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
