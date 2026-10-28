import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { sanitizePromptInput } from "@/lib/security";
import { requireSpaceWithSource } from "@/lib/supabase/require-space";
import { generateVisualizeContent } from "@/lib/generation/tool-generation";
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

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { prompt, type = "auto", spaceId, customPrompt } = body;
  if (!prompt) return errorResponse("prompt is required");

  const spaceCheck = await requireSpaceWithSource(supabase, user!.id, spaceId);
  if (!spaceCheck.ok) return spaceCheck.response;

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
  const plan = sub?.plan || "free";

  if (plan === "free" || plan === "plus") {
    const limit = plan === "free" ? planLimits.free.visualizePerMonth : planLimits.plus.visualizePerMonth;
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("visualize_outputs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= limit) {
      return errorResponse(
        plan === "free"
          ? `The Free plan includes ${limit} visualization per month. Upgrade to Plus (30/month) or Pro (Unlimited) to generate more.`
          : `You've reached your monthly limit of ${limit} visualizations on the Plus plan. Upgrade to Pro for unlimited visualizations.`,
        403
      );
    }
  }

  const input = sanitizePromptInput(prompt, 2000);
  const extraPrompt = customPrompt ? sanitizePromptInput(customPrompt, 1000) : undefined;

  let outputData: any;
  let title: string;

  try {
    let learningProfile;
    if (body.isPersonalized !== false) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("learning_profile")
        .eq("id", user!.id)
        .single();
      learningProfile = profileData?.learning_profile;
    }

    const result = await generateVisualizeContent(supabase, spaceId, input, type, extraPrompt, learningProfile);
    outputData = result.outputData;
    title = result.title;
  } catch (err: any) {
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }

  const { data, error } = await supabase
    .from("visualize_outputs")
    .insert({
      user_id: user!.id,
      space_id: spaceId,
      type: outputData.kind || type,
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

