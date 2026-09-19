"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Download, Loader2, Pencil, Eye } from "lucide-react";
import { useStudioDocument, useUpdateDocument } from "@/hooks/use-studio";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { PresentationEditor } from "@/components/studio/presentation/PresentationEditor";
import { exportToPptx } from "@/components/studio/presentation/export-pptx";

export default function StudioDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const spaceId = searchParams.get("spaceId");
  const id = params.id as string;
  const { data: doc, isLoading } = useStudioDocument(id);
  const update = useUpdateDocument();
  const [content, setContent] = React.useState("");
  const [editMode, setEditMode] = React.useState(false);
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
        exportToPptx(parsed);
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

  let isSlides = doc?.type === "slides";
  let parsedData: any = null;

  // AI robustness: If the document is saved as 'notes' or 'report' but the content is actually 
  // JSON slides (possibly wrapped in markdown), we force it to open in the Presentation Editor.
  // CRITICAL FIX: Use doc.content instead of 'content' state to prevent data-loss race condition on first render!
  const actualContent = doc?.content || "";
  let cleanContent = actualContent;
  
  if (cleanContent && typeof cleanContent === "string") {
    // Attempt to extract json_presentation or json block if AI wrapped it in conversational text
    const jsonBlockMatch = cleanContent.match(/```(?:json|json_presentation)\n([\s\S]*?)\n```/i);
    if (jsonBlockMatch) {
      cleanContent = jsonBlockMatch[1].trim();
    } else {
      // If no explicit block, maybe it's just raw JSON, or maybe it has some leading text.
      // Let's strip standard markdown formatting.
      cleanContent = cleanContent.replace(/```(?:json|json_presentation)?\n?/gi, "").replace(/```/g, "").trim();
      
      // If it has conversational text before the JSON, try to extract just the JSON part
      const firstBrace = cleanContent.indexOf("{");
      const lastBrace = cleanContent.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }
    }

    if (cleanContent.startsWith("{")) {
      try {
        const maybeJson = JSON.parse(cleanContent);
        if (maybeJson && Array.isArray(maybeJson.slides)) {
          isSlides = true;
          parsedData = maybeJson;
        }
      } catch (e) {
        // Not a valid JSON presentation
      }
    }
  }

  if (isSlides) {
    if (!parsedData && cleanContent) {
      try {
        parsedData = JSON.parse(cleanContent);
      } catch (e) {
        console.error("Failed to parse slides data");
      }
    }

    if (!parsedData || !parsedData.slides) {
      // Provide a default empty presentation structure
      const { nanoid } = require("nanoid");
      parsedData = {
        theme: {
          fontFamily: "Inter",
          primaryColor: "#000000",
          secondaryColor: "#666666",
          backgroundColor: "#ffffff"
        },
        slides: [
          {
            id: nanoid(),
            layout: "blank",
            background: { type: "solid", value: "#ffffff" },
            elements: []
          }
        ]
      };
    }

    return (
      <PresentationEditor 
        documentId={id}
        conversationId={conversationId}
        spaceId={spaceId}
        initialDoc={parsedData} 
        onSave={(data) => {
          clearTimeout(saveTimeout.current);
          saveTimeout.current = setTimeout(() => {
            update.mutate({ id, content: JSON.stringify(data) });
          }, 800);
        }}
        activeSlideId={parsedData?.slides?.[0]?.id}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span className="flex-1 truncate text-body-md font-medium text-text-primary">{doc?.title}</span>
        
        {/* Toggle edit/preview for non-slide documents */}
        {!isSlides && (
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-label-lg text-text-secondary hover:bg-hover"
          >
            {editMode ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editMode ? "Preview" : "Edit"}
          </button>
        )}
        
        <button onClick={handleExport} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-label-lg text-text-secondary hover:bg-hover">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {editMode ? (
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="mx-auto h-full max-w-3xl border-none bg-transparent p-0 font-mono text-body-md leading-relaxed focus-visible:shadow-none"
          />
        ) : (
          <div className="mx-auto max-w-3xl">
            <Markdown content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
