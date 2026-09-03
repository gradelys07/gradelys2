"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft, Plus, FileText, Link2, Youtube, Type, Trash2, NotebookPen, Upload, Loader2,
  ChevronUp, Sparkles, PenTool, LayoutDashboard, MessageSquare, Wrench
} from "lucide-react";
import {
  useAddSource, useDeleteSource, useDeleteSpace, useSources, useSpaces, useUploadSource,
} from "@/hooks/use-spaces";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ChatThread } from "@/components/chat/chat-thread";
import { ToolChatThread } from "@/components/space/tool-chat-thread";
import { useOrCreateToolConversation } from "@/hooks/use-or-create-tool-conversation";
import { formatRelativeDate, cn } from "@/lib/utils";
import { useMessages } from "@/hooks/use-chat";
import { toast } from "sonner";
import type { SourceType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/ui-store";

const SOURCE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText, url: Link2, youtube: Youtube, text: Type, spreadsheet: FileText, image: FileText,
};

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceId = params.id as string;
  const { data: spaces } = useSpaces();
  const space = spaces?.find((s) => s.id === spaceId);
  const { data: sources, isLoading } = useSources(spaceId);
  const addSource = useAddSource(spaceId);
  const uploadSource = useUploadSource(spaceId);
  const deleteSource = useDeleteSource(spaceId);
  const deleteSpace = useDeleteSpace();

  const chatConvoId = useOrCreateToolConversation("chat", spaceId, `${space?.name || "Space"} chat`);
  const { data: messages } = useMessages(chatConvoId);
  const hasMessages = messages && messages.length > 0;

  const toolsMode = useUIStore((s) => s.toolsMode);
  const setToolsMode = useUIStore((s) => s.setToolsMode);
  const [activeTab, setActiveTab] = React.useState(searchParams.get("tab") || "chat");
  const [tabKey, setTabKey] = React.useState(0);
  const [startedChatting, setStartedChatting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<SourceType>("text");
  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isFullScreen = hasMessages || startedChatting || activeTab !== "chat";

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (toolsMode) {
      timeout = setTimeout(() => {
        setToolsMode(false);
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [toolsMode, setToolsMode]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) {
      setTabKey((k) => k + 1); // Force remount if clicking the same tab
    } else {
      setTabKey(0);
    }
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      await addSource.mutateAsync({ type, name, url: url || undefined, contentPreview: content });
      toast.success(type === "youtube" ? "Video YouTube analysée et ajoutée !" : "Source ajoutée");
      setName("");
      setContent("");
      setUrl("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add source");
    } finally {
      setUploading(false);
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await uploadSource.mutateAsync({ fileName: file.name, mimeType: file.type, fileBase64: base64 });
      toast.success(`"${file.name}" analysé et ajouté`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const renderOutilsMenu = () => {
    return (
      <button 
        type="button" 
        onClick={() => setToolsMode(!toolsMode)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Wrench className="h-4 w-4" />
        {toolsMode ? "Fermer" : "Outils"}
      </button>
    );
  };

  return (
    <div className={cn(
      "flex h-full flex-col bg-background p-4 sm:p-6 mx-auto w-full relative overflow-hidden transition-all duration-300",
      isFullScreen ? "max-w-full px-4 sm:px-8" : "max-w-5xl"
    )}>
      <AnimatePresence>
        {toolsMode && (
          <motion.div
            key="tools"
            className="fixed z-[60] left-1/2 bottom-32 -translate-x-1/2 flex items-center justify-center gap-2 bg-surface/90 backdrop-blur-xl p-3 rounded-2xl border border-border-subtle shadow-2xl"
            initial={{ opacity: 0, y: -400, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -400, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button onClick={() => { handleTabChange("chat"); setToolsMode(false); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-hover min-w-[80px] transition-colors">
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary"><MessageSquare className="h-5 w-5" /></div>
              <span className="text-label-sm font-medium">Chat</span>
            </button>
            <button onClick={() => { handleTabChange("visualize"); setToolsMode(false); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-hover min-w-[80px] transition-colors">
              <div className="bg-blue/10 p-2.5 rounded-lg text-blue"><LayoutDashboard className="h-5 w-5" /></div>
              <span className="text-label-sm font-medium">Visualize</span>
            </button>
            <button onClick={() => { handleTabChange("studio"); setToolsMode(false); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-hover min-w-[80px] transition-colors">
              <div className="bg-orange/10 p-2.5 rounded-lg text-orange"><PenTool className="h-5 w-5" /></div>
              <span className="text-label-sm font-medium">Studio</span>
            </button>
            <button onClick={() => { handleTabChange("practice"); setToolsMode(false); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-hover min-w-[80px] transition-colors">
              <div className="bg-purple/10 p-2.5 rounded-lg text-purple"><Sparkles className="h-5 w-5" /></div>
              <span className="text-label-sm font-medium">Practice</span>
            </button>
            <button onClick={() => { handleTabChange("notes"); setToolsMode(false); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-hover min-w-[80px] transition-colors">
              <div className="bg-green/10 p-2.5 rounded-lg text-green"><NotebookPen className="h-5 w-5" /></div>
              <span className="text-label-sm font-medium">Notes</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* En-tête de l'espace */}
      <div className={cn("flex items-center justify-between w-full max-w-3xl mx-auto z-10 relative transition-all duration-500", isFullScreen ? "h-0 mb-0 opacity-0 overflow-hidden" : "h-14 mb-4 opacity-100")}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/chat")} className="flex items-center justify-center rounded-full p-2 text-text-muted hover:bg-hover hover:text-text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm border border-border-subtle" style={{ backgroundColor: `${space?.color}15` }}>
              {space?.emoji}
            </div>
            <div>
              <h1 className="text-body-lg font-semibold text-text-primary">{space?.name}</h1>
              <p className="text-label-sm text-text-muted capitalize">{space?.template.replace("-", " ")}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            if (confirm("Delete this space? This cannot be undone.")) {
              deleteSpace.mutate(spaceId);
              router.push("/chat");
            }
          }}
          className="rounded-full p-2 text-text-muted hover:bg-red-50 hover:text-red transition-colors"
          title="Supprimer l'espace"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Zone centrale du Chat / Outils */}
      <div className="flex-1 flex flex-col items-center min-h-0 mb-6 relative z-10 w-full transition-all duration-500">
        <div className={cn(
          "w-full bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden relative transition-all duration-500",
          isFullScreen ? "max-w-full flex-1 h-full" : "max-w-3xl h-[500px]"
        )}>
          {activeTab === "chat" && (
            <div className="absolute inset-0">
              {chatConvoId ? (
                <ChatThread 
                  conversationId={chatConvoId} 
                  spaceId={spaceId} 
                  placeholder={`Que voulez-vous savoir sur ${space?.name || "cet espace"}…`} 
                  renderInputToolbar={renderOutilsMenu}
                  onMessageSent={() => setStartedChatting(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-body-sm text-text-muted">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Préparation de l'espace…
                </div>
              )}
            </div>
          )}

          {activeTab === "practice" && (
            <div className="absolute inset-0 flex flex-col">
              <div className="px-4 py-2 border-b border-border-subtle bg-surface flex items-center justify-between">
                 <span className="text-body-sm font-medium text-text-muted">Outil: Practice</span>
                 {renderOutilsMenu()}
              </div>
              <div className="flex-1 overflow-hidden">
                 <SpaceToolTab key={`practice-${tabKey}`} kind="practice" spaceId={spaceId} spaceName={space?.name} />
              </div>
            </div>
          )}
          
          {activeTab === "visualize" && (
            <div className="absolute inset-0 flex flex-col">
              <div className="px-4 py-2 border-b border-border-subtle bg-surface flex items-center justify-between">
                 <span className="text-body-sm font-medium text-text-muted">Outil: Visualize</span>
                 {renderOutilsMenu()}
              </div>
              <div className="flex-1 overflow-hidden">
                <SpaceToolTab key={`visualize-${tabKey}`} kind="visualize" spaceId={spaceId} spaceName={space?.name} />
              </div>
            </div>
          )}
          
          {activeTab === "studio" && (
            <div className="absolute inset-0 flex flex-col">
              <div className="px-4 py-2 border-b border-border-subtle bg-surface flex items-center justify-between">
                 <span className="text-body-sm font-medium text-text-muted">Outil: Studio</span>
                 {renderOutilsMenu()}
              </div>
              <div className="flex-1 overflow-hidden">
                <SpaceToolTab key={`studio-${tabKey}`} kind="studio" spaceId={spaceId} spaceName={space?.name} />
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 bg-surface-subtle">
              <div className="mx-auto max-w-4xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-heading-lg text-text-primary">Notes de l'espace</h2>
                  {renderOutilsMenu()}
                </div>
                <SpaceNotesTab spaceId={spaceId} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rangée des sources en dessous */}
      <div className="h-32 shrink-0 relative z-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-label-lg font-semibold text-text-secondary uppercase tracking-wider">
            Sources Jointes ({sources?.length || 0})
          </h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          <button 
            onClick={() => setOpen(true)}
            className="snap-start shrink-0 flex flex-col items-center justify-center h-[90px] w-[110px] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-text-muted hover:text-primary group"
          >
            <Plus className="h-6 w-6 mb-1 text-text-muted group-hover:text-primary transition-colors" />
            <span className="text-label-sm font-medium">Ajouter</span>
          </button>
          
          {isLoading && (
            <div className="flex items-center justify-center h-[90px] w-[110px] rounded-xl border border-border bg-surface">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          )}

          {sources?.map((source) => {
            const Icon = SOURCE_ICONS[source.type];
            return (
              <div key={source.id} className="snap-start shrink-0 relative group flex flex-col items-center justify-center h-[90px] w-[130px] rounded-xl border border-border bg-surface p-2 shadow-sm hover:shadow-md transition-all">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="w-full truncate text-center text-label-sm font-medium text-text-primary px-1" title={source.name}>
                  {source.name}
                </p>
                <button
                  onClick={() => deleteSource.mutate(source.id)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-sm"
                  title="Supprimer la source"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="Ajouter une source">
        <div className="p-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong py-8 text-text-secondary transition-colors hover:border-primary disabled:opacity-60 bg-surface"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-text-muted" />}
            <span className="text-body-sm">{uploading ? "Analyse et extraction en cours…" : "Upload a PDF or image from your device"}</span>
            {!uploading && <span className="text-label-md text-text-muted">Le contenu sera automatiquement extrait par l'IA</span>}
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFilePick} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-label-md text-text-muted font-medium">OU AJOUTER UN LIEN / TEXTE</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-2">
              {(["text", "url", "youtube"] as SourceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-body-sm font-medium capitalize transition-colors ${
                    type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary hover:bg-hover hover:text-text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1.5 block text-label-lg font-medium text-text-secondary">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Chapitre 4 résumé" required />
            </div>
            {(type === "url" || type === "youtube") && (
              <div>
                <label className="mb-1.5 block text-label-lg font-medium text-text-secondary">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={type === "youtube" ? "https://youtube.com/watch?v=..." : "https://example.com/article"} type="url" required />
                <p className="mt-1.5 text-label-md text-text-muted flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Le contenu sera automatiquement extrait par l'IA.
                </p>
              </div>
            )}
            {type === "text" && (
              <div>
                <label className="mb-1.5 block text-label-lg font-medium text-text-secondary">Contenu</label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Collez le texte que cette source doit contenir…" required className="resize-none" />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Extraction en cours…</span>
              ) : "Ajouter la source"}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

function SpaceToolTab({ kind, spaceId, spaceName }: { kind: "visualize" | "studio" | "practice"; spaceId: string; spaceName?: string }) {
  const conversationId = useOrCreateToolConversation(kind, spaceId, `${spaceName || "Space"} ${kind}`, true);
  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-body-sm text-text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Configuration de l'outil…
      </div>
    );
  }
  return <ToolChatThread kind={kind} conversationId={conversationId} initialSpaceId={spaceId} lockSpace />;
}

function SpaceNotesTab({ spaceId }: { spaceId: string }) {
  const { data: notes } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const spaceNotes = notes?.filter((n) => n.spaceId === spaceId) || [];
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [content, setContent] = React.useState("");
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  const selected = spaceNotes.find((n) => n.id === selectedId);
  React.useEffect(() => {
    if (selected) setContent(selected.content);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    const res = await createNote.mutateAsync({ title: "Nouvelle note", content: "", spaceId });
    setSelectedId(res.note.id);
  }

  function handleChange(value: string) {
    setContent(value);
    if (!selectedId) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => updateNote.mutate({ id: selectedId, content: value }), 700);
  }

  if (selected) {
    return (
      <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm min-h-[500px] flex flex-col">
        <div className="mb-4">
          <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-body-sm font-medium text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Toutes les notes
          </button>
        </div>
        <Textarea 
          value={content} 
          onChange={(e) => handleChange(e.target.value)} 
          className="flex-1 resize-none border-none bg-transparent p-0 text-body-lg leading-relaxed focus-visible:ring-0 focus-visible:shadow-none" 
          placeholder="Commencez à écrire votre note ici..."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>Nouvelle note</Button>
      </div>
      
      {spaceNotes.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <NotebookPen className="h-6 w-6 text-primary" />
          </div>
          <p className="text-body-md font-medium text-text-primary mb-1">C'est un peu vide par ici</p>
          <p className="text-body-sm text-text-muted">Aucune note dans cet espace pour le moment.</p>
        </div>
      )}
      
      <div className="grid gap-3 sm:grid-cols-2">
        {spaceNotes.map((n) => (
          <div key={n.id} className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => setSelectedId(n.id)}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md font-semibold text-text-primary mb-1">{n.title || "Nouvelle note"}</p>
              <p className="text-label-md text-text-muted">{formatRelativeDate(n.updatedAt)}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                deleteNote.mutate(n.id);
              }} 
              className="shrink-0 rounded-full p-2 text-text-muted opacity-0 hover:bg-red-50 hover:text-red group-hover:opacity-100 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
