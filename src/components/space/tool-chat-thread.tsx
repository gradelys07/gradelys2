"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUp, Paperclip, Sparkles, Check, ChevronRight, FolderKanban,
  Network, GitBranch, PieChart as PieChartIcon, Clock, GitCompare, Image as ImageIcon,
  FileText, ScrollText, FileStack, PenTool, Presentation,
  Layers, Brain, X, Send,
} from "lucide-react";
import { useSpaces } from "@/hooks/use-spaces";
import { useMessages, useUpdateConversation } from "@/hooks/use-chat";
import { apiFetch } from "@/lib/api-fetch";
import { useQueryClient } from "@tanstack/react-query";
import { Markdown } from "@/components/markdown";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { ChartRenderer } from "@/components/chart-renderer";
import { QuizRunner } from "@/components/practice/quiz-runner";
import { useSaveSession } from "@/hooks/use-practice";
import { useGradeExam } from "@/hooks/use-practice-exam";
import { useRecordActivity } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/locale-provider";
import { trackVisualizationCreated, trackStudioDocCreated, trackQuizCompleted, trackFlashcardsCreated } from "@/lib/whop/tracking";
import type { QuizQuestion } from "@/types";

export type ToolKind = "visualize" | "studio" | "practice";

interface Preset {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  visualType?: string;
  subKind?: string;
  difficulty?: string;
}

const PRESETS: Record<ToolKind, Preset[]> = {
  visualize: [
    { id: "auto", title: "Auto format", subtitle: "Let Gradelys choose", icon: Sparkles, visualType: "auto", prompt: "Give me a visual overview of the most important ideas in this space." },
    { id: "infographic", title: "Infographic", subtitle: "Rich visual page", icon: ImageIcon, visualType: "infographic", prompt: "Create a rich visual infographic summarizing the key ideas." },
    { id: "diagram", title: "Diagrams", subtitle: "Flows, timelines & networks", icon: Network, visualType: "diagram", prompt: "Create a diagram showing how the key parts connect." },
    { id: "mindmap", title: "Mind maps", subtitle: "Ideas & connections", icon: GitBranch, visualType: "mindmap", prompt: "Create a mind map branching out from the central idea." },
    { id: "chart", title: "Charts", subtitle: "Data & comparisons", icon: PieChartIcon, visualType: "chart", prompt: "Create a chart comparing the key figures or categories." },
    { id: "timeline", title: "Timeline", subtitle: "Chronological events", icon: Clock, visualType: "timeline", prompt: "Create a timeline of the key stages or events in order." },
    { id: "comparison", title: "Comparison", subtitle: "Side-by-side contrast", icon: GitCompare, visualType: "comparison", prompt: "Compare the key concepts side by side, highlighting differences." },
  ],
  studio: [
    { id: "notes", title: "Study notes", subtitle: "Structured & exam-ready", icon: FileText, visualType: "notes", prompt: "Write clear, structured study notes covering the key material." },
    { id: "summary", title: "Summary", subtitle: "Dense, no filler", icon: ScrollText, visualType: "summary", prompt: "Write a concise summary capturing every key idea." },
    { id: "report", title: "Report", subtitle: "Formal write-up", icon: FileStack, visualType: "report", prompt: "Write a formal report with intro, body sections, and conclusion." },
    { id: "essay", title: "Essay", subtitle: "Argued & structured", icon: PenTool, visualType: "essay", prompt: "Write a well-argued essay with a clear thesis and conclusion." },
    { id: "slides", title: "Slide outline", subtitle: "Presentation-ready", icon: Presentation, visualType: "slides", prompt: "Write a slide-by-slide outline, a title and 3-5 bullets per slide." },
  ],
  practice: [
    { id: "flashcards", title: "Flashcards", subtitle: "Spaced repetition deck", icon: Layers, subKind: "flashcards", prompt: "Create a flashcard deck covering the most testable facts and definitions." },
    { id: "quiz", title: "Quiz", subtitle: "Untimed practice", icon: Brain, subKind: "quiz", prompt: "Create a practice quiz mixing easy and medium difficulty questions." },
    { id: "exam-easy", title: "Exam (Easy)", subtitle: "Written, AI-graded", icon: Clock, subKind: "exam", difficulty: "Easy", prompt: "Create an easy written exam." },
    { id: "exam-normal", title: "Exam (Normal)", subtitle: "Written, AI-graded", icon: Clock, subKind: "exam", difficulty: "Normal", prompt: "Create a standard written exam." },
    { id: "exam-hard", title: "Exam (Hard)", subtitle: "Written, AI-graded", icon: Clock, subKind: "exam", difficulty: "Hard", prompt: "Create a difficult written exam." },
  ],
};

