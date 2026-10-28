export type ChatIntentType = "presentation" | "visualize" | "practice" | "studio" | "chat";

export interface ChatIntentResult {
  type: ChatIntentType;
  subKind?: "quiz" | "flashcards" | "exam";
  visualType?: "mindmap" | "diagram" | "chart" | "comparison" | "infographic" | "notes" | "summary" | "essay" | "slides";
}

const PRESENTATION_KEYWORDS = [
  "présentation",
  "presentation",
  "diaporama",
  "slides",
  "powerpoint",
  "diapo",
  "diapos",
  "slideshow",
  "exposé",
  "expose",
  "pitch deck",
  "pitch",
];

const VISUALIZE_KEYWORDS = [
  "visualis",
  "visualiz",
  "mind map",
  "mindmap",
  "schéma",
  "schema",
  "diagramme",
  "diagram",
  "carte mentale",
  "cartes mentales",
  "infographie",
  "infographic",
  "canvas",
  "tableau blanc",
  "whiteboard",
  "dessin",
  "graphique",
  "chart",
  "flowchart",
  "flow chart",
  "organigramme",
  "timeline",
  "chronologie",
  "concept map",
];

const PRACTICE_KEYWORDS = [
  "quiz",
  "qcm",
  "flashcards",
  "flashcard",
  "cartes mémoires",
  "carte mémoire",
  "examen",
  "test",
  "interro",
  "interrogation",
  "évaluation",
  "evaluation",
  "exercices",
  "exercice",
  "s'entraîner",
  "s'entrainer",
  "entrainement",
  "entraînement",
];

const STUDIO_KEYWORDS = [
  "fiche de révision",
  "fiche de cours",
  "fiche révision",
  "fiche",
  "résumé",
  "resume",
  "resumer",
  "résumer",
  "resumé",
  "synthèse",
  "synthese",
  "dissertation",
  "essay",
  "compte-rendu",
  "compte rendu",
  "rapport de stage",
  "rapport",
  "notes de cours",
  "notes d'étude",
  "notes",
  "cours",
];

const CREATION_VERBS = [
  "crée",
  "cree",
  "créer",
  "creer",
  "génère",
  "genere",
  "générer",
  "generer",
  "fais",
  "faire",
  "produis",
  "produire",
  "construit",
  "construire",
  "construis",
  "create",
  "generate",
  "make",
  "build",
  "prépare",
  "prepare",
  "préparer",
  "preparer",
  "donne",
  "montre",
  "show",
  "give",
  "rédige",
  "rediger",
  "rédiger",
  "écris",
  "ecris",
  "écrire",
  "ecrire",
  "write",
  "élabore",
  "elaborer",
  "elabore",
  "conçois",
  "concevoir",
  "exporte",
  "exporter",
  "transforme",
  "transformer",
  "convertis",
  "convertir",
  "mets en",
  "mettre en",
  "peux tu",
  "peux-tu",
  "pourrais tu",
  "pourrais-tu",
];

export function detectChatIntent(text: string): ChatIntentResult {
  const lower = text.toLowerCase().trim();

  const hasCreationVerb = CREATION_VERBS.some((v) => lower.includes(v));

  // Direct start triggers (e.g., "diaporama sur...", "quiz sur...", "mindmap de...")
  const startsWithPresentation = PRESENTATION_KEYWORDS.some((k) => lower.startsWith(k));
  const startsWithVisualize = VISUALIZE_KEYWORDS.some((k) => lower.startsWith(k));
  const startsWithPractice = PRACTICE_KEYWORDS.some((k) => lower.startsWith(k));
  const startsWithStudio = STUDIO_KEYWORDS.some((k) => lower.startsWith(k));

  // 1. Presentation
  if (
    (hasCreationVerb && PRESENTATION_KEYWORDS.some((k) => lower.includes(k))) ||
    startsWithPresentation
  ) {
    return {
      type: "presentation",
      visualType: "slides",
    };
  }

  // 2. Visualize
  if (
    (hasCreationVerb && VISUALIZE_KEYWORDS.some((k) => lower.includes(k))) ||
    startsWithVisualize
  ) {
    let visualType: "mindmap" | "diagram" | "chart" | "infographic" = "diagram";
    if (lower.includes("mind") || lower.includes("carte mentale")) {
      visualType = "mindmap";
    } else if (lower.includes("infograph")) {
      visualType = "infographic";
    } else if (lower.includes("graph") || lower.includes("chart")) {
      visualType = "chart";
    }
    return {
      type: "visualize",
      visualType,
    };
  }

  // 3. Practice
  if (
    (hasCreationVerb && PRACTICE_KEYWORDS.some((k) => lower.includes(k))) ||
    startsWithPractice
  ) {
    let subKind: "quiz" | "flashcards" | "exam" = "quiz";
    if (lower.includes("flashcard") || lower.includes("carte mémoire") || lower.includes("cartes mémoires")) {
      subKind = "flashcards";
    } else if (lower.includes("examen") || lower.includes("exam") || lower.includes("partiel")) {
      subKind = "exam";
    }
    return {
      type: "practice",
      subKind,
    };
  }

  // 4. Studio documents
  if (
    (hasCreationVerb && STUDIO_KEYWORDS.some((k) => lower.includes(k))) ||
    startsWithStudio
  ) {
    let visualType: "notes" | "summary" | "essay" = "notes";
    if (lower.includes("résumé") || lower.includes("resume") || lower.includes("synthèse") || lower.includes("synthese")) {
      visualType = "summary";
    } else if (lower.includes("dissertation") || lower.includes("essay")) {
      visualType = "essay";
    }
    return {
      type: "studio",
      visualType,
    };
  }

  return { type: "chat" };
}
