// ═══════════════════════════════════════════════════════════════
// GEMINI CLIENT — thin REST wrapper around the Generative Language
// API. Used by all /api/* routes that need AI generation. When
// GEMINI_API_KEY is unset, callers should fall back to
// src/lib/demo/generators.ts instead of calling this module.
// ═══════════════════════════════════════════════════════════════

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiModel = "gemini-3.7-flash" | "gemini-3.1-pro-preview";

export function resolveModel(modelId?: string): GeminiModel {
  if (modelId === "pro") return "gemini-3.1-pro-preview";
  if (modelId === "flash") return "gemini-3.7-flash";
  return "gemini-3.7-flash"; // "auto" defaults to flash for cost efficiency
}

interface GenerateOptions {
  model?: GeminiModel;
  systemInstruction?: string;
  temperature?: number;
  jsonMode?: boolean;
  images?: { mimeType: string; data: string }[];
}

export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = options.model || "gemini-3.7-flash";
  const parts: any[] = [{ text: prompt }];
  if (options.images) {
    for (const img of options.images) {
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    }
  }

  const body: any = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  return text;
}

export async function* generateContentStream(
  prompt: string,
  options: GenerateOptions = {}
): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = options.model || "gemini-3.7-flash";
  const parts: any[] = [{ text: prompt }];
  if (options.images) {
    for (const img of options.images) {
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    }
  }
  const body: any = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: options.temperature ?? 0.7 },
  };
  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const res = await fetch(
    `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini stream error (${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const text = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("");
        if (text) yield text;
      } catch {
        // ignore malformed chunk
      }
    }
  }
}
