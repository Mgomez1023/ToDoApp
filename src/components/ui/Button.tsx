import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
    variants: {
      size: {
        sm: "h-9 px-3.5",
        md: "h-10 px-4",
        lg: "h-11 px-4.5",
      },
      variant: {
        primary:
          "bg-[var(--color-button-primary-bg)] text-[color:var(--color-button-primary-ink)] shadow-card hover:-translate-y-0.5 hover:bg-[var(--color-button-primary-bg-hover)]",
        secondary:
          "border border-[var(--color-button-secondary-border)] bg-[var(--color-button-secondary-bg)] text-ink shadow-card hover:-translate-y-0.5 hover:bg-[var(--color-button-secondary-bg-hover)]",
        ghost:
          "text-ink-muted hover:bg-[var(--color-button-ghost-hover)] hover:text-ink",
        subtle:
          "border border-[var(--color-button-subtle-border)] bg-[var(--color-button-subtle-bg)] text-ink shadow-card hover:bg-[var(--color-button-subtle-bg-hover)]",
      },
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  ),
);

Button.displayName = "Button";
