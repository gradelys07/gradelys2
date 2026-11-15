import {
  validateDrawCommands,
  type AssistantRequestPayload,
  type AssistantSSEEvent,
} from "./schemas";

const RICH_MEDIA_CAPABILITY_PROMPT = `Contenu mathématique, graphiques et médias interactifs (TRÈS IMPORTANT) :
1. **Formules mathématiques (KaTeX)** :
   - Écris toujours les formules avec des délimiteurs \`$...$\` (en ligne, ex. \`$x = 0$\`, \`$\\lim_{x \\to 0^+} f(x) = +\\infty$\`) ou \`$$...$$\` sur une ligne séparée pour une formule centrée. N'utilise jamais de délimiteurs \`\\(...\\)\` ou \`\\[...\\]\` ni de formules sans \`$\`.
2. **Graphiques interactifs et schémas (\`\`\`chart / \`\`\`mermaid)** :
   - Dès que l'utilisateur demande de **dessiner / tracer un graphique, une courbe mathématique, un histogramme, un camembert ou un diagramme** (ou lorsqu'un visuel rend ton explication plus claire), insère directement un bloc \`\`\`chart contenant du JSON valide sur UNE ligne (N'écris JAMAIS de code Python matplotlib, et N'utilise JAMAIS dessiner_sur_ecran pour tracer un graphique ou des axes sur l'écran) :
     - **Courbe mathématique** (plan cartésien interactif avec zoom/glissement) : utilise \`"functions"\` (\`x\`, \`exp(x)\`, \`ln(x)\`, \`sin(x)\`, \`cos(x)\`, \`tan(x)\`, \`sqrt(x)\`, \`abs(x)\`, \`^\`). Centre \`"domain"\` autour de \`0\` pour toute fonction définie sur ℝ (ex. \`[-6, 6]\`), ajoute un \`"yDomain"\` équilibré si besoin et \`"asymptotes"\` si utile :
       \`\`\`chart
       {"chartType":"line","title":"f(x) = x²","subtitle":"Parabole centrée en (0, 0)","xAxisLabel":"x","yAxisLabel":"f(x)","domain":[-5,5],"yDomain":[-1,12],"functions":[{"expr":"x^2","label":"f(x) = x²"}]}
       \`\`\`
     - **Données / statistiques / barres / évolution** : utilise \`"data"\` avec 6 à 14 points réalistes :
       \`\`\`chart
       {"chartType":"bar","title":"Répartition","xAxisLabel":"Catégorie","yAxisLabel":"Valeur","data":[{"name":"A","Valeur":12},{"name":"B","Valeur":19}]}
       \`\`\`
   - Pour un schéma logique / organigramme / étapes d'un processus, utilise un bloc \`\`\`mermaid simple et concis.
3. **Galeries de photos réelles (\`\`\`images)** :
   - Dès que l'utilisateur demande des photos/images/illustrations OU lorsque tu expliques un sujet concret (anatomie, biologie, physique, chimie, astronomie, histoire, géographie, art), insère un bloc \`\`\`images contenant un tableau JSON de **3 à 4 requêtes précises** :
     \`\`\`images
     [
       {"query": "human heart anatomy", "caption": "Anatomie interne du cœur"},
       {"query": "cardiac cycle systole diastole", "caption": "Cycle cardiaque : systole et diastole"},
       {"query": "coronary arteries heart", "caption": "Artères coronaires"}
     ]
     \`\`\`
   - Mets \`"query"\` en anglais (2–4 mots-clés précis, sans mots parasites) et \`"caption"\` en français.
4. **Vidéos YouTube intégrées (\`\`\`youtube)** :
   - Dès que l'utilisateur demande une vidéo/tutoriel YouTube OU pour illustrer un mécanisme dynamique, insère un bloc \`\`\`youtube avec **1 à 2 requêtes ciblées** :
     \`\`\`youtube
     [
       {"query": "comment fonctionne le coeur humain anatomie", "title": "Fonctionnement du cœur humain en vidéo"}
     ]
     \`\`\``;

