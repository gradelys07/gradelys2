import { cn } from "@/lib/utils";
import * as React from "react";

type BadgeVariant = "default" | "primary" | "success" | "danger" | "warning" | "outline";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-hover text-text-secondary",
    primary: "bg-[var(--primary-subtle)] text-[var(--primary)]",
    success: "bg-[var(--accent-green-subtle)] text-green",
    danger: "bg-[var(--accent-red-subtle)] text-red",
    warning: "bg-[var(--accent-yellow-subtle)] text-yellow",
    outline: "border border-border-strong text-text-secondary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-md font-medium whitespace-nowrap",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
