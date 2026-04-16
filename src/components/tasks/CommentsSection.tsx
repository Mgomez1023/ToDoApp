import { format } from "date-fns";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { getGuestAvatarColor, getGuestCode } from "@/lib/utils";
import type { TaskComment } from "@/types/comment";

interface CommentsSectionProps {
  comments: TaskComment[];
  currentUserId: string | null;
  disabled?: boolean;
  error: string | null;
  isCommenting: boolean;
  isLoading: boolean;
  onSubmit: (body: string) => Promise<void>;
}

function getCommentAuthorLabel(commentUserId: string, currentUserId: string | null) {
  if (commentUserId === currentUserId) {
    return "You";
  }

  return `Guest ${getGuestCode(commentUserId)}`;
}

export function CommentsSection({
  comments,
  currentUserId,
  disabled = false,
  error,
  isCommenting,
  isLoading,
  onSubmit,
}: CommentsSectionProps) {
  const [body, setBody] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const normalizedBody = body.trim();

    if (disabled) {
      return;
    }

    if (normalizedBody.length === 0) {
      setValidationError("Comment cannot be empty.");
      return;
    }

    setValidationError(null);

    try {
      await onSubmit(normalizedBody);
      setBody("");
    } catch {
      return;
    }
  };

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-transparent bg-white/70 p-4 shadow-card">
      <div className="flex items-center gap-2">
        <MessageSquareText className="size-4 text-ink-muted" />
        <h3 className="text-sm font-semibold text-ink">Comments</h3>
      </div>

      {disabled ? (
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          Create the task first to start the conversation.
        </div>
      ) : (
        <div className="space-y-3">
          <label className="sr-only" htmlFor="task-comment-body">
            Add comment
          </label>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100 sm:text-sm"
            disabled={isCommenting}
            id="task-comment-body"
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a quick update or note."
            value={body}
          />

          {validationError || error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {validationError ?? error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              disabled={isCommenting}
              onClick={() => void handleSubmit()}
              size="sm"
              type="button"
            >
              {isCommenting ? "Posting..." : "Add comment"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-line/80 bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <article
              className="rounded-2xl border border-line/70 bg-slate-50/85 px-4 py-3"
              key={comment.id}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-card"
                  style={{ backgroundColor: getGuestAvatarColor(comment.user_id) }}
                >
                  {getGuestCode(comment.user_id).slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-ink">
                      {getCommentAuthorLabel(comment.user_id, currentUserId)}
                    </p>
                    <span className="text-xs text-ink-soft">
                      {format(new Date(comment.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
                    {comment.body}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">
          No comments yet.
        </div>
      )}
    </section>
  );
}
