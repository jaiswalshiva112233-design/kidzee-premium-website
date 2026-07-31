import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "yellow"
  | "dark"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ariaLabel?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  external?: boolean;
  disabled?: boolean;
} & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children" | "aria-label"
  >;

type NativeButtonProps = CommonProps & {
  href?: never;
  external?: never;
} & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children" | "aria-label"
  >;

type ButtonProps = LinkButtonProps | NativeButtonProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[#5B2A86] bg-[#5B2A86] text-white shadow-[0_14px_34px_rgba(91,42,134,0.25)] hover:border-[#4A2070] hover:bg-[#4A2070] hover:shadow-[0_18px_44px_rgba(91,42,134,0.32)]",

  secondary:
    "border-[#D8C5E2] bg-white text-[#4A2070] shadow-[0_10px_28px_rgba(40,16,52,0.08)] hover:border-[#BFA4CE] hover:bg-[#F8F4FC] hover:text-[#281034] hover:shadow-[0_16px_38px_rgba(40,16,52,0.12)]",

  yellow:
    "border-[#F6C84B] bg-[#F6C84B] text-[#281034] shadow-[0_14px_34px_rgba(246,200,75,0.28)] hover:border-[#F8D568] hover:bg-[#F8D568] hover:shadow-[0_18px_42px_rgba(246,200,75,0.34)]",

  dark:
    "border-[#281034] bg-[#281034] text-white shadow-[0_14px_34px_rgba(40,16,52,0.26)] hover:border-[#3D185B] hover:bg-[#3D185B] hover:shadow-[0_18px_42px_rgba(40,16,52,0.32)]",

  ghost:
    "border-transparent bg-transparent text-[#5B2A86] shadow-none hover:bg-[#F3EAF8] hover:text-[#281034]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-[50px] px-6 py-3 text-[0.95rem]",
  lg: "min-h-14 px-7 py-3.5 text-base",
};

function joinClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    children,
    className = "",
    variant = "primary",
    size = "md",
    fullWidth = false,
    leftIcon,
    rightIcon,
    ariaLabel,
  } = props;

  const classes = joinClasses(
    "inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full border font-extrabold leading-none",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50 focus-visible:ring-offset-2",
    "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {leftIcon ? (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
        >
          {leftIcon}
        </span>
      ) : null}

      <span className="flex items-center justify-center">{children}</span>

      {rightIcon ? (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
        >
          {rightIcon}
        </span>
      ) : null}
    </>
  );

  if (typeof props.href === "string" && props.href.length > 0) {
    const {
      href,
      external = false,
      disabled = false,
      target,
      rel,
      onClick,
      className: _className,
      children: _children,
      variant: _variant,
      size: _size,
      fullWidth: _fullWidth,
      leftIcon: _leftIcon,
      rightIcon: _rightIcon,
      ariaLabel: _ariaLabel,
      ...anchorProps
    } = props;

    if (disabled) {
      return (
        <span
          aria-disabled="true"
          aria-label={ariaLabel}
          className={joinClasses(
            classes,
            "pointer-events-none cursor-not-allowed opacity-55",
          )}
        >
          {content}
        </span>
      );
    }

    const isInternalLink =
      href.startsWith("/") || href.startsWith("#");

    if (isInternalLink && !external) {
      return (
        <Link
          {...anchorProps}
          href={href}
          aria-label={ariaLabel}
          className={classes}
          onClick={onClick}
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        {...anchorProps}
        href={href}
        aria-label={ariaLabel}
        className={classes}
        target={external ? "_blank" : target}
        rel={external ? "noopener noreferrer" : rel}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  const {
    type = "button",
    disabled,
    className: _className,
    children: _children,
    variant: _variant,
    size: _size,
    fullWidth: _fullWidth,
    leftIcon: _leftIcon,
    rightIcon: _rightIcon,
    ariaLabel: _ariaLabel,
    href: _href,
    external: _external,
    ...buttonProps
  } = props as NativeButtonProps & {
    href?: unknown;
    external?: unknown;
  };

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
    >
      {content}
    </button>
  );
}