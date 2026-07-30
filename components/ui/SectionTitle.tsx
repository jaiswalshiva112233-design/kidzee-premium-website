import type { ReactNode } from "react";

interface SectionTitleProps {
  badge?: string;
  title: ReactNode;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export default function SectionTitle({
  badge,
  title,
  subtitle,
  center = true,
  className = "",
}: SectionTitleProps) {
  const alignment = center ? "mx-auto text-center" : "text-left";

  return (
    <div
      className={[
        "max-w-3xl",
        alignment,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {badge && (
        <span
          className="
            inline-flex items-center rounded-full
            border border-[#E5D6EE]
            bg-[#F8F3FC]
            px-4 py-2
            text-sm font-bold tracking-wide
            text-[#5B2A86]
          "
        >
          {badge}
        </span>
      )}

      <h2
        className="
          mt-5
          text-3xl font-black leading-tight tracking-[-0.03em]
          text-[#2C1735]
          sm:text-4xl
          lg:text-5xl
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            mt-5
            text-base leading-8
            text-[#5F5F6D]
            sm:text-lg
          "
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}