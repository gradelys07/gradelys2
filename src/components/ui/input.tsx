import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-body-md text-text-primary",
        "placeholder:text-text-muted transition-colors",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--primary-glow)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full rounded-md border border-border bg-elevated px-3 py-2 text-body-md text-text-primary",
      "placeholder:text-text-muted transition-colors resize-none",
      "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--primary-glow)]",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-label-lg text-text-secondary mb-1.5 block", className)}
      {...props}
    />
  );
}
