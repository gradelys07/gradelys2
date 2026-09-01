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
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  source: string;
  showArrow?: boolean;
}) {
  return (
    <Link href={href} onClick={() => trackLead(source)}>
      <Button variant={variant} size="lg">
        {label}
        {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </Link>
  );
}