const BASE_SYSTEM_PROMPT = `Tu es l'assistant pédagogique et technique intelligent de Gradelys.
Tu peux accompagner l'utilisateur dans N'IMPORTE QUELLE application ouverte sur son ordinateur (navigateur web, document Word/PDF, éditeur de code, exercice scolaire, logiciel créatif, réglages système).

Règles d'explication (TRÈS IMPORTANT — vise l'excellence) :
1. Commence directement par une phrase claire : ce que tu observes ou la réponse directe (sans formule d'introduction inutile).
2. Explique ensuite **étape par étape avec des numéros (1., 2., 3.)** de façon limpide, même pour un débutant :
   - Pour manipuler une app : indique le **nom exact** des boutons, menus ou onglets visibles à l'écran en **gras** et où ils se trouvent.
   - Pour un exercice, un cours, une formule ou une erreur : ne te contente pas de donner la solution sèche — explique **pourquoi** de manière intuitive et simple, donne la méthode claire, puis vérifie le résultat.
3. Termine par une courte phrase pratique (**Vérification** ou **Astuce**) si cela évite une erreur fréquente.
4. Évite le jargon technique non expliqué ; privilégie des phrases courtes, structurées et faciles à lire d'un coup d'œil dans une petite fenêtre.

${RICH_MEDIA_CAPABILITY_PROMPT}

Décision de capture d'écran (capture_ecran) :
- Appelle capture_ecran dès que la question porte sur ce qui est actuellement affiché à l'écran (ex. « aide-moi ici », « c'est quoi ça ? », « pourquoi j'ai cette erreur ? », « où cliquer ? », « corrige cet exercice », ou « fais un graphe avec ces valeurs »).
- N'appelle PAS capture_ecran pour une question théorique ou une demande de graphique/photos/vidéo indépendant de l'écran (ex. « dessine-moi un graphique de f(x) = eˣ », « montre-moi des photos du système solaire », « cherche une vidéo YouTube sur... »).

Dessin visuel sur l'écran (dessiner_sur_ecran) :
- Réservé UNIQUEMENT pour pointer 1 à 6 éléments déjà visibles sur une capture d'écran (bouton, champ, erreur, zone d'exercice).
- Après avoir vu une capture, appelle dessiner_sur_ecran **en même temps que ton texte** dès qu'un repère visuel aide l'utilisateur.
- Coordonnées normalisées 0 à 1000 : (0, 0) = haut-gauche, (1000, 1000) = bas-droite. Cible précisément les éléments réels de la capture.
- Envoie 1 à 6 annotations propres et coordonnées à tes étapes : place un badge {type:'step', n:1, label:'...'} juste AVANT son {type:'arrow', from, to}, {type:'circle', at, radius}, {type:'rect', from, to} ou {type:'highlight', from, to}.
- NE dessine JAMAIS de graphique, d'axes ou d'illustration à main levée avec dessiner_sur_ecran (utilise un bloc \`\`\`chart à la place).
- Si un élément est hors champ ou illisible, dis-le honnêtement sans inventer de coordonnées.
- Ignore toujours les données sensibles visibles (mots de passe, cartes bancaires, messages privés) et dis simplement « je regarde ton écran ».`;

const WEB_ONLY_SYSTEM_PROMPT = `Tu es l'assistant pédagogique et technique intelligent de Gradelys.
- Réponds en français, de façon claire, chaleureuse et structurée : réponse directe, étapes numérotées (1., 2., 3.), explication simple du « pourquoi » et exemple concret si utile.
- Tu es actuellement utilisé depuis un navigateur web classique (sans accès à l'écran). Réponds avec du texte et des blocs visuels (\`\`\`chart, \`\`\`mermaid, \`\`\`images, \`\`\`youtube) dès que cela aide l'utilisateur.

${RICH_MEDIA_CAPABILITY_PROMPT}`;

const CAPTURE_TOOL_DESCRIPTION =
  "Prend une capture légère de l'écran actif de l'utilisateur (toutes applications confondues). À appeler UNIQUEMENT si la question dépend de ce qui est visible à l'écran.";

const DRAW_TOOL_DESCRIPTION =
  "Pointe 1 à 6 éléments déjà visibles sur une capture d'écran (bouton, zone, champ, erreur). Ne l'utilise JAMAIS pour tracer un graphique ou un schéma à main levée (utilise un bloc ```chart dans ton texte à la place). Coordonnées 0..1000 relatives à la capture ; place chaque 'step' juste avant sa forme.";

function buildSystemPrompt(desktop: boolean, extraSystemContext?: string): string {
  const base = desktop ? BASE_SYSTEM_PROMPT : WEB_ONLY_SYSTEM_PROMPT;
  const trimmed = extraSystemContext?.trim();
  if (!trimmed) return base;
  return `${base}\n\nAdaptation au profil de l'utilisateur :\n${trimmed.slice(0, 1200)}`;
}