const TOOL_PLACEHOLDER: Record<ToolKind, string> = {
  visualize: "Describe what to visualize…",
  studio: "Describe what document to generate…",
  practice: "Describe what to practice…",
};

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: any;
  pending?: boolean;
}

export function ToolChatThread({
  kind,
  conversationId,
  initialSpaceId,
  lockSpace,
}: {
  kind: ToolKind;
  conversationId: string;
  initialSpaceId?: string;
  lockSpace?: boolean;
}) {
  const { t } = useTranslation();
  const { data: spaces } = useSpaces();
  const { data: serverMessages } = useMessages(conversationId);
  const saveSession = useSaveSession();
  const recordActivity = useRecordActivity();
  const updateConversation = useUpdateConversation();
  const qc = useQueryClient();

  const [spaceId, setSpaceId] = React.useState<string | undefined>(initialSpaceId);
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [localMessages, setLocalMessages] = React.useState<LocalMessage[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const selectedSpace = spaces?.find((s: any) => s.id === spaceId);

  React.useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages.map((m) => ({ id: m.id, role: m.role, content: m.content, structured: m.structured })));
    }
  }, [serverMessages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  async function send(text: string, preset?: Preset) {
    if (!text.trim() || sending) return;
    if (!spaceId) {
      setAttachOpen(true);
      toast.error("Pick a space first — this generates from its sources.");
      return;
    }
    setSending(true);
    setInput("");
    const userMsgId = `local-${Date.now()}`;
    const assistantMsgId = `local-${Date.now()}-a`;
    setLocalMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: text },
      { id: assistantMsgId, role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await apiFetch<{ message: any }>("/api/tool-chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          message: text,
          spaceId,
          visualType: preset?.visualType,
          subKind: preset?.subKind,
          difficulty: preset?.difficulty,
        }),
      });
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { id: res.message.id, role: "assistant", content: res.message.content, structured: res.message.structured } : m))
      );
      recordActivity.mutate();
      // Track feature engagement based on tool kind
      if (kind === "visualize") trackVisualizationCreated(preset?.visualType || "auto");
      else if (kind === "studio") trackStudioDocCreated(preset?.visualType || "notes");
      else if (kind === "practice" && preset?.subKind === "flashcards") trackFlashcardsCreated();
      qc.invalidateQueries({ queryKey: ["conversations", kind] });
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
      setLocalMessages((prev) => prev.filter((m) => m.id !== assistantMsgId && m.id !== userMsgId));
    } finally {
      setSending(false);
    }
  }

  function handlePresetClick(preset: Preset) {
    setAttachOpen(false);
    send(preset.prompt, preset);
  }

  async function handleQuizComplete(structured: any, correct: number, total: number, timeSeconds: number) {
    await saveSession.mutateAsync({
      mode: structured.mode,
      subject: structured.subject,
      spaceId,
      score: Math.round((correct / total) * 100),
      totalQuestions: total,
      correctAnswers: correct,
      timeTakenSeconds: timeSeconds,
    } as any);
    trackQuizCompleted(Math.round((correct / total) * 100));
    toast.success("Session saved to Progress");
  }

  function handleExamGraded(newMessage: any) {
    setLocalMessages((prev) => [
      ...prev,
      { id: newMessage.id, role: "assistant", content: newMessage.content, structured: newMessage.structured },
    ]);
  }

  const presets = PRESETS[kind];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {localMessages.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-body-md text-text-secondary">
                {selectedSpace ? `${t("tool.readyToGenerate")} ${selectedSpace.emoji} ${selectedSpace.name}.` : t("tool.pickSpace")}
              </p>
              <div className="mx-auto mt-6 max-w-md space-y-2 text-left">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary hover:bg-[var(--primary-subtle)]"
                  >
                    <preset.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
                    <div className="flex-1">
                      <p className="text-body-sm font-semibold text-text-primary">{preset.title}</p>
                      <p className="text-label-md text-text-muted">{preset.subtitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {localMessages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="mb-6 flex justify-end">
                <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-4 py-2.5 text-body-md text-white">{m.content}</div>
              </div>
            ) : (
              <ToolMessageBubble
                key={m.id}
                message={m}
                conversationId={conversationId}
                spaceId={spaceId}
                onQuizComplete={handleQuizComplete}
                onExamGraded={handleExamGraded}
              />
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border-subtle bg-void px-4 py-4">
        <div className="relative mx-auto max-w-4xl">
          {attachOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm rounded-lg border border-border-strong bg-elevated p-3 shadow-l3">
              {!lockSpace && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm uppercase text-text-muted">{t("tool.space")}</span>
                    <button onClick={() => setAttachOpen(false)} className="text-text-muted hover:text-text-primary"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto">
                    {spaces?.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSpaceId(s.id);
                          setAttachOpen(false);
                          updateConversation.mutate({ id: conversationId, spaceId: s.id });
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-body-sm",
                          spaceId === s.id ? "bg-[var(--primary-subtle)] text-primary" : "text-text-secondary hover:bg-hover"
                        )}
                      >
                        <span>{s.emoji}</span> <span className="truncate">{s.name}</span>
                        {spaceId === s.id && <Check className="ml-auto h-3.5 w-3.5" />}
                      </button>
                    ))}
                    {(!spaces || spaces.length === 0) && (
                      <p className="px-2.5 py-1.5 text-label-md text-text-muted">{t("tool.noSpacesYet")}</p>
                    )}
                  </div>
                </>
              )}
              <div className={cn(!lockSpace && "mt-2 border-t border-border-subtle pt-2")}>
                <span className="px-0.5 text-label-sm uppercase text-text-muted">{t("tool.quickPrompts")}</span>
                <div className="mt-1 space-y-0.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-body-sm text-text-secondary hover:bg-hover"
                    >
                      <preset.icon className="h-3.5 w-3.5 shrink-0 text-primary" /> {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="rounded-xl border border-border-strong bg-surface p-2 shadow-l2 focus-within:border-primary"
          >
            {selectedSpace && (
              <div className="flex items-center gap-1.5 px-2 pb-1 pt-0.5">
                <FolderKanban className="h-3 w-3 text-primary" />
                <span className="text-label-md text-text-muted">{selectedSpace.emoji} {selectedSpace.name}</span>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={TOOL_PLACEHOLDER[kind]}
              rows={1}
              className="max-h-32 w-full resize-none bg-transparent px-2 py-1.5 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setAttachOpen(!attachOpen)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-body-sm transition-colors",
                  attachOpen ? "bg-[var(--primary-subtle)] text-primary" : "text-text-muted hover:bg-hover hover:text-text-primary"
                )}
              >
                <Paperclip className="h-4 w-4" /> {t("action.attach")}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ToolMessageBubble({
  message,
  conversationId,
  spaceId,
  onQuizComplete,
  onExamGraded,
}: {
  message: LocalMessage;
  conversationId: string;
  spaceId?: string;
  onQuizComplete: (structured: any, correct: number, total: number, timeSeconds: number) => void;
  onExamGraded: (message: any) => void;
}) {
  const [startedQuiz, setStartedQuiz] = React.useState(false);
  const structured = message.structured;

  return (
    <div className="mb-6 flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        {message.pending && !message.content ? (
          <div className="flex gap-1 rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
            <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
            <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
          </div>
        ) : structured?.kind === "visualize" ? (
          <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <p className="text-body-md font-medium text-text-primary">{structured.title}</p>
            <Link
              href={`/visualize/${structured.visualizeId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-label-lg font-medium text-white hover:bg-primary-hover"
            >
              <Sparkles className="h-3.5 w-3.5" /> Open Visualization
            </Link>
          </div>
        ) : structured?.kind === "studio" ? (
          <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <Markdown content={message.content} />
            <Link
              href={`/studio/documents/${structured.documentId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-label-lg text-text-secondary hover:bg-hover"
            >
              <FileStack className="h-3.5 w-3.5 text-primary" /> Open full document
            </Link>
          </div>
        ) : structured?.kind === "flashcards" ? (
          <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <p className="text-body-md text-text-primary">{message.content}</p>
            <Link
              href={`/practice/decks/${structured.deckId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-label-lg font-medium text-white hover:bg-primary-hover"
            >
              <Layers className="h-3.5 w-3.5" /> Review deck
            </Link>
          </div>
        ) : structured?.kind === "quiz" ? (
          startedQuiz ? (
            <div className="rounded-lg border border-border-subtle bg-elevated p-4">
              <QuizRunner
                questions={structured.questions as QuizQuestion[]}
                timed={false}
                onExit={() => setStartedQuiz(false)}
                onComplete={(correct, total, time) => onQuizComplete(structured, correct, total, time)}
              />
            </div>
          ) : (
            <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
              <p className="text-body-md text-text-primary">{message.content}</p>
              <button
                onClick={() => setStartedQuiz(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-label-lg font-medium text-white hover:bg-primary-hover"
              >
                <Brain className="h-3.5 w-3.5" /> Start quiz
              </button>
            </div>
          )
        ) : structured?.kind === "exam" ? (
          <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <p className="text-body-md text-text-primary">{message.content}</p>
            <Link
              href={`/practice/exam/${structured.examId}?conversationId=${conversationId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-label-lg font-medium text-white hover:bg-primary-hover"
            >
              <Clock className="h-3.5 w-3.5" /> Start written exam
            </Link>
          </div>
        ) : structured?.kind === "exam-result" ? (
          <ExamResult structured={structured} />
        ) : (
          <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <Markdown content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

function ExamResult({
  structured,
}: {
  structured: {
    totalScore: number;
    maxScore: number;
    perQuestion: { question: string; score: number; maxScore: number; feedback: string }[];
    overallFeedback: string;
  };
}) {
  const pct = (structured.totalScore / Math.max(structured.maxScore, 1)) * 100;
  return (
    <div className="rounded-lg rounded-tl-sm border border-border-strong bg-elevated p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full text-heading-lg font-bold",
            pct >= 70 ? "bg-[var(--accent-green-subtle)] text-green" : pct >= 40 ? "bg-[var(--accent-yellow-subtle)] text-yellow" : "bg-[var(--accent-red-subtle)] text-red"
          )}
        >
          {structured.totalScore}
        </div>
        <div>
          <p className="text-heading-sm text-text-primary">{structured.totalScore} / {structured.maxScore}</p>
          <p className="text-label-md text-text-muted">Exam result</p>
        </div>
      </div>
      <p className="mt-4 text-body-sm text-text-secondary">{structured.overallFeedback}</p>
      <div className="mt-4 space-y-2">
        {structured.perQuestion?.map((q, i) => (
          <div key={i} className="rounded-md border border-border-subtle bg-base p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-body-sm text-text-primary">{q.question}</p>
              <span className="shrink-0 text-label-md font-medium text-text-secondary">{q.score}/{q.maxScore}</span>
            </div>
            <p className="mt-1 text-body-sm text-text-muted">{q.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

