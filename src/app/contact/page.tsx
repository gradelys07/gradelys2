import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Mail, MessageCircle } from "lucide-react";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-8">
        <h1 className="text-display-lg text-text-primary">Get in touch</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Questions, feedback, or partnership ideas — we'd love to hear from you.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a href="mailto:support@gradelys.app" className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong">
            <Mail className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-3 text-heading-sm text-text-primary">Support</p>
            <p className="mt-1 text-body-sm text-text-muted">support@gradelys.app</p>
          </a>
          <a href="mailto:hello@gradelys.app" className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong">
            <MessageCircle className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-3 text-heading-sm text-text-primary">General inquiries</p>
            <p className="mt-1 text-body-sm text-text-muted">hello@gradelys.app</p>
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