const UPSTREAM_FETCH_TIMEOUT_MS = 45_000;

/**
 * Shared SSE data-line iterator that normalizes CRLF and flushes the decoder
 * and final trailing buffer cleanly when the upstream stream closes.
 */
async function* iterateSseDataLines(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const extractDataPayload = (rawLine: string): string | null => {
    const line = rawLine.replace(/\r$/, "");
    if (!line.startsWith("data:")) return null;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return null;
    return payload;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const payload = extractDataPayload(line);
      if (payload) yield payload;
    }
  }

  if (buffer.trim().length > 0) {
    for (const line of buffer.split("\n")) {
      const payload = extractDataPayload(line);
      if (payload) yield payload;
    }
  }
}

function allowCaptureTool(payload: AssistantRequestPayload): boolean {
  return payload.context.desktop && payload.screenshot === null && !payload.disableCapture;
}

function emptyStreamFallbackEvent(blockReason?: string): AssistantSSEEvent {
  return {
    type: "error",
    code: "upstream",
    message: blockReason
      ? "La réponse a été bloquée par le filtre de sécurité. Essaie de reformuler ta question."
      : "L'assistant n'a renvoyé aucune réponse exploitable. Réessaie dans un instant.",
  };
}

// ─── Gemini Provider (Default) ────────────────────────────────────────────────

function buildGeminiTools(allowCapture: boolean) {
  const declarations: Record<string, unknown>[] = [];

  if (allowCapture) {
    declarations.push({
      name: "capture_ecran",
      description: CAPTURE_TOOL_DESCRIPTION,
      parameters: {
        type: "OBJECT",
        properties: {
          raison: {
            type: "STRING",
            description: "Courte phrase affichée à l'utilisateur expliquant pourquoi tu veux regarder son écran.",
          },
        },
        required: ["raison"],
      },
    });
  }

  declarations.push({
    name: "dessiner_sur_ecran",
    description: DRAW_TOOL_DESCRIPTION,
    parameters: {
      type: "OBJECT",
      properties: {
        commandes: {
          type: "ARRAY",
          description:
            "Liste de 1 à 6 annotations visuelles concises sur la capture. Types: circle ({type:'circle', at:{x,y}, radius?}), rect ({type:'rect', from:{x,y}, to:{x,y}}), arrow ({type:'arrow', from:{x,y}, to:{x,y}}), highlight ({type:'highlight', from:{x,y}, to:{x,y}}), text ({type:'text', at:{x,y}, text}), step ({type:'step', n, label?}), clear ({type:'clear'}). Coordonnées 0..1000.",
          items: {
            type: "OBJECT",
            properties: {
              type: {
                type: "STRING",
                enum: ["circle", "rect", "arrow", "highlight", "text", "step", "clear"],
              },
              at: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
              },
              from: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
              },
              to: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
              },
              radius: { type: "NUMBER" },
              text: { type: "STRING" },
              n: { type: "INTEGER" },
              label: { type: "STRING" },
            },
            required: ["type"],
          },
        },
      },
      required: ["commandes"],
    },
  });

  return [{ functionDeclarations: declarations }];
}

async function* readGeminiStreamTurn(
  apiKey: string,
  model: string,
  contents: Record<string, unknown>[],
  systemInstruction: string,
  tools?: Record<string, unknown>[]
): AsyncGenerator<{
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  rawParts?: Record<string, unknown>[];
  blockReason?: string;
}> {
  const body: Record<string, unknown> = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2400,
    },
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
    }
  );

  if (!res.ok || !res.body) {
    const status = res.status;
    await res.text().catch(() => "");
    throw new Error(`Gemini upstream HTTP ${status}`);
  }

  for await (const payload of iterateSseDataLines(res.body)) {
    let parsed: {
      error?: { message?: string };
      promptFeedback?: { blockReason?: string };
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<Record<string, unknown>> };
      }>;
    };
    try {
      parsed = JSON.parse(payload);
    } catch {
      continue;
    }

    if (parsed?.error?.message) {
      throw new Error(`Gemini upstream error: ${parsed.error.message.slice(0, 160)}`);
    }

    const cand = parsed?.candidates?.[0];
    const blockReason =
      parsed?.promptFeedback?.blockReason ||
      (cand?.finishReason &&
      ["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(cand.finishReason)
        ? cand.finishReason
        : undefined);
    if (blockReason) {
      yield { blockReason };
    }

    const parts = cand?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      // Skip model internal thought parts so they neither leak nor mask empty answers
      if (part?.thought === true) {
        continue;
      }
      if (typeof part?.text === "string" && part.text.length > 0) {
        yield { text: part.text };
      }
      const fc = part?.functionCall as { name?: unknown; args?: unknown } | undefined;
      if (fc && typeof fc.name === "string") {
        yield {
          functionCall: {
            name: fc.name,
            args: (fc.args && typeof fc.args === "object" ? fc.args : {}) as Record<string, unknown>,
          },
          rawParts: [part],
        };
      }
    }
  }
}

