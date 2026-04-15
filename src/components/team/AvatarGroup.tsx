import { User } from "lucide-react";

import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/utils";
import type { TeamMember } from "@/types/team";

interface AvatarGroupProps {
  className?: string;
  max?: number;
  members: TeamMember[];
  size?: "sm" | "md";
}

const avatarSizeClassName = {
  md: "size-8 text-[11px]",
  sm: "size-7 text-[10px]",
} as const;

export function AvatarGroup({
  className,
  max = 3,
  members,
  size = "sm",
}: AvatarGroupProps) {
  const visibleMembers = members.slice(0, max);
  const overflowCount = Math.max(members.length - max, 0);

  if (members.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-dashed border-line bg-slate-50 text-ink-soft",
          avatarSizeClassName[size],
          className,
        )}
      >
        <User className="size-3.5" />
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 -space-x-2", className)}>
      {visibleMembers.map((member) => (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white font-semibold text-white shadow-card",
            avatarSizeClassName[size],
          )}
          key={member.id}
          style={{ backgroundColor: member.avatar_color }}
          title={member.name}
        >
          {getInitials(member.name)}
        </div>
      ))}
      {overflowCount > 0 ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white bg-slate-900 font-semibold text-white shadow-card",
            avatarSizeClassName[size],
          )}
          title={`${overflowCount} more assignee${overflowCount === 1 ? "" : "s"}`}
        >
          +{overflowCount}
        </div>
      ) : null}
    </div>
  );
}
