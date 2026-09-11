import { generateContent, generateImage } from "@/lib/gemini/client";
import { getSpaceContext } from "@/lib/supabase/space-context";

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

  let outputData: any;
  let title = prompt.slice(0, 60);

  if (useImage) {
    // ── AI IMAGE GENERATION (Imagen 3 + Gemini text overlay) ──────────
    // Step 1: Gemini creates a super detailed image prompt from the sources
    const promptGenPrompt = `You are an expert image prompt engineer. A student has uploaded course material and wants a HIGH QUALITY visual image generated from it.

YOUR TASK:
1. Read the MATERIAL below VERY carefully — extract every key concept, term, process, and visual element.
2. Read the student's request: "${prompt}"
3. Write an EXTREMELY detailed image generation prompt in English (150-200 words). Include:
   - The exact scene/composition to depict
   - Specific objects, elements, labels referencing the material
   - Colors, lighting, perspective
   - Visual style (the one that best fits this educational content)
4. Also decide the best visual style. Choose ONE: "photorealistic photograph", "detailed educational illustration", "scientific diagram with labels", "3D rendered visualization", "watercolor painting", "digital art", "technical blueprint".
5. Write a short title for this visualization.

${extraInstruction}

MATERIAL (source of truth — base EVERYTHING on THIS):
${ctx.text || "(no text extracted — read the attached file(s) directly)"}

Return ONLY JSON (no fences): {"imagePrompt": "extremely detailed prompt...", "style": "chosen style", "title": "Short title", "overlayTexts": [{"text": "Label or annotation", "position": "top-left|top-right|bottom-left|bottom-right|center", "size": "large|medium|small"}]}`;

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
    // ── HTML INFOGRAPHIC ──────────────────────────────────────────────
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
    // ── MERMAID DIAGRAMS ──────────────────────────────────────────────
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
    cleanCode = sanitizeMermaidCode(cleanCode);
    if (cleanCode.toLowerCase().includes("usable material")) {
      throw new Error("No usable material provided by the sources. Please upload documents with relevant data to generate this diagram.");
    }
    if (!cleanCode.match(/^(graph|flowchart|mindmap|timeline|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|erDiagram|requirementDiagram|gitGraph|C4Context|quadrantChart|xychart|block-beta)/i)) {
      throw new Error("The AI failed to generate a valid diagram from the available material.");
    }
    outputData = { kind: "mermaid", code: cleanCode };
  } else {
    // ── CHARTS ────────────────────────────────────────────────────────
    const genPrompt = `Given the topic "${prompt}" and the material below, produce chart-ready data as JSON only, shaped exactly like:
{"chartType":"bar|line|pie","title":"...","data":[{"name":"...","value":0}]}
${GROUNDING_RULE} Use real figures, categories, or comparisons drawn from the material — not invented placeholder numbers.
${LANGUAGE_RULE} (the "title" and "name" fields must be in that language)
5-8 data points, no commentary, no markdown fences.${extraInstruction}

MATERIAL:
${ctx.text || "(no text extracted — read the attached file(s) directly)"}`;
    const raw = await generateContent(genPrompt, { jsonMode: true, temperature: 0.5, images: ctx.files.length ? ctx.files : undefined });
    const parsed = parseCleanJson(raw);
    outputData = { kind: "chart", ...parsed };
    title = parsed.title || title;
  }

  return { title, outputData };
}


