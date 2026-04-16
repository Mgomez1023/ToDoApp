import { X } from "lucide-react";
import type { PropsWithChildren } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";

interface ModalProps extends PropsWithChildren {
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function Modal({
  children,
  description,
  onClose,
  open,
  title,
}: ModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-overlay p-4 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-line bg-surface-elevated p-6 shadow-shell sm:max-h-[calc(100vh-3rem)]">
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
