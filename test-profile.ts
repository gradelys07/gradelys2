async function run() {
  const { generateContent } = await import("./src/lib/gemini/client");
  const prompt = `Tu es un profileur psychologique et pédagogique IA.
L'étudiant a envoyé ce message : "je suis en premier annes en medecin"

Voici sa description de profil d'apprentissage actuelle :
"""
Aucune description pour le moment.
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
  try {
    const response = await generateContent(prompt, { jsonMode: true, temperature: 0.1 });
    console.log("RAW RESPONSE:", response);
    const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());
    console.log("PARSED:", parsed);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
