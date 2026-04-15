import { Trash2, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getInitials } from "@/lib/utils";
import { TEAM_MEMBER_COLOR_OPTIONS, type TeamMember } from "@/types/team";

interface TeamMembersModalProps {
  deletingMemberId: string | null;
  error: string | null;
  guestCode: string | null;
  isLinking: boolean;
  isLoading: boolean;
  isSaving: boolean;
  members: TeamMember[];
  onClose: () => void;
  onCreateMember: (input: { avatar_color: string; name: string }) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  onLinkGuestMember: (guestCode: string) => Promise<void>;
  open: boolean;
}

const inputClassName =
  "w-full rounded-2xl border border-line bg-slate-50 px-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

export function TeamMembersModal({
  deletingMemberId,
  error,
  guestCode,
  isLinking,
  isLoading,
  isSaving,
  members,
  onClose,
  onCreateMember,
  onDeleteMember,
  onLinkGuestMember,
  open,
}: TeamMembersModalProps) {
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(
    TEAM_MEMBER_COLOR_OPTIONS[0],
  );
  const [guestLookupCode, setGuestLookupCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setAvatarColor(TEAM_MEMBER_COLOR_OPTIONS[0]);
      setGuestLookupCode("");
      setValidationError(null);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length === 0) {
      setValidationError("Name is required.");
      return;
    }

    setValidationError(null);

    try {
      await onCreateMember({
        avatar_color: avatarColor,
        name,
      });
      setName("");
      setAvatarColor(TEAM_MEMBER_COLOR_OPTIONS[0]);
    } catch {
      return;
    }
  };

  const handleDelete = async (member: TeamMember) => {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`Remove ${member.name} from this workspace?`);

    if (!confirmed) {
      return;
    }

    try {
      await onDeleteMember(member.id);
    } catch {
      return;
    }
  };

  const handleLinkGuest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (guestLookupCode.trim().length === 0) {
      setValidationError("Guest code is required.");
      return;
    }

    setValidationError(null);

    try {
      await onLinkGuestMember(guestLookupCode);
      setGuestLookupCode("");
    } catch {
      return;
    }
  };

  return (
    <Modal
      description="Team members stay private to this guest workspace and can be assigned across multiple tasks."
      onClose={onClose}
      open={open}
      title="Team members"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-4">
          <form
            className="rounded-[1.75rem] border border-line/80 bg-slate-50/85 p-4 sm:p-5"
            onSubmit={handleSubmit}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-ink shadow-card">
                <Users className="size-5" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink">Add team member</h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Create lightweight collaborators with a name and avatar color.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink" htmlFor="team-member-name">
                  Name
                </label>
                <input
                  className={`${inputClassName} h-12`}
                  disabled={isSaving}
                  id="team-member-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jordan Lee"
                  type="text"
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-ink">Avatar color</span>
                <div className="flex flex-wrap gap-2">
                  {TEAM_MEMBER_COLOR_OPTIONS.map((color) => {
                    const isSelected = avatarColor === color;

                    return (
                      <button
                        aria-label={`Choose ${color} avatar color`}
                        className={`flex size-10 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                          isSelected
                            ? "border-slate-950 shadow-card"
                            : "border-white bg-white/70 hover:border-slate-300"
                        }`}
                        disabled={isSaving}
                        key={color}
                        onClick={() => setAvatarColor(color)}
                        style={{ backgroundColor: color }}
                        type="button"
                      >
                        {isSelected ? (
                          <span className="text-xs font-semibold text-white">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-card">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                    Preview
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {name.trim() || "New teammate"}
                  </p>
                </div>

                <div
                  className="flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-card"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(name.trim() || "New teammate")}
                </div>
              </div>

              {validationError || error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {validationError ?? error}
                </div>
              ) : null}

              <Button disabled={isSaving} type="submit">
                {isSaving ? "Adding..." : "Add member"}
              </Button>
            </div>
          </form>

          <div className="rounded-[1.75rem] border border-line/80 bg-white/80 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-ink">Link guest workspace</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Add another guest by code so tasks assigned to them show up on their board.
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Your guest code
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {guestCode ?? "Starting workspace"}
              </p>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleLinkGuest}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink" htmlFor="guest-lookup-code">
                  Guest code
                </label>
                <input
                  className={`${inputClassName} h-12 uppercase`}
                  disabled={isLinking}
                  id="guest-lookup-code"
                  onChange={(event) => setGuestLookupCode(event.target.value.toUpperCase())}
                  placeholder="A1B2C3D4"
                  type="text"
                  value={guestLookupCode}
                />
              </div>

              <Button disabled={isLinking} type="submit" variant="secondary">
                {isLinking ? "Linking..." : "Add guest teammate"}
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-line/80 bg-white/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Current team</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {members.length === 0
                  ? "No collaborators yet."
                  : `${members.length} member${members.length === 1 ? "" : "s"} available for assignment.`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-5 text-sm text-ink-muted">
              Loading team members...
            </div>
          ) : members.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-5 text-sm text-ink-muted">
              Add two or three people here so tasks can show ownership clearly on the board.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {members.map((member) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-slate-50/75 px-3 py-3"
                  key={member.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-card"
                      style={{ backgroundColor: member.avatar_color }}
                    >
                      {getInitials(member.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                      <p className="text-xs text-ink-muted">
                        {member.linked_user_id
                          ? "Linked guest workspace"
                          : "Private to this guest workspace"}
                      </p>
                    </div>
                  </div>

                  <Button
                    disabled={deletingMemberId === member.id}
                    onClick={() => void handleDelete(member)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                    {deletingMemberId === member.id ? "Removing..." : "Remove"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
