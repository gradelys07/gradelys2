"use client";

import * as React from "react";
import { Upload, ScanLine, AlertTriangle, AlertCircle, CheckCircle2, Brain, Trash2 } from "lucide-react";
import { useCreateScan, useDeleteScan, useScans } from "@/hooks/use-scans";
import { useCreateDeck } from "@/hooks/use-flashcards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRecordActivity } from "@/hooks/use-gamification";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatRelativeDate } from "@/lib/utils";

export default function ScanPage() {
  const { data: scans, isLoading } = useScans();
  const createScan = useCreateScan();
  const deleteScan = useDeleteScan();
  const recordActivity = useRecordActivity();
  const subscription = useAuthStore((s) => s.subscription);

  const [subject, setSubject] = React.useState("");
  const [chapter, setChapter] = React.useState("");
  const [file, setFile] = React.useState<{ preview: string; base64: string; mimeType: string } | null>(null);
  const [selected, setSelected] = React.useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image (photo of your exam/homework).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFile({ preview: result, base64: result.split(",")[1], mimeType: f.type });
    };
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !subject.trim()) return;
    try {
      const res = await createScan.mutateAsync({ subject, chapter, imageBase64: file.base64, mimeType: file.mimeType });
      setSelected(res.scan);
      setFile(null);
      setSubject("");
      setChapter("");
      recordActivity.mutate();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (selected) {
    return <ScanResult scan={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-display-md text-text-primary">Scan</h1>
      <p className="mt-2 text-body-lg text-text-secondary">Photograph a graded exam or homework and get an instant diagnostic.</p>

      {subscription && (
        <p className="mt-2 text-body-sm text-text-muted">
          {subscription.creditsRemaining} of {subscription.creditsMax} scan credits remaining this period.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border bg-surface p-6">
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors",
            file ? "border-primary" : "border-border-strong hover:border-primary"
          )}
        >
          {file ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.preview} alt="Preview" className="max-h-56 rounded-md object-contain" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-text-muted" />
              <span className="text-body-md text-text-secondary">Click to upload a photo</span>
              <span className="text-label-md text-text-muted">JPG or PNG, up to 20MB</span>
            </>
          )}
        </button>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g. Physics)" required />
          <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter (optional)" />
        </div>

        <Button type="submit" className="mt-4 w-full" size="lg" loading={createScan.isPending} disabled={!file} icon={<ScanLine className="h-4 w-4" />}>
          Analyze
        </Button>
      </form>

      <h2 className="mt-10 text-heading-lg text-text-primary">Past scans</h2>
      {isLoading && <p className="mt-3 text-body-sm text-text-muted">Loading…</p>}
      <div className="mt-4 space-y-2">
        {scans?.map((scan) => (
          <div
            key={scan.id}
            onClick={() => scan.status === "ready" && setSelected(scan)}
            className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
          >
            <div>
              <p className="text-body-sm font-medium text-text-primary">{scan.subject} {scan.chapter && `— ${scan.chapter}`}</p>
              <p className="text-label-md text-text-muted">
                {scan.status === "processing" ? "Processing…" : scan.status === "error" ? "Failed" : `Grade: ${scan.diagnostic?.currentGrade}/20`} · {formatRelativeDate(scan.createdAt)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteScan.mutate(scan.id);
              }}
              className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-hover hover:text-red group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const ERROR_STYLES = {
  error: { icon: AlertCircle, className: "text-red bg-[var(--accent-red-subtle)] border-red/30" },
  weak: { icon: AlertTriangle, className: "text-yellow bg-[var(--accent-yellow-subtle)] border-yellow/30" },
  correct: { icon: CheckCircle2, className: "text-green bg-[var(--accent-green-subtle)] border-green/30" },
};

function ScanResult({ scan, onBack }: { scan: any; onBack: () => void }) {
  const diagnostic = scan.diagnostic;
  const createDeck = useCreateDeck();
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function handleSaveFlashcards() {
    if (!diagnostic?.flashcards?.length) return;
    setSaving(true);
    try {
      const deck = await createDeck.mutateAsync({ name: `Review — ${scan.subject}`, subject: scan.subject });
      for (const fc of diagnostic.flashcards) {
        // eslint-disable-next-line no-await-in-loop
        await fetch(`/api/decks/${deck.deck.id}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: fc.question, answer: fc.answer }),
        });
      }
      setSaved(true);
      toast.success("Flashcards saved to Practice");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!diagnostic) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-body-md text-text-secondary">This scan is still processing or failed.</p>
        <Button className="mt-4" onClick={onBack}>Back</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={onBack} className="text-body-sm text-text-muted hover:text-text-primary">← Back to scans</button>

      <div className="mt-4 flex items-center gap-6 rounded-lg border border-border bg-surface p-6">
        <div className="text-center">
          <div className="text-display-lg text-text-primary">{diagnostic.currentGrade}/20</div>
          <div className="text-label-md text-text-muted">Current grade</div>
        </div>
        <div className="text-2xl text-text-muted">→</div>
        <div className="text-center">
          <div className="text-display-lg text-green">{diagnostic.potentialGrade}/20</div>
          <div className="text-label-md text-text-muted">Potential grade</div>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-border-subtle bg-base p-4 text-body-sm text-text-secondary">{diagnostic.globalFeedback}</p>

      <h3 className="mt-6 text-heading-md text-text-primary">Breakdown</h3>
      <div className="mt-3 space-y-2">
        {diagnostic.errors?.map((err: any) => {
          const style = ERROR_STYLES[err.type as keyof typeof ERROR_STYLES];
          const Icon = style.icon;
          return (
            <div key={err.id} className={cn("rounded-md border p-4", style.className)}>
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-body-sm font-medium">{err.title}</p>
                  <p className="mt-1 text-body-sm opacity-90">{err.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {diagnostic.flashcards?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-heading-md text-text-primary">Flashcards to fix your gaps</h3>
          <div className="mt-3 space-y-2">
            {diagnostic.flashcards.map((fc: any) => (
              <div key={fc.id} className="rounded-md border border-border-subtle bg-base p-4">
                <p className="text-body-sm font-medium text-text-primary">{fc.question}</p>
                <p className="mt-1 text-body-sm text-text-muted">{fc.answer}</p>
              </div>
            ))}
          </div>
          <Button className="mt-4" onClick={handleSaveFlashcards} disabled={saved} loading={saving} icon={<Brain className="h-4 w-4" />}>
            {saved ? "Saved to Practice" : "Save as flashcard deck"}
          </Button>
        </div>
      )}
    </div>
  );
}
