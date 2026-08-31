import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import * as React from "react";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none rounded-md border border-border bg-elevated px-3 pr-9 text-body-md text-text-primary",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--primary-glow)]",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
  </div>
));
Select.displayName = "Select";
