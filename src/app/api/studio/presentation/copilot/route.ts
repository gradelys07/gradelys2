import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { askCopilot } from "@/lib/gemini/presentation-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { prompt, document, targetSlideId, targetElementIds } = await req.json().catch(() => ({}));
  if (!prompt || !document) return errorResponse("prompt and document are required");

  try {
    const operations = await askCopilot(prompt, document, targetSlideId, targetElementIds);
    return NextResponse.json(operations);
  } catch (err: any) {
    return errorResponse(`Copilot failed: ${err.message}`, 500);
  }
}
