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
      <h1>Conditions Générales d'Utilisation</h1>
      <p className="text-body-sm text-text-muted">Dernière mise à jour : Septembre 2026</p>

      <h2>1. Acceptation des conditions</h2>
      <p>
        En créant un compte ou en utilisant Gradelys, vous acceptez ces Conditions Générales d'Utilisation. Si vous ne les acceptez pas, veuillez ne pas utiliser le service.
      </p>

      <h2>2. Qui peut utiliser Gradelys</h2>
      <p>
        Vous devez avoir au moins 13 ans pour utiliser Gradelys. Si vous n'avez pas l'âge de la majorité dans votre juridiction, vous confirmez avoir l'autorisation d'un parent ou d'un tuteur. Bien que nous demandions votre âge lors de l'inscription pour adapter notre intelligence artificielle, cela ne dispense pas de cette obligation d'âge minimum.
      </p>

      <h2>3. Votre compte</h2>
      <p>
        Vous êtes responsable du maintien de la confidentialité de vos identifiants de compte et de toute activité effectuée sous votre compte. Informez-nous immédiatement de toute utilisation non autorisée.
      </p>

      <h2>4. Utilisation acceptable</h2>
      <p>Vous acceptez de ne pas :</p>
      <ul>
        <li>Utiliser Gradelys à des fins illégales ou pour violer les politiques d'intégrité académique de votre établissement ;</li>
        <li>Tenter de faire de la rétro-ingénierie, de récupérer des données en masse (scraping) ou de surcharger notre infrastructure ;</li>
        <li>Télécharger du contenu que vous n'avez pas le droit de partager, ou du contenu nuisible, abusif ou contrefait ;</li>
        <li>Contourner les limites d'utilisation, les limites de débit ou les niveaux d'abonnement.</li>
      </ul>
      <p>
        Gradelys est une aide à l'étude conçue pour vous aider à comprendre la matière et à vous exercer — et non un substitut pour réaliser votre propre travail académique là où l'originalité est requise. Vous êtes responsable du respect de la politique d'intégrité académique de votre école.
      </p>

      <h2>5. Abonnements et facturation</h2>
      <p>
        Les forfaits payants (Plus, Pro) sont facturés mensuellement ou annuellement via notre processeur de paiement, Whop. Les abonnements se renouvellent automatiquement jusqu'à leur annulation. Vous pouvez annuler à tout moment depuis les Paramètres ; vous conserverez l'accès jusqu'à la fin de votre période de facturation en cours. Consultez notre <a href="/refund">Politique de Remboursement</a> pour plus de détails.
      </p>

      <h2>6. Contenu généré par l'IA</h2>
      <p>
        Gradelys utilise des modèles d'IA tiers pour générer des explications, des quiz, des flashcards et d'autres matériels d'étude, en les adaptant spécifiquement à votre profil d'apprentissage (âge, niveau, difficultés). Les résultats de l'IA peuvent être inexacts ou incomplets — vérifiez toujours les faits importants, en particulier avant un examen. Nous ne sommes pas responsables des décisions prises uniquement sur la base de contenus générés par l'IA.
      </p>

      <h2>7. Propriété intellectuelle</h2>
      <p>
        Vous conservez la propriété du contenu que vous téléchargez ou créez. En utilisant Gradelys, vous nous accordez une licence limitée pour traiter ce contenu uniquement dans le but de vous fournir le service. L'image de marque, le design et le logiciel sous-jacent de Gradelys sont notre propriété.
      </p>

      <h2>8. Résiliation</h2>
      <p>
        Nous pouvons suspendre ou fermer les comptes qui violent ces conditions, s'engagent dans un comportement abusif ou posent un risque de sécurité. Vous pouvez supprimer votre compte à tout moment depuis les Paramètres.
      </p>

      <h2>9. Clause de non-responsabilité et limitation de responsabilité</h2>
      <p>
        Gradelys est fourni "tel quel" sans garantie d'aucune sorte. Dans toute la mesure permise par la loi, nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs découlant de votre utilisation du service.
      </p>

      <h2>10. Modifications de ces conditions</h2>
      <p>Nous pouvons mettre à jour ces conditions périodiquement. L'utilisation continue après des modifications constitue une acceptation.</p>

      <h2>11. Contact</h2>
      <p>Des questions concernant ces conditions ? Envoyez un e-mail à <a href="mailto:support@gradelys.com">support@gradelys.com</a>.</p>
    </>
  );
}
