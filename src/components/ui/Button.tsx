import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
    variants: {
      size: {
        sm: "h-10 px-3.5",
        md: "h-11 px-4.5",
        lg: "h-12 px-5",
      },
      variant: {
        primary:
          "bg-ink text-white shadow-card hover:-translate-y-0.5 hover:bg-slate-800",
        secondary:
          "border border-line bg-white/80 text-ink shadow-card hover:-translate-y-0.5 hover:bg-white",
        ghost: "text-ink-muted hover:bg-white/70 hover:text-ink",
        subtle:
          "border border-white/70 bg-white/65 text-ink shadow-card hover:bg-white/80",
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
