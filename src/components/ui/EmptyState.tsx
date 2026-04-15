import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  children?: ReactNode;
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
}

export function EmptyState({
  children,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-line/80 bg-white/60 px-4 py-5 text-center sm:min-h-36 sm:px-5 sm:py-6",
        className,
      )}
    >
      <div className="mb-2.5 rounded-xl border border-white/80 bg-white/90 p-2 text-ink shadow-card">
        <Icon className="size-[18px]" />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[28ch] text-sm leading-5 text-ink-muted">
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
