import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-feather border-feather-dark text-white hover:bg-feather/90 disabled:hover:bg-feather",
  secondary:
    "bg-macaw border-macaw-dark text-white hover:bg-macaw/90 disabled:hover:bg-macaw",
  danger:
    "bg-cardinal border-cardinal-dark text-white hover:bg-cardinal/90 disabled:hover:bg-cardinal",
  outline:
    "bg-transparent border-swan dark:border-[var(--border-default)] text-eel dark:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5",
  ghost: "bg-transparent border-transparent text-eel dark:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", fullWidth, className, children, ...rest }: Props) {
  return (
    <button
      className={clsx(
        "btn-press rounded-2xl px-6 py-3 font-extrabold uppercase tracking-wide text-sm border-2",
        VARIANT_CLASSES[variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
