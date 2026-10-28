import { NextRequest } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContentStream, resolveModel } from "@/lib/gemini/client";
import { sanitizePromptInput } from "@/lib/security";
import { planLimits, integrations } from "@/lib/config";
import { webSearch } from "@/lib/serper/client";

export const dynamic = "force-dynamic";

const SYSTEM_INSTRUCTION = `You are the AI tutor inside Gradelys, a study workspace for students.
Be clear, encouraging, and pedagogically sound. Structure answers with short paragraphs,
bold key terms, and use markdown (headings, lists, code blocks) when it aids understanding.
When useful, end with a one-line suggestion to turn the answer into a quiz, flashcards, or a
visual diagram — Gradelys can generate all three.`;

const SPACE_SCOPED_INSTRUCTION = `You are the AI tutor inside Gradelys, scoped to a single
study Space. Answer ONLY using the sources provided below (text content and/or attached
files). If the sources don't contain the answer, say so plainly instead of guessing from
general knowledge. Be clear and structured, using markdown.`;

async function fetchFileAsBase64(
  supabase: any,
  bucket: string,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) return null;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => null);
  if (!body?.message || !body?.conversationId) {
    return errorResponse("message and conversationId are required");
  }

  const message = sanitizePromptInput(body.message);
  const conversationId: string = body.conversationId;
  const model = resolveModel(body.model);

  // Parse attached file or image (supports PDF, images, txt, md, csv up to 10MB)
  const rawAttachment = body.attachment || body.file || (body.image ? { name: "image", mimeType: body.image.mimeType, data: body.image.data } : undefined);
  let attachment: { name: string; mimeType: string; data: string; size?: number } | undefined;

  if (rawAttachment?.data) {
    const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB
    const approxBytes = Math.ceil((rawAttachment.data.length * 3) / 4);
    if (approxBytes > MAX_ATTACHMENT_BYTES || (rawAttachment.size && rawAttachment.size > MAX_ATTACHMENT_BYTES)) {
      return errorResponse("Le fichier joint dépasse la limite maximale autorisée de 10 Mo.", 400);
    }
    attachment = {
      name: rawAttachment.name || "Fichier joint",
      mimeType: rawAttachment.mimeType || (rawAttachment.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
      data: rawAttachment.data,
      size: rawAttachment.size || approxBytes,
    };
  }

  // Verify the conversation belongs to this user (RLS also enforces this).
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, user_id, web_search_enabled, space_id")
    .eq("id", conversationId)
    .single();
  if (!conversation) return errorResponse("Conversation not found", 404);

  // Free plan limit: 5 messages per day
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user!.id)
    .single();

  const plan = sub?.plan || "free";

  if (plan === "free") {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("messages")
      .select("id, conversations!inner(user_id)", { count: "exact", head: true })
      .eq("role", "user")
      .eq("conversations.user_id", user!.id)
      .gte("created_at", startOfDay.toISOString());

    if ((count ?? 0) >= planLimits.free.messagesPerDay) {
      return errorResponse(
        `You've reached your daily limit of ${planLimits.free.messagesPerDay} free messages. Upgrade to Plus or Pro for unlimited chat.`,
        403
      );
    }
  }

  // Determine attachment record for the database
  const attachmentType = attachment
    ? attachment.mimeType.startsWith("image/")
      ? "image"
      : attachment.mimeType === "application/pdf" || attachment.name.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : attachment.name.toLowerCase().endsWith(".docx")
      ? "docx"
      : attachment.mimeType === "text/csv" || attachment.name.toLowerCase().endsWith(".csv")
      ? "csv"
      : "txt"
    : undefined;

  const attachmentRecord = attachment && attachmentType ? [{
    id: `att-${Date.now()}`,
    type: attachmentType,
    name: attachment.name,
    meta: attachment.size ? `${(attachment.size / (1024 * 1024)).toFixed(1)} Mo` : undefined,
  }] : [];

  // Save the user's message.
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
    attachments: attachmentRecord,
  });

  // Pull recent history for context.
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const contextText = (history ?? [])
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  // Space-scoped grounding: pull this space's sources in as context/files.
  let systemInstruction = SYSTEM_INSTRUCTION;
  let spaceContext = "";
  const spaceFiles: { mimeType: string; data: string }[] = [];

  if (conversation.space_id) {
    let query = supabase
      .from("space_sources")
      .select("id, type, name, content_preview, storage_path, url")
      .eq("space_id", conversation.space_id)
      .eq("status", "ready");

    if (Array.isArray(body.activeSourceIds)) {
      if (body.activeSourceIds.length === 0) {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      } else {
        query = query.in("id", body.activeSourceIds);
      }
    }

    const { data: sources } = await query.limit(10);

    if (sources && sources.length > 0) {
      systemInstruction = SPACE_SCOPED_INSTRUCTION;
      const textParts: string[] = [];
      let fileCount = 0;
      for (const src of sources) {
        if (src.content_preview) {
          textParts.push(`— Source "${src.name}" (${src.type}):\n${src.content_preview}`);
        } else if (src.url && (src.type === "youtube" || src.type === "url")) {
          textParts.push(`— Source "${src.name}" (${src.type}): ${src.url}\n(No transcript or content was extracted for this source.)`);
        }
        if (src.storage_path && fileCount < 3 && (src.type === "pdf" || src.type === "image")) {
          const base64 = await fetchFileAsBase64(supabase, "sources", src.storage_path);
          if (base64) {
            spaceFiles.push({
              mimeType: src.type === "pdf" ? "application/pdf" : "image/jpeg",
              data: base64,
            });
            fileCount++;
          }
        }
      }
      if (textParts.length > 0) {
        spaceContext = `\n\nSPACE SOURCES:\n${textParts.join("\n\n")}`;
      }
    }
  }

  // Optional live web search grounding.
  let sources: { id: string; title: string; snippet: string; url: string }[] = [];
  let searchContext = "";
  if (conversation.web_search_enabled && integrations.serper) {
    if (plan === "free") {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const { count: searchCount } = await supabase
        .from("messages")
        .select("id, conversations!inner(user_id)", { count: "exact", head: true })
        .eq("role", "assistant")
        .eq("conversations.user_id", user!.id)
        .neq("sources", "[]")
        .gte("created_at", startOfDay.toISOString());

      if ((searchCount ?? 0) >= planLimits.free.webSearchesPerDay) {
        return errorResponse(
          `You've reached your limit of ${planLimits.free.webSearchesPerDay} web searches per day on the Free plan. Upgrade to Plus or Pro for unlimited web searches.`,
          403
        );
      }
    }

    try {
      const results = await webSearch(message);
      sources = results.map((r, i) => ({ id: `s${i}`, title: r.title, snippet: r.snippet, url: r.link }));
      searchContext = `\n\nLive web search results for grounding (cite naturally, don't just list them):\n${results
        .map((r, i) => `[${i + 1}] ${r.title} — ${r.snippet} (${r.link})`)
        .join("\n")}`;
    } catch {
      // Search failures shouldn't block the chat response.
    }
  }

  // Fetch learning profile for calibration
  const { data: profileData } = await supabase
    .from("profiles")
    .select("learning_profile")
    .eq("id", user!.id)
    .single();

  const { calibratePrompt } = await import("@/lib/ai/personalize-prompt");
  systemInstruction = calibratePrompt(systemInstruction, profileData?.learning_profile);

  // Background track learning profile
  import("@/lib/ai/learning-profile").then((m) => {
    m.trackChatInteraction(supabase, user!.id);
    m.updateProfileDescription(supabase, user!.id, message);
  }).catch(() => {});

  // Prepare attachment for Gemini (inline data for PDF/image, or extracted text for docs)
  let attachmentContext = "";
  const attachmentFiles: { mimeType: string; data: string }[] = [];

  if (attachment) {
    const isTextual =
      attachment.mimeType.startsWith("text/") ||
      attachment.name.toLowerCase().endsWith(".txt") ||
      attachment.name.toLowerCase().endsWith(".md") ||
      attachment.name.toLowerCase().endsWith(".csv") ||
      attachment.name.toLowerCase().endsWith(".json");

    if (isTextual) {
      try {
        const textDecoded = Buffer.from(attachment.data, "base64").toString("utf-8");
        attachmentContext = `\n\n[DOCUMENT JOINT PAR L'ÉTUDIANT: "${attachment.name}"]:\n${textDecoded.slice(0, 50000)}\n\n`;
      } catch {
        attachmentFiles.push({ mimeType: "text/plain", data: attachment.data });
      }
    } else {
      // PDF or Image — Gemini natively parses PDF and images via inline_data
      const effectiveMime =
        attachment.mimeType === "application/pdf" || attachment.name.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : attachment.mimeType.startsWith("image/")
          ? attachment.mimeType
          : "application/pdf";
      attachmentFiles.push({ mimeType: effectiveMime, data: attachment.data });
    }

    systemInstruction += `\nL'étudiant a joint un document nommé "${attachment.name}". Analyse attentivement son contenu et base tes explications, réponses et résumés dessus. Cite les parties pertinentes ou les numéros de page si nécessaire.`;
  }

  const prompt = `${contextText}${spaceContext}${searchContext}${attachmentContext}\n\nTutor:`;
  const allFiles = [...attachmentFiles, ...spaceFiles];

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      if (sources.length > 0) {
        controller.enqueue(encoder.encode(`__SOURCES__${JSON.stringify(sources)}__ENDSOURCES__`));
      }
      try {
        for await (const chunk of generateContentStream(prompt, {
          model,
          systemInstruction,
          images: allFiles.length > 0 ? allFiles : undefined,
        })) {
          fullText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`));
      } finally {
        if (fullText) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: fullText,
            sources,
          });
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
