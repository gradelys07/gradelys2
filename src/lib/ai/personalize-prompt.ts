import { LearningProfile } from "@/types";

export function calibratePrompt(basePrompt: string, learningProfile?: LearningProfile): string {
  if (!learningProfile || !learningProfile.interactions || learningProfile.interactions < 5) {
    return basePrompt;
  }

  const fastResponses = learningProfile.fastResponses || 0;
  const slowResponses = learningProfile.slowResponses || 0;
  const formatPreference = learningProfile.formatPreference || { flashcard: 0, quiz: 0, explain: 0 };
  const successByHour = learningProfile.successByHour || {};
  const analogyReaction = learningProfile.analogyReaction || { positive: 0, negative: 0, neutral: 0 };

  const currentHour = new Date().getHours();
  const currentHourStats = successByHour[currentHour.toString()];
  const isOptimalTime = currentHourStats && currentHourStats.total > 0 && (currentHourStats.correct / currentHourStats.total) > 0.7;

  let calibration = `\n\n--- CALIBRAGE PÉDAGOGIQUE (OBSERVATION SILENCIEUSE) ---\n`;
  calibration += `Adapte ton ton et ton format selon le profil d'apprentissage de l'utilisateur :\n`;
  
  if (learningProfile.detailedDescription) {
    calibration += `\nPROFIL DETAILLÉ DE L'ÉTUDIANT :\n"${learningProfile.detailedDescription}"\n\n`;
  }

  // 1. Response speed heuristics
  if (fastResponses > slowResponses * 1.5) {
    calibration += `- L'utilisateur a un rythme d'apprentissage rapide. Fais des explications très concises et directes. Va droit au but.\n`;
  } else if (slowResponses > fastResponses * 1.5) {
    calibration += `- L'utilisateur prend le temps de réfléchir. Fais des explications bien détaillées, décompose étape par étape, ne saute pas d'informations.\n`;
  }

  // 2. Format preferences
  const totalFormats = formatPreference.flashcard + formatPreference.quiz + formatPreference.explain;
  if (totalFormats > 5) {
    if (formatPreference.flashcard > totalFormats * 0.5) {
      calibration += `- L'utilisateur préfère la mémorisation directe. Si approprié, structure ton explication comme une question/réponse (style flashcard).\n`;
    } else if (formatPreference.explain > totalFormats * 0.5) {
      calibration += `- L'utilisateur aime comprendre en profondeur. Utilise la technique de Feynman pour expliquer simplement.\n`;
    }
  }

  // 3. Time of day
  if (isOptimalTime) {
    calibration += `- C'est l'heure où l'utilisateur est le plus performant. Tu peux utiliser un vocabulaire un peu plus technique et le pousser à réfléchir par lui-même.\n`;
  }

  // 4. Analogy reaction
  const totalReactions = analogyReaction.positive + analogyReaction.negative;
  if (totalReactions >= 2) {
    if (analogyReaction.positive > analogyReaction.negative) {
      calibration += `- L'utilisateur ADORE les analogies personnalisées. Trouve toujours une métaphore (sport, cuisine, films...) pour expliquer un concept complexe.\n`;
    } else if (analogyReaction.negative > analogyReaction.positive) {
      calibration += `- L'utilisateur réagit MAL aux analogies. NE FAIS PAS d'analogies, donne uniquement l'explication théorique et factuelle la plus claire possible.\n`;
    }
  }

  return `${basePrompt}${calibration}-------------------------------------------------------`;
}
