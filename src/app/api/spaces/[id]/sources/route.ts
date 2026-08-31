import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { extractYouTube, extractUrl } from "@/lib/extraction/extract-source";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("space_sources")
    .select("*")
    .eq("space_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ sources: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  if (!body.type || !body.name) return errorResponse("type and name are required");

  let contentPreview = body.contentPreview || "";
  let sourceName = body.name;

  try {
    // YouTube → Gemini extracts video content directly
    if (body.type === "youtube" && body.url) {
      const { title, content } = await extractYouTube(body.url);
      contentPreview = content;
      if (!body.name || body.name === body.url || body.name.length < 5) {
        sourceName = title;
      }
    }

    // URL (website) → fetch page + Gemini extracts structured content
    if (body.type === "url" && body.url && !contentPreview) {
      const { title, content } = await extractUrl(body.url);
      contentPreview = content;
      if (!body.name || body.name === body.url || body.name.length < 5) {
        sourceName = title;
      }
    }
  } catch (err: any) {
    // If extraction fails, still save the source with whatever we have
    contentPreview = contentPreview || `(Extraction failed: ${err.message})`;
  }

  const { data, error } = await supabase
    .from("space_sources")
    .insert({
      space_id: params.id,
      type: body.type,
      name: sourceName,
      url: body.url,
      content_preview: contentPreview,
      status: "ready",
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ source: data }, { status: 201 });
}
