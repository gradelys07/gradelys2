"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Plus, Sparkles, RotateCw, Trash2 } from "lucide-react";
import { useAddCard, useCards, useDeleteCard, useGenerateFlashcards, useReviewCard } from "@/hooks/use-flashcards";
import { useDecks } from "@/hooks/use-flashcards";
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

  const [mode, setMode] = React.useState<"list" | "review">("list");
  const [reviewIndex, setReviewIndex] = React.useState(0);
  const [addOpen, setAddOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  const dueCards = React.useMemo(() => {
    if (!cards) return [];
    const now = new Date();
    return cards.filter((c) => new Date(c.nextReviewAt) <= now);
  }, [cards]);

  const [userAnswer, setUserAnswer] = React.useState("");
  const [verified, setVerified] = React.useState(false);

  function startReview() {
    setReviewIndex(0);
    setVerified(false);
    setUserAnswer("");
    setMode("review");
  }

  function handleVerify() {
    setVerified(true);
  }

  function handleRate(rating: Rating) {
    const card = dueCards[reviewIndex];
    reviewCard.mutate({ id: card.id, rating });
    recordActivity.mutate();
    if (reviewIndex < dueCards.length - 1) {
      setReviewIndex(reviewIndex + 1);
      setVerified(false);
      setUserAnswer("");
    } else {
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
        spaceId: (deck as any)?.spaceId || undefined,
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
          <button onClick={() => setMode("list")} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Exit review
          </button>
          <span className="text-body-sm text-text-muted">{reviewIndex + 1} / {dueCards.length}</span>
        </div>

        <div className="rounded-xl border border-border-strong bg-surface p-6 sm:p-8">
          <span className="text-label-md uppercase text-text-muted">Question</span>
          <p className="mt-2 text-heading-lg text-text-primary">{card.question}</p>

          <div className="mt-5">
            <label className="mb-1.5 block text-label-lg text-text-secondary">Your answer</label>
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={verified}
              placeholder="Type your answer…"
              rows={3}
              autoFocus
            />
          </div>

          {!verified ? (
            <Button className="mt-4 w-full" onClick={handleVerify}>
              Verify
            </Button>
          ) : (
            <div className="mt-4 rounded-md border border-primary/30 bg-[var(--primary-subtle)] p-4">
              <span className="text-label-md uppercase text-primary">Correct answer</span>
              <p className="mt-1 text-body-md text-text-primary">{card.answer}</p>
            </div>
          )}
        </div>

        {verified && (
          <div className="mt-6">
            <p className="mb-2 text-center text-body-sm text-text-muted">How did you do?</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => handleRate("again")} className="rounded-md border border-red/40 bg-[var(--accent-red-subtle)] py-3 text-body-sm font-medium text-red hover:brightness-110">
                Again
              </button>
              <button onClick={() => handleRate("hard")} className="rounded-md border border-yellow/40 bg-[var(--accent-yellow-subtle)] py-3 text-body-sm font-medium text-yellow hover:brightness-110">
                Hard
              </button>
              <button onClick={() => handleRate("good")} className="rounded-md border border-primary/40 bg-[var(--primary-subtle)] py-3 text-body-sm font-medium text-primary hover:brightness-110">
                Good
              </button>
              <button onClick={() => handleRate("easy")} className="rounded-md border border-green/40 bg-[var(--accent-green-subtle)] py-3 text-body-sm font-medium text-green hover:brightness-110">
                Easy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.push("/practice")} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
      </button>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-display-md text-text-primary">{deck?.name || "Deck"}</h1>
          <p className="mt-1 text-body-md text-text-secondary">{deck?.subject}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleGenerateMore} loading={generating} icon={<Sparkles className="h-4 w-4" />}>
            Generate more
          </Button>
          <Button onClick={() => setAddOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Add card
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-heading-sm text-text-primary">{dueCards.length} cards due for review</p>
            <p className="text-body-sm text-text-muted">{cards?.length || 0} total cards in this deck</p>
          </div>
          <Button onClick={startReview} disabled={dueCards.length === 0} icon={<RotateCw className="h-4 w-4" />}>
            Start review
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading && <p className="text-body-sm text-text-muted">Loading cards…</p>}
        {cards?.map((card) => (
          <div key={card.id} className="group flex items-start justify-between gap-3 rounded-md border border-border-subtle bg-surface p-4">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-text-primary">{card.question}</p>
              <p className="mt-1 text-body-sm text-text-muted">{card.answer}</p>
            </div>
            <button
              onClick={() => deleteCard.mutate(card.id)}
              className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-hover hover:text-red group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
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
