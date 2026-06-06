import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "dark" | "light";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

export function Button({
  children,
  className,
  disabled = false,
  href,
  iconLeft,
  iconRight,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  const buttonClassName = cx(
    "button",
    `button--${variant}`,
    `button--${size}`,
    disabled && "button--disabled",
    className,
  );
  const content = (
    <>
      {iconLeft ? <span className="button__icon">{iconLeft}</span> : null}
      <span>{children}</span>
      {iconRight ? <span className="button__icon">{iconRight}</span> : null}
    </>
  );

  if (href) {
    if (disabled) {
      return (
        <button className={buttonClassName} disabled type="button">
          {content}
        </button>
      );
    }

    return (
      <Link
        className={buttonClassName}
        href={href}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={buttonClassName} disabled={disabled} type="button" {...props}>
      {content}
    </button>
  );
}
