"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { ChartRenderer } from "@/components/chart-renderer";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";

function HtmlVisual({ code }: { code: string }) {
  const [height, setHeight] = React.useState(420);
  return (
    <iframe
      sandbox=""
      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:-apple-system,Inter,sans-serif;background:#fff;}</style></head><body>${code}</body></html>`}
      style={{ width: "100%", height, border: "none", borderRadius: 8 }}
      onLoad={(e) => {
        try {
          const doc = (e.target as HTMLIFrameElement).contentDocument;
          if (doc) setHeight(Math.min(1200, doc.body.scrollHeight + 20));
        } catch {}
      }}
      className="bg-white"
    />
  );
}

export default function VisualizePage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const { data: output, isLoading, error } = useQuery({
    queryKey: ["visualize", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visualize_outputs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-body-md text-text-secondary">Loading visualization...</p>
        </div>
      </div>
    );
  }

  if (error || !output) {
    return notFound();
  }

  const structured = output.output_data;

  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-base px-4 sm:px-6">
        <Link
          href="/explore"
          className="mr-4 flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-hover hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-purple">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h1 className="text-body-lg font-semibold text-text-primary truncate">{output.title}</h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-5xl rounded-xl border border-border-strong bg-elevated p-8 shadow-sm">
          {structured?.kind === "html" ? (
            <HtmlVisual code={structured.code} />
          ) : structured?.kind === "mermaid" ? (
            <MermaidDiagram code={structured.code} id={output.id} />
          ) : structured?.kind === "bar" || structured?.kind === "pie" || structured?.kind === "line" || structured?.kind === "doughnut" ? (
             <ChartRenderer data={structured} />
          ) : (
            <div className="prose dark:prose-invert max-w-none">
               <Markdown content={JSON.stringify(structured, null, 2)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
