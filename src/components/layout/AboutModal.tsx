import { HelpCircle, Layers3, Users } from "lucide-react";

import { Modal } from "@/components/ui/Modal";

interface AboutModalProps {
  onClose: () => void;
  open: boolean;
}

export function AboutModal({ onClose, open }: AboutModalProps) {
  return (
    <Modal
      description=""
      onClose={onClose}
      open={open}
      presentation="sheet"
      title="About"
    >
      <div className="space-y-3">
        <section className="rounded-[1.6rem] border bg-white/80 p-4 shadow-card sm:px-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-line bg-surface-muted p-2.5 text-ink shadow-card">
              <HelpCircle className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink">
                A focused collaborative workspace
              </h3>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Built to keep project tracking clear, lightweight, and fast.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 text-ink-muted">
            <p>
              Next Play - To Do is a streamlined Kanban workspace for planning,
              prioritizing, and moving work forward. It focuses on a polished
              board experience with clear statuses, quick editing, and responsive
              behavior across desktop and mobile.
            </p>
            <p>
              The app also supports shared teammates, linked guest workspaces, 
              assignees, labels, due dates, comments, activity history, summary 
              stats, and appearance controls. The goal is to keep collaboration 
              lightweight while still giving each workspace enough structure to 
              stay organized.
            </p>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-[1.6rem] border bg-white/80 p-4 shadow-card">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-100 p-2 text-ink">
                <Layers3 className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-ink">Board structure</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Tasks, priorities, labels, due dates, comments, and activity all
              stay connected in one board-first workflow.
            </p>
          </section>

          <section className="rounded-[1.6rem] border bg-white/80 p-4 shadow-card">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-100 p-2 text-ink">
                <Users className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-ink">Shared teamwork</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Guest linking and team management are designed to make
              collaboration two-way, visible, and easy to follow.
            </p>
          </section>
        </div>
      </div>
    </Modal>
  );
}
