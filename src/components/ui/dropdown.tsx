"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={ref}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error("Must be used within DropdownMenu");
  return (
    <div onClick={() => ctx.setOpen(!ctx.open)} className="cursor-pointer">
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "start",
  side = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
  side?: "top" | "bottom" | "right" | "left";
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error("Must be used within DropdownMenu");

  const isHorizontal = side === "right" || side === "left";
  const initialAnim = isHorizontal
    ? { opacity: 0, x: side === "left" ? 4 : -4, scale: 0.98 }
    : { opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 };
  const exitAnim = initialAnim;

  const positionClasses = isHorizontal
    ? cn(
        side === "right" ? "left-full ml-1.5" : "right-full mr-1.5",
        align === "end" ? "bottom-0" : "top-0"
      )
    : cn(
        side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        align === "end" ? "right-0" : "left-0"
      );

  return (
    <AnimatePresence>
      {ctx.open && (
        <motion.div
          initial={initialAnim}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={exitAnim}
          transition={{ duration: 0.12 }}
          className={cn(
            "absolute z-50 min-w-[180px] rounded-md border border-border-strong bg-elevated shadow-l3 py-1",
            positionClasses,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}) {
  const ctx = React.useContext(DropdownContext);
  return (
    <button
      onClick={() => {
        onClick?.();
        ctx?.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-body-sm text-left transition-colors",
        danger ? "text-red hover:bg-[var(--accent-red-subtle)]" : "text-text-secondary hover:bg-hover hover:text-text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border-subtle" />;
}
