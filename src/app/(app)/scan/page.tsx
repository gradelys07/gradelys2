"use client";

import * as React from "react";
import { Upload, ScanLine, AlertTriangle, AlertCircle, CheckCircle2, Brain, Trash2, Plus } from "lucide-react";
import { useCreateScan, useDeleteScan, useScans } from "@/hooks/use-scans";
import { useCreateDeck } from "@/hooks/use-flashcards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRecordActivity } from "@/hooks/use-gamification";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatRelativeDate } from "@/lib/utils";
import { trackScanUploaded, trackViewContent } from "@/lib/whop/tracking";

export default function ScanPage() {
  const { data: scans, isLoading } = useScans();
  const createScan = useCreateScan();
  const deleteScan = useDeleteScan();
  const recordActivity = useRecordActivity();
  const subscription = useAuthStore((s) => s.subscription);

  const [subject, setSubject] = React.useState("");
  const [chapter, setChapter] = React.useState("");
  const [workFiles, setWorkFiles] = React.useState<{ preview: string; base64: string; mimeType: string }[]>([]);
  const [subjectFiles, setSubjectFiles] = React.useState<{ preview: string; base64: string; mimeType: string }[]>([]);
  const [correctionFiles, setCorrectionFiles] = React.useState<{ preview: string; base64: string; mimeType: string }[]>([]);
  const [selected, setSelected] = React.useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = React.useState<"work" | "subject" | "correction" | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    files.forEach((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error("Veuillez n'ajouter que des images.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newFile = { preview: result, base64: result.split(",")[1], mimeType: f.type };
        if (uploadTarget === "work") setWorkFiles(p => [...p, newFile]);
        if (uploadTarget === "subject") setSubjectFiles(p => [...p, newFile]);
        if (uploadTarget === "correction") setCorrectionFiles(p => [...p, newFile]);
      };
      reader.readAsDataURL(f);
    });
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadTarget(null);
  }

  function removeFile(target: "work" | "subject" | "correction", index: number) {
    if (target === "work") setWorkFiles(p => p.filter((_, i) => i !== index));
    if (target === "subject") setSubjectFiles(p => p.filter((_, i) => i !== index));
    if (target === "correction") setCorrectionFiles(p => p.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (useAuthStore.getState().user?.isAnonymous) {
      toast("Création de compte requise", { description: "Veuillez créer un compte pour commencer." });
      useAuthStore.getState().setShowAuthModal(true);
      return;
    }
    if (workFiles.length === 0 || !subject.trim()) {
      toast.error("Sujet et images de votre travail requis.");
      return;
    }
    try {
      const res = await createScan.mutateAsync({ 
        subject, 
        chapter, 
        workFiles: workFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType })),
        subjectFiles: subjectFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType })),
        correctionFiles: correctionFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType }))
      });
      setSelected(res.scan);
      setWorkFiles([]);
      setSubjectFiles([]);
      setCorrectionFiles([]);
      setSubject("");
      setChapter("");
      trackScanUploaded(subject);
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
      <p className="mt-2 text-body-lg text-text-secondary">Scanne ton devoir et reçois une correction détaillée étape par étape.</p>

      {subscription && (
        <p className="mt-2 text-body-sm text-text-muted">
          {subscription.creditsRemaining} sur {subscription.creditsMax} crédits restants.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border bg-surface p-6">
        <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleFile} />
        
        <button
          type="button"
          onClick={() => { setUploadTarget("work"); fileInputRef.current?.click(); }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors",
            workFiles.length > 0 ? "border-primary bg-[var(--primary-subtle)]/30" : "border-border-strong hover:border-primary"
          )}
        >
          {workFiles.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto px-4 w-full justify-center">
              {workFiles.map((f, i) => (
                <div key={i} className="relative group shrink-0">
                  <img src={f.preview} alt="Preview" className="max-h-56 rounded-md object-contain border border-border" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile("work", i); }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-text-muted" />
              <span className="text-body-md text-text-secondary">Ajouter une photo de ton travail</span>
              <span className="text-label-md text-text-muted">JPG ou PNG, jusqu'à 20MB</span>
            </>
          )}
        </button>

        <div className="flex flex-col gap-2 mt-4 bg-base p-3 rounded-md border border-border-subtle">
           {subjectFiles.length > 0 && (
             <div className="flex items-center gap-2 text-label-sm text-text-secondary">
               <span className="font-medium">Sujet de l'exercice :</span> {subjectFiles.length} fichier(s) attaché(s)
               <button type="button" onClick={() => setSubjectFiles([])} className="text-red hover:underline ml-2">Retirer</button>
             </div>
           )}
           {correctionFiles.length > 0 && (
             <div className="flex items-center gap-2 text-label-sm text-text-secondary">
               <span className="font-medium">Copie du professeur :</span> {correctionFiles.length} fichier(s) attaché(s)
               <button type="button" onClick={() => setCorrectionFiles([])} className="text-red hover:underline ml-2">Retirer</button>
             </div>
           )}
           <div className="flex flex-wrap gap-4 mt-1">
             <button type="button" onClick={() => { setUploadTarget("subject"); fileInputRef.current?.click(); }} className="text-label-sm flex items-center gap-1 text-primary hover:underline">
                <Plus className="w-3.5 h-3.5"/> Ajouter le sujet d'exercice (facultatif)
             </button>
             <button type="button" onClick={() => { setUploadTarget("correction"); fileInputRef.current?.click(); }} className="text-label-sm flex items-center gap-1 text-primary hover:underline">
                <Plus className="w-3.5 h-3.5"/> Ajouter la copie du professeur (facultatif)
             </button>
           </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matière (ex: Physique)" required />
          <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapitre (Facultatif)" />
        </div>

        <Button type="submit" className="mt-6 w-full" size="lg" loading={createScan.isPending} disabled={workFiles.length === 0} icon={<ScanLine className="h-4 w-4" />}>
          Analyser le devoir
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

const QUESTION_STYLES = {
  wrong: { icon: AlertCircle, className: "text-red border-red/30", bg: "bg-[var(--accent-red-subtle)]/30", label: "Faux" },
  partial: { icon: AlertTriangle, className: "text-yellow border-yellow/30", bg: "bg-[var(--accent-yellow-subtle)]/30", label: "Incomplet" },
  correct: { icon: CheckCircle2, className: "text-green border-green/30", bg: "bg-[var(--accent-green-subtle)]/30", label: "Correct" },
};

function QuestionChat({ scanId, question }: { scanId: string, question: any }) {
  const [messages, setMessages] = React.useState<{role: "user" | "assistant", content: string}[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || sending) return;
    
    const newMsg = { role: "user" as const, content: chatInput };
    setMessages(p => [...p, newMsg]);
    setChatInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/scans/${scanId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMsg.content, history: messages, questionContext: question })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chat");
      
      setMessages(p => [...p, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      toast.error(err.message);
      setMessages(p => p.filter(m => m !== newMsg));
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="mt-3 text-label-sm font-medium text-primary hover:underline">
        Poser une question sur cette question...
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-border-subtle pt-4">
      <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-xl px-4 py-2 text-body-sm", m.role === "user" ? "bg-primary text-white rounded-br-none" : "bg-elevated text-text-primary border border-border-subtle rounded-bl-none")}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-4 py-2 text-body-sm bg-elevated text-text-muted border border-border-subtle rounded-bl-none animate-pulse">
              Réflexion...
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleChatSubmit} className="flex gap-2">
        <Input 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)} 
          placeholder="Ta question..." 
          disabled={sending}
          className="flex-1 h-9 text-body-sm"
        />
        <Button type="submit" size="sm" disabled={!chatInput.trim() || sending}>
          Envoyer
        </Button>
      </form>
    </div>
  );
}

