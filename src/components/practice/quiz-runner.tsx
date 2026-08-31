"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Clock, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatDuration } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

export function QuizRunner({
  questions,
  timed,
  onExit,
  onComplete,
}: {
  questions: QuizQuestion[];
  timed: boolean;
  onExit: () => void;
  onComplete: (correct: number, total: number, timeSeconds: number) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<(string | null)[]>(Array(questions?.length || 0).fill(null));
  const [finished, setFinished] = React.useState(false);
  const [startTime] = React.useState(Date.now());
  const [elapsed, setElapsed] = React.useState(0);
  const timeLimit = timed ? (questions?.length || 0) * 60 : Infinity;

  React.useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  React.useEffect(() => {
    if (timed && elapsed >= timeLimit && !finished) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-text-muted">No questions available.</p>
        <Button className="mt-4" onClick={onExit} variant="outline">Exit</Button>
      </div>
    );
  }

  const question = questions[index];
  const selected = answers[index];
  const correctCount = answers.filter((a, i) => a === questions[i]?.correct).length;

  function handleSelect(option: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = option;
      return next;
    });
  }

  function handleNext() {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    setFinished(true);
    onComplete(correctCount, questions.length, elapsed);
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <div
          className={cn(
            "mx-auto flex h-20 w-20 items-center justify-center rounded-full text-display-md font-bold",
            pct >= 70 ? "bg-[var(--accent-green-subtle)] text-green" : pct >= 40 ? "bg-[var(--accent-yellow-subtle)] text-yellow" : "bg-[var(--accent-red-subtle)] text-red"
          )}
        >
          {pct}%
        </div>
        <h2 className="mt-5 text-heading-xl text-text-primary">
          {correctCount} / {questions.length} correct
        </h2>
        <p className="mt-1 text-body-md text-text-secondary">Completed in {formatDuration(elapsed)}</p>

        <div className="mx-auto mt-8 max-w-xl space-y-3 text-left">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-md border border-border-subtle bg-base p-4">
              <div className="flex items-start gap-2">
                {answers[i] === q.correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                )}
                <div className="min-w-0">
                  <p className="text-body-sm text-text-primary">{q.question}</p>
                  {answers[i] !== q.correct && (
                    <p className="mt-1 text-body-sm text-text-muted">
                      Your answer: <span className="text-red">{answers[i] || "Skipped"}</span>
                    </p>
                  )}
                  <p className="mt-1 text-body-sm text-green">Correct: {q.correct}</p>
                  <p className="mt-1 text-body-sm text-text-secondary">{q.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="mt-8" onClick={onExit} icon={<RotateCcw className="h-4 w-4" />}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit
        </button>
        {timed && (
          <div className="flex items-center gap-1.5 text-body-sm text-text-secondary">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(Math.max(0, timeLimit - elapsed))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-label-md text-text-muted">
          <span>Question {index + 1} of {questions.length}</span>
          <span className="capitalize">{question.difficulty}</span>
        </div>
        <Progress value={((index + 1) / questions.length) * 100} className="mt-2" />
      </div>

      <h2 className="mt-6 text-heading-lg text-text-primary">{question.question}</h2>
      <p className="mt-1 text-label-md text-text-muted">Pick an answer — you'll see your score at the end.</p>

      <div className="mt-5 space-y-2.5">
        {question.options?.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={cn(
              "flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-body-md transition-colors",
              selected === option
                ? "border-primary bg-[var(--primary-subtle)] text-primary"
                : "border-border text-text-primary hover:border-border-strong hover:bg-hover"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Button className="mt-6 w-full" onClick={handleNext} disabled={!selected}>
        {index < questions.length - 1 ? "Next question" : "Finish quiz"}
      </Button>
    </div>
  );
}
