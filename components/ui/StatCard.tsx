import type { ReactNode } from "react";

interface StatCardProps {
  value: string;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export default function StatCard({
  value,
  label,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={[
        "group",
        "relative overflow-hidden",
        "rounded-[30px]",
        "border border-[#E8DDF1]",
        "bg-white",
        "p-6 lg:p-7",
        "shadow-[0_18px_50px_rgba(52,20,68,0.08)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5",
        "hover:border-[#D8C4E3]",
        "hover:shadow-[0_28px_80px_rgba(52,20,68,0.14)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <div
          className="
            mb-5
            inline-flex h-14 w-14
            items-center justify-center
            rounded-2xl
            bg-[#F8F3FC]
            text-[#5B2A86]
            transition-transform duration-300
            group-hover:scale-105
          "
        >
          {icon}
        </div>
      )}

      <h3
        className="
          text-4xl
          font-black
          leading-none
          tracking-tight
          text-[#5B2A86]
          lg:text-5xl
        "
      >
        {value}
      </h3>

      <p
        className="
          mt-3
          max-w-[18rem]
          text-base
          font-medium
          leading-7
          text-[#5F5F6D]
        "
      >
        {label}
      </p>
    </div>
  );
}