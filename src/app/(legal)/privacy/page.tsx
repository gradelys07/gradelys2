import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Gradelys",
  description:
    "Consultez la politique de confidentialité de Gradelys : protection de vos données personnelles, sécurité du chiffrement et respect des droits des utilisateurs.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Politique de confidentialité | Gradelys",
    description:
      "Consultez la politique de confidentialité de Gradelys : protection de vos données personnelles, sécurité du chiffrement et respect des droits des utilisateurs.",
    url: "https://gradelys.com/privacy",
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-body-sm text-text-muted">Last updated: August 2026</p>

      <h2>1. Overview</h2>
      <p>
        Gradelys ("we", "us", "our") provides an AI-powered learning workspace. This policy explains what
        data we collect, how we use it, and the choices you have. By using Gradelys, you agree to the
        practices described here.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Account data</strong> — name, email address, and authentication credentials.</li>
        <li><strong>Content you create</strong> — chat messages, notes, flashcards, uploaded documents and images, and generated study materials.</li>
        <li><strong>Usage data</strong> — feature usage, session activity, and device/browser information, used to improve the product and enforce plan limits.</li>
        <li><strong>Payment data</strong> — subscription and billing details are processed by our payment partner (Whop); we do not store full card numbers.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <p>
        We use your data to provide and improve Gradelys, personalize your study experience, process
        payments, send transactional and (opt-in) product emails, and maintain the security of our
        service. Content you submit to AI features is sent to our AI provider (Google Gemini) solely to
        generate your requested output — it is not used to train third-party models beyond their standard
        API terms.
      </p>

      <h2>4. Data sharing</h2>
      <p>
        We do not sell your personal data. We share data only with service providers that power Gradelys
        (Supabase for database and authentication, Google for AI generation, Whop for payments, Resend for
        email) under contracts that require them to protect your data, or when required by law.
      </p>

      <h2>5. Data retention & deletion</h2>
      <p>
        We retain your data for as long as your account is active. You can delete individual items (notes,
        chats, flashcards, scans) at any time from within the app, or request full account deletion from
        Settings → Security. Deleted data is permanently removed from our production database.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct, export, or delete your
        personal data. You can exercise these rights directly in Settings, or by contacting us at{" "}
        <a href="mailto:privacy@gradelys.com">privacy@gradelys.com</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures to protect your data, including encryption in transit (TLS) and
        at rest, row-level security on all database tables, and rate limiting on sensitive endpoints. No
        method of transmission or storage is 100% secure, and we encourage you to use a strong, unique
        password.
      </p>

      <h2>8. Children's privacy</h2>
      <p>
        Gradelys is intended for students aged 13 and older. If you believe a child under 13 has provided
        us with personal data, contact us and we will delete it.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this policy from time to time. We'll notify you of material changes by email or in-app notice.</p>

      <h2>10. Contact</h2>
      <p>Questions? Reach us at <a href="mailto:privacy@gradelys.com">privacy@gradelys.com</a>.</p>
    </>
  );
}
