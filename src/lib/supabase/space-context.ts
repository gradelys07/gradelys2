/** Builds grounding context (text + real files) from a space's ready sources. */

export interface SpaceContext {
  text: string;
  files: { mimeType: string; data: string }[];
  sourceCount: number;
}

async function fetchFileAsBase64(supabase: any, bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) return null;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

export async function getSpaceContext(supabase: any, spaceId: string, maxChars = 20000): Promise<SpaceContext> {
  const { data: sources } = await supabase
    .from("space_sources")
    .select("type, name, content_preview, storage_path, url")
    .eq("space_id", spaceId)
    .eq("status", "ready")
    .limit(15);

  if (!sources || sources.length === 0) return { text: "", files: [], sourceCount: 0 };

  const textParts: string[] = [];
  const files: { mimeType: string; data: string }[] = [];
  let fileCount = 0;

  for (const src of sources) {
    // Text content from content_preview
    if (src.content_preview) {
      textParts.push(`— Source "${src.name}" (${src.type}):\n${src.content_preview}`);
    } else if (src.url && (src.type === "youtube" || src.type === "url")) {
      // For YouTube/URL sources without extracted content, include the URL so the AI
      // at least knows the source exists (even though it can't read the page directly).
      textParts.push(`— Source "${src.name}" (${src.type}): ${src.url}\n(No transcript or content was extracted for this source. Work with whatever information the name and URL provide.)`);
    }

    // Binary files (PDF, images) attached as base64
    if (src.storage_path && fileCount < 5 && (src.type === "pdf" || src.type === "image")) {
      const base64 = await fetchFileAsBase64(supabase, "sources", src.storage_path);
      if (base64) {
        files.push({ mimeType: src.type === "pdf" ? "application/pdf" : "image/jpeg", data: base64 });
        textParts.push(`— Source "${src.name}" (${src.type}): [file attached below — read it directly, it is the actual source material]`);
        fileCount++;
      }
    }
  }

  return { text: textParts.join("\n\n").slice(0, maxChars), files, sourceCount: sources.length };
}

/** Legacy text-only accessor, kept for the one-shot routes. Prefer getSpaceContext. */
export async function getSpaceContextText(supabase: any, spaceId: string, maxChars = 10000): Promise<string> {
  const ctx = await getSpaceContext(supabase, spaceId, maxChars);
  return ctx.text;
}
