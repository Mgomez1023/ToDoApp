import { CalendarDays, X } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface TaskDetailSheetProps {
  onClose: () => void;
  open: boolean;
}

export function TaskDetailSheet({ onClose, open }: TaskDetailSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-y-4 right-4 z-40 hidden w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-shell xl:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="accent">Preview</Badge>
          <h2 className="mt-3 text-lg font-semibold text-ink">
            Task detail sheet
          </h2>
        </div>
        <Button onClick={onClose} size="sm" type="button" variant="ghost">
          <X className="size-4" />
        </Button>
      </div>

      <p className="mt-6 text-sm leading-7 text-ink-muted">
        This sheet will house the focused edit and review experience once CRUD is
        connected.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-slate-50 p-4 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          Due date, assignees, and task metadata will live here.
        </div>
      </div>
    </aside>
  );
}
