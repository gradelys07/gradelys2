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
      <h1>Politique de Confidentialité</h1>
      <p className="text-body-sm text-text-muted">Dernière mise à jour : Septembre 2026</p>

      <h2>1. Aperçu</h2>
      <p>
        Gradelys ("nous", "notre", "nos") fournit un espace de travail d'apprentissage propulsé par l'IA. Cette politique explique quelles données nous collectons, comment nous les utilisons et les choix dont vous disposez. En utilisant Gradelys, vous acceptez les pratiques décrites ici.
      </p>

      <h2>2. Les informations que nous collectons</h2>
      <ul>
        <li><strong>Données de compte</strong> — nom, adresse e-mail et identifiants de connexion.</li>
        <li><strong>Profil d'apprentissage</strong> — âge, rôle (étudiant, professeur, etc.), niveau d'études, spécialité, difficultés d'apprentissage, centres d'intérêt personnels et préférences linguistiques. Ces données sont utilisées pour personnaliser les réponses de l'IA.</li>
        <li><strong>Contenu que vous créez</strong> — messages de chat, notes, flashcards, documents et images téléchargés, et matériel d'étude généré.</li>
        <li><strong>Données d'utilisation et d'étude</strong> — durée de vos sessions de concentration (Focus Timer), vitesse d'interaction, préférences de format (quiz, explications) et réactions aux analogies générées.</li>
        <li><strong>Données de paiement</strong> — les détails d'abonnement et de facturation sont traités par notre partenaire de paiement (Whop) ; nous ne stockons pas les numéros de carte complets.</li>
      </ul>

      <h2>3. Comment nous utilisons vos informations</h2>
      <p>
        Nous utilisons vos données pour fournir et améliorer Gradelys, personnaliser votre expérience d'étude (notamment grâce à votre profil d'apprentissage), traiter les paiements, envoyer des e-mails transactionnels, et maintenir la sécurité de notre service. Le contenu que vous soumettez aux fonctionnalités d'IA est envoyé à notre fournisseur d'IA (Google Gemini) uniquement pour générer le résultat demandé — il n'est pas utilisé pour entraîner des modèles tiers au-delà de leurs conditions d'API standard.
      </p>

      <h2>4. Partage des données</h2>
      <p>
        Nous ne vendons pas vos données personnelles. Nous partageons des données uniquement avec les fournisseurs de services qui font fonctionner Gradelys (Supabase pour la base de données et l'authentification, Google pour la génération par IA, Whop pour les paiements, Resend pour les e-mails) sous des contrats qui les obligent à protéger vos données, ou lorsque la loi l'exige.
      </p>

      <h2>5. Conservation et suppression des données</h2>
      <p>
        Nous conservons vos données tant que votre compte est actif. Vous pouvez supprimer des éléments individuels (notes, chats, flashcards, scans) à tout moment depuis l'application, ou demander la suppression complète de votre compte depuis Paramètres → Sécurité. Les données supprimées sont définitivement effacées de notre base de données de production.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Selon votre lieu de résidence, vous pouvez avoir le droit d'accéder, de corriger, d'exporter ou de supprimer vos données personnelles. Vous pouvez exercer ces droits directement dans les Paramètres, ou en nous contactant à <a href="mailto:privacy@gradelys.com">privacy@gradelys.com</a>.
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Nous utilisons des mesures conformes aux normes de l'industrie pour protéger vos données, y compris le chiffrement en transit (TLS) et au repos, la sécurité au niveau des lignes sur toutes les tables de la base de données, et la limitation de débit sur les points d'accès sensibles. Aucune méthode de transmission ou de stockage n'est sûre à 100 %, et nous vous encourageons à utiliser un mot de passe fort et unique.
      </p>

      <h2>8. Confidentialité des enfants</h2>
      <p>
        Gradelys est destiné aux étudiants âgés de 13 ans et plus. Bien que nous demandions l'âge lors de l'inscription pour personnaliser l'apprentissage, si vous pensez qu'un enfant de moins de 13 ans nous a fourni des données personnelles, contactez-nous et nous les supprimerons.
      </p>

      <h2>9. Modifications de cette politique</h2>
      <p>Nous pouvons mettre à jour cette politique de temps à autre. Nous vous informerons des changements importants par e-mail ou par une notification dans l'application.</p>

      <h2>10. Contact</h2>
      <p>Des questions ? Contactez-nous à <a href="mailto:privacy@gradelys.com">privacy@gradelys.com</a>.</p>
    </>
  );
}
