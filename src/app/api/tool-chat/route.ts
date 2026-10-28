import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { requireSpaceWithSource } from "@/lib/supabase/require-space";
import {
  generateVisualizeContent, generateStudioContent, generateQuizContent, generateFlashcardsContent, generateExamQuestions,
} from "@/lib/generation/tool-generation";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { conversationId, message, spaceId, visualType, subKind, customPrompt, count, isPersonalized, activeSourceIds } = body;
  if (!conversationId || !message) {
    return errorResponse("conversationId and message are required");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, kind, title, user_id, space_id")
    .eq("id", conversationId)
    .eq("user_id", user!.id)
    .single();
  if (!conversation) return errorResponse("Conversation not found", 404);

  const effectiveSpaceId = spaceId || conversation.space_id || null;

  if (effectiveSpaceId) {
    const spaceCheck = await requireSpaceWithSource(supabase, user!.id, effectiveSpaceId);
    if (!spaceCheck.ok && spaceCheck.response.status === 404) {
      return spaceCheck.response;
    }
  }

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
  const plan = sub?.plan || "free";

  if (conversation.kind === "visualize" && (plan === "free" || plan === "plus")) {
    const limit = plan === "free" ? planLimits.free.visualizePerMonth : planLimits.plus.visualizePerMonth;
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: visCount } = await supabase
      .from("visualize_outputs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((visCount ?? 0) >= limit) {
      return errorResponse(
        plan === "free"
          ? `The Free plan includes ${limit} visualization per month. Upgrade to Plus (30/month) or Pro (Unlimited) for more.`
          : `You've reached your monthly limit of ${limit} visualizations on the Plus plan. Upgrade to Pro for unlimited visualizations.`,
        403
      );
    }
  }

  if (conversation.kind === "studio" && (plan === "free" || plan === "plus")) {
    const limit = plan === "free" ? planLimits.free.studioPerMonth : planLimits.plus.studioPerMonth;
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: docCount } = await supabase
      .from("studio_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((docCount ?? 0) >= limit) {
      return errorResponse(
        plan === "free"
          ? `The Free plan includes ${limit} Studio document per month. Upgrade to Plus (20/month) or Pro (Unlimited) for more.`
          : `You've reached your monthly limit of ${limit} Studio documents on the Plus plan. Upgrade to Pro for unlimited documents.`,
        403
      );
    }
  }

  let learningProfile;
  if (isPersonalized !== false) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("learning_profile")
      .eq("id", user!.id)
      .single();
    learningProfile = profileData?.learning_profile;
  }

  await supabase.from("messages").insert({ conversation_id: conversationId, role: "user", content: message });

  if (conversation.title === "New conversation") {
    await supabase.from("conversations").update({ title: message.slice(0, 48) }).eq("id", conversationId);
  }

  try {
    if (conversation.kind === "visualize") {
      const type = visualType || "auto";
      const { title, outputData } = await generateVisualizeContent(supabase, effectiveSpaceId, message, type, customPrompt, learningProfile, activeSourceIds);

      const { data: visDoc, error: visError } = await supabase.from("visualize_outputs").insert({
        user_id: user!.id, space_id: effectiveSpaceId, type: outputData.kind || type, prompt: message, title, output_data: outputData,
      }).select().single();

      if (visError) return errorResponse(`Failed to save visualization: ${visError.message}`, 500);

      const structuredPayload = outputData.kind === "image" ? {
        kind: "image",
        visualizeId: visDoc.id,
        title,
        imageUrl: `data:${outputData.mimeType};base64,${outputData.imageBase64}`,
        promptUsed: outputData.promptUsed,
        style: outputData.style,
      } : {
        kind: "visualize",
        visualizeId: visDoc.id,
        title,
        output: outputData,
      };

      const { data: assistantMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: `Generated: ${title}`,
          structured: structuredPayload,
        })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      return NextResponse.json({ message: assistantMsg });
    }

    if (conversation.kind === "studio") {
      const docType = visualType || "auto";
      const { title, content, returnedDocType } = await generateStudioContent(supabase, effectiveSpaceId, message, docType, customPrompt, learningProfile, activeSourceIds);

      const finalDocType = returnedDocType || (visualType || "notes");

      const { data: doc } = await supabase
        .from("studio_documents")
        .insert({ user_id: user!.id, space_id: effectiveSpaceId, type: finalDocType, title, content })
        .select()
        .single();

      const { data: assistantMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: finalDocType === "slides" ? "Generated Presentation Outline" : content,
          structured: { kind: "studio", documentId: doc?.id, title, docType: finalDocType },
        })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      return NextResponse.json({ message: assistantMsg });
    }

    if (conversation.kind === "practice") {
      const n = Math.min(Math.max(Number(count) || 10, 1), 30);

      if (subKind === "flashcards") {
        const cards = await generateFlashcardsContent(supabase, effectiveSpaceId, message, n, customPrompt, activeSourceIds);
        const { data: deck } = await supabase
          .from("flashcard_decks")
          .insert({ user_id: user!.id, space_id: effectiveSpaceId, name: message.slice(0, 60), subject: message.slice(0, 60) })
          .select()
          .single();
        await supabase.from("flashcards").insert(cards.map((c) => ({ deck_id: deck.id, question: c.question, answer: c.answer })));

        const { data: assistantMsg, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: "assistant",
            content: `Created a flashcard deck "${deck.name}" with ${cards.length} cards.`,
            structured: { kind: "flashcards", deckId: deck.id, deckName: deck.name, count: cards.length },
          })
          .select()
          .single();
        if (error) return errorResponse(error.message, 500);
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
        return NextResponse.json({ message: assistantMsg });
      }

      const mode = subKind === "exam" ? "exam" : "quiz";

      if (mode === "exam") {
        const { data: profile } = await supabase.from("profiles").select("education_system").eq("id", user!.id).single();
        const format = profile?.education_system || "Standard";
        const difficulty = body.difficulty || "Normal";

        const examJson = await generateExamQuestions(supabase, effectiveSpaceId, message, Math.min(n, 8), format, difficulty, customPrompt, activeSourceIds);
        
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .insert({
            user_id: user!.id,
            space_id: effectiveSpaceId,
            subject: examJson.subject || message,
            format: examJson.format || format,
            difficulty: examJson.difficulty || difficulty,
            duration: examJson.duration || "2h",
            total_points: examJson.totalPoints || 20,
            content_json: examJson,
          })
          .select()
          .single();
          
        if (examError) return errorResponse(`Failed to save exam: ${examError.message}`, 500);

        const { data: assistantMsg, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: "assistant",
            content: `Created a written exam on "${message}" (${examJson.format}, ${examJson.difficulty}).`,
            structured: { kind: "exam", examId: examData.id },
          })
          .select()
          .single();
        if (error) return errorResponse(error.message, 500);
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
        return NextResponse.json({ message: assistantMsg });
      }

      const questions = await generateQuizContent(supabase, effectiveSpaceId, message, n, "mixed", customPrompt, activeSourceIds);

      const { data: assistantMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: `Created a quiz — ${questions.length} questions on "${message}".`,
          structured: { kind: "quiz", mode, subject: message, questions },
        })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      return NextResponse.json({ message: assistantMsg });
    }

    return errorResponse("This conversation is not a tool conversation", 400);
  } catch (err: any) {
    console.error("TOOL CHAT ERROR:", err);
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }
}
