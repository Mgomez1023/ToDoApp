import { Check } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type SuccessPhase = "idle" | "success" | "settling";

interface AnimatedSubmitButtonProps extends Omit<ButtonProps, "children"> {
  children: ReactNode;
  isLoading: boolean;
  loadingContent: ReactNode;
  successLabel?: string;
  successSignal: number;
}

export function AnimatedSubmitButton({
  children,
  className,
  disabled,
  isLoading,
  loadingContent,
  successLabel = "Saved",
  successSignal,
  ...props
}: AnimatedSubmitButtonProps) {
  const [phase, setPhase] = useState<SuccessPhase>("idle");
  const lastSuccessSignalRef = useRef(successSignal);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (successSignal === lastSuccessSignalRef.current) {
      return;
    }

    lastSuccessSignalRef.current = successSignal;
    clearTimers();
    setPhase("success");

    settleTimeoutRef.current = setTimeout(() => {
      setPhase("settling");
    }, 1150);

    resetTimeoutRef.current = setTimeout(() => {
      setPhase("idle");
    }, 2050);
  }, [successSignal]);

  useEffect(
    () => () => {
      clearTimers();
    },
    [],
  );

  const isSuccessActive = phase !== "idle";

  return (
    <Button
      className={cn(
        "relative isolate overflow-hidden",
        isSuccessActive && "pointer-events-none disabled:opacity-100",
        className,
      )}
      disabled={disabled || isLoading || isSuccessActive}
      {...props}
    >
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <span
          className={cn(
            "absolute inset-0 origin-left bg-[linear-gradient(90deg,rgb(22,163,74),rgb(34,197,94)_58%,rgb(74,222,128))] transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            phase === "idle" && "scale-x-0 opacity-0",
            phase === "success" && "scale-x-100 opacity-100",
            phase === "settling" && "scale-x-100 opacity-0 duration-[900ms]",
          )}
        />
        <span
          className={cn(
            "absolute inset-y-0 left-[-35%] w-[35%] bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.7),transparent)] opacity-0 blur-md transition-[transform,opacity] duration-[850ms] ease-out",
            phase === "success" && "translate-x-[340%] opacity-100",
          )}
        />
      </span>

      <span
        className={cn(
          "relative z-10 flex items-center gap-2 transition-all duration-300",
          phase === "success" ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
          phase === "settling" && "duration-500",
        )}
      >
        {isLoading ? loadingContent : children}
      </span>

      <span
        className={cn(
          "pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-1.5 text-white transition-all duration-300",
          phase === "success"
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0",
        )}
      >
        <Check className="size-3.5" />
        <span>{successLabel}</span>
      </span>
    </Button>
  );
}
