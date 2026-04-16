import { cn } from "@/lib/cn";
import { getLabelColorStyles } from "@/lib/colors";
import type { Label } from "@/types/label";

interface TaskLabelsProps {
  className?: string;
  labels: Label[];
  limit?: number;
  size?: "sm" | "md";
}

export function TaskLabels({
  className,
  labels,
  limit,
  size = "sm",
}: TaskLabelsProps) {
  if (labels.length === 0) {
    return null;
  }

  const visibleLabels = limit ? labels.slice(0, limit) : labels;
  const remainingCount = labels.length - visibleLabels.length;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleLabels.map((label) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border font-semibold",
            size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-xs",
          )}
          key={label.id}
          style={getLabelColorStyles(label.color)}
        >
          {label.name}
        </span>
      ))}

      {remainingCount > 0 ? (
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-line/80 bg-slate-100 font-semibold text-ink-muted",
            size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-xs",
          )}
        >
          +{remainingCount}
        </span>
      ) : null}
    </div>
  );
}
