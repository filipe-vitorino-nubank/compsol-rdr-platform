import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[var(--purple-600)] text-white hover:bg-[var(--purple-800)] border border-transparent shadow-sm hover:shadow-[var(--shadow-purple-sm)] active:scale-[0.98]",
  secondary:
    "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--purple-600)]/40 hover:bg-[var(--bg-card-hover)] active:scale-[0.98]",
  ghost:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] active:scale-[0.98] border border-transparent",
  danger:
    "bg-[var(--danger)] text-white hover:bg-red-700 border border-transparent active:scale-[0.98]",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-input)] px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 ${focusRing} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
