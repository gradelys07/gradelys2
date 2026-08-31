"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-body-lg font-medium text-text-primary">{item.q}</span>
            <ChevronDown
              className={cn("h-5 w-5 shrink-0 text-text-muted transition-transform duration-200", open === i && "rotate-180")}
            />
          </button>
          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <p className="px-5 pb-4 text-body-md text-text-secondary">{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
