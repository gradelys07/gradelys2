import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";
import type { ChatIntentResult } from "@/lib/chat-intent";

export const dynamic = "force-dynamic";

function getSubjectEmoji(text: string): string {
  const l = text.toLowerCase();
  if (l.includes("math") || l.includes("dériv") || l.includes("fonct") || l.includes("intégr") || l.includes("géom")) return "📐";
  if (l.includes("physiq") || l.includes("chimie") || l.includes("biolog") || l.includes("svt") || l.includes("cellul") || l.includes("atome")) return "🔬";
  if (l.includes("hist") || l.includes("géo") || l.includes("guerre") || l.includes("siècle") || l.includes("monde")) return "🌍";
  if (l.includes("français") || l.includes("littér") || l.includes("philo") || l.includes("roman") || l.includes("poés")) return "📖";
  if (l.includes("informatiq") || l.includes("code") || l.includes("dev") || l.includes("python") || l.includes("algor")) return "💻";
  if (l.includes("éco") || l.includes("gest") || l.includes("droit") || l.includes("compta") || l.includes("financ")) return "📊";
  if (l.includes("anglais") || l.includes("lang") || l.includes("espagnol") || l.includes("allemand")) return "🗣️";
  return "📚";
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { conversationId, userPrompt, intent, spaceId, attachment }: {
    conversationId?: string;
    userPrompt: string;
    intent: ChatIntentResult;
    spaceId?: string | null;
    attachment?: { name?: string; mimeType?: string; data?: string; size?: number };
  } = body;

  if (!userPrompt || !intent?.type) {
    return errorResponse("userPrompt and intent are required", 400);
  }

  // Optional attached file (max 10 Mo) used to ground the synthesis
  let attachmentText = "";
  const attachmentFiles: { mimeType: string; data: string }[] = [];
  if (attachment?.data) {
    const approxBytes = Math.ceil((attachment.data.length * 3) / 4);
    if (approxBytes > 10 * 1024 * 1024 || (attachment.size && attachment.size > 10 * 1024 * 1024)) {
      return errorResponse("Le fichier joint dépasse la limite maximale autorisée de 10 Mo.", 400);
    }
    const mime = attachment.mimeType || "application/octet-stream";
    const name = attachment.name || "Fichier joint";
    if (mime.startsWith("text/")) {
      const decoded = Buffer.from(attachment.data, "base64").toString("utf-8").slice(0, 50000);
      attachmentText = `DOCUMENT JOINT PAR L'ÉTUDIANT ("${name}") :\n${decoded}\n\n`;
    } else if (mime === "application/pdf" || mime.startsWith("image/")) {
      attachmentFiles.push({ mimeType: mime, data: attachment.data });
      attachmentText = `L'étudiant a joint le document "${name}" (fourni ci-joint). Base-toi en priorité sur son contenu.\n\n`;
    }
  }

  // 1. Resolve or create Space
  let effectiveSpaceId = spaceId || null;
  let chatConversation: any = null;

  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id, title, space_id")
      .eq("id", conversationId)
      .eq("user_id", user!.id)
      .single();
    if (conv) {
      chatConversation = conv;
      if (!effectiveSpaceId && conv.space_id) {
        effectiveSpaceId = conv.space_id;
      }
    }
  }

  let spaceRecord: any = null;

  if (effectiveSpaceId) {
    const { data: existingSpace } = await supabase
      .from("spaces")
      .select("id, name, emoji, color")
      .eq("id", effectiveSpaceId)
      .eq("user_id", user!.id)
      .single();
    spaceRecord = existingSpace;
  }

  // If no space exists yet, automatically create a dedicated space for this chat topic
  if (!spaceRecord) {
    const spaceName = chatConversation?.title || userPrompt.slice(0, 36) || "Espace d'étude";
    const spaceEmoji = getSubjectEmoji(spaceName + " " + userPrompt);

    const { data: newSpace, error: spaceCreateErr } = await supabase
      .from("spaces")
      .insert({
        user_id: user!.id,
        name: spaceName.trim(),
        emoji: spaceEmoji,
        color: "#6366F1",
        template: "general",
      })
      .select()
      .single();

    if (spaceCreateErr || !newSpace) {
      return errorResponse(`Erreur lors de la création automatique de l'espace : ${spaceCreateErr?.message}`, 500);
    }
    spaceRecord = newSpace;
    effectiveSpaceId = newSpace.id;

    // Link the current chat conversation to this space if applicable
    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ space_id: newSpace.id })
        .eq("id", conversationId);
    }
  }

  // 2. Fetch discussion messages to provide context
  let recentHistory = "";
  if (conversationId) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(16);

    if (msgs && msgs.length > 0) {
      recentHistory = msgs
        .filter((m) => m.content && m.content.trim())
        .map((m) => `${m.role === "user" ? "Étudiant" : "Assistant"}: ${m.content}`)
        .join("\n\n");
    }
  }

  // 3. Generate tailored, high-density academic study material for this specific request
  const formatDesc = intent.type === "presentation"
    ? "une présentation à diapositives (structure claire par diapo, titres, points clés, chiffres et concepts)"
    : intent.type === "visualize"
    ? `une visualisation (${intent.visualType || "schéma/carte mentale"}) (relations logiques, hiérarchie, branches, étapes)`
    : intent.type === "practice"
    ? `un entraînement (${intent.subKind || "quiz/flashcards"}) (questions testables, définitions, faits précis, formules)`
    : "un document de synthèse / notes de cours complètes";

  const aiSynthesisPrompt = `Tu es un professeur expert et concepteur de cours d'élite.
L'étudiant a formulé cette requête : "${userPrompt}".
Il souhaite générer : ${formatDesc}.

${attachmentText}${recentHistory ? `CONTEXTE DE LA DISCUSSION PRÉCÉDENTE :\n${recentHistory}\n\n` : `THÈME DEMANDÉ :\n${userPrompt}\n\n`}

MISSION :
Rédige un contenu d'étude de référence très riche, dense, structuré et exhaustif sur ce sujet.
Ce texte servira de source de données et de base de vérité pour le moteur d'IA qui va concevoir le support.
- Donne toutes les définitions fondamentales et termes techniques indispensables
- Explique clairement chaque étape, propriété, formule ou mécanisme
- Détaille les exemples d'application concrets
- Organise les parties de manière nette et progressive

RÈGLE ABSOLUE :
- Écris dans la même langue que la discussion / requête de l'étudiant.
- AUCUN bavardage d'introduction ("Voici...", "Dans ce document..."). Commence directement par le contenu (# Titre).`;

  let synthesizedStudySource = "";
  try {
    const aiText = await generateContent(aiSynthesisPrompt, {
      temperature: 0.35,
      ...(attachmentFiles.length ? { images: attachmentFiles } : {}),
    });
    if (aiText && aiText.trim().length > 80) {
      synthesizedStudySource = aiText.trim();
    }
  } catch (err) {
    console.warn("AI brief synthesis warning:", err);
  }

  // Fallback if AI call failed
  if (!synthesizedStudySource) {
    synthesizedStudySource = recentHistory
      ? `# Synthèse d'étude : ${userPrompt}\n\n${recentHistory}`
      : `# Notes d'étude : ${userPrompt}\n\nContenu généré pour le support d'apprentissage.`;
  }

  // 4. Save this synthesized brief into space_sources so tool generation grounds on it
  const sourceName = `Source IA : ${userPrompt.slice(0, 48)}`;
  await supabase.from("space_sources").insert({
    space_id: effectiveSpaceId,
    type: "text",
    name: sourceName,
    content_preview: synthesizedStudySource,
    status: "ready",
  });

  // 5. Create the tool conversation in this space
  const targetKind = intent.type === "presentation" ? "studio" : intent.type;
  const { data: toolConv, error: convErr } = await supabase
    .from("conversations")
    .insert({
      user_id: user!.id,
      space_id: effectiveSpaceId,
      kind: targetKind,
      title: userPrompt.slice(0, 48),
      model: "auto",
    })
    .select()
    .single();

  if (convErr || !toolConv) {
    return errorResponse(`Erreur lors de la création de la session outil : ${convErr?.message}`, 500);
  }

  return NextResponse.json({
    success: true,
    toolConversationId: toolConv.id,
    spaceId: effectiveSpaceId,
    space: spaceRecord,
    targetKind,
    preset: {
      visualType: intent.visualType || (intent.type === "presentation" ? "slides" : undefined),
      subKind: intent.subKind,
    },
    userPrompt,
  });
}
