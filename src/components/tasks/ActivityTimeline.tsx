import { format } from "date-fns";
import { History } from "lucide-react";

import { getTaskActivityCopy } from "@/lib/taskActivity";
import { getGuestCode } from "@/lib/utils";
import type { TaskActivity } from "@/types/activity";

interface ActivityTimelineProps {
  activity: TaskActivity[];
  currentUserId: string | null;
  disabled?: boolean;
  isLoading: boolean;
}

function getActorLabel(actorUserId: string | null, currentUserId: string | null) {
  if (!actorUserId) {
    return "System";
  }

  if (actorUserId === currentUserId) {
    return "You";
  }

  return `Guest ${getGuestCode(actorUserId)}`;
}

export function ActivityTimeline({
  activity,
  currentUserId,
  disabled = false,
  isLoading,
}: ActivityTimelineProps) {
  return (
    <section className="space-y-4 rounded-[1.5rem] border border-line/80 bg-white/70 p-4 shadow-card">
      <div className="flex items-center gap-2">
        <History className="size-4 text-ink-muted" />
        <h3 className="text-sm font-semibold text-ink">Activity</h3>
      </div>

      {disabled ? (
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          Create the task first to start tracking activity.
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-line/80 bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          Loading activity...
        </div>
      ) : activity.length > 0 ? (
        <div className="space-y-4">
          {activity.map((event) => {
            const copy = getTaskActivityCopy(event);

            return (
              <div className="flex gap-3" key={event.id}>
                <div className="flex flex-col items-center">
                  <span className="mt-1 size-2.5 rounded-full bg-accent" />
                  <span className="mt-1 h-full w-px bg-line" />
                </div>

                <div className="min-w-0 flex-1 pb-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-ink">
                      {getActorLabel(event.actor_user_id, currentUserId)}
                    </p>
                    <span className="text-xs text-ink-soft">
                      {format(new Date(event.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{copy.summary}</p>
                  {copy.detail ? (
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{copy.detail}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          No activity yet.
        </div>
      )}
    </section>
  );
}
