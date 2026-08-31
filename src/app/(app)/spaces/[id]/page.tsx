"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft, Plus, FileText, Link2, Youtube, Type, Trash2, NotebookPen, Upload, Loader2,
} from "lucide-react";
import {
  useAddSource, useDeleteSource, useDeleteSpace, useSources, useSpaces, useUploadSource,
} from "@/hooks/use-spaces";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatThread } from "@/components/chat/chat-thread";
import { ToolChatThread } from "@/components/space/tool-chat-thread";
import { useOrCreateToolConversation } from "@/hooks/use-or-create-tool-conversation";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import type { SourceType } from "@/types";

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

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<SourceType>("text");
  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const sourceCount = sources?.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
        <button onClick={() => router.push("/chat")} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="mt-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md text-2xl" style={{ backgroundColor: `${space?.color}20` }}>
              {space?.emoji}
            </div>
            <div>
              <h1 className="text-heading-xl text-text-primary">{space?.name}</h1>
              <p className="text-body-sm text-text-muted capitalize">{space?.template.replace("-", " ")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm("Delete this space? This cannot be undone.")) {
                deleteSpace.mutate(spaceId);
                router.push("/chat");
              }
            }}
            className="rounded-md p-2 text-text-muted hover:bg-hover hover:text-red"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Tabs defaultValue={searchParams.get("tab") || "sources"} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-2.5 sm:px-6">
          <TabsList>
            <TabsTrigger value="sources">Sources ({sourceCount})</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="sources" className="p-4 sm:p-6">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={() => setOpen(true)} icon={<Plus className="h-4 w-4" />}>Add source</Button>
            </div>
            {isLoading && <p className="text-body-sm text-text-muted">Loading…</p>}
            {!isLoading && sourceCount === 0 && (
              <p className="rounded-lg border border-dashed border-border-strong p-8 text-center text-body-sm text-text-muted">
                No sources yet — add a PDF, link, or note. Practice, Visualize, and Studio all need at least one source to work.
              </p>
            )}
            <div className="space-y-2">
              {sources?.map((source) => {
                const Icon = SOURCE_ICONS[source.type];
                return (
                  <div key={source.id} className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-medium text-text-primary">{source.name}</p>
                        <p className="text-label-md text-text-muted">{formatRelativeDate(source.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSource.mutate(source.id)}
                      className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-hover hover:text-red group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="h-full">
            {chatConvoId ? (
              <ChatThread conversationId={chatConvoId} spaceId={spaceId} placeholder={`Ask about ${space?.name || "this space"}…`} />
            ) : (
              <div className="flex h-full items-center justify-center text-body-sm text-text-muted">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up chat…
              </div>
            )}
          </TabsContent>

          <TabsContent value="practice" className="h-full">
            <SpaceToolTab kind="practice" spaceId={spaceId} spaceName={space?.name} />
          </TabsContent>
          <TabsContent value="visualize" className="h-full">
            <SpaceToolTab kind="visualize" spaceId={spaceId} spaceName={space?.name} />
          </TabsContent>
          <TabsContent value="studio" className="h-full">
            <SpaceToolTab kind="studio" spaceId={spaceId} spaceName={space?.name} />
          </TabsContent>
          <TabsContent value="notes" className="p-4 sm:p-6"><SpaceNotesTab spaceId={spaceId} /></TabsContent>
        </div>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen} title="Add a source">
        <div className="p-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong py-8 text-text-secondary transition-colors hover:border-primary disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-text-muted" />}
            <span className="text-body-sm">{uploading ? "Analyse et extraction en cours…" : "Upload a PDF or image from your device"}</span>
            {!uploading && <span className="text-label-md text-text-muted">Le contenu sera automatiquement extrait par l'IA</span>}
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFilePick} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-label-md text-text-muted">OR ADD A LINK / NOTE</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-2">
              {(["text", "url", "youtube"] as SourceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-body-sm capitalize transition-colors ${
                    type === t ? "border-primary bg-[var(--primary-subtle)] text-primary" : "border-border text-text-secondary hover:bg-hover"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1.5 block text-label-lg text-text-secondary">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chapter 4 recap" required />
            </div>
            {(type === "url" || type === "youtube") && (
              <div>
                <label className="mb-1.5 block text-label-lg text-text-secondary">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={type === "youtube" ? "https://youtube.com/watch?v=..." : "https://example.com/article"} type="url" required />
                <p className="mt-1.5 text-label-md text-text-muted">
                  {type === "youtube" ? "🎬" : "🌐"} Le contenu sera automatiquement extrait par l'IA.
                </p>
              </div>
            )}
            {type === "text" && (
              <div>
                <label className="mb-1.5 block text-label-lg text-text-secondary">Content</label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Collez le texte que cette source doit contenir…" required />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Extraction en cours…" : "Add source"}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

function SpaceToolTab({ kind, spaceId, spaceName }: { kind: "visualize" | "studio" | "practice"; spaceId: string; spaceName?: string }) {
  const conversationId = useOrCreateToolConversation(kind, spaceId, `${spaceName || "Space"} ${kind}`);
  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-body-sm text-text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up…
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
    const res = await createNote.mutateAsync({ title: "Untitled note", content: "", spaceId });
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
      <div>
        <button onClick={() => setSelectedId(null)} className="text-body-sm text-text-muted hover:text-text-primary">← All notes</button>
        <Textarea value={content} onChange={(e) => handleChange(e.target.value)} rows={16} className="mt-3 border-none bg-transparent p-0 text-body-lg leading-relaxed focus-visible:shadow-none" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>New note</Button>
      </div>
      {spaceNotes.length === 0 && <EmptyState icon={NotebookPen} text="No notes in this space yet." />}
      <div className="space-y-2">
        {spaceNotes.map((n) => (
          <div key={n.id} className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-surface p-4">
            <button onClick={() => setSelectedId(n.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-body-sm font-medium text-text-primary">{n.title}</p>
              <p className="text-label-md text-text-muted">{formatRelativeDate(n.updatedAt)}</p>
            </button>
            <button onClick={() => deleteNote.mutate(n.id)} className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-hover hover:text-red group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
      <Icon className="mx-auto h-6 w-6 text-text-muted" />
      <p className="mt-2 text-body-sm text-text-muted">{text}</p>
    </div>
  );
}
