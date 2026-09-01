import Link from "next/link";
import { GraduationCap, Twitter, Instagram, Youtube } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { href: "/#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/chat", label: "Open app" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/refund", label: "Refund Policy" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-void">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
              </div>
              <span className="text-heading-sm font-bold text-text-primary">Gradelys</span>
            </Link>
            <p className="mt-3 max-w-xs text-body-sm text-text-muted">
              Your AI-powered learning workspace — chat, scan, practice, and visualize your way to better grades.
            </p>
            <div className="mt-5 flex gap-3">
              {[Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-label-lg uppercase text-text-muted">{category}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-body-sm text-text-secondary hover:text-text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-body-sm text-text-muted">© {new Date().getFullYear()} Gradelys. All rights reserved.</p>
          <p className="text-body-sm text-text-muted">Made for students, everywhere. 🎓</p>
        </div>
      </div>
    </footer>
  );
}
