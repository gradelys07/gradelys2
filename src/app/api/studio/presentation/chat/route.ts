import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContentStream } from "@/lib/gemini/client";

export const dynamic = "force-dynamic";

const SYSTEM_INSTRUCTION = `You are Gradelys Presentation Copilot, an advanced AI embedded directly inside a presentation editor.
You have FULL control over the presentation's JSON structure. You can add slides, change layouts, rewrite text, add charts, and import images.

## Current State
You will be provided with the CURRENT JSON state of the presentation.

## Your Capabilities
1. You can search the internet for up-to-date facts or images (using Google Search).
2. You can chat with the user to explain what you're doing or ask clarifying questions.
3. You can modify the presentation using partial updates to save tokens and costs, OR regenerate the entire presentation if necessary.

## How to modify the presentation
By default, you MUST use partial updates to save tokens. Do NOT regenerate the entire presentation unless the user explicitly asks to "regenerate the entire presentation", "rewrite everything", or if you need to add/remove/reorder slides.

### 1. Partial Slide Updates (DEFAULT FOR CONTENT CHANGES)
If the user asks you to modify specific slides (e.g. "change the title of this slide", "add an image to slide 2"), output a markdown block with the language \`json_slide_update\`.
This block must contain the FULL updated JSON of that specific slide (or an array of slides if modifying multiple).

Example:
Sure, I've updated the slide for you!
\`\`\`json_slide_update
{
  "id": "slide-123",
  "layout": "title-and-content",
  "elements": [ ... all elements of this slide ... ]
}
\`\`\`

### 2. Theme Updates
If you need to update the theme (colors, fonts), use \`json_theme_update\`:
\`\`\`json_theme_update
{
  "fontFamily": "Inter",
  "primaryColor": "#ff0000",
  "secondaryColor": "#666666",
  "backgroundColor": "#ffffff"
}
\`\`\`

### 3. Full Regeneration (ONLY WHEN EXPLICITLY ASKED OR ADDING/REMOVING SLIDES)
If you need to add a new slide, delete a slide, or the user explicitly asks to regenerate the whole presentation, use \`json_presentation\` to output the entire JSON.
\`\`\`json_presentation
{
  "metadata": { "title": "My Presentation" },
  "theme": { ... },
  "slides": [ ... all slides including the new/modified ones ... ]
}
\`\`\`

## Adding Images
If the user asks for images, you have two options:
1. Find real image URLs using Google Search and use them.
2. Generate AI illustrations by using the URL format: \`https://image.pollinations.ai/prompt/[detailed URL-encoded description]?nologo=true&width=1280&height=720\` (e.g. \`https://image.pollinations.ai/prompt/a%20detailed%20illustration%20of%20a%20rocket?nologo=true\`).

IMPORTANT: When adding an image element, you MUST set the image URL in the \`src\` property (NOT \`url\`).
Example: \`{"type": "image", "properties": {"src": "...", "alt": "...", "objectFit": "cover"}}\`

Always maintain the exact expected schema for the presentation JSON.`;

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { messages, presentation, activeSlideId } = await req.json().catch(() => ({}));
  if (!messages || !Array.isArray(messages)) {
    return errorResponse("messages array is required");
  }

  // Format history for Gemini
  const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Copilot'}: ${m.content}`).join("\n\n");
  
  const prompt = `--- CURRENT PRESENTATION JSON ---
${JSON.stringify(presentation, null, 2)}
---------------------------------

--- ACTIVE SLIDE ID ---
The user is currently viewing/editing the slide with ID: "${activeSlideId || "unknown"}"
If they ask you to modify "this slide", target this specific ID!
-----------------------

--- CHAT HISTORY ---
${chatHistory}
--------------------

Reply to the user's last message. If you need to make changes, include the \`\`\`json_presentation block.`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = generateContentStream(prompt, {
          systemInstruction: SYSTEM_INSTRUCTION,
          enableSearch: true,
          temperature: 0.5,
        });

        for await (const chunk of generator) {
          const data = JSON.stringify({ chunk });
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
