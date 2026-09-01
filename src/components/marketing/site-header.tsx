"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { trackLead } from "@/lib/whop/tracking";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
          </div>
          <span className="text-heading-sm font-bold tracking-tight text-text-primary">Gradelys</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-md text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link href="/chat">
              <Button variant="primary" size="sm">Go to app</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-body-md text-text-secondary hover:text-text-primary">
                Log in
              </Link>
              <Link href="/signup" onClick={() => trackLead("header_cta")}>
                <Button variant="primary" size="sm">Get started free</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-text-primary" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border-subtle bg-void px-5 py-4 md:hidden animate-slide-up">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-body-lg text-text-secondary" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border-subtle pt-4">
              {user ? (
                <Link href="/chat" className="text-body-lg text-text-primary font-medium">Go to app →</Link>
              ) : (
                <>
                  <Link href="/login" className="text-body-lg text-text-secondary">Log in</Link>
                  <Link href="/signup" className="text-body-lg font-medium text-primary" onClick={() => { trackLead("mobile_header_cta"); setOpen(false); }}>Get started free →</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
