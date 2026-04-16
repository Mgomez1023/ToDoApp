import { X } from "lucide-react";
import {
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const MODAL_EXIT_DURATION_MS = 260;

interface ModalProps extends PropsWithChildren {
  description?: string;
  onClose: () => void;
  open: boolean;
  presentation?: "dialog" | "sheet";
  title: string;
}

export function Modal({
  children,
  description,
  onClose,
  open,
  presentation = "dialog",
  title,
}: ModalProps) {
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsRendered(true);

      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    setIsVisible(false);

    const timeout = window.setTimeout(() => {
      setIsRendered(false);
    }, MODAL_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

  if (!isRendered || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center overflow-y-auto bg-overlay transition-[opacity,backdrop-filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        presentation === "sheet"
          ? "items-end p-0 sm:items-center sm:p-6"
          : "items-start p-4 sm:items-center sm:p-6",
        isVisible && "modal-backdrop-enter",
        isVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-none",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden border border-line bg-surface-elevated transition-[opacity,transform,box-shadow,border-radius] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          presentation === "sheet"
            ? "max-h-[min(88vh,48rem)] max-w-2xl rounded-t-[2rem] rounded-b-none px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_70px_rgba(15,23,42,0.18)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem] sm:p-6 sm:shadow-shell"
            : "max-h-[calc(100vh-2rem)] max-w-2xl rounded-[2rem] p-6 shadow-shell sm:max-h-[calc(100vh-3rem)]",
          presentation === "sheet"
            ? isVisible
              ? "translate-y-0 opacity-100 modal-sheet-enter"
              : "translate-y-12 opacity-0 sm:translate-y-4 sm:scale-[0.985]"
            : isVisible
              ? "translate-y-0 scale-100 opacity-100 modal-dialog-enter"
              : "translate-y-6 scale-[0.985] opacity-0 shadow-[0_10px_35px_rgba(15,23,42,0.08)]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {presentation === "sheet" ? (
          <div className="mb-3 flex justify-center sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-slate-300/90 shadow-[0_1px_0_rgba(255,255,255,0.5)]" />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm text-ink-muted">{description}</p>
            ) : null}
          </div>
          <Button
            aria-label="Close modal"
            className="shrink-0"
            onClick={onClose}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-6 min-h-0 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
