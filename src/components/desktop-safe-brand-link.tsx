"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { useIsDesktopApp } from "@/lib/desktop-client";

interface DesktopSafeBrandLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    Omit<LinkProps, "href"> {
  webHref?: string;
  desktopHref?: string;
  children: React.ReactNode;
}

/**
 * Prevents links inside the desktop shell from navigating to or prefetching
 * the marketing landing page (`/`), routing instead to `/login` (or custom desktopHref).
 */
export function DesktopSafeBrandLink({
  webHref = "/",
  desktopHref = "/login",
  children,
  ...props
}: DesktopSafeBrandLinkProps) {
  const isDesktop = useIsDesktopApp();
  return (
    <Link href={isDesktop ? desktopHref : webHref} {...props}>
      {children}
    </Link>
  );
}

