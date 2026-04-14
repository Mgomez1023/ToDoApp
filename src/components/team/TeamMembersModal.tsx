import { Users } from "lucide-react";

import { Modal } from "@/components/ui/Modal";

interface TeamMembersModalProps {
  onClose: () => void;
  open: boolean;
}

export function TeamMembersModal({ onClose, open }: TeamMembersModalProps) {
  return (
    <Modal
      description="Lightweight collaborators and avatar colors will be added once the core board interactions are complete."
      onClose={onClose}
      open={open}
      title="Team members"
    >
      <div className="rounded-[1.75rem] border border-dashed border-line bg-slate-50 px-5 py-6 text-sm leading-7 text-ink-muted">
        <div className="mb-3 inline-flex rounded-2xl bg-white p-3 text-ink shadow-card">
          <Users className="size-5" />
        </div>
        Team member management is intentionally deferred until the core task flow
        is in place. The modal is ready for phase 6.
      </div>
    </Modal>
  );
}