const TYPE_INSTRUCTIONS: Record<string, string> = {
  notes: "Write highly structured, comprehensive, university-level study notes. Use a clear hierarchy of headings (H1, H2, H3). Bold all key terms and provide precise definitions. Include bulleted lists for enumerations, and highlight critical formulas, dates, and examples pulled directly from the material. The output must look like a premium, professionally formatted cheat sheet.",
  report: "Write a highly professional, meticulously organized formal report. It MUST include an Executive Summary, a clear Introduction, deeply detailed Body Sections with logical subheadings, and a strong Conclusion. Use a formal, objective, and analytical tone suitable for a corporate or academic setting. Support every claim with specific data, quotes, and facts from the material.",
  summary: "Write an ultra-dense, comprehensive, and highly professional executive summary. Capture every critical idea, specific fact, and nuance from the material without any fluff or generic filler. Synthesize the information elegantly, using bullet points for key takeaways where appropriate, ensuring a high-level academic or professional standard.",
  essay: "Write a masterfully crafted, university-level essay. It MUST feature a compelling and clear thesis statement in the introduction, highly structured body paragraphs with seamless transitions and rigorous argumentation, and a profound conclusion. The tone must be scholarly, objective, and deeply analytical. Every argument must be substantiated by specific evidence from the material.",
  slides: `You are generating a complete slide deck in structured JSON.
CRITICAL LANGUAGE RULE: Write all slide content in the language of the provided material.
${GROUNDING_RULE}

RULES:
- Create 6-10 slides. Each slide MUST be a UNIQUE visual design — different layout, different color scheme, different arrangement.
- Each slide's "html" field is a SELF-CONTAINED HTML snippet that will be rendered inside a 960x540px container (16:9 ratio).
- Use ONLY inline styles. No external CSS, no external fonts.
- Make it look like a premium Canva/Pitch template.

BACKGROUND IMAGE INTEGRATION (CRITICAL):
- You MUST use Pollinations to generate a gorgeous background image for at least 3-4 of the slides.
- Do NOT let Pollinations write any text on the images! You must add the word "no_text_no_letters_blank_background" in the prompt.
- Syntax for the image URL: https://image.pollinations.ai/prompt/{URL_ENCODED_DETAILED_PROMPT_WITHOUT_TEXT}?width=960&height=540&nologo=true
- Place this image as the background-image in the slide's main div: <div style="background-image: url('...'); background-size: cover; position: relative;">
- Add a dark or colored overlay using an inner div or background-color with rgba so the text (which you add in HTML) remains highly readable!
- Example: <div style="width:100%; height:100%; background: url('https://image.pollinations.ai/prompt/abstract_blue_gradient_background_no_text?width=960&height=540&nologo=true'); background-size: cover;"><div style="background: rgba(0,0,0,0.6); width: 100%; height: 100%; padding: 40px; color: white;">...your html text here...</div></div>

VISUAL ELEMENTS TO USE (mix and match for uniqueness):
- CSS gradients (linear-gradient, radial-gradient) for backgrounds when not using pollinations images.
- Flexbox and CSS Grid for layouts.
- Different layout types per slide: split (left/right), grid cards, centered hero, timeline vertical, stats row, comparison columns, quote highlight.
- Typography: use font-weight, font-size, letter-spacing, text-transform for hierarchy. Titles should be large and bold. Details should be smaller and lighter.

SLIDE TYPES TO INCLUDE (vary the layouts):
1. TITLE slide: Large centered title, subtitle, awesome pollinations background image.
2. OVERVIEW slide: 3-4 cards in a grid showing key themes.
3. CONTENT slides: Mix of split layouts (text + visual), card grids, timeline, numbered lists.
4. STATS slide: Big numbers with labels in a row.
5. CONCLUSION slide: Key takeaways with a strong visual close.

ALSO provide "title" and "keyPoints" (array of strings) for each slide for PPTX export.

Return EXACTLY this JSON format (no markdown fences):
{"title":"Presentation Title","slides":[{"html":"<div style='width:100%;height:100%;...'>...</div>","title":"Slide Title","keyPoints":["Point 1","Point 2"]}]}`,
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

  let formatInstruction = `Format the output in clean, highly visual Markdown:
- Start with a single # title.
- CRITICAL: You MUST include at least one relevant, highly professional header image right after the title, and 1-2 inline images if the document is long. 
  Generate the image using this exact markdown syntax: ![Description](https://image.pollinations.ai/prompt/{URL_ENCODED_DETAILED_PROMPT}?width=1200&height=600&nologo=true)
  (Replace {URL_ENCODED_DETAILED_PROMPT} with a detailed, url-encoded english description of the image you want, e.g., "A_professional_corporate_report_on_a_desk_with_graphs").
- Use blockquotes (\`> \`) extensively for key insights, definitions, or critical takeaways so they render as premium callouts.
- Include external links if referencing common concepts.`;
  
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