async function* streamGeminiAssistant(
  payload: AssistantRequestPayload,
  extraSystemContext?: string
): AsyncGenerator<AssistantSSEEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }
  const model = process.env.GEMINI_ASSISTANT_MODEL || "gemini-3.7-flash";
  const systemPrompt = buildSystemPrompt(payload.context.desktop, extraSystemContext);

  // Map messages to Gemini contents; attach screenshot to the last user message
  const contents: Record<string, unknown>[] = payload.messages.map((m, idx) => {
    const isLastUser =
      idx === payload.messages.length - 1 && m.role === "user" && payload.screenshot !== null;
    const parts: Record<string, unknown>[] = [{ text: m.content }];
    if (isLastUser && payload.screenshot) {
      parts.push({
        inline_data: {
          mime_type: payload.screenshot.mimeType,
          data: payload.screenshot.imageBase64,
        },
      });
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const tools = payload.context.desktop
    ? buildGeminiTools(allowCaptureTool(payload))
    : undefined;

  const collectedModelParts: Record<string, unknown>[] = [];
  let pendingDrawResponse: { name: string; count: number } | null = null;
  let emittedText = false;
  let emittedDraw = false;
  let blockReason: string | undefined;

  for await (const chunk of readGeminiStreamTurn(apiKey, model, contents, systemPrompt, tools)) {
    if (chunk.blockReason) {
      blockReason = chunk.blockReason;
    }
    if (chunk.text) {
      emittedText = true;
      collectedModelParts.push({ text: chunk.text });
      yield { type: "text_delta", text: chunk.text };
    }

    if (chunk.functionCall) {
      if (chunk.rawParts) {
        collectedModelParts.push(...chunk.rawParts);
      }

      if (chunk.functionCall.name === "capture_ecran" && allowCaptureTool(payload)) {
        const rawReason = chunk.functionCall.args?.raison;
        const reason =
          typeof rawReason === "string" && rawReason.trim().length > 0
            ? rawReason.trim().slice(0, 180)
            : "Pour voir ce qui est affiché sur ton écran.";
        yield { type: "need_screenshot", reason };
        return;
      }

      if (chunk.functionCall.name === "dessiner_sur_ecran" && payload.context.desktop) {
        const commands = validateDrawCommands(chunk.functionCall.args?.commandes);
        if (commands.length > 0) {
          emittedDraw = true;
          yield { type: "draw", commands };
        }
        pendingDrawResponse = { name: "dessiner_sur_ecran", count: commands.length };
      }
    }
  }

  // If the model called dessiner_sur_ecran and finished without text, send tool response so it completes its explanation
  if (pendingDrawResponse && !emittedText) {
    const followUpContents: Record<string, unknown>[] = [
      ...contents,
      { role: "model", parts: collectedModelParts },
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: pendingDrawResponse.name,
              response: { ok: true, drawnCount: pendingDrawResponse.count },
            },
          },
        ],
      },
    ];

    for await (const chunk of readGeminiStreamTurn(
      apiKey,
      model,
      followUpContents,
      systemPrompt,
      undefined
    )) {
      if (chunk.blockReason) blockReason = chunk.blockReason;
      if (chunk.text) {
        emittedText = true;
        yield { type: "text_delta", text: chunk.text };
      }
    }
  }

  if (!emittedText) {
    if (emittedDraw) {
      yield {
        type: "text_delta",
        text: "Voici les repères visuels sur ton écran. Dis-moi si tu veux plus de détails.",
      };
    } else {
      yield emptyStreamFallbackEvent(blockReason);
      return;
    }
  }

  yield { type: "done" };
}

