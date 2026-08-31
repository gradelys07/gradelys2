"use client";

import * as React from "react";

let mermaidInitialized = false;

/** Light client-side sanitization of Mermaid code to fix common AI-generated issues */
function sanitizeClientMermaid(code: string): string {
  // Remove HTML tags
  let cleaned = code.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");
  // Trim each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
  return cleaned;
}

export function MermaidDiagram({ code, id }: { code: string; id: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            themeVariables: {
              darkMode: false,
              background: "#FFFFFF",
              primaryColor: "#E0F2FE",
              primaryTextColor: "#334155",
              primaryBorderColor: "#0EA5E9",
              lineColor: "#94A3B8",
              secondaryColor: "#F8FAFC",
              tertiaryColor: "#F1F5F9",
              mainBkg: "#E0F2FE",
              nodeBorder: "#0EA5E9",
              clusterBkg: "#F8FAFC",
              titleColor: "#334155",
              edgeLabelBackground: "#FFFFFF",
              fontFamily: "-apple-system, Inter, sans-serif",
            },
            securityLevel: "strict",
          });
          mermaidInitialized = true;
        }
        const safeId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
        const sanitizedCode = sanitizeClientMermaid(code);
        const { svg } = await mermaid.render(safeId, sanitizedCode);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to render diagram");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="rounded-md border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)] p-4 text-body-sm text-red">
        <p className="font-medium">Syntax error in text</p>
        <p className="mt-1 text-text-muted">Le diagramme n&apos;a pas pu être rendu. Essayez de reformuler votre demande ou choisissez un autre format (infographic, chart).</p>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-container flex justify-center overflow-x-auto" />;
}
