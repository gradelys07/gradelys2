import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { requireSpaceWithSource } from "@/lib/supabase/require-space";
import {
  generateVisualizeContent, generateStudioContent, generateQuizContent, generateFlashcardsContent, generateExamQuestions,
} from "@/lib/generation/tool-generation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { conversationId, message, spaceId, visualType, subKind, customPrompt, count } = body;
  if (!conversationId || !message || !spaceId) {
    return errorResponse("conversationId, message, and spaceId are required");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, kind, title, user_id")
    .eq("id", conversationId)
    .eq("user_id", user!.id)
    .single();
  if (!conversation) return errorResponse("Conversation not found", 404);

  const spaceCheck = await requireSpaceWithSource(supabase, user!.id, spaceId);
  if (!spaceCheck.ok) return spaceCheck.response;

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
  if (sub?.plan === "free" && (conversation.kind === "visualize" || conversation.kind === "practice")) {
    return errorResponse(
      `${conversation.kind === "visualize" ? "Visualize" : "Practice"} isn't included in the Free plan. Upgrade to Plus or Pro to unlock it.`,
      403
    );
  }
  if (sub?.plan === "free" && conversation.kind === "studio") {
    const { count: docCount } = await supabase
      .from("studio_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id);
    if ((docCount ?? 0) >= 1) {
      return errorResponse("The Free plan includes 1 Studio document. Upgrade to Plus or Pro for more.", 403);
    }
  }

  await supabase.from("messages").insert({ conversation_id: conversationId, role: "user", content: message });

  if (conversation.title === "New conversation") {
    await supabase.from("conversations").update({ title: message.slice(0, 48) }).eq("id", conversationId);
  }

  try {
    if (conversation.kind === "visualize") {
      const type = visualType || "auto";
      const { title, outputData } = await generateVisualizeContent(supabase, spaceId, message, type, customPrompt);

      const { data: visDoc, error: visError } = await supabase.from("visualize_outputs").insert({
        user_id: user!.id, space_id: spaceId, type, prompt: message, title, output_data: outputData,
      }).select().single();

      if (visError) return errorResponse(`Failed to save visualization: ${visError.message}`, 500);

      const { data: assistantMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: `Generated: ${title}`,
          structured: { kind: "visualize", visualizeId: visDoc.id, title, output: outputData },
        })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      return NextResponse.json({ message: assistantMsg });
    }

    if (conversation.kind === "studio") {
      const docType = visualType || "notes";
      const { title, content } = await generateStudioContent(supabase, spaceId, message, docType, customPrompt);

      const { data: doc } = await supabase
        .from("studio_documents")
        .insert({ user_id: user!.id, space_id: spaceId, type: docType, title, content })
        .select()
        .single();

      const { data: assistantMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content,
          structured: { kind: "studio", documentId: doc?.id, title, docType },
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
        const cards = await generateFlashcardsContent(supabase, spaceId, message, n, customPrompt);
        const { data: deck } = await supabase
          .from("flashcard_decks")
          .insert({ user_id: user!.id, space_id: spaceId, name: message.slice(0, 60), subject: message.slice(0, 60) })
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

        const examJson = await generateExamQuestions(supabase, spaceId, message, Math.min(n, 8), format, difficulty, customPrompt);
        
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .insert({
            user_id: user!.id,
            space_id: spaceId,
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

      const questions = await generateQuizContent(supabase, spaceId, message, n, "mixed", customPrompt);

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
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }
}
