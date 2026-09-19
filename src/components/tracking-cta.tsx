"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trackLead } from "@/lib/whop/tracking";

/** CTA link that fires a Whop lead event on click. */
export function TrackingCTA({
  href,
  label,
  variant = "primary",
  source,
  showArrow = false,
  className,
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  source: string;
  showArrow?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} onClick={() => trackLead(source)}>
      <Button variant={variant} size="lg" className={className}>
        {label}
        {showArrow && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
      </Button>
    </Link>
  );
}
