import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
}

export function EmptyState({
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-line/80 bg-white/55 px-6 py-8 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl border border-white/80 bg-white/90 p-3 text-ink shadow-card">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-[24ch] text-sm leading-6 text-ink-muted">
        {description}
      </p>
    </div>
  );
}