// ─── OpenAI Provider (Interchangeable via AI_PROVIDER=openai) ────────────────

function buildOpenAITools(allowCapture: boolean) {
  const tools: Record<string, unknown>[] = [];
  if (allowCapture) {
    tools.push({
      type: "function",
      function: {
        name: "capture_ecran",
        description: CAPTURE_TOOL_DESCRIPTION,
        parameters: {
          type: "object",
          properties: {
            raison: { type: "string" },
          },
          required: ["raison"],
        },
      },
    });
  }
  tools.push({
    type: "function",
    function: {
      name: "dessiner_sur_ecran",
      description: DRAW_TOOL_DESCRIPTION,
      parameters: {
        type: "object",
        properties: {
          commandes: {
            type: "array",
            items: { type: "object" },
          },
        },
        required: ["commandes"],
      },
    },
  });
  return tools;
}

async function* streamOpenAIAssistant(
  payload: AssistantRequestPayload,
  extraSystemContext?: string
): AsyncGenerator<AssistantSSEEvent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
  const model = process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini";
  const systemPrompt = buildSystemPrompt(payload.context.desktop, extraSystemContext);

  const openAiMessages: Record<string, unknown>[] = [
    { role: "system", content: systemPrompt },
    ...payload.messages.map((m, idx) => {
      const isLastUser =
        idx === payload.messages.length - 1 && m.role === "user" && payload.screenshot !== null;
      if (isLastUser && payload.screenshot) {
        return {
          role: "user",
          content: [
            { type: "text", text: m.content },
            {
              type: "image_url",
              image_url: {
                url: `data:${payload.screenshot.mimeType};base64,${payload.screenshot.imageBase64}`,
                detail: "auto",
              },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  const tools = payload.context.desktop
    ? buildOpenAITools(allowCaptureTool(payload))
    : undefined;

  const runTurn = async function* (
    msgs: Record<string, unknown>[],
    turnTools?: Record<string, unknown>[]
  ) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: msgs,
        stream: true,
        temperature: 0.3,
        max_tokens: 2400,
        ...(turnTools ? { tools: turnTools } : {}),
      }),
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
    });

    if (!res.ok || !res.body) {
      throw new Error(`OpenAI upstream HTTP ${res.status}`);
    }

    const toolCalls = new Map<number, { id: string; name: string; args: string }>();
    let textBuffer = "";

    for await (const data of iterateSseDataLines(res.body)) {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.error?.message) {
          throw new Error(`OpenAI upstream error: ${String(parsed.error.message).slice(0, 160)}`);
        }
        const delta = parsed?.choices?.[0]?.delta;
        if (!delta) continue;
        if (typeof delta.content === "string" && delta.content.length > 0) {
          textBuffer += delta.content;
          yield { text: delta.content };
        }
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = typeof tc.index === "number" ? tc.index : 0;
            const current = toolCalls.get(idx) || { id: tc.id || `call_${idx}`, name: "", args: "" };
            if (tc.id) current.id = tc.id;
            if (tc.function?.name) current.name += tc.function.name;
            if (tc.function?.arguments) current.args += tc.function.arguments;
            toolCalls.set(idx, current);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("OpenAI upstream error:")) {
          throw err;
        }
        // Ignore malformed chunk
      }
    }

    yield { finishedToolCalls: Array.from(toolCalls.values()), fullText: textBuffer };
  };

  let emittedText = false;
  let emittedDraw = false;
  let drawToolCall: { id: string; name: string; args: string; count: number } | null = null;

  for await (const part of runTurn(openAiMessages, tools)) {
    if ("text" in part && part.text) {
      emittedText = true;
      yield { type: "text_delta", text: part.text };
    }
    if ("finishedToolCalls" in part && part.finishedToolCalls) {
      for (const tc of part.finishedToolCalls) {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.args || "{}");
        } catch {
          parsedArgs = {};
        }

        if (tc.name === "capture_ecran" && allowCaptureTool(payload)) {
          const reason =
            typeof parsedArgs.raison === "string" && parsedArgs.raison.trim().length > 0
              ? parsedArgs.raison.trim().slice(0, 180)
              : "Pour voir ce qui est affiché sur ton écran.";
          yield { type: "need_screenshot", reason };
          return;
        }

        if (tc.name === "dessiner_sur_ecran" && payload.context.desktop) {
          const commands = validateDrawCommands(parsedArgs.commandes);
          if (commands.length > 0) {
            emittedDraw = true;
            yield { type: "draw", commands };
          }
          drawToolCall = { ...tc, count: commands.length };
        }
      }
    }
  }

  if (drawToolCall && !emittedText) {
    const followUp: Record<string, unknown>[] = [
      ...openAiMessages,
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: drawToolCall.id,
            type: "function",
            function: { name: drawToolCall.name, arguments: drawToolCall.args },
          },
        ],
      },
      {
        role: "tool",
        tool_call_id: drawToolCall.id,
        content: JSON.stringify({ ok: true, drawnCount: drawToolCall.count }),
      },
    ];

    for await (const part of runTurn(followUp, undefined)) {
      if ("text" in part && part.text) {
        emittedText = true;
        yield { type: "text_delta", text: part.text };
      }
    }
  }

  if (!emittedText) {
    if (emittedDraw) {
      yield {
        type: "text_delta",
        text: "Voici les repères visuels sur ton écran. Dis-moi si tu veux plus de détails.",
      };
    } else {
      yield emptyStreamFallbackEvent();
      return;
    }
  }

  yield { type: "done" };
}

