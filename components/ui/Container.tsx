import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow" | "full";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const sizeClasses = {
  default: "max-w-[1180px]",
  wide: "max-w-[1320px]",
  narrow: "max-w-[860px]",
  full: "max-w-none",
} as const;

export default function Container<T extends ElementType = "div">({
  as,
  children,
  className = "",
  size = "default",
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={[
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}