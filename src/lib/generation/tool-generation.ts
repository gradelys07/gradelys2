import { generateContent } from "@/lib/gemini/client";
import { getSpaceContext } from "@/lib/supabase/space-context";

const MERMAID_TYPES = ["mindmap", "flowchart", "timeline", "concept-map", "diagram", "auto"];

const LANGUAGE_RULE =
  "CRITICAL LANGUAGE RULE: Detect the language of the MATERIAL/source below and write your ENTIRE response in that exact same language (if the source is in French, respond in French; if Arabic, respond in Arabic; if Spanish, respond in Spanish; if English, respond in English; if mixed, use the dominant language). Never switch to a different language than the source.";

const GROUNDING_RULE =
  "CRITICAL GROUNDING RULE: Base your output strictly and specifically on the facts, terms, numbers, names, dates, and examples that literally appear in the MATERIAL below (text and/or attached files). Do NOT write generic, textbook-style filler that could apply to any topic — every item must reference something concrete found in the material. If the material only weakly covers a point, skip it rather than inventing detail. If there is no usable material at all, say so instead of fabricating content.";

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

export async function generateVisualizeContent(
  supabase: any,
  spaceId: string,
  prompt: string,
  type: string,
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${customPrompt}` : "";
  const useMermaid = MERMAID_TYPES.includes(type);
  const useHtml = type === "infographic" || type === "html";

  let outputData: any;
  let title = prompt.slice(0, 60);

  if (useHtml) {
    const genPrompt = `You are building a polished, self-contained HTML infographic/visual explainer for a student, based on the request: "${prompt}".
${GROUNDING_RULE}
${LANGUAGE_RULE}
${extraInstruction}

Return ONLY a single self-contained HTML fragment (no <html>/<head>/<body> tags, no markdown fences, no commentary) using inline <style> and semantic markup: headings, cards, colored callouts, icons made of emoji or simple SVG/CSS shapes (no external image URLs — they will not load). Use a clean modern layout with CSS flexbox/grid, rounded cards, and a light color palette (white/light-gray backgrounds, one accent color). Make it visually rich but load instantly with zero external dependencies.

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}`;
    const html = await generateContent(genPrompt, { temperature: 0.6, images: ctx.files.length ? ctx.files : undefined });
    outputData = { kind: "html", code: html.replace(/```html|```/g, "").trim() };
  } else if (useMermaid) {
    const genPrompt = `Produce a Mermaid.js diagram (type: ${type === "auto" ? "choose the best fit — flowchart, mindmap, or timeline" : type}) that visually explains: "${prompt}".
${GROUNDING_RULE} Use the actual terms, steps, and labels found in the material as node labels — not generic placeholders like "Step 1" or "Concept A".
${LANGUAGE_RULE}
${extraInstruction}

CRITICAL MERMAID SYNTAX RULES — follow these exactly or the diagram will fail to render:
- ALL node labels that contain parentheses, brackets, colons, commas, quotes, accented characters, or any special characters MUST be wrapped in double quotes. Example: A["Label (with parens)"] not A[Label (with parens)]
- For mindmap nodes, wrap multi-word labels or labels with special chars in double quotes on the same line.
- Do NOT use HTML tags or <br> in labels.
- Use only ASCII arrows: -->, --->, -.->, ---|label|
- Avoid excessively long labels (max ~40 characters per label).
- Do not use emoji or unicode symbols in node IDs or labels.

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

Return ONLY valid Mermaid syntax, no markdown fences, no commentary. Keep it readable (max ~15 nodes).`;
    const mermaidCode = await generateContent(genPrompt, { temperature: 0.4, images: ctx.files.length ? ctx.files : undefined });
    let cleanCode = mermaidCode.replace(/```mermaid|```/g, "").trim();
    // Sanitize common Mermaid issues
    cleanCode = sanitizeMermaidCode(cleanCode);
    if (cleanCode.toLowerCase().includes("usable material")) {
      throw new Error("No usable material provided by the sources. Please upload documents with relevant data to generate this diagram.");
    }
    if (!cleanCode.match(/^(graph|flowchart|mindmap|timeline|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|erDiagram|requirementDiagram|gitGraph|C4Context|quadrantChart|xychart|block-beta)/i)) {
      throw new Error("The AI failed to generate a valid diagram from the available material.");
    }
    outputData = { kind: "mermaid", code: cleanCode };
  } else {
    const genPrompt = `Given the topic "${prompt}" and the material below, produce chart-ready data as JSON only, shaped exactly like:
{"chartType":"bar|line|pie","title":"...","data":[{"name":"...","value":0}]}
${GROUNDING_RULE} Use real figures, categories, or comparisons drawn from the material — not invented placeholder numbers.
${LANGUAGE_RULE} (the "title" and "name" fields must be in that language)
5-8 data points, no commentary, no markdown fences.${extraInstruction}

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}`;
    const raw = await generateContent(genPrompt, { jsonMode: true, temperature: 0.5, images: ctx.files.length ? ctx.files : undefined });
    const parsed = JSON.parse(raw);
    outputData = { kind: "chart", ...parsed };
    title = parsed.title || title;
  }

  return { title, outputData };
}

const TYPE_INSTRUCTIONS: Record<string, string> = {
  notes: "Write structured, exam-ready study notes with headings, bullet points, and bolded key terms — pull the actual definitions, formulas, dates, and examples straight from the material.",
  report: "Write a formal, well-organized report with an introduction, body sections, and conclusion, built entirely from the material's content.",
  summary: "Write a concise, dense summary that captures every key idea and specific fact from the material, with no filler.",
  essay: "Write a well-argued essay with a clear thesis, supporting paragraphs referencing specific material, and a conclusion.",
  slides: `Write slide-by-slide content as JSON. Format EXACTLY like:
{"title":"Presentation Title", "slides":[{"title":"Slide 1 Title", "bullets":["Bullet 1","Bullet 2"]}]}`,
};

export async function generateStudioContent(
  supabase: any,
  spaceId: string,
  topic: string,
  type: string,
  customPrompt?: string
) {
  const ctx = await getSpaceContext(supabase, spaceId);
  const instruction = customPrompt || TYPE_INSTRUCTIONS[type] || TYPE_INSTRUCTIONS.notes;

  let formatInstruction = "Format the output in clean Markdown starting with a single # title.";
  if (type === "slides") {
    formatInstruction = ""; // We already requested JSON in the slides instruction
  }

  const fullPrompt = `${instruction}

Focus specifically on: ${topic}

${GROUNDING_RULE}
${LANGUAGE_RULE}

MATERIAL (this is the student's own course material — treat it as the ONLY source of truth):
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

${formatInstruction}`;

  const isJson = type === "slides";
  const raw = await generateContent(fullPrompt, { jsonMode: isJson, temperature: 0.5, images: ctx.files.length ? ctx.files : undefined });

  let content = raw;
  let docTitle = topic.slice(0, 60);

  if (isJson) {
    try {
      const parsed = JSON.parse(raw);
      docTitle = parsed.title || docTitle;
      content = JSON.stringify(parsed); // Save the stringified JSON
    } catch (e) {
      // fallback
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
  const questions = JSON.parse(raw);
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
  const cards = JSON.parse(raw);
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
  return JSON.parse(raw);
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
  const exam = JSON.parse(raw);
  if (typeof exam !== "object" || !exam.exercises) throw new Error("Invalid response shape");
  return exam as any;
}
