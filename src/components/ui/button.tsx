"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-[0_0_0_1px_var(--primary)] hover:shadow-glow",
  secondary:
    "bg-elevated text-text-primary border border-border hover:bg-hover hover:border-border-strong",
  ghost: "bg-transparent text-text-secondary hover:bg-hover hover:text-text-primary",
  danger: "bg-red text-white hover:brightness-110",
  success: "bg-green text-white hover:brightness-110",
  outline: "bg-transparent border border-border-strong text-text-primary hover:bg-hover",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-body-sm rounded-md gap-1.5",
  md: "h-10 px-4 text-body-md rounded-md gap-2",
  lg: "h-12 px-6 text-body-lg rounded-lg gap-2",
  icon: "h-10 w-10 rounded-md justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center font-medium transition-all duration-150 select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
