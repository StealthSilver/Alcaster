import Link from "next/link";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#e6740a] text-white hover:bg-[#e6740a]/90 shadow-[0_0_0_1px_rgba(230,116,10,0.35)]",
  secondary:
    "border border-white/15 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]",
  ghost: "text-white/70 hover:text-white hover:bg-white/[0.04]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    children,
    className,
    variant = "primary",
    size = "md",
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6740a]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#010609]",
    variants[variant],
    sizes[size],
    className,
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} onClick={props.onClick}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as ButtonAsButton;
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
