import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "yellow";

interface ButtonProps {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#5b2a86] text-white shadow-[0_14px_34px_rgba(91,42,134,0.22)] hover:bg-[#4a2070] hover:shadow-[0_18px_40px_rgba(91,42,134,0.27)]",

  secondary:
    "border border-[#eadff0] bg-white text-[#5b2a86] shadow-[0_8px_24px_rgba(52,20,68,0.05)] hover:border-[#d6c1e2] hover:bg-[#faf7fc] hover:shadow-[0_18px_50px_rgba(52,20,68,0.08)]",

  yellow:
    "bg-[#f6c84b] text-[#311048] shadow-[0_14px_34px_rgba(246,200,75,0.26)] hover:bg-[#f9d66a]",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  external = false,
  ariaLabel,
}: ButtonProps) {
  const classes = [
    "inline-flex min-h-[50px] items-center justify-center gap-2",
    "rounded-full border border-transparent px-6 py-3",
    "text-sm font-black leading-none",
    "transition duration-200 ease-out",
    "hover:-translate-y-0.5 active:translate-y-0",
    "focus-visible:outline-none focus-visible:ring-4",
    "focus-visible:ring-[#f6c84b]/70 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={classes}>
      {children}
    </Link>
  );
}