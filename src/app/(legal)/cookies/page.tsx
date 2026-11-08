import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Cookie Policy | Gradelys",
  },
  description:
    "Learn about cookie usage on Gradelys: essential session cookies, user preferences, security, and how to manage your privacy settings.",
  alternates: {
    canonical: "https://gradelys.com/cookies",
  },
  openGraph: {
    title: "Cookie Policy | Gradelys",
    description:
      "Learn about cookie usage on Gradelys: essential session cookies, user preferences, security, and how to manage your privacy settings.",
    url: "https://gradelys.com/cookies",
    type: "article",
    locale: "en_US",
    siteName: "Gradelys",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Gradelys Cookie Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | Gradelys",
    description:
      "Learn about cookie usage on Gradelys: essential session cookies, user preferences, security, and how to manage your privacy settings.",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Gradelys Cookie Policy",
      },
    ],
  },
};

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="text-body-sm text-text-muted">Last updated: August 2026</p>

      <h2>1. What are cookies</h2>
      <p>
        Cookies are small text files stored on your device. Gradelys uses cookies and similar
        technologies (like local storage) to keep you signed in and remember your preferences.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li><strong>Essential cookies</strong> — used by Supabase Auth to keep you securely signed in. The app cannot function without these.</li>
        <li><strong>Preference storage</strong> — your locale, sidebar state, and display preferences, stored locally in your browser.</li>
        <li><strong>Analytics (optional)</strong> — if enabled, aggregated, privacy-respecting analytics to help us understand feature usage.</li>
      </ul>
      <p>We do not use third-party advertising cookies.</p>

      <h2>3. Managing cookies</h2>
      <p>
        You can control cookies through your browser settings. Blocking essential cookies will prevent you
        from staying logged in to Gradelys.
      </p>

      <h2>4. Contact</h2>
      <p>Questions? Email <a href="mailto:privacy@gradelys.com">privacy@gradelys.com</a>.</p>
    </>
  );
}
