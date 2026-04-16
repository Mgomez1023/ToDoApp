import {
  BarChart3,
  HelpCircle,
  ListTodo,
  MoonStar,
  Settings,
  SunMedium,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { StatsPopoverPanel } from "@/components/board/StatsPopover";
import { cn } from "@/lib/cn";
import type { ThemeMode } from "@/hooks/useThemePreference";
import type { Task } from "@/types/task";

interface WorkspaceRailProps {
  guestUserId: string | null;
  hasActiveFilters: boolean;
  onManageTeam: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  tasks: Task[];
  theme: ThemeMode;
  visibleTaskCount: number;
}

const primaryNav: Array<{
  active?: boolean;
  icon: LucideIcon;
  label: string;
}> = [
  {
    active: true,
    icon: ListTodo,
    label: "Worklist",
  },
];

const utilityNav: Array<{
  icon: LucideIcon;
  label: string;
}> = [
  {
    icon: HelpCircle,
    label: "Help",
  },
];

export function WorkspaceRail({
  guestUserId,
  hasActiveFilters,
  onManageTeam,
  onThemeChange,
  tasks,
  theme,
  visibleTaskCount,
}: WorkspaceRailProps) {
  const guestLabel = guestUserId ? guestUserId.slice(0, 8).toUpperCase() : "GUEST";

  return (
    <>
      <div className="relative z-30 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-surface px-3 py-2.5 shadow-card backdrop-blur-xl sm:px-4">
          <div className="min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Pulse Workspace
              </p>
              <p className="truncate text-sm font-semibold text-ink">{guestLabel}</p>
            </div>
          </div>

          <nav aria-label="Workspace views" className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <RailIcon key={item.label} {...item} compact />
            ))}
            <RailButton
              compact
              icon={Users}
              label="Team manager"
              onClick={onManageTeam}
            />
            <SummaryRailButton
              compact
              hasActiveFilters={hasActiveFilters}
              tasks={tasks}
              visibleTaskCount={visibleTaskCount}
            />
            <ThemeRailButton compact onThemeChange={onThemeChange} theme={theme} />
          </nav>
        </div>
      </div>

      <aside className="relative z-30 hidden lg:block lg:w-[86px] lg:shrink-0">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] min-h-[640px] flex-col rounded-[1.75rem] border border-line bg-surface px-3 py-4 shadow-shell backdrop-blur-xl">
          <nav
            aria-label="Workspace views"
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            {primaryNav.map((item) => (
              <RailIcon key={item.label} {...item} />
            ))}
            <RailButton icon={Users} label="Team manager" onClick={onManageTeam} />
            <SummaryRailButton
              hasActiveFilters={hasActiveFilters}
              tasks={tasks}
              visibleTaskCount={visibleTaskCount}
            />
          </nav>

          <div className="border-t border-line/80 pt-4">
            <div className="flex flex-col items-center gap-1.5">
              <ThemeRailButton onThemeChange={onThemeChange} theme={theme} />
              {utilityNav.map((item) => (
                <RailIcon key={item.label} {...item} />
              ))}
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
      className={getRailIconClassName({ active, compact })}
      title={label}
    >
      <Icon className={compact ? "size-4" : "size-[18px]"} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

interface RailButtonProps extends RailIconProps {
  "aria-expanded"?: boolean;
  onClick: () => void;
}

function RailButton({
  active = false,
  "aria-expanded": ariaExpanded,
  compact = false,
  icon: Icon,
  label,
  onClick,
}: RailButtonProps) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      className={getRailIconClassName({ active, compact })}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className={compact ? "size-4" : "size-[18px]"} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

interface SummaryRailButtonProps {
  compact?: boolean;
  hasActiveFilters: boolean;
  tasks: Task[];
  visibleTaskCount: number;
}

interface ThemeRailButtonProps {
  compact?: boolean;
  onThemeChange: (theme: ThemeMode) => void;
  theme: ThemeMode;
}

function SummaryRailButton({
  compact = false,
  hasActiveFilters,
  tasks,
  visibleTaskCount,
}: SummaryRailButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative z-40" ref={containerRef}>
      <RailButton
        aria-expanded={open}
        active={open}
        compact={compact}
        icon={BarChart3}
        label="Summary"
        onClick={() => setOpen((currentValue) => !currentValue)}
      />

      {open ? (
        <StatsPopoverPanel
          className={cn(
            "absolute z-50",
            compact
              ? "right-0 top-[calc(100%+0.75rem)]"
              : "left-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2",
          )}
          hasActiveFilters={hasActiveFilters}
          tasks={tasks}
          visibleTaskCount={visibleTaskCount}
        />
      ) : null}
    </div>
  );
}

function ThemeRailButton({
  compact = false,
  onThemeChange,
  theme,
}: ThemeRailButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative z-40" ref={containerRef}>
      <RailButton
        aria-expanded={open}
        active={open}
        compact={compact}
        icon={Settings}
        label="Appearance settings"
        onClick={() => setOpen((currentValue) => !currentValue)}
      />

      {open ? (
        <ThemeSettingsPanel
          className={cn(
            "absolute z-50",
            compact
              ? "right-0 top-[calc(100%+0.75rem)]"
              : "bottom-0 left-[calc(100%+0.75rem)]",
          )}
          onThemeChange={onThemeChange}
          theme={theme}
        />
      ) : null}
    </div>
  );
}

interface ThemeSettingsPanelProps {
  className?: string;
  onThemeChange: (theme: ThemeMode) => void;
  theme: ThemeMode;
}

function ThemeSettingsPanel({
  className,
  onThemeChange,
  theme,
}: ThemeSettingsPanelProps) {
  return (
    <div
      className={cn(
        "w-[min(18.5rem,calc(100vw-2rem))] rounded-[1.5rem] border border-line bg-surface-elevated p-4 shadow-shell backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-line bg-surface-muted p-2 text-ink">
          <Settings className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Appearance</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Switch the workspace between light and dark with a softer, low-glare palette.
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="pointer-events-none absolute inset-x-4 top-1/2 h-10 -translate-y-1/2 rounded-full bg-[var(--theme-slider-glow)] blur-xl" />
        <div
          aria-label="Theme mode"
          className="relative grid grid-cols-2 rounded-full border border-line bg-[var(--theme-slider-track)] p-1"
          role="radiogroup"
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full border border-white/10 transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              theme === "dark" ? "translate-x-full" : "translate-x-0",
            )}
            style={{
              background: "var(--theme-slider-thumb-bg)",
              boxShadow: "var(--theme-slider-thumb-shadow)",
            }}
          />

          <button
            aria-checked={theme === "light"}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold transition-colors duration-300",
              theme === "light" ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
            onClick={() => onThemeChange("light")}
            role="radio"
            type="button"
          >
            <SunMedium className="size-3.5" />
            Light
          </button>

          <button
            aria-checked={theme === "dark"}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold transition-colors duration-300",
              theme === "dark" ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
            onClick={() => onThemeChange("dark")}
            role="radio"
            type="button"
          >
            <MoonStar className="size-3.5" />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}

function getRailIconClassName({
  active,
  compact,
}: {
  active: boolean;
  compact: boolean;
}) {
  return cn(
    "flex items-center justify-center rounded-[1rem] border border-transparent text-ink-muted transition hover:bg-[var(--color-rail-hover-bg)] hover:text-ink",
    compact ? "size-9 rounded-xl" : "size-11",
    active
      ? "border-[var(--color-rail-active-bg)] bg-[var(--color-rail-active-bg)] text-[color:var(--color-rail-active-ink)] shadow-card"
      : "bg-transparent",
  );
}
