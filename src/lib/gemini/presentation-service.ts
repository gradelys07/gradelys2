import { generateContent } from "./client";
import { PresentationDocument, Slide, PresentationElement } from "@/components/studio/presentation/types";
import { nanoid } from "nanoid";

export type GenerationProgress = 
  | "Analyzing topic..."
  | "Planning presentation..."
  | "Creating visual structure..."
  | "Generating content..."
  | "Finalizing presentation...";

export interface GenerationEvent {
  status: GenerationProgress;
  document?: PresentationDocument;
}

export async function* generatePresentationStream(topic: string, context?: string): AsyncGenerator<GenerationEvent> {
  yield { status: "Analyzing topic..." };
  
  // Phase 1: Planner
  yield { status: "Planning presentation..." };
  const plannerPrompt = `
    You are an expert presentation planner. Create a high-level outline for a presentation about: "${topic}".
    Context: ${context || "None"}
    Respond in JSON format with an array of slides, each having a "title" and a "layoutType" (hero, twoColumn, chartFocus, tableFocus, statement).
  `;
  
  let outline;
  try {
    const outlineText = await generateContent(plannerPrompt, { jsonMode: true, temperature: 0.7, model: "gemini-3.1-pro-preview" });
    outline = JSON.parse(outlineText);
  } catch (e) {
    throw new Error("Failed to plan presentation outline. Please try again.");
  }

  yield { status: "Creating visual structure..." };
  
  // Phase 2: Designer & Content
  yield { status: "Generating content..." };
  
  const designerPrompt = `
    You are an expert presentation designer. Create the full JSON structure for the presentation based on this outline:
    ${JSON.stringify(outline)}
    
    The output must strictly follow this JSON schema for a PresentationDocument:
    {
      "version": 1,
      "metadata": { "title": "string", "createdAt": "ISO date", "updatedAt": "ISO date" },
      "theme": { "primaryColor": "#hex", "secondaryColor": "#hex", "accentColor": "#hex", "backgroundColor": "#hex", "surfaceColor": "#hex", "textColor": "#hex", "mutedTextColor": "#hex", "headingFont": "string", "bodyFont": "string" },
      "slides": [
        {
          "id": "unique-id",
          "layout": "string",
          "background": { "type": "solid", "value": "#hex" },
          "elements": [
            {
              "id": "unique-id",
              "type": "text|shape|chart|table|image",
              "x": 0, "y": 0, "width": 100, "height": 100, "rotation": 0, "zIndex": 1,
              "properties": { ... } // Depending on type
            }
          ]
        }
      ]
    }
    
    Rules for elements:
    - Canvas is 1280x720. Position elements logically (e.g. title at y: 60, content at y: 200).
    - Use "text" for titles, subtitles, bullet points.
    - Use "chart" for data. Properties must include "chartType" (bar, line, pie), "labels" (array of strings), "datasets" (array of { label, values }).
    - Use "table" for comparisons. Properties must include "columns", "rows", "data" (array of arrays of { value, isHeader, align }).
    - Use "shape" for decorative elements.
    - Use "image" for photos. IMPORTANT: For the "url" property of images, generate a URL using the Pollinations AI format: "https://image.pollinations.ai/prompt/{detailed_url_encoded_description}?width=800&height=600&nologo=true". Example: "https://image.pollinations.ai/prompt/a%20modern%20hospital%20room%20with%20medical%20equipment?width=800&height=600&nologo=true".
    - Ensure visually diverse layouts.
  `;

  let fullPresentation: PresentationDocument;
  try {
    const jsonText = await generateContent(designerPrompt, { jsonMode: true, temperature: 0.7, model: "gemini-3.1-pro-preview" });
    fullPresentation = JSON.parse(jsonText) as PresentationDocument;
    
    // Ensure all elements have unique IDs and basic defaults if AI missed them
    fullPresentation.slides.forEach(slide => {
      if (!slide.id) slide.id = nanoid();
      slide.elements.forEach(el => {
        if (!el.id) el.id = nanoid();
      });
    });

  } catch (e) {
    throw new Error("Failed to generate presentation content. Please try again.");
  }

  yield { status: "Finalizing presentation...", document: fullPresentation };
}

export async function askCopilot(prompt: string, document: PresentationDocument, targetSlideId?: string, targetElementIds?: string[]) {
  const copilotPrompt = `
    You are an AI Presentation Copilot. The user asks: "${prompt}"
    
    Current Document State (simplified):
    ${JSON.stringify({
      targetSlide: targetSlideId ? document.slides.find(s => s.id === targetSlideId) : null,
      targetElements: targetElementIds?.length ? document.slides.flatMap(s => s.elements).filter(e => targetElementIds.includes(e.id)) : null
    })}
    
    Respond in strict JSON with an array of operations:
    {
      "operations": [
        {
          "action": "update_element" | "add_element" | "delete_element" | "change_layout",
          "targetId": "element-id or slide-id",
          "changes": { ...properties to merge... }
        }
      ]
    }
  `;

  try {
    const res = await generateContent(copilotPrompt, { jsonMode: true, temperature: 0.4, model: "gemini-3.1-pro-preview" });
    return JSON.parse(res);
  } catch(e) {
    throw new Error("Copilot failed to process request.");
  }
}