// ─── Anthropic Provider (Interchangeable via AI_PROVIDER=anthropic) ──────────

async function* streamAnthropicAssistant(
  payload: AssistantRequestPayload,
  extraSystemContext?: string
): AsyncGenerator<AssistantSSEEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY missing");
  }
  const model = process.env.ANTHROPIC_ASSISTANT_MODEL || "claude-3-5-sonnet-latest";
  const systemPrompt = buildSystemPrompt(payload.context.desktop, extraSystemContext);

  const messages: Record<string, unknown>[] = payload.messages.map((m, idx) => {
    const isLastUser =
      idx === payload.messages.length - 1 && m.role === "user" && payload.screenshot !== null;
    if (isLastUser && payload.screenshot) {
      return {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: payload.screenshot.mimeType,
              data: payload.screenshot.imageBase64,
            },
          },
          { type: "text", text: m.content },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  const tools = payload.context.desktop
    ? [
        ...(allowCaptureTool(payload)
          ? [
              {
                name: "capture_ecran",
                description: CAPTURE_TOOL_DESCRIPTION,
                input_schema: {
                  type: "object",
                  properties: { raison: { type: "string" } },
                  required: ["raison"],
                },
              },
            ]
          : []),
        {
          name: "dessiner_sur_ecran",
          description: DRAW_TOOL_DESCRIPTION,
          input_schema: {
            type: "object",
            properties: {
              commandes: { type: "array", items: { type: "object" } },
            },
            required: ["commandes"],
          },
        },
      ]
    : undefined;

  const runTurn = async function* (
    turnMessages: Record<string, unknown>[],
    turnTools?: Record<string, unknown>[]
  ) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2400,
        temperature: 0.3,
        system: systemPrompt,
        messages: turnMessages,
        stream: true,
        ...(turnTools ? { tools: turnTools } : {}),
      }),
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Anthropic upstream HTTP ${res.status}`);
    }

    const toolUses: { id: string; name: string; jsonBuf: string }[] = [];
    let currentTool: { id: string; name: string; jsonBuf: string } | null = null;

    for await (const data of iterateSseDataLines(res.body)) {
      try {
        const evt = JSON.parse(data);
        if (evt.type === "error" && evt.error?.message) {
          throw new Error(`Anthropic upstream error: ${String(evt.error.message).slice(0, 160)}`);
        }
        if (evt.type === "content_block_start" && evt.content_block?.type === "tool_use") {
          currentTool = {
            id: evt.content_block.id || "tool_0",
            name: evt.content_block.name || "",
            jsonBuf: "",
          };
        } else if (evt.type === "content_block_delta") {
          if (evt.delta?.type === "text_delta" && typeof evt.delta.text === "string") {
            yield { text: evt.delta.text };
          } else if (
            evt.delta?.type === "input_json_delta" &&
            typeof evt.delta.partial_json === "string" &&
            currentTool
          ) {
            currentTool.jsonBuf += evt.delta.partial_json;
          }
        } else if (evt.type === "content_block_stop" && currentTool) {
          toolUses.push(currentTool);
          currentTool = null;
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("Anthropic upstream error:")) {
          throw err;
        }
        // Ignore malformed chunk
      }
    }

    yield { toolUses };
  };

  let emittedText = false;
  let emittedDraw = false;
  let drawTool: { id: string; name: string; input: Record<string, unknown>; count: number } | null =
    null;

  for await (const part of runTurn(messages, tools)) {
    if ("text" in part && part.text) {
      emittedText = true;
      yield { type: "text_delta", text: part.text };
    }
    if ("toolUses" in part && part.toolUses) {
      for (const tu of part.toolUses) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tu.jsonBuf || "{}");
        } catch {
          input = {};
        }

        if (tu.name === "capture_ecran" && allowCaptureTool(payload)) {
          const reason =
            typeof input.raison === "string" && input.raison.trim().length > 0
              ? input.raison.trim().slice(0, 180)
              : "Pour voir ce qui est affiché sur ton écran.";
          yield { type: "need_screenshot", reason };
          return;
        }

        if (tu.name === "dessiner_sur_ecran" && payload.context.desktop) {
          const commands = validateDrawCommands(input.commandes);
          if (commands.length > 0) {
            emittedDraw = true;
            yield { type: "draw", commands };
          }
          drawTool = { id: tu.id, name: tu.name, input, count: commands.length };
        }
      }
    }
  }

  if (drawTool && !emittedText) {
    const followUp: Record<string, unknown>[] = [
      ...messages,
      {
        role: "assistant",
        content: [{ type: "tool_use", id: drawTool.id, name: drawTool.name, input: drawTool.input }],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: drawTool.id,
            content: JSON.stringify({ ok: true, drawnCount: drawTool.count }),
          },
        ],
      },
    ];
    for await (const part of runTurn(followUp, undefined)) {
      if ("text" in part && part.text) {
        emittedText = true;
        yield { type: "text_delta", text: part.text };
      }
    }
  }

  if (!emittedText) {
    if (emittedDraw) {
      yield {
        type: "text_delta",
        text: "Voici les repères visuels sur ton écran. Dis-moi si tu veux plus de détails.",
      };
    } else {
      yield emptyStreamFallbackEvent();
      return;
    }
  }

  yield { type: "done" };
}

// ─── Provider Dispatcher ─────────────────────────────────────────────────────

export async function* streamAssistant(
  payload: AssistantRequestPayload,
  extraSystemContext?: string
): AsyncGenerator<AssistantSSEEvent> {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();

  if (provider === "openai") {
    yield* streamOpenAIAssistant(payload, extraSystemContext);
    return;
  }
  if (provider === "anthropic" || provider === "claude") {
    yield* streamAnthropicAssistant(payload, extraSystemContext);
    return;
  }
  yield* streamGeminiAssistant(payload, extraSystemContext);
}

// ─── Audio Transcription (Dictation) ─────────────────────────────────────────

const AUDIO_EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};

async function transcribeWithGemini(
  audioBase64: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const model = process.env.GEMINI_ASSISTANT_MODEL || "gemini-3.7-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: audioBase64,
              },
            },
            {
              text: "Transcris fidèlement cet enregistrement audio en français. Retourne uniquement le texte exact prononcé, sans guillemets ni commentaire. Si aucun mot intelligible n'est présent, retourne une chaîne vide.",
            },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini transcription HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join(" ")
    .trim();
}

async function transcribeWithOpenAI(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const ext = AUDIO_EXT_BY_MIME[mimeType] || "webm";
  const form = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  form.append("file", blob, `dictation.${ext}`);
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  form.append("language", "fr");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`OpenAI transcription HTTP ${res.status}`);
  }

  const json = (await res.json()) as { text?: string };
  return (json.text || "").trim();
}

/**
 * Transcribes short French voice dictation audio using the active AI provider
 * (Gemini multimodal audio by default, or OpenAI Whisper when selected/available).
 */
export async function transcribeAssistantAudio(
  audioBase64: string,
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (provider === "openai" && openAiKey) {
    return transcribeWithOpenAI(audioBuffer, mimeType, openAiKey);
  }
  if (geminiKey) {
    return transcribeWithGemini(audioBase64, mimeType, geminiKey);
  }
  if (openAiKey) {
    return transcribeWithOpenAI(audioBuffer, mimeType, openAiKey);
  }

  throw new Error("GEMINI_API_KEY or OPENAI_API_KEY missing for voice transcription");
}

