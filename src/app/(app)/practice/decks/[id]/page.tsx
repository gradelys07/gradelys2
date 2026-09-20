"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Plus, RotateCw, Trash2 } from "lucide-react";
import { useAddCard, useCards, useDeleteCard, useGenerateFlashcards, useReviewCard, useDecks } from "@/hooks/use-flashcards";
import { useSaveSession } from "@/hooks/use-practice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRecordActivity } from "@/hooks/use-gamification";
import type { Rating } from "@/types";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const { data: decks } = useDecks();
  const deck = decks?.find((d) => d.id === deckId);
  const { data: cards, isLoading } = useCards(deckId);
  const reviewCard = useReviewCard(deckId);
  const addCard = useAddCard(deckId);
  const deleteCard = useDeleteCard(deckId);
  const generateFlashcards = useGenerateFlashcards();
  const recordActivity = useRecordActivity();
  const saveSession = useSaveSession();

  const [mode, setMode] = React.useState<"list" | "review">("list");
  const [reviewIndex, setReviewIndex] = React.useState(0);
  const [addOpen, setAddOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  const dueCards = React.useMemo(() => {
    if (!cards) return [];
    const now = new Date();
    return cards.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
  }, [cards]);

  const [userAnswer, setUserAnswer] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [sessionStartTime, setSessionStartTime] = React.useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = React.useState(0);

  function startReview() {
    setReviewIndex(0);
    setVerified(false);
    setUserAnswer("");
    setCorrectAnswers(0);
    setSessionStartTime(Date.now());
    setMode("review");
  }

  function handleVerify() {
    setVerified(true);
  }

  async function handleRate(rating: Rating) {
    const card = dueCards[reviewIndex];
    reviewCard.mutate({ id: card.id, rating });
    recordActivity.mutate();
    
    const isCorrect = rating === "good" || rating === "easy";
    const finalCorrectAnswers = correctAnswers + (isCorrect ? 1 : 0);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    if (reviewIndex < dueCards.length - 1) {
      setReviewIndex(reviewIndex + 1);
      setVerified(false);
      setUserAnswer("");
    } else {
      // Create a practice session record for the Progress page
      const timeTakenSeconds = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
      const totalQuestions = dueCards.length;
      const score = Math.round((finalCorrectAnswers / totalQuestions) * 100);

      await saveSession.mutateAsync({
        mode: "flashcards",
        subject: deck?.subject || "Flashcards",
        score,
        totalQuestions,
        correctAnswers: finalCorrectAnswers,
        timeTakenSeconds,
        spaceId: (deck as any)?.spaceId || null,
      });

      setMode("list");
      toast.success("Review session complete 🎉");
    }
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    await addCard.mutateAsync({ question, answer });
    setQuestion("");
    setAnswer("");
    setAddOpen(false);
  }

  async function handleGenerateMore() {
    setGenerating(true);
    try {
      await generateFlashcards.mutateAsync({
        deckId,
        topic: deck?.subject || deck?.name || "this topic",
        spaceId: (deck as any)?.space_id || (deck as any)?.spaceId || undefined,
        count: 8,
      });
      toast.success("8 more flashcards added");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (mode === "review" && dueCards.length > 0) {
    const card = dueCards[reviewIndex];
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={async () => {
              if (reviewIndex > 0) {
                const timeTakenSeconds = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
                await saveSession.mutateAsync({
                  mode: "flashcards",
                  subject: deck?.subject || "Flashcards",
                  score: Math.round((correctAnswers / reviewIndex) * 100),
                  totalQuestions: reviewIndex,
                  correctAnswers: correctAnswers,
                  timeTakenSeconds,
                  spaceId: (deck as any)?.spaceId || null,
                });
                toast.success("Partial session saved");
              }
              setMode("list");
            }} 
            className="flex items-center gap-1.5 text-body-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Exit review
          </button>
          <span className="rounded-full bg-surface-elevated px-3 py-1 text-label-sm font-bold text-primary shadow-sm border border-border">
            {reviewIndex + 1} / {dueCards.length}
          </span>
        </div>

        <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-surface to-surface-elevated p-8 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl"></div>
          
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-label-xs font-bold uppercase tracking-wider text-primary mb-4">Question</span>
          <p className="text-heading-lg font-bold text-text-primary leading-tight">{card.question}</p>

          <div className="mt-8">
            <label className="mb-2 block text-label-md font-semibold text-text-secondary">Your answer</label>
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={verified}
              placeholder="Type your answer…"
              rows={3}
              className="resize-none rounded-xl border-border bg-black/5 p-4 text-body-md focus:border-primary/50 focus:ring-primary/20"
              autoFocus
            />
          </div>

          {!verified ? (
            <Button className="mt-6 w-full rounded-xl py-6 text-label-lg shadow-lg hover:shadow-primary/25 transition-all" onClick={handleVerify}>
              Verify Answer
            </Button>
          ) : (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 p-5 shadow-inner">
              <span className="flex items-center gap-2 text-label-sm font-bold uppercase tracking-wider text-emerald-600 mb-2">
                <Sparkles className="h-4 w-4" /> Correct answer
              </span>
              <p className="text-body-lg font-medium text-text-primary">{card.answer}</p>
            </div>
          )}
        </div>

        {verified && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="mb-3 text-center text-label-md font-bold text-text-muted">How did you do?</p>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => handleRate("again")} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-red/20 bg-gradient-to-br from-red/10 to-red/5 py-4 text-label-md font-bold text-red shadow-sm transition-all hover:scale-105 hover:bg-red/10 hover:shadow-md">
                <span className="text-2xl mb-1">😓</span>
                Again
              </button>
              <button onClick={() => handleRate("hard")} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-500/5 py-4 text-label-md font-bold text-orange-500 shadow-sm transition-all hover:scale-105 hover:bg-orange-500/10 hover:shadow-md">
                <span className="text-2xl mb-1">🤔</span>
                Hard
              </button>
              <button onClick={() => handleRate("good")} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 py-4 text-label-md font-bold text-primary shadow-sm transition-all hover:scale-105 hover:bg-primary/10 hover:shadow-md">
                <span className="text-2xl mb-1">👍</span>
                Good
              </button>
              <button onClick={() => handleRate("easy")} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 py-4 text-label-md font-bold text-emerald-500 shadow-sm transition-all hover:scale-105 hover:bg-emerald-500/10 hover:shadow-md">
                <span className="text-2xl mb-1">😎</span>
                Easy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button onClick={() => router.push("/practice")} className="flex items-center gap-1.5 text-label-sm font-medium text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Practice
      </button>

      <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-display-lg font-black text-text-primary tracking-tight">{deck?.name || "Deck"}</h1>
          <p className="mt-2 inline-flex items-center rounded-full bg-surface-elevated border border-border px-3 py-1 text-label-sm font-medium text-text-secondary shadow-sm">
            {deck?.subject}
          </p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button variant="secondary" className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all sm:flex-none" onClick={handleGenerateMore} loading={generating} icon={<Sparkles className="h-4 w-4" />}>
            Generate more
          </Button>
          <Button className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all sm:flex-none" onClick={() => setAddOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Add card
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-surface to-surface-elevated p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                <RotateCw className="h-6 w-6" />
              </div>
              <div>
                <p className="text-heading-md font-bold text-text-primary">{dueCards.length} cards due</p>
                <p className="text-body-sm font-medium text-text-muted">{cards?.length || 0} total cards in this deck</p>
              </div>
            </div>
          </div>
          <Button 
            size="lg"
            className="w-full sm:w-auto rounded-xl shadow-lg hover:shadow-primary/25 transition-all text-label-md" 
            onClick={startReview} 
            disabled={dueCards.length === 0} 
            icon={<RotateCw className="h-5 w-5" />}
          >
            Start review session
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-heading-md font-bold text-text-primary flex items-center gap-2">
          Flashcards <span className="rounded-full bg-black/5 px-2 py-0.5 text-label-sm text-text-muted">{cards?.length || 0}</span>
        </h2>
        
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-2xl border border-border/50 bg-surface-elevated animate-pulse"></div>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards?.map((card) => (
            <div 
              key={card.id} 
              className="group relative flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-gradient-to-b from-surface to-surface-elevated p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => deleteCard.mutate(card.id)}
                  className="rounded-full bg-white/50 p-2 text-text-muted opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-red/10 hover:text-red group-hover:opacity-100 border border-border/50"
                  title="Delete card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mb-6">
                <span className="mb-3 inline-block rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  Question
                </span>
                <p className="text-body-md font-bold text-text-primary line-clamp-4">{card.question}</p>
              </div>
              
              <div className="mt-auto border-t border-border-subtle pt-4">
                <span className="mb-2 inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Answer
                </span>
                <p className="text-body-sm font-medium text-text-muted line-clamp-3 group-hover:text-text-secondary transition-colors">{card.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen} title="Add a flashcard">
        <form onSubmit={handleAddCard} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-label-lg text-text-secondary">Question</label>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} required />
          </div>
          <div>
            <label className="mb-1.5 block text-label-lg text-text-secondary">Answer</label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} required />
          </div>
          <Button type="submit" className="w-full">Add card</Button>
        </form>
      </Dialog>
    </div>
  );
}
