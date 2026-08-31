"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useStudioDocument, useUpdateDocument } from "@/hooks/use-studio";
import { Textarea } from "@/components/ui/input";
import { SlideViewer, exportToPptx } from "@/components/studio/slide-viewer";

export default function StudioDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: doc, isLoading } = useStudioDocument(id);
  const update = useUpdateDocument();
  const [content, setContent] = React.useState("");
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (doc) setContent(doc.content);
  }, [doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: string) {
    setContent(value);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => update.mutate({ id, content: value }), 800);
  }

  function handleExport() {
    if (!doc) return;
    
    if (doc.type === "slides") {
      try {
        const parsed = JSON.parse(content);
        exportToPptx(parsed.title || doc.title, parsed.slides || []);
      } catch (e) {
        console.error("Failed to parse slides for export", e);
      }
      return;
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-text-muted"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span className="flex-1 truncate text-body-md font-medium text-text-primary">{doc?.title}</span>
        <button onClick={handleExport} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-label-lg text-text-secondary hover:bg-hover">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {doc?.type === "slides" ? (
          (() => {
            try {
              const parsed = JSON.parse(content);
              return <SlideViewer title={parsed.title || doc.title} slides={parsed.slides || []} onExport={handleExport} />;
            } catch (e) {
              return <div className="text-red">Failed to parse slides data.</div>;
            }
          })()
        ) : (
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="mx-auto h-full max-w-3xl border-none bg-transparent p-0 font-mono text-body-md leading-relaxed focus-visible:shadow-none"
          />
        )}
      </div>
    </div>
  );
}
