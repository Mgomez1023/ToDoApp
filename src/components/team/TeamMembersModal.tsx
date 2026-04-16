import { ChevronRight, Trash2 } from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
  type PropsWithChildren,
} from "react";

import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
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
  "w-full rounded-2xl border border-line bg-slate-50 px-4 text-base text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";
const defaultExpandedSections = {
  guest: false,
  member: false,
};
type SectionKey = keyof typeof defaultExpandedSections;

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
  const [memberValidationError, setMemberValidationError] = useState<string | null>(null);
  const [guestValidationError, setGuestValidationError] = useState<string | null>(null);
  const [memberSubmitSuccessSignal, setMemberSubmitSuccessSignal] = useState(0);
  const [guestSubmitSuccessSignal, setGuestSubmitSuccessSignal] = useState(0);
  const [expandedSections, setExpandedSections] = useState(defaultExpandedSections);

  useEffect(() => {
    if (!open) {
      setName("");
      setAvatarColor(TEAM_MEMBER_COLOR_OPTIONS[0]);
      setGuestLookupCode("");
      setMemberValidationError(null);
      setGuestValidationError(null);
      setMemberSubmitSuccessSignal(0);
      setGuestSubmitSuccessSignal(0);
      setExpandedSections(defaultExpandedSections);
    }
  }, [open]);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((currentValue) => ({
      ...currentValue,
      [section]: !currentValue[section],
    }));
  };

  const openSection = (section: SectionKey) => {
    setExpandedSections((currentValue) => ({
      ...currentValue,
      [section]: true,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length === 0) {
      openSection("member");
      setMemberValidationError("Name is required.");
      return;
    }

    setMemberValidationError(null);

    try {
      await onCreateMember({
        avatar_color: avatarColor,
        name,
      });
      setName("");
      setAvatarColor(TEAM_MEMBER_COLOR_OPTIONS[0]);
      setMemberSubmitSuccessSignal((currentValue) => currentValue + 1);
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
      openSection("guest");
      setGuestValidationError("Guest code is required.");
      return;
    }

    setGuestValidationError(null);

    try {
      await onLinkGuestMember(guestLookupCode);
      setGuestLookupCode("");
      setGuestSubmitSuccessSignal((currentValue) => currentValue + 1);
    } catch {
      return;
    }
  };

  return (
    <Modal
      description=""
      onClose={onClose}
      open={open}
      presentation="sheet"
      title="Team members"
    >
      <div className="space-y-3">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-[1.6rem] border bg-white/80 p-4 shadow-card sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink">Current team</h3>
            </div>

            <Badge tone={members.length > 0 ? "accent" : "neutral"}>
              {isLoading
                ? "Loading..."
                : `${members.length} member${members.length === 1 ? "" : "s"}`}
            </Badge>
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
              Loading team members...
            </div>
          ) : members.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
              Add two or three people here so tasks can show ownership clearly on the board.
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-line/70 bg-slate-50/80 px-3 py-2.5"
                  key={member.id}
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-card"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {getInitials(member.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {member.linked_user_id
                        ? "Linked guest workspace"
                        : "Private to this guest workspace"}
                    </p>
                  </div>

                  <Button
                    aria-label={`Remove ${member.name}`}
                    className="h-8 w-8 shrink-0 rounded-full px-0"
                    disabled={deletingMemberId === member.id}
                    onClick={() => void handleDelete(member)}
                    size="sm"
                    title={`Remove ${member.name}`}
                    type="button"
                    variant="ghost"
                  >
                    {deletingMemberId === member.id ? "..." : <Trash2 className="size-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <AccordionSection
          onToggle={() => toggleSection("member")}
          open={expandedSections.member}
          title="Add team member"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)]">

              <div className="rounded-2xl border border-white/80 bg-slate-50/85 px-4 py-4 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Preview
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
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
              </div>
            </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink" htmlFor="team-member-name">
                  Name
                </label>
                <input
                  className={`${inputClassName} h-12`}
                  disabled={isSaving}
                  id="team-member-name"
                  onChange={(event) => {
                    setName(event.target.value);
                    if (memberValidationError) {
                      setMemberValidationError(null);
                    }
                  }}
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
                          : "border-white/80 hover:border-slate-300"
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

            {memberValidationError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {memberValidationError}
              </div>
            ) : null}

            <AnimatedSubmitButton
              disabled={isSaving}
              isLoading={isSaving}
              loadingContent="Adding..."
              successSignal={memberSubmitSuccessSignal}
              type="submit"
            >
              Add member
            </AnimatedSubmitButton>
          </form>
        </AccordionSection>

        <AccordionSection
          onToggle={() => toggleSection("guest")}
          open={expandedSections.guest}
          title="Link guest workspace"
        >
          <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-3">
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
                onChange={(event) => {
                  setGuestLookupCode(event.target.value.toUpperCase());
                  if (guestValidationError) {
                    setGuestValidationError(null);
                  }
                }}
                placeholder="A1B2C3D4"
                type="text"
                value={guestLookupCode}
              />
            </div>

            {guestValidationError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {guestValidationError}
              </div>
            ) : null}

            <AnimatedSubmitButton
              disabled={isLinking}
              isLoading={isLinking}
              loadingContent="Linking..."
              successSignal={guestSubmitSuccessSignal}
              type="submit"
              variant="secondary"
            >
              Add guest teammate
            </AnimatedSubmitButton>
          </form>
        </AccordionSection>
      </div>
    </Modal>
  );
}

interface AccordionSectionProps extends PropsWithChildren {
  onToggle: () => void;
  open: boolean;
  title: string;
}

function AccordionSection({
  children,
  onToggle,
  open,
  title,
}: AccordionSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[1.6rem] border border-line/80 bg-white/80 shadow-card transition-all duration-300",
        open ? "border-slate-200 bg-white/90" : "hover:bg-white/90",
      )}
    >
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
        onClick={onToggle}
        type="button"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border border-line/80 bg-slate-50/90 text-ink-muted shadow-card transition-all duration-300",
            open ? "bg-white text-ink shadow-sm" : "",
          )}
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "rotate-90" : "rotate-0",
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-line/70 px-4 pb-4 pt-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-5 sm:pb-5",
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
