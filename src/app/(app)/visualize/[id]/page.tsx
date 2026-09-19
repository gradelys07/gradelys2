"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, notFound, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Wand2, X, MousePointer2, PenTool, Type, Square, ImageIcon, Undo2, Redo2, Minus, Plus, Maximize, Cloud, Eraser, Hand, Circle, MessageCircle, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { ToolChatThread } from "@/components/space/tool-chat-thread";
import { VisualizeCanvas } from "@/components/visualize/VisualizeCanvas";
import { useVisualizeStore, ShapeKind } from "@/components/visualize/useVisualizeStore";

import { toast } from "sonner";

const PEN_COLORS = ['#0EA5E9', '#f43f5e', '#3b82f6', '#f59e0b', '#a855f7', '#ffffff', '#ec4899', '#06b6d4'];
const TEXT_SIZES = [14, 18, 24, 32, 48];
const SHAPE_OPTIONS: { kind: ShapeKind; icon: React.ElementType; label: string }[] = [
  { kind: 'rectangle', icon: Square, label: 'Rectangle' },
  { kind: 'ellipse', icon: Circle, label: 'Cercle' },
  { kind: 'arrow', icon: ArrowRight, label: 'Flèche' },
  { kind: 'thought', icon: MessageCircle, label: 'Bulle de pensée' },
];

