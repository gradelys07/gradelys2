import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { prompt, conversationHistory = [] } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return errorResponse("OPENAI_API_KEY not configured", 500);

    const systemPrompt = `You are the Gradelys Studio Orchestrator. 
Your job is to understand the user's intent to create educational content and route them to the correct tool.

Gradelys has 3 main tools:
1. practice: for testing knowledge. SubKinds: "exam", "quiz", "flashcards".
2. visualize: for visual aids. VisualTypes: "mindmap", "diagram", "chart", "comparison", "infographic", "timeline".
3. studio: for documents. VisualTypes: "notes", "summary", "essay", "slides", "report".

Analyze the user's request. 
If the request is clear, return a JSON object with:
{
  "action": "route",
  "kind": "<practice|visualize|studio>",
  "subKind": "<subKind if practice, else null>",
  "visualType": "<visualType if visualize or studio, else null>",
  "refinedPrompt": "Cleaned up prompt for the generator"
}

If the request is ambiguous (e.g., 'help me study biology' without specifying how), or you want to propose a format, return a JSON object with:
{
  "action": "ask",
  "message": "Your short question asking for clarification or suggesting formats."
}
IMPORTANT: Only ask questions if absolutely necessary. If the user asks for 'un examen', that's practice -> exam. If they ask for 'des exercices', that's practice -> quiz. Be smart, confident, and default to routing when possible.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: prompt }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error("OpenAI API failed");
    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    // fallback
    return NextResponse.json({
      action: "route",
      kind: "studio",
      subKind: null,
      visualType: null,
      refinedPrompt: "generate content"
    });
  }
}
