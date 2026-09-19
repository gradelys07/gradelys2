import { SupabaseClient } from "@supabase/supabase-js";
import { LearningProfile } from "@/types";

/**
 * Returns a default empty learning profile.
 */
export function getDefaultLearningProfile(): LearningProfile {
  return {
    interactions: 0,
    fastResponses: 0,
    slowResponses: 0,
    successByHour: {},
    formatPreference: { flashcard: 0, quiz: 0, explain: 0 },
    recurringWeaknesses: [],
    analogyReaction: { positive: 0, negative: 0, neutral: 0 },
  };
}

/**
 * Fire-and-forget background tracker for chat interactions and analogy reactions.
 */
export async function trackChatInteraction(
  supabase: SupabaseClient,
  userId: string,
  options?: { isAnalogyResponse?: boolean; feedback?: "up" | "down" | null }
) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("learning_profile")
      .eq("id", userId)
      .single();

    if (!profile) return;

    const lp: LearningProfile = {
      ...getDefaultLearningProfile(),
      ...(profile.learning_profile || {}),
    };

    lp.interactions += 1;
    lp.formatPreference.explain += 1;

    if (options?.isAnalogyResponse && options.feedback) {
      if (options.feedback === "up") lp.analogyReaction.positive += 1;
      else if (options.feedback === "down") lp.analogyReaction.negative += 1;
    }

    await supabase
      .from("profiles")
      .update({ learning_profile: lp })
      .eq("id", userId);
  } catch (err) {
    console.error("[LearningProfile] Failed to track chat interaction:", err);
  }
}

/**
 * Fire-and-forget background tracker for practice sessions (quiz/flashcard).
 */
export async function trackPracticeSession(
  supabase: SupabaseClient,
  userId: string,
  mode: "quiz" | "exam" | "flashcards",
  score: number, // percentage or out of total
  totalQuestions: number,
  timeTakenSeconds: number
) {
  if (totalQuestions <= 0) return;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("learning_profile")
      .eq("id", userId)
      .single();

    if (!profile) return;

    const lp: LearningProfile = {
      ...getDefaultLearningProfile(),
      ...(profile.learning_profile || {}),
    };

    lp.interactions += 1;
    
    // Update format preferences
    if (mode === "quiz" || mode === "exam") lp.formatPreference.quiz += 1;
    if (mode === "flashcards") lp.formatPreference.flashcard += 1;

    // Track response speed (heuristic: < 15s per question is fast, > 45s is slow)
    const avgTimePerQuestion = timeTakenSeconds / totalQuestions;
    if (avgTimePerQuestion < 15) lp.fastResponses += 1;
    else if (avgTimePerQuestion > 45) lp.slowResponses += 1;

    // Track success rate by hour of day
    const currentHour = new Date().getHours().toString();
    if (!lp.successByHour[currentHour]) {
      lp.successByHour[currentHour] = { correct: 0, total: 0 };
    }
    const successRate = score > 1 ? score / 100 : score;
    lp.successByHour[currentHour].correct += successRate;
    lp.successByHour[currentHour].total += 1;
    
    lp.lastActiveHour = parseInt(currentHour);

    await supabase
      .from("profiles")
      .update({ learning_profile: lp })
      .eq("id", userId);
  } catch (err) {
    console.error("[LearningProfile] Failed to track practice session:", err);
  }
}

/**
 * Asynchronously evaluates if a user's message reveals new insights about their learning profile,
 * and edits the existing description if it does (with 80%+ confidence).
 */
export async function updateProfileDescription(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string
) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("learning_profile")
      .eq("id", userId)
      .single();

    if (!profile) return;

    const lp: LearningProfile = {
      ...getDefaultLearningProfile(),
      ...(profile.learning_profile || {}),
    };

    const currentDescription = lp.detailedDescription || "Aucune description pour le moment.";

    const prompt = `Tu es un profileur psychologique et pédagogique IA.
L'étudiant a envoyé ce message : "${userMessage}"

Voici sa description de profil d'apprentissage actuelle :
"""
${currentDescription}
"""

TA MISSION :
Analyse le message de l'étudiant. Y a-t-il une NOUVELLE information CRUCIALE concernant son comportement d'apprentissage, ses lacunes, ses forces, ou sa méthode de travail ?
Ignore complètement les blagues, les questions basiques (ex: "qu'est-ce que x ?"), ou les informations banales. Tu dois être sûr à 80% que l'information mérite d'être notée.

RÈGLE D'OR :
Ne réécris PAS entièrement la description. Contente-toi de l'améliorer en ajoutant ou en modifiant SEULEMENT ce qui est pertinent. Si l'information contredit l'ancienne description, mets à jour en conséquence. 
Si le message n'apporte RIEN de nouveau ou d'utile au profil, retourne la description exacte telle quelle ou dis qu'aucune modification n'est nécessaire.

Retourne OBLIGATOIREMENT un JSON avec ce format :
{
  "needsUpdate": boolean,
  "newDescription": "La description mise à jour (si needsUpdate est true, sinon vide)"
}
`;

    const { generateContent } = await import("@/lib/gemini/client");
    const response = await generateContent(prompt, { 
      model: "gemini-3.1-flash",
      jsonMode: true, 
      temperature: 0.1 
    });
    
    let result;
    try {
      result = JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      return; // Fallback silently
    }

    if (result && result.needsUpdate && result.newDescription) {
      lp.detailedDescription = result.newDescription;
      await supabase
        .from("profiles")
        .update({ learning_profile: lp })
        .eq("id", userId);
    }
  } catch (err) {
    console.error("[LearningProfile] Failed to update profile description:", err);
  }
}
