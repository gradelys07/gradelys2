import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique relative aux cookies | Gradelys",
  description:
    "Découvrez l'utilisation des cookies techniques et de préférences sur la plateforme Gradelys : gestion de session, sécurité et respect de votre vie privée.",
  alternates: {
    canonical: "/cookies",
  },
  openGraph: {
    title: "Politique relative aux cookies | Gradelys",
    description:
      "Découvrez l'utilisation des cookies techniques et de préférences sur la plateforme Gradelys : gestion de session, sécurité et respect de votre vie privée.",
    url: "https://gradelys.com/cookies",
    type: "article",
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
