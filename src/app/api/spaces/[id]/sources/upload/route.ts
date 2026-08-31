import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { validateFile } from "@/lib/security";
import { extractPdf, extractImage } from "@/lib/extraction/extract-source";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { fileName, mimeType, fileBase64 } = body;
  if (!fileName || !mimeType || !fileBase64) {
    return errorResponse("fileName, mimeType, and fileBase64 are required");
  }

  const buffer = Buffer.from(fileBase64, "base64");
  const validation = validateFile({ name: fileName, type: mimeType, size: buffer.length });
  if (!validation.valid) return errorResponse(validation.reason || "Invalid file", 400);

  const { data: space } = await supabase
    .from("spaces")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();
  if (!space) return errorResponse("Space not found", 404);

  const path = `${user!.id}/${params.id}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage.from("sources").upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) return errorResponse(uploadError.message, 500);

  const type = mimeType === "application/pdf" ? "pdf" : mimeType.startsWith("image/") ? "image" : "text";

  // Extract content from the file using Gemini
  let contentPreview: string | null = null;
  let sourceName = fileName;

  try {
    if (type === "pdf") {
      const { title, content } = await extractPdf(fileBase64);
      contentPreview = content;
      sourceName = title || fileName;
    } else if (type === "image") {
      const { title, content } = await extractImage(fileBase64, mimeType);
      contentPreview = content;
      sourceName = title || fileName;
    }
  } catch (err: any) {
    // If extraction fails, still save the source — the file itself is already uploaded
    contentPreview = `(Content extraction failed: ${err.message})`;
  }

  const { data: source, error } = await supabase
    .from("space_sources")
    .insert({
      space_id: params.id,
      type,
      name: sourceName,
      storage_path: path,
      content_preview: contentPreview,
      status: "ready",
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ source }, { status: 201 });
}
