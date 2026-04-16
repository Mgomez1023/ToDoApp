import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight",
  {
    defaultVariants: {
      tone: "neutral",
    },
    variants: {
      tone: {
        accent:
          "bg-[var(--color-badge-accent-bg)] text-[color:var(--color-badge-accent-ink)]",
        danger:
          "bg-[var(--color-badge-danger-bg)] text-[color:var(--color-badge-danger-ink)]",
        neutral:
          "bg-[var(--color-badge-neutral-bg)] text-[color:var(--color-badge-neutral-ink)]",
        success:
          "bg-[var(--color-badge-success-bg)] text-[color:var(--color-badge-success-ink)]",
        warning:
          "bg-[var(--color-badge-warning-bg)] text-[color:var(--color-badge-warning-ink)]",
      },
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ className, tone }))} {...props} />;
}
