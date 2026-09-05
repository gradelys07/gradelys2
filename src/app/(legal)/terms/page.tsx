import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | Gradelys",
  description:
    "Prenez connaissance des conditions générales d'utilisation de Gradelys : règles d'accès, intégrité académique, abonnements et responsabilités.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Conditions Générales d'Utilisation | Gradelys",
    description:
      "Prenez connaissance des conditions générales d'utilisation de Gradelys : règles d'accès, intégrité académique, abonnements et responsabilités.",
    url: "https://gradelys.com/terms",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-body-sm text-text-muted">Last updated: August 2026</p>

      <h2>1. Acceptance of terms</h2>
      <p>
        By creating an account or using Gradelys, you agree to these Terms of Service. If you don't agree,
        please don't use the service.
      </p>

      <h2>2. Who can use Gradelys</h2>
      <p>
        You must be at least 13 years old to use Gradelys. If you are under the age of majority in your
        jurisdiction, you confirm you have permission from a parent or guardian.
      </p>

      <h2>3. Your account</h2>
      <p>
        You're responsible for maintaining the confidentiality of your account credentials and for all
        activity under your account. Notify us immediately of any unauthorized use.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Gradelys for any unlawful purpose or to violate academic integrity policies of your institution;</li>
        <li>Attempt to reverse-engineer, scrape, or overload our infrastructure;</li>
        <li>Upload content you don't have the right to share, or content that is harmful, abusive, or infringing;</li>
        <li>Circumvent usage limits, rate limits, or subscription tiers.</li>
      </ul>
      <p>
        Gradelys is a study aid designed to help you understand material and practice — not a substitute
        for doing your own academic work where originality is required. You are responsible for complying
        with your school's academic integrity policy.
      </p>

      <h2>5. Subscriptions & billing</h2>
      <p>
        Paid plans (Plus, Pro) are billed monthly or annually through our payment processor, Whop.
        Subscriptions renew automatically until cancelled. You can cancel anytime from Settings; you'll
        retain access until the end of your current billing period. See our{" "}
        <a href="/refund">Refund Policy</a> for details on refunds.
      </p>

      <h2>6. AI-generated content</h2>
      <p>
        Gradelys uses third-party AI models to generate explanations, quizzes, flashcards, and other study
        material. AI output can be inaccurate or incomplete — always verify important facts, especially
        before an exam. We are not liable for decisions made solely based on AI-generated content.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        You retain ownership of content you upload or create. By using Gradelys, you grant us a limited
        license to process that content solely to provide the service to you. Gradelys' branding, design,
        and underlying software are our property.
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these terms, engage in abusive behavior, or pose
        a security risk. You may delete your account at any time from Settings.
      </p>

      <h2>9. Disclaimer & limitation of liability</h2>
      <p>
        Gradelys is provided "as is" without warranties of any kind. To the maximum extent permitted by
        law, we are not liable for indirect, incidental, or consequential damages arising from your use of
        the service.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>We may update these terms periodically. Continued use after changes constitutes acceptance.</p>

      <h2>11. Contact</h2>
      <p>Questions about these terms? Email <a href="mailto:support@gradelys.com">support@gradelys.com</a>.</p>
    </>
  );
}
