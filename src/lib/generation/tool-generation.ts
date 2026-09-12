import { generateContent, generateImage } from "@/lib/gemini/client";
import { getSpaceContext } from "@/lib/supabase/space-context";
import { enhancePromptWithOpenAI } from "@/lib/openai/client";

const MERMAID_TYPES = ["mindmap", "flowchart", "timeline", "concept-map", "diagram", "auto"];

const LANGUAGE_RULE =
  "CRITICAL LANGUAGE RULE: Detect the language of the MATERIAL/source below and write your ENTIRE response in that exact same language (if the source is in French, respond in French; if Arabic, respond in Arabic; if Spanish, respond in Spanish; if English, respond in English; if mixed, use the dominant language). Never switch to a different language than the source.";

const GROUNDING_RULE =
  "CRITICAL GROUNDING RULE: Base your output strictly and specifically on the facts, terms, numbers, names, dates, and examples that literally appear in the MATERIAL below (text and/or attached files). Do NOT write generic, textbook-style filler that could apply to any topic — every item must reference something concrete found in the material. If the material only weakly covers a point, skip it rather than inventing detail. If there is no usable material at all, say so instead of fabricating content.";

/** Parse JSON output from the AI safely by stripping markdown blocks */
function parseCleanJson(raw: string) {
  const clean = raw.replace(/```(?:json)?\n?/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean);
}

/** Sanitize common Mermaid syntax issues that cause parse errors. */
function sanitizeMermaidCode(code: string): string {
  // Remove HTML tags like <br>, <b>, etc.
  let cleaned = code.replace(/<\/?[a-zA-Z][^>]*>/g, " ");

  // For flowchart/graph: auto-quote unquoted node labels with special characters
  // Matches patterns like A[Label with (parens)] and wraps the label in quotes
  cleaned = cleaned.replace(
    /(\w+)\[([^\]"]+)\]/g,
    (_match, nodeId, label) => {
      // If label has special chars and isn't already quoted, quote it
      if (/[(),:;'"àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/.test(label)) {
        return `${nodeId}["${label.replace(/"/g, "'")}"]`;
      }
      return `${nodeId}[${label}]`;
    }
  );

  // Same for round brackets A(Label)
  cleaned = cleaned.replace(
    /(\w+)\(([^)"]+)\)/g,
    (_match, nodeId, label) => {
      if (/[[\],:;'"àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ()]/.test(label)) {
        return `${nodeId}("${label.replace(/"/g, "'")}")`;
      }
      return `${nodeId}(${label})`;
    }
  );

  return cleaned;
}

const IMAGE_TYPES = ["image", "ai-image"];

export async function generateVisualizeContent(
  supabase: any,
  spaceId: string,
  prompt: string,
  type: string,
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${customPrompt}` : "";
  let finalType = type;

  // ── AUTO SELECTION ──────────────────────────────────────────────
  if (type === "auto") {
    const autoPrompt = `You are a visual medium selector. A student wants a visualization for: "${prompt}".
Based on the material and request, select the BEST medium. 
- "image": Best for realistic scenes, metaphors, or artistic representations.
- "mermaid": Best for flowcharts, mindmaps, timelines, architecture, or process steps.
- "chart": Best for numerical data, statistics, or direct comparisons.
- "infographic": Best for rich HTML summaries with cards, icons, and structured text.

MATERIAL:
${ctx.text ? ctx.text.slice(0, 3000) : "(no text)"}

Return ONLY a JSON object: {"bestType": "image" | "mermaid" | "chart" | "infographic"}`;

    const raw = await generateContent(autoPrompt, { jsonMode: true, temperature: 0.2, images: ctx.files.length ? ctx.files : undefined });
    try {
      const parsed = parseCleanJson(raw);
      if (["image", "mermaid", "chart", "infographic"].includes(parsed.bestType)) {
        finalType = parsed.bestType;
      }
    } catch (e) {
      finalType = "mermaid"; // fallback
    }
  }

  const useMermaid = MERMAID_TYPES.includes(finalType) && finalType !== "auto";
  const useHtml = finalType === "infographic" || finalType === "html";
  const useImage = IMAGE_TYPES.includes(finalType);

  // ── OPENAI MASTER PROMPT ENGINEER ───────────────────────────────
  // Enhance the user's original prompt with gpt-4o-mini for maximum detail
  const enhancedPromptText = await enhancePromptWithOpenAI(
    prompt,
    finalType,
    ctx.text ? ctx.text.slice(0, 6000) : ""
  );

  let outputData: any;
  let title = prompt.slice(0, 60);

  if (useImage) {
    const promptGenPrompt = `${enhancedPromptText}\n\nTECHNICAL REQUIREMENT: Return ONLY JSON (no fences): {"imagePrompt": "extremely detailed prompt...", "style": "chosen style", "title": "Short title", "overlayTexts": [{"text": "Label or annotation", "position": "top-left|top-right|bottom-left|bottom-right|center", "size": "large|medium|small"}]}`;

    const raw = await generateContent(promptGenPrompt, {
      jsonMode: true,
      temperature: 0.6,
      images: ctx.files.length ? ctx.files : undefined,
    });

    let parsed: { imagePrompt: string; style: string; title: string; overlayTexts?: { text: string; position: string; size: string }[] };
    try {
      parsed = parseCleanJson(raw);
    } catch {
      throw new Error("Failed to generate an optimized image prompt from the material.");
    }
    if (!parsed.imagePrompt || !parsed.title) {
      throw new Error("The AI could not produce a valid image prompt from the available material.");
    }

    // Step 2: Generate image with Gemini 3.1 Flash Image (Cheap and Powerful)
    const fullImagePrompt = `${parsed.imagePrompt}, ${parsed.style}, ultra high quality, sharp details, professional, 8K`;
    const { base64, mimeType } = await generateImage(fullImagePrompt);

    // Step 3: Create HTML overlay with the image as base + text annotations from Gemini
    const overlays = parsed.overlayTexts || [];
    const positionMap: Record<string, string> = {
      "top-left": "top:20px;left:20px;",
      "top-right": "top:20px;right:20px;",
      "bottom-left": "bottom:20px;left:20px;",
      "bottom-right": "bottom:20px;right:20px;",
      "center": "top:50%;left:50%;transform:translate(-50%,-50%);",
    };
    const sizeMap: Record<string, string> = {
      large: "font-size:28px;font-weight:800;",
      medium: "font-size:18px;font-weight:600;",
      small: "font-size:14px;font-weight:500;",
    };

    const overlayHtml = overlays.map((o) => {
      const pos = positionMap[o.position] || positionMap["bottom-left"];
      const size = sizeMap[o.size] || sizeMap["medium"];
      return `<div style="position:absolute;${pos}${size}color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.7);max-width:60%;line-height:1.3;padding:8px 14px;background:rgba(0,0,0,0.35);border-radius:8px;backdrop-filter:blur(4px);">${o.text}</div>`;
    }).join("\n      ");

    const code = `<div style="position:relative;width:100%;font-family:-apple-system,Inter,Segoe UI,sans-serif;">
      <img src="__IMAGE_SRC__" style="width:100%;display:block;border-radius:8px;" alt="${parsed.title}" />
      ${overlayHtml}
    </div>`;

    title = parsed.title;
    outputData = {
      kind: "image",
      imageBase64: base64,
      mimeType,
      code,
      promptUsed: parsed.imagePrompt,
      style: parsed.style,
    };
  } else if (useHtml) {
    const genPrompt = `${enhancedPromptText}\n\nTECHNICAL REQUIREMENT: Return ONLY a single self-contained HTML fragment (no <html>/<head>/<body> tags, no markdown fences). Use inline <style>.`;
    const html = await generateContent(genPrompt, { temperature: 0.6, images: ctx.files.length ? ctx.files : undefined });
    outputData = { kind: "html", code: html.replace(/```html|```/g, "").trim() };
  } else if (useMermaid) {
    const genPrompt = `${enhancedPromptText}\n\nTECHNICAL REQUIREMENT: Return ONLY valid Mermaid.js syntax, no markdown fences. For labels with special chars, wrap them in double quotes.`;
    const mermaidCode = await generateContent(genPrompt, { temperature: 0.4, images: ctx.files.length ? ctx.files : undefined });
    let cleanCode = mermaidCode.replace(/```mermaid|```/g, "").trim();
    cleanCode = sanitizeMermaidCode(cleanCode);
    if (!cleanCode.match(/^(graph|flowchart|mindmap|timeline|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|erDiagram|requirementDiagram|gitGraph|C4Context|quadrantChart|xychart|block-beta)/i)) {
      throw new Error("The AI failed to generate a valid diagram from the available material.");
    }
    outputData = { kind: "mermaid", code: cleanCode };
  } else {
    const genPrompt = `${enhancedPromptText}\n\nTECHNICAL REQUIREMENT: Return ONLY JSON shaped exactly like: {"chartType":"bar|line|pie","title":"...","data":[{"name":"...","value":0}]}. No markdown fences.`;
    const raw = await generateContent(genPrompt, { jsonMode: true, temperature: 0.5, images: ctx.files.length ? ctx.files : undefined });
    const parsed = parseCleanJson(raw);
    outputData = { kind: "chart", ...parsed };
    title = parsed.title || title;
  }

  return { title, outputData };
}


export async function generateStudioContent(
  supabase: any,
  spaceId: string,
  topic: string,
  type: string,
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);

  // ── OPENAI MASTER PROMPT ENGINEER ───────────────────────────────
  const enhancedTopic = await enhancePromptWithOpenAI(
    topic,
    type,
    ctx.text ? ctx.text.slice(0, 6000) : ""
  );

  let fullPrompt = enhancedTopic;
  
  if (type === "slides") {
    fullPrompt += `\n\nTECHNICAL REQUIREMENT: Return EXACTLY this JSON format (no markdown fences):\n{"title":"Presentation Title","slides":[{"html":"<div style='width:100%;height:100%;...'>...</div>","title":"Slide Title","keyPoints":["Point 1","Point 2"]}]}`;
  }

  const isJson = type === "slides";
  const raw = await generateContent(fullPrompt, { jsonMode: isJson, temperature: isJson ? 0.7 : 0.5, images: ctx.files.length ? ctx.files : undefined });

  let content = raw;
  let docTitle = topic.slice(0, 60);

  if (isJson) {
    try {
      const parsed = parseCleanJson(raw);
      docTitle = parsed.title || docTitle;
      content = JSON.stringify(parsed); // Save the stringified JSON
    } catch (e) {
      // fallback
      content = raw.replace(/```(?:json)?\n?/gi, "").replace(/```/g, "").trim();
    }
  } else {
    const titleLine = content.split("\\n").find((l) => l.startsWith("# "));
    if (titleLine) docTitle = titleLine.replace(/^#\\s*/, "");
  }

  return { title: docTitle, content };
}

export async function generateQuizContent(
  supabase: any,
  spaceId: string,
  subject: string,
  count: number,
  difficulty: string,
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${customPrompt}` : "";

  const prompt = `Create exactly ${count} multiple-choice questions (${difficulty} difficulty) about: ${subject}

${GROUNDING_RULE} Every question must test a specific fact, definition, formula, date, or detail that is literally present in the material — never a generic question that could be answered without having read it. The wrong answer options must be plausible distractors related to the same material (e.g. a nearby date, a similar term, a common mix-up), not random unrelated text.
${LANGUAGE_RULE} (questions, options, and explanations must all be in that language)
${extraInstruction}

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

Return ONLY a JSON array of objects shaped exactly like:
[{"id":"q1","question":"...","type":"mcq","options":["...","...","...","..."],"correct":"<must match one option exactly>","explanation":"<cite the specific fact from the material that makes this correct>","difficulty":"easy|medium|hard"}]
No markdown fences, no commentary — JSON only.`;

  const raw = await generateContent(prompt, { jsonMode: true, temperature: 0.6, images: ctx.files.length ? ctx.files : undefined });
  const questions = parseCleanJson(raw);
  if (!Array.isArray(questions)) throw new Error("Invalid response shape");
  return questions;
}

export async function generateFlashcardsContent(
  supabase: any,
  spaceId: string,
  topic: string,
  count: number,
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${customPrompt}` : "";

  const prompt = `Generate exactly ${count} high-quality flashcards (question + answer pairs) about "${topic}" for a student.

${GROUNDING_RULE} Each question must ask about one specific fact, term, formula, date, or concept that is literally present in the material. Each answer must be short, precise, and match what the material actually says — not a generic textbook definition.
${LANGUAGE_RULE}
${extraInstruction}

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

Return ONLY a JSON array like [{"question": "...", "answer": "..."}]. No markdown, no commentary.`;

  const raw = await generateContent(prompt, { jsonMode: true, temperature: 0.5, images: ctx.files.length ? ctx.files : undefined });
  const cards = parseCleanJson(raw);
  if (!Array.isArray(cards)) throw new Error("Invalid response shape");
  return cards as { question: string; answer: string }[];
}

/** Grades a free-response written exam answer sheet against the space's material, out of 20 (French grading scale). */
export async function gradeExamContent(
  supabase: any,
  spaceId: string,
  examQuestions: string,
  studentAnswers: string,
  images?: { mimeType: string; data: string }[]
) {
  const ctx = await getSpaceContext(supabase, spaceId);

  const prompt = `You are grading a student's written exam. Below are the exam questions you set, the material they were based on, and the student's full written answer sheet.

${LANGUAGE_RULE}

Grade rigorously but fairly out of 20 (French grading scale), the way a real teacher would: award partial credit for partially correct answers, and be specific about what was missing or wrong. Ground every judgment in the MATERIAL — an answer is only "correct" if it matches what the material says.

EXAM QUESTIONS:
${examQuestions}

MATERIAL (source of truth):
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

STUDENT'S WRITTEN ANSWERS:
${studentAnswers}

Return ONLY JSON shaped exactly like:
{"totalScore": 0, "maxScore": 20, "perQuestion": [{"question": "...", "score": 0, "maxScore": 0, "feedback": "..."}], "overallFeedback": "..."}
No markdown fences, no commentary — JSON only.`;

  const promptImages = images && images.length > 0 ? images : (ctx.files.length ? ctx.files : undefined);

  const raw = await generateContent(prompt, { jsonMode: true, temperature: 0.3, images: promptImages });
  return parseCleanJson(raw);
}

/** Writes a set of open-ended written exam questions (no options) grounded in the space's material. */
export async function generateExamQuestions(
  supabase: any,
  spaceId: string,
  subject: string,
  count: number,
  format: string = "Standard",
  difficulty: string = "Normal",
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${customPrompt}` : "";

  const prompt = `Write a real school-style written exam about: ${subject}

${GROUNDING_RULE}
${LANGUAGE_RULE}

FORMAT AND CONTEXT:
Education System / Format: ${format}
Difficulty: ${difficulty}
Approximate length: ${count} major questions/exercises.

The exam must look like a real subject paper from this education system, with an official-looking header, instructions, a visible grading scale (total points), and structured exercises/sections. Adapt the tone, question types, and structure to fit the requested format and difficulty.

${extraInstruction}

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

Return ONLY a JSON object shaped exactly like this (do not use markdown blocks):
{
  "subject": "Name of the subject (e.g. Mathematics, History)",
  "format": "${format}",
  "difficulty": "${difficulty}",
  "duration": "Estimated time (e.g. 2h)",
  "totalPoints": 20,
  "instructions": "General instructions for the student (e.g. Answer on a separate sheet...)",
  "exercises": [
    {
      "id": "ex1",
      "title": "Exercise 1 — Title",
      "points": 5,
      "instructions": "Specific instructions for this exercise (optional)",
      "questions": [
        { "id": "q1", "text": "Question text...", "points": 2 },
        { "id": "q2", "text": "Question text...", "points": 3 }
      ]
    }
  ]
}

No markdown fences, no commentary — JSON only.`;

  const raw = await generateContent(prompt, { jsonMode: true, temperature: 0.5, images: ctx.files.length ? ctx.files : undefined });
  const exam = parseCleanJson(raw);
  if (typeof exam !== "object" || !exam.exercises) throw new Error("Invalid response shape");
  return exam as any;
}
