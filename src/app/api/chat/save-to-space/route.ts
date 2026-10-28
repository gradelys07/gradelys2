import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { conversationId, newSpace, spaceId } = body;

  if (!conversationId) {
    return errorResponse("conversationId is required", 400);
  }

  // 1. Fetch conversation and verify ownership
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, user_id, space_id")
    .eq("id", conversationId)
    .eq("user_id", user!.id)
    .single();

  if (!conversation) {
    return errorResponse("Conversation introuvable", 404);
  }

  // 2. Fetch all messages in the conversation
  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgErr) {
    return errorResponse(`Erreur lors de la récupération des messages : ${msgErr.message}`, 500);
  }

  if (!messages || messages.length === 0) {
    return errorResponse("La discussion ne contient aucun message à enregistrer.", 400);
  }

  // 3. Format the transcript
  const transcript = messages
    .filter((m) => m.content && m.content.trim())
    .map((m) => `${m.role === "user" ? "Étudiant" : "Professeur / IA"}: ${m.content}`)
    .join("\n\n");

  // 4. Generate a rich, structured academic study note with Gemini
  let synthesizedContent = transcript;
  try {
    const prompt = `Tu es un professeur et rédacteur académique d'élite.
Un étudiant a eu la discussion suivante et souhaite l'enregistrer dans son espace d'étude.

DISCUSSION :
${transcript}

MISSION :
Transforme cette discussion en une fiche de cours / synthèse d'étude complète, dense et structurée.
- Titre clair et engageant en début de fiche (# ...)
- Définitions clés et notions fondamentales
- Formules, propriétés, théorèmes ou méthodes abordées
- Exemples concrets et explications détaillées
- Questions récurrentes et réponses claires
- Points d'attention et pièges à éviter

RÈGLE : Rédige dans la même langue que la discussion. Ne mets AUCUN bavardage méta, produis directement le document complet de synthèse au format Markdown.`;

    const aiSummary = await generateContent(prompt, { temperature: 0.4 });
    if (aiSummary && aiSummary.trim().length > 100) {
      synthesizedContent = `${aiSummary.trim()}\n\n---\n\n### 📝 Transcription intégrale de la discussion :\n\n${transcript}`;
    }
  } catch (err) {
    console.warn("AI synthesis fallback to raw transcript:", err);
  }

  // 5. Determine target space
  let targetSpaceId = spaceId;
  let spaceData: any = null;

  if (newSpace && newSpace.name) {
    // Create new space
    const { data: createdSpace, error: createErr } = await supabase
      .from("spaces")
      .insert({
        user_id: user!.id,
        name: newSpace.name.trim(),
        emoji: newSpace.emoji || "📚",
        color: newSpace.color || "#6366F1",
        template: "general",
      })
      .select()
      .single();

    if (createErr || !createdSpace) {
      return errorResponse(`Erreur lors de la création de l'espace : ${createErr?.message}`, 500);
    }
    targetSpaceId = createdSpace.id;
    spaceData = createdSpace;
  } else if (spaceId) {
    // Verify existing space ownership
    const { data: existingSpace, error: spaceErr } = await supabase
      .from("spaces")
      .select("id, name, emoji, color")
      .eq("id", spaceId)
      .eq("user_id", user!.id)
      .single();

    if (spaceErr || !existingSpace) {
      return errorResponse("Espace d'étude introuvable ou non autorisé", 404);
    }
    spaceData = existingSpace;
  } else {
    return errorResponse("Veuillez spécifier un nouvel espace ou un espace existant.", 400);
  }

  // 6. Insert into space_sources
  const sourceTitle = `Discussion : ${conversation.title || "Notes d'étude"}`;
  const { data: source, error: sourceErr } = await supabase
    .from("space_sources")
    .insert({
      space_id: targetSpaceId,
      type: "text",
      name: sourceTitle.slice(0, 80),
      content_preview: synthesizedContent,
      status: "ready",
    })
    .select()
    .single();

  if (sourceErr) {
    return errorResponse(`Erreur lors de l'ajout de la source à l'espace : ${sourceErr.message}`, 500);
  }

  // 7. Associate the conversation with this space
  await supabase
    .from("conversations")
    .update({ space_id: targetSpaceId, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({
    success: true,
    spaceId: targetSpaceId,
    space: spaceData,
    sourceId: source.id,
    sourceName: source.name,
  });
}
