"use client";

import * as React from "react";
import { Camera, Send, Upload, FileText, CheckCircle2 } from "lucide-react";
import { Exam } from "@/types";
import { ExamTimer } from "./exam-timer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function ExamPaper({ exam }: { exam: Exam }) {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [images, setImages] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [grading, setGrading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [timeSeconds, setTimeSeconds] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const exercises = exam.contentJson.exercises || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0 && images.length === 0) {
      toast.error("Please provide some answers or take a photo of your answer sheet.");
      return;
    }
    setGrading(true);
    
    try {
      const res = await fetch("/api/practice/grade-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          conversationId,
          answers,
          images,
          timeSeconds,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grade exam");
      
      setResult(data.grading);
      setSubmitted(true);
      toast.success("Exam graded successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGrading(false);
    }
  };

  if (result) {
    const pct = (result.totalScore / Math.max(result.maxScore, 1)) * 100;
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-border-strong bg-elevated p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <div
            className={cn(
              "flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-heading-xl font-bold",
              pct >= 70 ? "bg-[var(--accent-green-subtle)] text-green" : pct >= 40 ? "bg-[var(--accent-yellow-subtle)] text-yellow" : "bg-[var(--accent-red-subtle)] text-red"
            )}
          >
            {result.totalScore}
          </div>
          <div>
            <h1 className="text-heading-lg text-text-primary">Exam Result</h1>
            <p className="text-body-lg text-text-secondary mt-1">Score: {result.totalScore} / {result.maxScore}</p>
            <p className="mt-3 text-body-md text-text-primary">{result.overallFeedback}</p>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <h3 className="text-heading-sm text-text-primary">Detailed Feedback</h3>
          {result.perQuestion?.map((q: any, i: number) => (
            <div key={i} className="rounded-lg border border-border-subtle bg-base p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-body-md font-medium text-text-primary">{q.question}</p>
                <span className="shrink-0 text-label-lg font-bold text-primary">{q.score} / {q.maxScore}</span>
              </div>
              <p className="mt-2 text-body-sm text-text-secondary bg-elevated p-3 rounded-md border border-border-subtle">{q.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      {/* Exam Header */}
      <div className="rounded-xl border border-border-strong bg-elevated p-8 shadow-sm text-center space-y-4">
        <h1 className="text-heading-2xl font-bold text-text-primary">{exam.subject}</h1>
        <div className="flex items-center justify-center gap-6 text-body-md text-text-secondary">
          <span>Format: <strong className="text-text-primary">{exam.format}</strong></span>
          <span>&bull;</span>
          <span>Difficulty: <strong className="text-text-primary">{exam.difficulty}</strong></span>
          <span>&bull;</span>
          <span>Duration: <strong className="text-text-primary">{exam.duration}</strong></span>
          <span>&bull;</span>
          <span>Total Points: <strong className="text-text-primary">{exam.totalPoints}</strong></span>
        </div>
        
        {exam.contentJson.instructions && (
          <div className="mt-6 inline-block bg-base border border-border rounded-lg p-4 text-left max-w-2xl mx-auto">
            <p className="text-body-sm text-text-primary"><span className="font-semibold">Instructions:</span> {exam.contentJson.instructions}</p>
          </div>
        )}
      </div>

      {/* Floating Timer */}
      <div className="sticky top-4 z-10 flex justify-end">
        <ExamTimer onStop={(s) => setTimeSeconds(s)} />
      </div>

      {/* Exercises */}
      <div className="space-y-12">
        {exercises.map((ex: any, exIdx: number) => (
          <div key={ex.id || exIdx} className="space-y-6">
            <div className="border-b border-border-strong pb-2">
              <h2 className="text-heading-lg font-semibold text-text-primary flex items-baseline justify-between">
                {ex.title}
                <span className="text-body-md font-normal text-text-secondary">{ex.points} pts</span>
              </h2>
              {ex.instructions && <p className="mt-1 text-body-md text-text-secondary">{ex.instructions}</p>}
            </div>
            
            <div className="space-y-8 pl-4 border-l-2 border-border-subtle">
              {ex.questions?.map((q: any, qIdx: number) => (
                <div key={q.id || qIdx}>
                  <p className="text-body-md text-text-primary mb-3">
                    <span className="font-semibold text-text-secondary mr-2">{qIdx + 1}.</span>
                    {q.text || q.question} <span className="text-text-muted text-body-sm">({q.points} pts)</span>
                  </p>
                  <textarea
                    value={answers[q.id || qIdx] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id || qIdx]: e.target.value })}
                    placeholder="Write your answer here, or write on paper and take a photo below..."
                    className="w-full min-h-[100px] rounded-lg border border-border bg-base px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Upload Section */}
      <div className="rounded-xl border border-border bg-base p-6 text-center space-y-4">
        <h3 className="text-heading-sm text-text-primary">Prefer writing on paper?</h3>
        <p className="text-body-sm text-text-secondary">Take a photo of your handwritten answer sheet for AI grading.</p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {images.map((img, i) => (
            <div key={i} className="relative h-32 w-24 rounded-md border border-border overflow-hidden">
              <img src={img} alt="Answer sheet" className="object-cover w-full h-full" />
              <button 
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red"
              >
                ✕
              </button>
            </div>
          ))}
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
            multiple
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} icon={<Camera className="h-4 w-4" />}>
            Add Photo
          </Button>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-center pt-8">
        <Button size="lg" onClick={handleSubmit} loading={grading} icon={<CheckCircle2 className="h-5 w-5" />}>
          Submit for Grading
        </Button>
      </div>
    </div>
  );
}
