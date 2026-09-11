// src/lib/openai/client.ts
// ═══════════════════════════════════════════════════════════════
// OPENAI MASTER PROMPT ENGINEER
// ═══════════════════════════════════════════════════════════════

export async function enhancePromptWithOpenAI(
  userQuery: string,
  kind: string,
  sourceMaterial: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  // If the user hasn't configured the key yet, gracefully fallback to their raw prompt
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not configured. Falling back to raw prompt.");
    return userQuery;
  }

  const systemPrompt = `You are a world-class Master Prompt Engineer. 
Your singular goal is to take the user's intent and some source material, and write an ultra-precise, meticulously detailed instruction prompt that will be sent to a weaker generative AI (Gemini) to execute the final task.

The final task is to generate a "${kind}" structure.
- If kind is 'visualize': The output should be a highly creative, visually stunning chart, diagram, mermaid graph, or HTML infographic.
- If kind is 'studio': The output should be a structured JSON of presentation slides or a formal document.

INSTRUCTIONS FOR YOUR OUTPUT:
1. Do NOT generate the final content yourself! You are writing the INSTRUCTION PROMPT for another AI.
2. Be incredibly specific about layout, typography, colors, structure, and tone.
3. Extract the exact facts, numbers, and key concepts from the source material that the other AI MUST use.
4. Your output must be nothing but the ultimate, flawless prompt string. No conversational filler, no pleasantries. Just the final prompt ready to be passed to the next AI.`;

  const userMessage = `USER'S INTENT:
${userQuery}

SOURCE MATERIAL (Facts & Context):
${sourceMaterial}

Write the ultimate, detailed instruction prompt for the generator AI based on the above.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast, incredibly cheap, very smart
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI enhancement failed:", err);
      return userQuery; // Graceful fallback
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content;
    
    if (!enhancedPrompt) {
      return userQuery;
    }

    return enhancedPrompt;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return userQuery; // Graceful fallback
  }
}
