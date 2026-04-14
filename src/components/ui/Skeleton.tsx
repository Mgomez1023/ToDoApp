import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-slate-200/80 via-white to-slate-200/80 bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
