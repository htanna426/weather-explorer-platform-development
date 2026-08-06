import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-semibold hover:brightness-110 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]",
  secondary: "bg-white/[0.06] text-slate-100 border border-white/10 hover:bg-white/[0.1]",
  ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-white",
  danger: "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export function Button({ variant = "secondary", size = "md", isLoading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
