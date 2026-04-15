import {
  BarChart3,
  HelpCircle,
  KanbanSquare,
  ListTodo,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

interface WorkspaceRailProps {
  guestUserId: string | null;
}

const primaryNav: Array<{
  active?: boolean;
  icon: LucideIcon;
  label: string;
}> = [
  {
    active: true,
    icon: KanbanSquare,
    label: "Board",
  },
  {
    icon: ListTodo,
    label: "Worklist",
  },
  {
    icon: Users,
    label: "Team",
  },
  {
    icon: BarChart3,
    label: "Reports",
  },
];

const utilityNav: Array<{
  icon: LucideIcon;
  label: string;
}> = [
  {
    icon: Settings,
    label: "Settings",
  },
  {
    icon: HelpCircle,
    label: "Help",
  },
];

export function WorkspaceRail({ guestUserId }: WorkspaceRailProps) {
  const guestLabel = guestUserId ? guestUserId.slice(0, 8).toUpperCase() : "GUEST";

  return (
    <>
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/75 bg-white/70 px-3 py-2.5 shadow-card backdrop-blur-xl sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-card">
              <ListTodo className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Pulse Workspace
              </p>
              <p className="truncate text-sm font-semibold text-ink">{guestLabel}</p>
            </div>
          </div>

          <nav aria-label="Workspace views" className="flex items-center gap-1">
            {primaryNav.slice(0, 3).map((item) => (
              <RailIcon key={item.label} {...item} compact />
            ))}
            <RailIcon compact {...utilityNav[1]} />
          </nav>
        </div>
      </div>

      <aside className="hidden lg:block lg:w-[86px] lg:shrink-0">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] min-h-[640px] flex-col rounded-[1.75rem] border border-white/75 bg-white/70 px-3 py-4 shadow-shell backdrop-blur-xl">
          <div className="flex justify-center">
            <div className="flex size-11 items-center justify-center rounded-[1.1rem] bg-ink text-white shadow-card">
              <ListTodo className="size-5" />
            </div>
          </div>

          <nav
            aria-label="Workspace views"
            className="mt-6 flex flex-1 flex-col items-center gap-1.5"
          >
            {primaryNav.map((item) => (
              <RailIcon key={item.label} {...item} />
            ))}
          </nav>

          <div className="border-t border-line/80 pt-4">
            <div className="flex flex-col items-center gap-1.5">
              {utilityNav.map((item) => (
                <RailIcon key={item.label} {...item} />
              ))}
            </div>

            <div className="mt-4 rounded-[1.1rem] bg-slate-950 px-2 py-2 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Guest
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                {guestLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

interface RailIconProps {
  active?: boolean;
  compact?: boolean;
  icon: LucideIcon;
  label: string;
}

function RailIcon({ active = false, compact = false, icon: Icon, label }: RailIconProps) {
  return (
    <span
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-center rounded-[1rem] border border-transparent text-ink-muted",
        compact ? "size-9 rounded-xl" : "size-11",
        active
          ? "border-slate-900/90 bg-slate-950 text-white shadow-card"
          : "bg-transparent",
      )}
      title={label}
    >
      <Icon className={compact ? "size-4" : "size-[18px]"} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
