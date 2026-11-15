import { DesktopSafeBrandLink } from "@/components/desktop-safe-brand-link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
        <img
          src="/favicon.png"
          alt="Gradelys logo"
          width={48}
          height={48}
          className="h-full w-full object-contain"
        />
      </div>
      <h1 className="mt-6 text-display-lg text-text-primary">404</h1>
      <p className="mt-2 text-body-lg text-text-secondary">This page doesn&apos;t exist.</p>
      <DesktopSafeBrandLink
        webHref="/"
        desktopHref="/chat"
        className="mt-6 text-body-md font-medium text-primary hover:underline"
      >
        ← Retour
      </DesktopSafeBrandLink>
    </div>
  );
}
