import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";
import { sanitizePromptInput } from "@/lib/security";
import { requireSpaceWithSource } from "@/lib/supabase/require-space";
import { getSpaceContextText } from "@/lib/supabase/space-context";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const spaceId = new URL(req.url).searchParams.get("spaceId");
  let query = supabase.from("visualize_outputs").select("*").eq("user_id", user!.id);
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ outputs: data });
}

const MERMAID_TYPES = ["mindmap", "flowchart", "timeline", "concept-map", "diagram", "auto"];

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { prompt, type = "auto", spaceId, customPrompt } = body;
  if (!prompt) return errorResponse("prompt is required");

  const spaceCheck = await requireSpaceWithSource(supabase, user!.id, spaceId);
  if (!spaceCheck.ok) return spaceCheck.response;

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
  if (sub?.plan === "free") {
    return errorResponse(
      "Visualize isn't included in the Free plan. Upgrade to Plus or Pro to generate diagrams and charts.",
      403
    );
  }

  const input = sanitizePromptInput(prompt, 2000);
  const spaceContext = await getSpaceContextText(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${sanitizePromptInput(customPrompt, 1000)}` : "";
  const useMermaid = MERMAID_TYPES.includes(type);

  let outputData: any;
  let title = input.slice(0, 60);

  try {
    if (useMermaid) {
      const genPrompt = `Produce a Mermaid.js diagram (type: ${type === "auto" ? "choose the best fit — flowchart, mindmap, or timeline" : type}) that visually explains: "${input}", grounded strictly in the material below.${extraInstruction}

CRITICAL MERMAID SYNTAX RULES:
- ALL node labels with parentheses, brackets, colons, commas, accented characters, or special chars MUST be wrapped in double quotes. Example: A["Label (info)"] not A[Label (info)]
- Do NOT use HTML tags in labels. Use only ASCII arrows. Max ~40 chars per label. No emoji.

MATERIAL:
${spaceContext}

Return ONLY valid Mermaid syntax, no markdown fences, no commentary. Keep it readable (max ~15 nodes).`;
      const mermaidCode = await generateContent(genPrompt, { temperature: 0.5 });
      let cleanCode = mermaidCode.replace(/```mermaid|```/g, "").trim();
      // Remove HTML tags from labels
      cleanCode = cleanCode.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
      if (cleanCode.toLowerCase().includes("usable material")) {
        throw new Error("No usable material provided by the sources. Please upload documents with relevant data to generate this diagram.");
      }
      if (!cleanCode.match(/^(graph|flowchart|mindmap|timeline|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|erDiagram|requirementDiagram|gitGraph|C4Context|quadrantChart|xychart|block-beta)/i)) {
        throw new Error("The AI failed to generate a valid diagram from the available material.");
      }
      outputData = { kind: "mermaid", code: cleanCode };
    } else {
      const genPrompt = `Given the topic "${input}" and the material below, produce chart-ready data as JSON only, shaped exactly like:
{"chartType":"bar|line|pie","title":"...","data":[{"name":"...","value":0}]}
5-8 data points grounded in the material, no commentary, no markdown fences.${extraInstruction}

MATERIAL:
${spaceContext}`;
      const raw = await generateContent(genPrompt, { jsonMode: true, temperature: 0.6 });
      const parsed = JSON.parse(raw);
      outputData = { kind: "chart", ...parsed };
      title = parsed.title || title;
    }
  } catch (err: any) {
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }

  const { data, error } = await supabase
    .from("visualize_outputs")
    .insert({
      user_id: user!.id,
      space_id: spaceId,
      type,
      prompt: input,
      title,
      description: body.description || "",
      output_data: outputData,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ output: data }, { status: 201 });
}
