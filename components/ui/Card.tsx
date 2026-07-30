import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-5",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  hover = true,
  padding = "md",
}: CardProps) {
  const classes = [
    "overflow-hidden",
    "rounded-[32px]",
    "border border-[#eadff0]",
    "bg-white",
    "shadow-[0_18px_50px_rgba(52,20,68,0.08)]",
    "transition-all duration-300 ease-out",
    paddingClasses[padding],
    hover
      ? "hover:-translate-y-1.5 hover:border-[#d8c4e3] hover:shadow-[0_28px_80px_rgba(52,20,68,0.12)]"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}