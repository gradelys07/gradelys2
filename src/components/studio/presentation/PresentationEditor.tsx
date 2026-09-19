"use client";

import React, { useState, useEffect } from "react";
import { usePresentationStore } from "./store";
import { PropertiesPanel } from "./PropertiesPanel";
import { ToolChatThread } from "@/components/space/tool-chat-thread";
import { ImagePickerDialog } from "./ImagePickerDialog";
import { SlideCanvas, SlideThumbnail } from "./SlideCanvas";
import { PresentationViewer } from "./PresentationViewer";
import { Button } from "@/components/ui/button";
import { PresentationDocument } from "./types";
import { Undo2, Redo2, Play, Download, Wand2, Plus, Trash2, ArrowLeft, Type, Image as ImageIcon, Square, BarChart4, Loader2, X } from "lucide-react";
import { exportToPptx } from "./export-pptx";
import { nanoid } from "nanoid";
import { applyAIOperations } from "./ai-engine";
import { toast } from "sonner";

export function PresentationEditor({ 
  initialDoc, 
  onSave,
  activeSlideId: propActiveSlideId,
  documentId,
  conversationId,
  spaceId
}: { 
  initialDoc?: PresentationDocument, 
  onSave?: (doc: PresentationDocument) => void,
  activeSlideId?: string,
  documentId?: string,
  conversationId?: string | null,
  spaceId?: string | null
}) {
  const { document, setDocument, activeSlideId, setActiveSlide, undo, redo, past, future, addSlide, deleteSlide, selectedElementIds } = usePresentationStore();
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const currentDocIdRef = React.useRef<string | null>(null);
  const [savedPrompt, setSavedPrompt] = useState<string | undefined>(undefined);

  // Read and clear saved prompt from sessionStorage on mount
  React.useEffect(() => {
    const prompt = sessionStorage.getItem("gradelys:presentation-prompt");
    if (prompt) {
      setSavedPrompt(prompt);
      sessionStorage.removeItem("gradelys:presentation-prompt");
    }
  }, []);

  // Automatically switch to properties panel when an element is selected
  React.useEffect(() => {
    if (selectedElementIds.length > 0) {
      setShowAiPanel(false);
    }
  }, [selectedElementIds]);

  // Initialize store with document
  React.useEffect(() => {
    if (initialDoc && initialDoc.slides) {
      if (documentId !== currentDocIdRef.current || !document) {
        setDocument(initialDoc);
        currentDocIdRef.current = documentId || null;
      }
    }
  }, [initialDoc, documentId, document, setDocument]);

  React.useEffect(() => {
    if (propActiveSlideId) {
      setActiveSlide(propActiveSlideId);
    }
  }, [propActiveSlideId, setActiveSlide]);

  const onSaveRef = React.useRef(onSave);
  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  React.useEffect(() => {
    if (document && onSaveRef.current) {
      onSaveRef.current(document);
    }
  }, [document]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        window.document.activeElement?.tagName === "INPUT" ||
        window.document.activeElement?.tagName === "TEXTAREA" ||
        window.document.activeElement?.tagName === "SELECT" ||
        (window.document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const store = usePresentationStore.getState();

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        return;
      }
      
      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        store.redo();
        return;
      }

      // Delete selected elements
      if (e.key === "Delete" || e.key === "Backspace") {
        const { activeSlideId, selectedElementIds } = store;
        if (activeSlideId && selectedElementIds.length > 0) {
          e.preventDefault();
          selectedElementIds.forEach(id => {
            store.deleteElement(activeSlideId, id);
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!document || !document.slides) return <div className="flex-1 flex items-center justify-center">Loading presentation...</div>;

  const activeSlide = document.slides.find(s => s.id === activeSlideId) || document.slides[0];

  const handleExport = async () => {
    try {
      await exportToPptx(document);
    } catch (err: any) {
      console.error("PPTX export failed:", err);
      alert("Export failed: " + (err?.message || "Unknown error"));
    }
  };

  const handleAddSlide = () => {
    addSlide({
      id: nanoid(),
      layout: "blank",
      background: { type: "solid", value: "#ffffff" },
      elements: []
    });
  };

  const handleAddElement = (type: "text" | "image" | "shape" | "chart", imageUrl?: string) => {
    if (!activeSlideId) return;
    
    let newElement: any = {
      id: nanoid(),
      type,
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      rotation: 0,
      zIndex: 10,
    };

    switch (type) {
      case "text":
        newElement.height = 100;
        newElement.properties = { content: "Double click to edit", fontSize: 24, color: "#000000", alignment: "left" };
        break;
      case "image":
        newElement.properties = { 
          src: imageUrl || "https://image.pollinations.ai/prompt/beautiful%20landscape?width=400&height=300&nologo=true", 
          alt: "Presentation Image", 
          objectFit: "cover" 
        };
        break;
      case "shape":
        newElement.width = 200;
        newElement.height = 200;
        newElement.properties = { shapeType: "rectangle", backgroundColor: "#3b82f6", borderColor: "#2563eb", borderWidth: 2 };
        break;
      case "chart":
        newElement.properties = { 
          chartType: "bar", 
          title: "New Chart", 
          labels: ["Jan", "Feb", "Mar"], 
          datasets: [{ label: "Dataset 1", values: [10, 20, 30] }] 
        };
        break;
    }

    usePresentationStore.getState().addElement(activeSlideId, newElement);
  };



  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] bg-gray-50 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <h2 className="font-semibold text-sm mr-4 truncate max-w-[200px]">{document.metadata?.title || "Untitled Presentation"}</h2>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <Button variant="ghost" size="icon" onClick={() => handleAddElement("text")}><Type className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsImagePickerOpen(true)}><ImageIcon className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleAddElement("shape")}><Square className="h-4 w-4" /></Button>
          <div className="h-4 w-px bg-gray-300 mx-2" />
          <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}><Redo2 className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(!showAiPanel)} className={showAiPanel ? "bg-purple-100 text-purple-600" : ""}>
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export PPTX
          </Button>

          <Button size="sm" onClick={() => setIsPresenting(true)}>
            <Play className="h-4 w-4 mr-2" />
            Present
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Thumbnails */}
        <div className="w-48 border-r bg-gray-50 flex flex-col shrink-0">
          <div className="p-3 border-b flex justify-between items-center bg-white">
            <span className="text-sm font-semibold">Slides</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddSlide}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {document.slides.map((slide, i) => (
              <div 
                key={slide.id}
                onClick={() => setActiveSlide(slide.id)}
                className={`relative group rounded-md border-2 overflow-hidden cursor-pointer transition-colors ${activeSlideId === slide.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
              >
                <SlideThumbnail slide={slide} className="group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-1 py-0.5 z-10 flex justify-between">
                  <span>Slide {i + 1}</span>
                </div>
                {document.slides.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                    className="absolute top-1 right-1 h-6 w-6 bg-red-100 text-red-600 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-100 relative">
          
          {/* Element Toolbar */}
          {activeSlideId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md border px-2 py-1 flex items-center gap-1 z-10">
              <Button variant="ghost" size="sm" onClick={() => handleAddElement("text")} title="Add Text" className="h-8 px-2 text-gray-600 hover:text-purple-600"><Type className="h-4 w-4 mr-1" /> Text</Button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => setIsImagePickerOpen(true)} title="Add Image" className="h-8 px-2 text-gray-600 hover:text-purple-600"><ImageIcon className="h-4 w-4 mr-1" /> Image</Button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => handleAddElement("shape")} title="Add Shape" className="h-8 px-2 text-gray-600 hover:text-purple-600"><Square className="h-4 w-4 mr-1" /> Shape</Button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => handleAddElement("chart")} title="Add Chart" className="h-8 px-2 text-gray-600 hover:text-purple-600"><BarChart4 className="h-4 w-4 mr-1" /> Chart</Button>
            </div>
          )}

          {activeSlide ? (
            <SlideCanvas slide={activeSlide} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">Select a slide</div>
          )}
        </div>

        {/* Right Sidebar - Chat or Properties */}
        {showAiPanel ? (
          <div className="w-80 border-l bg-white flex flex-col shrink-0">
             <div className="flex items-center justify-between border-b px-4 py-2">
               <span className="font-semibold text-sm">Studio Chat</span>
               <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)}><X className="h-4 w-4"/></Button>
             </div>
             <div className="flex-1 overflow-hidden">
               {conversationId ? (
                 <ToolChatThread kind="studio" conversationId={conversationId} initialSpaceId={spaceId || undefined} initialPrompt={savedPrompt} hidePresets />
               ) : (
                 <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-4 text-center">
                   Open this presentation from a chat to use the AI assistant.
                 </div>
               )}
             </div>
          </div>
        ) : (
          <PropertiesPanel />
        )}
      </div>

      <ImagePickerDialog 
        open={isImagePickerOpen} 
        onOpenChange={setIsImagePickerOpen} 
        onImageSelect={(url) => handleAddElement("image", url)}
      />

      {isPresenting && (
        <PresentationViewer slides={document.slides} onClose={() => setIsPresenting(false)} />
      )}
    </div>
  );
}