export default function VisualizePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const conversationId = searchParams.get("conversationId");
  const spaceId = searchParams.get("spaceId");
  const supabase = createClient();
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

  const activeTool = useVisualizeStore(s => s.activeTool);
  const setActiveTool = useVisualizeStore(s => s.setActiveTool);
  const camera = useVisualizeStore(s => s.camera);
  const setCamera = useVisualizeStore(s => s.setCamera);
  const past = useVisualizeStore(s => s.past);
  const future = useVisualizeStore(s => s.future);
  const undo = useVisualizeStore(s => s.undo);
  const redo = useVisualizeStore(s => s.redo);
  const addElement = useVisualizeStore(s => s.addElement);
  const elements = useVisualizeStore(s => s.elements);
  const currentColor = useVisualizeStore(s => s.currentColor);
  const setCurrentColor = useVisualizeStore(s => s.setCurrentColor);
  const activeShapeKind = useVisualizeStore(s => s.activeShapeKind);
  const setActiveShapeKind = useVisualizeStore(s => s.setActiveShapeKind);
  const textSize = useVisualizeStore(s => s.textSize);
  const setTextSize = useVisualizeStore(s => s.setTextSize);
  const penSize = useVisualizeStore(s => s.penSize);
  const setPenSize = useVisualizeStore(s => s.setPenSize);
  const selectedIds = useVisualizeStore(s => s.selectedElementIds);
  const deleteSelected = useVisualizeStore(s => s.deleteSelected);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (output && elements.length === 0 && past.length === 0) {
      addElement({ id: output.id, type: "ai_visual", x: 0, y: 0, content: JSON.stringify(output.output_data), zIndex: 0 });
      if (typeof window !== "undefined") setCamera({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output?.id]);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20">
            <Sparkles className="h-6 w-6 text-sky-400 animate-pulse" />
          </div>
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !output) return notFound();

  const handleExport = () => {
    // Add a temporary class to prepare the page for printing
    document.body.classList.add('visualize-printing');
    // Set the document title for the PDF filename
    const prevTitle = document.title;
    document.title = output.title || 'Visualize';
    
    // Give the browser a tick to apply the print styles
    requestAnimationFrame(() => {
      window.print();
      // Restore after print dialog closes
      document.body.classList.remove('visualize-printing');
      document.title = prevTitle;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const s = useVisualizeStore.getState();
      s.addElement({
        id: crypto.randomUUID(), type: "image",
        x: (-s.camera.x / s.camera.zoom) + 100, y: (-s.camera.y / s.camera.zoom) + 100,
        width: 400, imageUrl: ev.target?.result as string, zIndex: s.elements.length,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowImageMenu(false);
  };

  const handleAiImageGenerate = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate an image: ${aiImagePrompt}`, spaceId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.output?.imageBase64) {
          const s = useVisualizeStore.getState();
          s.addElement({
            id: crypto.randomUUID(), type: 'image',
            x: (-s.camera.x / s.camera.zoom) + 100, y: (-s.camera.y / s.camera.zoom) + 100,
            width: 400, imageUrl: `data:${data.output.mimeType || 'image/png'};base64,${data.output.imageBase64}`, zIndex: s.elements.length,
          });
          toast.success('Image générée !');
        }
      } else {
        toast.error("Erreur lors de la génération");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setIsGeneratingImage(false);
    setAiImagePrompt('');
    setShowImageMenu(false);
  };

  const selectTool = (toolId: string) => {
    if (toolId === 'pen' || toolId === 'shape' || toolId === 'text') {
      setOpenSubmenu(openSubmenu === toolId ? null : toolId);
    } else {
      setOpenSubmenu(null);
    }
    setShowImageMenu(false);
    setActiveTool(toolId as any);
  };

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Sélectionner (V)' },
    { id: 'pan', icon: Hand, label: 'Déplacer (H)' },
    { id: 'pen', icon: PenTool, label: 'Stylo (P)' },
    { id: 'eraser', icon: Eraser, label: 'Gomme (E)' },
    { id: 'shape', icon: Square, label: 'Formes' },
    { id: 'text', icon: Type, label: 'Texte (T)' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] bg-[#121212] overflow-hidden font-sans text-gray-200">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#181818] px-4 z-20">
        <div className="flex items-center gap-3">
          <Link href="/visualize" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-semibold text-sm text-white">Visualize</span>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 bg-[#222] border border-[#333] rounded-full px-3.5 py-1">
          <span className="text-xs font-medium text-gray-300 truncate max-w-[250px]">{output.title}</span>
          <Cloud className="h-3.5 w-3.5 text-sky-500" />
        </div>
        <div className="flex items-center gap-2">
          {conversationId && (
            <button onClick={() => setShowAiPanel(!showAiPanel)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${showAiPanel ? "bg-sky-500/20 text-sky-400" : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"}`}>
              <Sparkles className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 relative overflow-hidden" ref={containerRef}>
          <VisualizeCanvas />

          {/* LEFT TOOLBAR */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-2xl p-1.5 shadow-2xl z-20">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              if (tool.id === 'image') {
                return (
                  <React.Fragment key={tool.id}>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button onClick={() => { setOpenSubmenu(null); setShowImageMenu(!showImageMenu); }} title={tool.label}
                      className={`p-2.5 rounded-xl transition-all duration-150 ${showImageMenu ? "bg-sky-500/20 text-sky-400" : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"}`}>
                      <Icon className="h-4 w-4" />
                    </button>
                  </React.Fragment>
                );
              }
              return (
                <button key={tool.id} onClick={() => selectTool(tool.id)} title={tool.label}
                  className={`p-2.5 rounded-xl transition-all duration-150 ${isActive ? "bg-sky-500/20 text-sky-400" : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"}`}>
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
            <div className="w-5 h-px bg-[#333] mx-auto my-0.5" />
            <button onClick={undo} disabled={past.length === 0} title="Annuler (⌘Z)"
              className="p-2.5 rounded-xl text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed">
              <Undo2 className="h-4 w-4" />
            </button>
            <button onClick={redo} disabled={future.length === 0} title="Rétablir (⌘⇧Z)"
              className="p-2.5 rounded-xl text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed">
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* PEN SUBMENU */}
          {openSubmenu === 'pen' && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-2xl p-3 shadow-2xl z-20 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Couleur</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PEN_COLORS.map(c => (
                  <button key={c} onClick={() => setCurrentColor(c)} className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: c, borderColor: currentColor === c ? '#fff' : 'transparent', boxShadow: currentColor === c ? `0 0 8px ${c}` : 'none' }} />
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Taille</div>
              <div className="flex items-center gap-2">
                {[2, 4, 6, 10].map(s => (
                  <button key={s} onClick={() => setPenSize(s)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${penSize === s ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}>
                    <div className="rounded-full bg-current" style={{ width: s + 2, height: s + 2 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SHAPE SUBMENU */}
          {openSubmenu === 'shape' && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-2xl p-3 shadow-2xl z-20 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Formes</div>
              {SHAPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.kind} onClick={() => setActiveShapeKind(opt.kind)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeShapeKind === opt.kind ? 'bg-sky-500/20 text-sky-400' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
                    <Icon className="h-4 w-4" /> {opt.label}
                  </button>
                );
              })}
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Couleur</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PEN_COLORS.map(c => (
                  <button key={c} onClick={() => setCurrentColor(c)} className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: c, borderColor: currentColor === c ? '#fff' : 'transparent', boxShadow: currentColor === c ? `0 0 8px ${c}` : 'none' }} />
                ))}
              </div>
            </div>
          )}

          {/* TEXT SUBMENU */}
          {openSubmenu === 'text' && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-2xl p-3 shadow-2xl z-20 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Taille</div>
              <div className="flex items-center gap-1">
                {TEXT_SIZES.map(s => (
                  <button key={s} onClick={() => setTextSize(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${textSize === s ? 'bg-sky-500/20 text-sky-400' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Couleur</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PEN_COLORS.map(c => (
                  <button key={c} onClick={() => setCurrentColor(c)} className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: c, borderColor: currentColor === c ? '#fff' : 'transparent', boxShadow: currentColor === c ? `0 0 8px ${c}` : 'none' }} />
                ))}
              </div>
            </div>
          )}

          {/* IMAGE MENU */}
          {showImageMenu && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-2xl p-3 shadow-2xl z-20 flex flex-col gap-3 w-64" onClick={e => e.stopPropagation()}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Ajouter une image</div>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-all border border-[#333]">
                <ImageIcon className="h-4 w-4" /> Depuis votre appareil
              </button>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Générer avec l&apos;IA</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAiImageGenerate(); }}
                  placeholder="Décrivez l'image..."
                  className="flex-1 bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-sky-500 transition-colors"
                />
                <button onClick={handleAiImageGenerate} disabled={isGeneratingImage || !aiImagePrompt.trim()}
                  className="px-3 py-2 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  {isGeneratingImage ? '...' : <Sparkles className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* DELETE BUTTON (when element selected) */}
          {selectedIds.length > 0 && (
            <div className="absolute left-3 bottom-4 z-20">
              <button onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all text-xs font-medium border border-red-500/30 shadow-xl backdrop-blur-sm">
                <Trash2 className="h-4 w-4" /> Supprimer
              </button>
            </div>
          )}

          {/* ZOOM */}
          <div className="absolute right-4 bottom-4 flex items-center gap-1.5 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-full px-2 py-1.5 shadow-2xl z-20">
            <button onClick={() => setCamera({ ...camera, zoom: Math.max(0.1, camera.zoom - 0.2) })}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-medium text-gray-400 w-9 text-center tabular-nums">{Math.round(camera.zoom * 100)}%</span>
            <button onClick={() => setCamera({ ...camera, zoom: Math.min(5, camera.zoom + 0.2) })}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-3 w-px bg-[#333]" />
            <button onClick={() => { if (typeof window !== "undefined") setCamera({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 }); }}
              title="Recentrer" className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors">
              <Maximize className="h-3.5 w-3.5" />
            </button>
          </div>
        </main>

        {/* AI Sidebar */}
        {showAiPanel && conversationId && (
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 border-l border-gray-200 bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-30">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-sky-500" />
                <span className="font-semibold text-sm text-gray-900">AI Assistant</span>
              </div>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowAiPanel(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <ToolChatThread kind="visualize" conversationId={conversationId} initialSpaceId={spaceId || undefined} hidePresets />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
