"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, Search, Trash2, ChevronLeft, ChevronRight, List, BookOpen, Brain,
} from "lucide-react";
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from "@/hooks/use-notes";
import { useCreateDeck, useGenerateFlashcards } from "@/hooks/use-flashcards";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeDate, truncate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";

export default function NotesPage() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createDeck = useCreateDeck();
  const generateFlashcards = useGenerateFlashcards();
  const searchParams = useSearchParams();

  const { t } = useTranslation();
  const [view, setView] = React.useState<"notebook" | "list">("notebook");
  const [search, setSearch] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>();
  const touchStartX = React.useRef<number | null>(null);

  const filtered = React.useMemo(
    () => (notes || []).filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())),
    [notes, search]
  );
  const current = filtered[index];

  React.useEffect(() => {
    if (searchParams.get("new") === "1") handleCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (index >= filtered.length) setIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, index]);

  React.useEffect(() => {
    if (current) {
      setTitle(current.title);
      setContent(current.content);
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!current) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setSaving(true);
      updateNote.mutate({ id: current.id, title: title || "Untitled note", content }, { onSettled: () => setSaving(false) });
    }, 700);
    return () => clearTimeout(saveTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  async function handleCreate() {
    const res = await createNote.mutateAsync({ title: "Untitled note", content: "" });
    setView("notebook");
    setTimeout(() => setIndex(0), 0);
  }

  async function handleDelete(id: string) {
    await deleteNote.mutateAsync(id);
  }

  async function handleFlashcards() {
    if (!current) return;
    try {
      const deck = await createDeck.mutateAsync({ name: current.title, subject: "General" });
      await generateFlashcards.mutateAsync({ deckId: deck.deck.id, sourceText: current.content, count: 10 });
      toast.success("Flashcards generated — check Practice");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setIndex((i) => Math.min(filtered.length - 1, i + 1));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) goPrev();
    if (delta < -60) goNext();
    touchStartX.current = null;
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view !== "notebook") return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, filtered.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-3 sm:px-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setIndex(0); }} placeholder={t("notes.searchPlaceholder")} className="h-9 pl-8" />
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          <button
            onClick={() => setView("notebook")}
            className={cn("flex items-center gap-1.5 rounded px-2.5 py-1.5 text-label-lg", view === "notebook" ? "bg-primary text-white" : "text-text-secondary hover:bg-hover")}
          >
            <BookOpen className="h-3.5 w-3.5" /> {t("notes.notebookView")}
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("flex items-center gap-1.5 rounded px-2.5 py-1.5 text-label-lg", view === "list" ? "bg-primary text-white" : "text-text-secondary hover:bg-hover")}
          >
            <List className="h-3.5 w-3.5" /> {t("notes.listView")}
          </button>
        </div>
        <Button size="sm" onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>{t("notes.newNote")}</Button>
      </div>

      {isLoading && <div className="p-6 text-body-sm text-text-muted">Loading…</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BookOpen className="h-10 w-10 text-text-muted" />
          <p className="mt-3 text-body-lg text-text-secondary">{t("notes.empty")}</p>
          <Button className="mt-4" onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>{t("notes.emptyCta")}</Button>
        </div>
      )}

      {view === "notebook" && filtered.length > 0 && current && (
        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-8">
          <div className="flex w-full max-w-2xl items-center gap-3">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary hover:bg-hover disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="relative flex-1 rounded-2xl border border-border-strong bg-white p-6 shadow-l2 sm:p-8"
              style={{ minHeight: "60vh", borderLeft: "4px solid var(--primary)" }}
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled note"
                className="w-full bg-transparent text-heading-xl text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-2 text-label-md text-text-muted">
                <span>{formatRelativeDate(current.updatedAt)}</span>
                {saving && <span>· Saving…</span>}
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing…"
                className="mt-4 h-[calc(60vh-100px)] resize-none border-none bg-transparent p-0 text-body-lg leading-relaxed focus-visible:shadow-none"
              />

              <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
                <button onClick={() => handleDelete(current.id)} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-red">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <button onClick={handleFlashcards} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-label-lg text-text-secondary hover:bg-hover">
                  <Brain className="h-3.5 w-3.5 text-green" /> Flashcards
                </button>
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={index === filtered.length - 1}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary hover:bg-hover disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 text-body-sm text-text-muted">
            {t("notes.page")} {index + 1} / {filtered.length} · {t("notes.swipeHint")}
          </div>
        </div>
      )}

      {view === "list" && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note, i) => (
              <button
                key={note.id}
                onClick={() => {
                  setIndex(i);
                  setView("notebook");
                }}
                className="group relative rounded-lg border border-border bg-white p-4 text-left shadow-l1 hover:border-border-strong"
                style={{ borderLeft: "3px solid var(--primary)" }}
              >
                <p className="truncate text-body-md font-medium text-text-primary">{note.title || "Untitled note"}</p>
                <p className="mt-1 text-body-sm text-text-muted">{truncate(note.content.replace(/[#*_`]/g, ""), 80) || "Empty note"}</p>
                <p className="mt-2 text-label-md text-text-muted">{formatRelativeDate(note.updatedAt)}</p>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                  className="absolute right-3 top-3 rounded p-1 text-text-muted opacity-0 hover:bg-hover hover:text-red group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
