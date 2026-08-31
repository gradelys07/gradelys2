/**
 * Source content extraction — uses Gemini to extract text + title from any source type.
 * YouTube: Gemini fileData (native video understanding)
 * URL:     fetch HTML → strip to text → Gemini summarize
 * PDF:     Gemini inline_data (native PDF reading)
 * Image:   Gemini inline_data (native vision)
 *
 * No extra npm dependencies — only Gemini API + built-in fetch.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent";

const EXTRACTION_PROMPT = `Extract ALL the educational content from this source as detailed, structured text that a student can study from. Include:
- A clear, descriptive title for this content (first line, prefixed with "TITLE: ")
- Every key concept, definition, formula, date, name, and example mentioned
- Preserve the original language (if French, write in French; if English, write in English, etc.)
- Organize with headings and bullet points where appropriate
- Be exhaustive — do not skip or summarize loosely, capture the full substance

Format:
TITLE: [descriptive title]

[full extracted content below]`;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

/** Parse TITLE: line from Gemini response */
function parseResult(raw: string, fallbackTitle: string): { title: string; content: string } {
  let title = fallbackTitle;
  let content = raw;
  const match = raw.match(/^TITLE:\s*(.+)/m);
  if (match) {
    title = match[1].trim();
    content = raw.slice(raw.indexOf("\n", raw.indexOf(match[0])) + 1).trim();
  }
  return { title, content };
}

async function callGemini(parts: any[]): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini extraction failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
}

// ── YouTube ──────────────────────────────────────────────────────
export async function extractYouTube(youtubeUrl: string): Promise<{ title: string; content: string }> {
  const raw = await callGemini([
    { fileData: { fileUri: youtubeUrl, mimeType: "video/mp4" } },
    { text: EXTRACTION_PROMPT },
  ]);
  return parseResult(raw, "YouTube video");
}

// ── URL (website) ────────────────────────────────────────────────
export async function extractUrl(pageUrl: string): Promise<{ title: string; content: string }> {
  // Fetch page HTML, strip to text, send to Gemini for structured extraction
  let pageText = "";
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "Gradelys/2.0 (educational content extractor)", Accept: "text/html,text/plain" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Strip HTML tags to get raw text — lightweight, no dependency
    pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 30000); // Cap to avoid huge pages
  } catch (err: any) {
    throw new Error(`Could not fetch URL: ${err.message}`);
  }

  if (!pageText || pageText.length < 50) {
    throw new Error("Page returned too little content to extract.");
  }

  const raw = await callGemini([
    { text: `${EXTRACTION_PROMPT}\n\nSOURCE URL: ${pageUrl}\n\nPAGE CONTENT:\n${pageText}` },
  ]);
  return parseResult(raw, pageUrl);
}

// ── PDF (base64) ─────────────────────────────────────────────────
export async function extractPdf(base64Data: string): Promise<{ title: string; content: string }> {
  const raw = await callGemini([
    { inline_data: { mime_type: "application/pdf", data: base64Data } },
    { text: EXTRACTION_PROMPT },
  ]);
  return parseResult(raw, "PDF document");
}

// ── Image (base64) ───────────────────────────────────────────────
export async function extractImage(base64Data: string, mimeType: string): Promise<{ title: string; content: string }> {
  const raw = await callGemini([
    { inline_data: { mime_type: mimeType, data: base64Data } },
    { text: EXTRACTION_PROMPT },
  ]);
  return parseResult(raw, "Image");
}