function ScanResult({ scan, onBack }: { scan: any; onBack: () => void }) {
  const diagnostic = scan.diagnostic;
  const createDeck = useCreateDeck();
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function handleSaveFlashcards() {
    if (useAuthStore.getState().user?.isAnonymous) {
      toast("Création de compte requise", { description: "Veuillez créer un compte pour commencer." });
      useAuthStore.getState().setShowAuthModal(true);
      return;
    }
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

      <h3 className="mt-6 text-heading-md text-text-primary">Correction Détaillée</h3>
      <div className="mt-4 space-y-4">
        {diagnostic.questions?.map((q: any) => {
          const style = QUESTION_STYLES[q.status as keyof typeof QUESTION_STYLES];
          const Icon = style.icon;
          return (
            <div key={q.id} className={cn("rounded-xl border p-5", style.className, style.bg)}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="text-body-md font-medium text-text-primary leading-tight">{q.questionText}</p>
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-base shrink-0", style.className)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-label-sm font-semibold">{style.label}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {q.remark && (
                  <p className="text-body-sm text-text-secondary">{q.remark}</p>
                )}
                {q.trick && (
                  <div className="p-3 bg-white/40 dark:bg-black/20 rounded-md border border-black/5 dark:border-white/5">
                    <p className="text-label-sm font-semibold text-text-primary mb-1">💡 Astuce</p>
                    <p className="text-body-sm">{q.trick}</p>
                  </div>
                )}
                {q.howToFix && (
                  <div className="p-3 bg-white/40 dark:bg-black/20 rounded-md border border-black/5 dark:border-white/5">
                    <p className="text-label-sm font-semibold text-text-primary mb-1">🛠 Comment compléter</p>
                    <p className="text-body-sm">{q.howToFix}</p>
                  </div>
                )}
                {(q.correction || q.whyErrorMade || q.stepByStep) && (
                  <div className="p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-black/10 dark:border-white/10 space-y-3">
                    {q.whyErrorMade && (
                      <div>
                        <p className="text-label-sm font-semibold text-text-primary mb-0.5">Pourquoi cette erreur ?</p>
                        <p className="text-body-sm text-text-secondary">{q.whyErrorMade}</p>
                      </div>
                    )}
                    {q.correction && (
                      <div>
                        <p className="text-label-sm font-semibold text-text-primary mb-0.5">Correction</p>
                        <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{q.correction}</p>
                      </div>
                    )}
                    {q.stepByStep && (
                      <div>
                        <p className="text-label-sm font-semibold text-text-primary mb-0.5">Étape par étape</p>
                        <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{q.stepByStep}</p>
                      </div>
                    )}
                    {q.howToHandleFuture && (
                      <div>
                        <p className="text-label-sm font-semibold text-text-primary mb-0.5">Pour la prochaine fois</p>
                        <p className="text-body-sm text-text-secondary">{q.howToHandleFuture}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <QuestionChat scanId={scan.id} question={q} />
            </div>
          );
        })}
      </div>

      {diagnostic.flashcards?.length > 0 && (
        <div className="mt-8">
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
