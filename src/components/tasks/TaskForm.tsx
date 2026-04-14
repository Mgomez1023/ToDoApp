import { AssigneePicker } from "@/components/team/AssigneePicker";
import { Button } from "@/components/ui/Button";

export function TaskForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="task-title">
          Title
        </label>
        <input
          className="h-12 w-full rounded-2xl border border-line bg-slate-50 px-4 text-sm text-ink outline-none"
          disabled
          id="task-title"
          placeholder="Plan launch checklist"
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-ink"
          htmlFor="task-description"
        >
          Description
        </label>
        <textarea
          className="min-h-32 w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-ink outline-none"
          disabled
          id="task-description"
          placeholder="Capture the important context, then keep the card concise."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-priority">
            Priority
          </label>
          <select
            className="h-12 w-full rounded-2xl border border-line bg-slate-50 px-4 text-sm text-ink outline-none"
            disabled
            id="task-priority"
          >
            <option>Normal</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="task-due-date">
            Due date
          </label>
          <input
            className="h-12 w-full rounded-2xl border border-line bg-slate-50 px-4 text-sm text-ink outline-none"
            disabled
            id="task-due-date"
            type="date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Assignees</p>
        <AssigneePicker disabled />
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-3 text-sm leading-6 text-ink-muted">
        Task CRUD wiring lands next. The modal shell is in place so phase 4 can
        connect directly to Supabase without reworking the layout.
      </div>

      <div className="flex justify-end">
        <Button disabled type="submit">
          Save task
        </Button>
      </div>
    </form>
  );
}
