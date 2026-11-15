"use client";

import {
  Loader2 as QuickSpinnerIcon,
  Mic as QuickMicIcon,
  Square as QuickStopIcon,
} from "lucide-react";
import { useVoiceDictation } from "@/components/quick/use-voice-dictation";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeMathMarkdown } from "@/lib/markdown-math";
import {
  AlertCircle,
  AppWindow,
  Download,
  Eraser,
  Eye,
  Pin,
  PinOff,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Input, Label } from "@/components/ui/input";
import {
  type CaptureResult,
  type GradelysDesktopBridge,
  type Rect,
} from "@/lib/desktop-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type {
  AssistantErrorCode,
  AssistantSSEEvent,
  DrawCommand,
} from "@/lib/assistant/schemas";
import "./quick.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasScreenshot?: boolean;
  isError?: boolean;
}

type UiPhase = "idle" | "thinking" | "asking" | "capturing" | "drawing";
type PermissionDecision = "allow" | "always" | "deny";

const LazyQuickChartBlock = dynamic(
  () => import("@/components/quick/quick-chart-block").then((m) => m.QuickChartBlock),
  { ssr: false }
);

const LazyQuickPythonChartBlock = dynamic(
  () => import("@/components/quick/quick-chart-block").then((m) => m.QuickPythonChartBlock),
  { ssr: false }
);

const LazyQuickMermaidBlock = dynamic(
  () => import("@/components/quick/quick-chart-block").then((m) => m.QuickMermaidBlock),
  { ssr: false }
);

const LazyQuickImageGallery = dynamic(
  () => import("@/components/chat/chat-rich-blocks").then((m) => m.ChatImageGallery),
  { ssr: false }
);

const LazyQuickYouTubeEmbed = dynamic(
  () => import("@/components/chat/chat-rich-blocks").then((m) => m.ChatYouTubeEmbed),
  { ssr: false }
);

const MAX_CAPTURES_PER_TURN = 3;
const DELTA_FLUSH_MS = 90;
const RESIZE_SYNC_INTERVAL_MS = 220;

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [
  [rehypeKatex, { strict: false, throwOnError: false }],
] as unknown as NonNullable<React.ComponentProps<typeof ReactMarkdown>["rehypePlugins"]>;

function extractHastText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; value?: unknown; children?: unknown[] };
  if (n.type === "text" && typeof n.value === "string") return n.value;
  if (Array.isArray(n.children)) {
    return n.children.map(extractHastText).join("");
  }
  return "";
}

function getHastCodeLang(codeEl: unknown): string | null {
  if (!codeEl || typeof codeEl !== "object") return null;
  const cls = (codeEl as { properties?: { className?: unknown } }).properties?.className;
  const classes = Array.isArray(cls)
    ? cls
    : typeof cls === "string"
      ? cls.split(/\s+/)
      : [];
  for (const c of classes) {
    const m = String(c).match(/^language-([a-z0-9_-]+)$/i);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

const STARTER_PROMPTS = [
  "Explique-moi étape par étape ce qu'il y a sur mon écran",
  "Aide-moi à trouver où cliquer pour faire cette action",
  "Résume simplement ce que je dois faire maintenant",
];

function isSafeExternalUrl(href: string | undefined): href is string {
  if (!href) return false;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function makeMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function friendlyErrorMessage(code?: AssistantErrorCode, fallback?: string): string {
  if (fallback && fallback.trim().length > 0) return fallback;
  switch (code) {
    case "auth":
      return "Session expirée. Reconnecte-toi pour utiliser Gradelys.";
    case "rate_limit":
      return "Tu as envoyé beaucoup de messages. Patiente quelques instants avant de réessayer.";
    case "too_large":
      return "Le message ou la capture est trop volumineux.";
    case "bad_request":
      return "La requête n'a pas pu être traitée. Essaie de reformuler.";
    default:
      return "Le service est momentanément indisponible. Réessaie dans un instant.";
  }
}

class AssistantHttpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantHttpError";
  }
}

function parseSseBlockLines(
  rawText: string,
  onEvent: (event: AssistantSSEEvent) => void
): boolean {
  let emitted = false;
  for (const line of rawText.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;
    try {
      const parsed = JSON.parse(jsonStr) as AssistantSSEEvent;
      onEvent(parsed);
      emitted = true;
    } catch {
      // Ignore malformed SSE lines cleanly
    }
  }
  return emitted;
}

async function extractHttpErrorMessage(response: Response): Promise<string> {
  const status = response.status;
  let snippet = "";
  try {
    snippet = (await response.text()).slice(0, 2048);
  } catch {
    snippet = "";
  }

  let sseErrorMessage: string | null = null;
  parseSseBlockLines(snippet, (evt) => {
    if (evt.type === "error" && evt.message) {
      sseErrorMessage = evt.message;
    }
  });
  if (sseErrorMessage) return sseErrorMessage;

  const trimmed = snippet.trim();
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as { error?: unknown; message?: unknown };
      if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
      if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    } catch {
      // Ignore invalid JSON body
    }
  }

  if (status === 401) return "Session expirée. Reconnecte-toi pour utiliser Gradelys.";
  if (status === 403) return "Accès refusé. Connecte-toi avec ton compte Gradelys.";
  if (status === 404) {
    return "L'assistant serveur (/api/assistant) est introuvable ou pas encore déployé.";
  }
  if (status === 429) {
    return "Trop de requêtes envoyées. Patiente quelques instants avant de réessayer.";
  }
  if (status >= 500) {
    return `Erreur serveur temporaire (HTTP ${status}). Réessaie dans un instant.`;
  }
  return `Erreur de requête (HTTP ${status}). Réessaie dans un instant.`;
}

async function readSseStream(
  response: Response,
  onEvent: (event: AssistantSSEEvent) => void
): Promise<boolean> {
  if (!response.ok) {
    throw new AssistantHttpError(await extractHttpErrorMessage(response));
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType && !contentType.includes("text/event-stream")) {
    throw new AssistantHttpError(await extractHttpErrorMessage(response));
  }

  if (!response.body) {
    throw new AssistantHttpError("Flux de réponse absent.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let emittedAny = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundaryMatch = /\r?\n\r?\n/.exec(buffer);
    while (boundaryMatch) {
      const rawBlock = buffer.slice(0, boundaryMatch.index);
      buffer = buffer.slice(boundaryMatch.index + boundaryMatch[0].length);
      if (parseSseBlockLines(rawBlock, onEvent)) {
        emittedAny = true;
      }
      boundaryMatch = /\r?\n\r?\n/.exec(buffer);
    }
  }

  if (buffer.trim().length > 0 && parseSseBlockLines(buffer, onEvent)) {
    emittedAny = true;
  }

  return emittedAny;
}

function QuickLoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage("Saisis ton adresse e-mail et ton mot de passe.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login")) {
          setErrorMessage("E-mail ou mot de passe incorrect.");
        } else {
          setErrorMessage("Connexion impossible pour le moment. Réessaie.");
        }
      }
    } catch {
      setErrorMessage("Erreur réseau. Vérifie ta connexion internet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center px-5 py-4">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-white p-1.5 shadow-sm">
          <img
            src="/favicon.png"
            alt="Gradelys"
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">
          Connecte-toi à Gradelys
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Utilise ton compte Gradelys pour discuter et obtenir des explications guidées.
        </p>
      </div>

      <GoogleSignInButton
        label="Continuer avec Google"
        loadingLabel="Connexion via ton navigateur..."
        cancelLabel="Annuler"
        disabled={submitting}
        onError={(msg) => {
          if (msg) setErrorMessage(msg);
        }}
        className="h-9 rounded-lg border-slate-200/80 bg-white/85 text-sm shadow-sm hover:bg-white"
      />

      <div className="my-3.5 flex items-center gap-2.5">
        <div className="h-px flex-1 bg-[var(--border-default)]" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          ou avec ton e-mail
        </span>
        <div className="h-px flex-1 bg-[var(--border-default)]" />
      </div>

      <form onSubmit={handleLogin} className="space-y-3" noValidate>
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <Label htmlFor="quick-login-email" className="text-xs text-[var(--text-primary)]">
            Adresse e-mail
          </Label>
          <Input
            id="quick-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom@exemple.fr"
            required
            className="mt-1 h-9 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="quick-login-password" className="text-xs text-[var(--text-primary)]">
            Mot de passe
          </Label>
          <Input
            id="quick-login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="mt-1 h-9 text-sm"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={submitting}
          className="w-full"
        >
          Se connecter
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-[var(--text-secondary)]">
        Pas encore de compte ?{" "}
        <a
          href="https://gradelys.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--primary)] underline hover:text-[var(--primary-hover)]"
        >
          Créer un compte sur gradelys.com
        </a>
      </p>
    </div>
  );
}

const QuickMessageBubble = memo(function QuickMessageBubble({
  msg,
  isStreaming,
  streamingStatus,
  isDesktop,
}: {
  msg: ChatMessage;
  isStreaming: boolean;
  streamingStatus?: string | null;
  isDesktop: boolean;
}) {
  const hasVisualBlock =
    msg.role === "assistant" &&
    (msg.content.includes("```chart") ||
      msg.content.includes("```json-chart") ||
      msg.content.includes("```mermaid") ||
      msg.content.includes("```python") ||
      msg.content.includes("```images") ||
      msg.content.includes("```gallery") ||
      msg.content.includes("```photos") ||
      msg.content.includes("```youtube") ||
      msg.content.includes("```video") ||
      msg.content.includes("$$"));

  const markdownComponents = useMemo(
    () => ({
      a: ({
        href,
        children,
      }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
        isSafeExternalUrl(href) ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-700 underline hover:text-sky-900"
          >
            {children}
          </a>
        ) : (
          <span>{children}</span>
        ),
      pre: ({
        node,
        children,
        ...props
      }: React.HTMLAttributes<HTMLPreElement> & { node?: unknown }) => {
        const hastNode = node as { children?: unknown[] } | undefined;
        const codeEl = Array.isArray(hastNode?.children)
          ? hastNode.children.find(
              (c) =>
                Boolean(c) &&
                typeof c === "object" &&
                (c as { type?: string }).type === "element" &&
                (c as { tagName?: string }).tagName === "code"
            )
          : undefined;
        const lang = getHastCodeLang(codeEl);
        if (lang === "chart" || lang === "json-chart") {
          return (
            <LazyQuickChartBlock
              code={extractHastText(codeEl).replace(/\n$/, "")}
              isStreaming={isStreaming}
            />
          );
        }
        if (lang === "python" || lang === "python-plot" || lang === "py") {
          return (
            <LazyQuickPythonChartBlock
              code={extractHastText(codeEl).replace(/\n$/, "")}
              isStreaming={isStreaming}
            />
          );
        }
        if (lang === "mermaid") {
          return (
            <LazyQuickMermaidBlock
              code={extractHastText(codeEl).replace(/\n$/, "")}
              id={`qm-${msg.id}-${lang}`}
              isStreaming={isStreaming}
            />
          );
        }
        if (lang === "images" || lang === "gallery" || lang === "photos") {
          return (
            <LazyQuickImageGallery
              id={`qi-${msg.id}-${lang}`}
              raw={extractHastText(codeEl).replace(/\n$/, "")}
              isStreaming={isStreaming}
              showCanvasAction={false}
              compact
            />
          );
        }
        if (lang === "youtube" || lang === "video" || lang === "videos") {
          return (
            <LazyQuickYouTubeEmbed
              id={`qy-${msg.id}-${lang}`}
              raw={extractHastText(codeEl).replace(/\n$/, "")}
              isStreaming={isStreaming}
              showCanvasAction={false}
              compact
            />
          );
        }
        return <pre {...props}>{children}</pre>;
      },
    }),
    [isStreaming, msg.id]
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        msg.role === "user" ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "select-text rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
          hasVisualBlock ? "w-[96%] max-w-[96%]" : "max-w-[92%]",
          msg.role === "user"
            ? "rounded-br-sm bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm"
            : msg.isError
              ? "rounded-bl-sm border border-red-200/80 bg-red-50/90 text-red-800"
              : isDesktop
                ? "rounded-bl-sm border border-white/90 bg-white/90 text-slate-800 shadow-sm"
                : "rounded-bl-sm border border-white/80 bg-white/75 text-slate-800 shadow-sm backdrop-blur-md"
        )}
      >
        {msg.role === "user" ? (
          <div>
            {msg.hasScreenshot && (
              <span className="mb-1 inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                📸 Écran partagé
              </span>
            )}
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        ) : msg.content ? (
          <div className="quick-markdown prose prose-sm max-w-none break-words text-slate-800 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-1.5 prose-pre:overflow-x-auto prose-pre:rounded-md prose-pre:bg-slate-900/90 prose-pre:p-2 prose-pre:text-xs prose-pre:text-slate-100 prose-code:rounded prose-code:bg-slate-200/70 prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px]">
            <ReactMarkdown
              remarkPlugins={REMARK_PLUGINS}
              rehypePlugins={REHYPE_PLUGINS}
              components={markdownComponents}
            >
              {normalizeMathMarkdown(msg.content)}
            </ReactMarkdown>
          </div>
        ) : isStreaming ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <QuickSpinnerIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>{streamingStatus || "Réflexion…"}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-800">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
            <span>Aucune réponse reçue. Réessaie dans un instant.</span>
          </span>
        )}
      </div>
    </div>
  );
});

export default function QuickAssistantPage() {
  const { user, loading: authLoading, initialized } = useAuthStore();
  const isAuthenticated = Boolean(user && !user.isAnonymous);

  const [desktopBridge, setDesktopBridge] = useState<GradelysDesktopBridge | undefined>(
    undefined
  );
  const [pinned, setPinned] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [askBeforeCapture, setAskBeforeCapture] = useState(true);
  const [shortcutLabel, setShortcutLabel] = useState("⌘⇧Espace");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [attachedCapture, setAttachedCapture] = useState<CaptureResult | null>(null);
  const [phase, setPhase] = useState<UiPhase>("idle");
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingPermission, setPendingPermission] = useState<{
    reason: string;
  } | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userAbortedTurnRef = useRef(false);
  const pinnedRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const inputValueRef = useRef("");
  const isBusyRef = useRef(false);
  const pendingDeltaRef = useRef<{ msgId: string; text: string } | null>(null);
  const deltaFlushTimerRef = useRef<number | null>(null);
  const lastSentHeightRef = useRef<number>(0);
  const lastScrollHeightRef = useRef<number>(0);
  const lastCaptureMetaRef = useRef<{
    displayId: number;
    displayBounds: Rect;
  } | null>(null);
  const permissionResolverRef = useRef<((decision: PermissionDecision) => void) | null>(
    null
  );

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  // Detect desktop preload bridge & subscribe to native events
  useEffect(() => {
    const bridge = window.gradelysDesktop;
    setDesktopBridge(bridge);

    if (!bridge?.isDesktop) return;

    document.documentElement.classList.add("quick-desktop");
    if (bridge.platform === "darwin") {
      document.documentElement.classList.add("quick-mac");
    }

    void bridge
      .getSettings()
      .then((settings) => {
        setAskBeforeCapture(settings.askBeforeCapture);
        setShortcutLabel(settings.shortcut);
      })
      .catch(() => {
        // Keep safe defaults
      });

    const unsubCapture = bridge.onCaptureState((state) => {
      if (state === "asking") setPhase("asking");
      else if (state === "capturing") setPhase("capturing");
    });

    const unsubOverlay = bridge.onOverlayState((active) => {
      setOverlayActive(active);
    });

    return () => {
      document.documentElement.classList.remove("quick-desktop", "quick-mac");
      unsubCapture();
      unsubOverlay();
    };
  }, []);

  // Auto-focus composer on open & window refocus without stealing text selection
  useEffect(() => {
    if (!initialized || !isAuthenticated) return;
    const focusInput = () => {
      if (window.getSelection()?.toString()) return;
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    };

    focusInput();
    window.addEventListener("focus", focusInput);
    return () => window.removeEventListener("focus", focusInput);
  }, [isAuthenticated, initialized]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      lastScrollHeightRef.current = 0;
      return;
    }
    const nextHeight = container.scrollHeight;
    const grew = nextHeight > lastScrollHeightRef.current + 2;
    lastScrollHeightRef.current = nextHeight;
    if (!grew) return;

    const distanceFromBottom =
      nextHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom > 180 && streamingMsgId !== null) {
      return;
    }
    container.scrollTop = nextHeight;
  }, [messages, pendingPermission, streamingMsgId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (deltaFlushTimerRef.current !== null) {
        window.clearTimeout(deltaFlushTimerRef.current);
      }
    };
  }, []);

  const isBusy = phase !== "idle";

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    isBusyRef.current = isBusy;
  }, [isBusy]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const handleOpenMainChat = useCallback(() => {
    const targetPath = conversationId ? `/chat/${conversationId}` : "/chat";
    if (desktopBridge?.isDesktop) {
      desktopBridge.openMainApp?.(targetPath);
      return;
    }
    window.open(targetPath, "_blank", "noopener,noreferrer");
  }, [conversationId, desktopBridge]);

  const handleTogglePin = () => {
    const next = !pinned;
    setPinned(next);
    desktopBridge?.setPinned(next);
  };

  const handleClearOverlay = async () => {
    if (!desktopBridge) return;
    await desktopBridge.clearOverlay();
    setOverlayActive(false);
  };

  const flushPendingDelta = useCallback(() => {
    if (deltaFlushTimerRef.current !== null) {
      window.clearTimeout(deltaFlushTimerRef.current);
      deltaFlushTimerRef.current = null;
    }
    const pending = pendingDeltaRef.current;
    if (!pending || !pending.text) {
      pendingDeltaRef.current = null;
      return;
    }
    pendingDeltaRef.current = null;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pending.msgId ? { ...m, content: m.content + pending.text } : m
      )
    );
  }, []);

  const handleResetChat = async () => {
    userAbortedTurnRef.current = false;
    abortControllerRef.current?.abort();
    if (deltaFlushTimerRef.current !== null) {
      window.clearTimeout(deltaFlushTimerRef.current);
      deltaFlushTimerRef.current = null;
    }
    pendingDeltaRef.current = null;
    setStreamingMsgId(null);
    if (permissionResolverRef.current) {
      permissionResolverRef.current("deny");
      permissionResolverRef.current = null;
    }
    setPendingPermission(null);
    setMessages([]);
    setAttachedCapture(null);
    setStatusNote(null);
    setConversationId(null);
    conversationIdRef.current = null;
    setPhase("idle");
    lastCaptureMetaRef.current = null;
    if (desktopBridge) {
      desktopBridge.setPinned(pinnedRef.current);
      await desktopBridge.clearOverlay();
    }
    textareaRef.current?.focus();
  };

  const handleManualCapture = async () => {
    if (!desktopBridge || isBusy) return;
    setStatusNote(null);
    setPhase("capturing");

    const result = await desktopBridge.captureScreen();
    setPhase("idle");

    if ("error" in result) {
      if (result.error === "permission") {
        setStatusNote(
          "Autorise l'enregistrement d'écran dans Réglages Système > Confidentialité et sécurité."
        );
      } else if (result.error === "denied") {
        setStatusNote("Capture annulée ou trop fréquente. Réessaie dans un instant.");
      } else {
        setStatusNote("Impossible de capturer l'écran pour le moment.");
      }
      return;
    }

    lastCaptureMetaRef.current = {
      displayId: result.displayId,
      displayBounds: result.displayBounds,
    };
    setAttachedCapture(result);
    textareaRef.current?.focus();
  };

  const askUserPermission = useCallback(
    (reason: string): Promise<PermissionDecision> => {
      return new Promise((resolve) => {
        permissionResolverRef.current = resolve;
        setPendingPermission({ reason });
        setPhase("asking");
        // Keep popup open while user reads and decides on permission prompt
        desktopBridge?.setPinned(true);
      });
    },
    [desktopBridge]
  );

  const resolvePermissionPrompt = async (decision: PermissionDecision) => {
    const resolver = permissionResolverRef.current;
    permissionResolverRef.current = null;
    setPendingPermission(null);
    desktopBridge?.setPinned(pinnedRef.current);

    if (decision === "always" && desktopBridge) {
      setAskBeforeCapture(false);
      await desktopBridge.setAskBeforeCapture(false);
    }

    resolver?.(decision);
  };

  const cancelActiveTurn = useCallback(() => {
    userAbortedTurnRef.current = true;
    abortControllerRef.current?.abort();
    if (permissionResolverRef.current) {
      permissionResolverRef.current("deny");
      permissionResolverRef.current = null;
    }
    setPendingPermission(null);
    desktopBridge?.setPinned(pinnedRef.current);
    flushPendingDelta();
    setStreamingMsgId(null);
    setPhase("idle");
    setStatusNote("Réponse interrompue.");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [desktopBridge, flushPendingDelta]);

  const executeAssistantTurn = useCallback(
    async (
      conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
      initialScreenshot: CaptureResult | null
    ) => {
      userAbortedTurnRef.current = false;
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let currentMessages = conversationHistory.slice(-20);
      let nextScreenshot: CaptureResult | null = initialScreenshot;
      let captureCount = initialScreenshot ? 1 : 0;
      let captureDisabled = false;
      let turnAttempt = 0;
      let timedOut = false;
      const assistantMsgId = makeMessageId();

      setStreamingMsgId(assistantMsgId);
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      try {
        while (true) {
          setPhase("thinking");
          const currentAttempt = turnAttempt;
          turnAttempt += 1;

          timedOut = false;
          const requestTimeoutId = window.setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, 65_000);

          let requestedScreenshotReason: string | null = null;
          let streamError: { code?: AssistantErrorCode; message?: string } | null = null;
          let receivedTextOrDraw = false;

          try {
            const response = await fetch("/api/assistant", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                messages: currentMessages,
                conversationId: conversationIdRef.current,
                isScreenshotFollowUp: currentAttempt > 0,
                disableCapture: captureDisabled,
                screenshot: nextScreenshot
                  ? {
                      imageBase64: nextScreenshot.imageBase64,
                      mimeType: nextScreenshot.mimeType,
                      width: nextScreenshot.width,
                      height: nextScreenshot.height,
                    }
                  : null,
                context: {
                  desktop: Boolean(desktopBridge?.isDesktop),
                  platform: desktopBridge?.platform,
                  locale: "fr",
                },
              }),
            });

            // Drop screenshot reference quickly once serialized in request
            nextScreenshot = null;

            await readSseStream(response, (event) => {
              if (event.type === "conversation") {
                conversationIdRef.current = event.conversationId;
                setConversationId(event.conversationId);
              } else if (event.type === "text_delta") {
                if (event.text.length > 0) {
                  receivedTextOrDraw = true;
                }
                const cur = pendingDeltaRef.current;
                if (cur && cur.msgId === assistantMsgId) {
                  cur.text += event.text;
                } else {
                  pendingDeltaRef.current = { msgId: assistantMsgId, text: event.text };
                }
                if (deltaFlushTimerRef.current === null) {
                  deltaFlushTimerRef.current = window.setTimeout(() => {
                    flushPendingDelta();
                  }, DELTA_FLUSH_MS);
                }
              } else if (event.type === "need_screenshot") {
                flushPendingDelta();
                requestedScreenshotReason = event.reason;
              } else if (event.type === "draw") {
                flushPendingDelta();
                receivedTextOrDraw = true;
                if (desktopBridge) {
                  const meta = lastCaptureMetaRef.current ?? {
                    displayId: -1,
                    displayBounds: { x: 0, y: 0, width: 1, height: 1 },
                  };
                  setPhase("drawing");
                  void desktopBridge.drawOverlay(
                    event.commands,
                    meta.displayId,
                    meta.displayBounds
                  );
                }
              } else if (event.type === "error") {
                flushPendingDelta();
                streamError = { code: event.code, message: event.message };
              }
            });
          } finally {
            window.clearTimeout(requestTimeoutId);
          }

          flushPendingDelta();

          if (streamError) {
            const { code, message } = streamError as {
              code?: AssistantErrorCode;
              message?: string;
            };
            const text = friendlyErrorMessage(code, message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: m.content ? `${m.content}\n\n${text}` : text,
                      isError: true,
                    }
                  : m
              )
            );
            break;
          }

          if (!requestedScreenshotReason) {
            if (!receivedTextOrDraw) {
              throw new AssistantHttpError(
                "L'assistant n'a renvoyé aucune réponse. Réessaie dans un instant."
              );
            }
            break;
          }

          // Model asked to look at the screen
          if (!desktopBridge?.isDesktop) {
            setStatusNote(
              "Cette demande nécessite l'application desktop Gradelys pour voir ton écran."
            );
            captureDisabled = true;
            currentMessages = [
              ...currentMessages,
              {
                role: "user" as const,
                content:
                  "[L'utilisateur utilise la version web sans capture d'écran. Réponds simplement sans voir l'écran et préviens-le.]",
              },
            ].slice(-20);
            continue;
          }

          if (captureCount >= MAX_CAPTURES_PER_TURN) {
            setStatusNote("Limite de 3 captures atteinte pour cette question.");
            captureDisabled = true;
            currentMessages = [
              ...currentMessages,
              {
                role: "user" as const,
                content:
                  "[Limite de captures atteinte pour cette réponse. Termine ton explication avec les éléments déjà vus.]",
              },
            ].slice(-20);
            continue;
          }

          let shouldAsk = askBeforeCapture;
          try {
            const latestSettings = await desktopBridge.getSettings();
            shouldAsk = latestSettings.askBeforeCapture;
            setAskBeforeCapture(shouldAsk);
          } catch {
            // Use cached state
          }

          if (shouldAsk) {
            const decision = await askUserPermission(requestedScreenshotReason);
            if (controller.signal.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }
            if (decision === "deny") {
              captureDisabled = true;
              currentMessages = [
                ...currentMessages,
                {
                  role: "user" as const,
                  content:
                    "[L'utilisateur a refusé le partage d'écran. Réponds sans capture d'écran en le prévenant gentiment.]",
                },
              ].slice(-20);
              continue;
            }
          }

          setPhase("capturing");
          const capture = await desktopBridge.captureScreen();
          if (controller.signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          if ("error" in capture) {
            const note =
              capture.error === "permission"
                ? "Autorisation d'enregistrement d'écran requise sur Mac."
                : "Capture d'écran impossible.";
            setStatusNote(note);
            captureDisabled = true;
            currentMessages = [
              ...currentMessages,
              {
                role: "user" as const,
                content: `[Capture d'écran impossible (${note}). Réponds sans voir l'écran en prévenant l'utilisateur.]`,
              },
            ].slice(-20);
            continue;
          }

          captureCount += 1;
          lastCaptureMetaRef.current = {
            displayId: capture.displayId,
            displayBounds: capture.displayBounds,
          };
          nextScreenshot = capture;
        }
      } catch (err) {
        if (
          (err instanceof DOMException && err.name === "AbortError" && !timedOut) ||
          userAbortedTurnRef.current
        ) {
          flushPendingDelta();
          // Drop an empty placeholder bubble left by an aborted turn while keeping any streamed text
          setMessages((prev) =>
            prev.filter((m) => !(m.id === assistantMsgId && !m.content.trim()))
          );
          return;
        }
        const fallback = timedOut
          ? "La requête a pris trop de temps. Vérifie ta connexion et réessaie."
          : err instanceof AssistantHttpError
            ? err.message
            : navigator.onLine
              ? "Une erreur de connexion est survenue. Réessaie dans un instant."
              : "Pas de connexion internet. Vérifie ta connexion et réessaie.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: m.content ? `${m.content}\n\n${fallback}` : fallback,
                  isError: true,
                }
              : m
          )
        );
      } finally {
        flushPendingDelta();
        setStreamingMsgId((cur) => (cur === assistantMsgId ? null : cur));
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setPhase("idle");
        }
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      }
    },
    [askBeforeCapture, askUserPermission, desktopBridge, flushPendingDelta]
  );

  const submitQuestion = async (rawText?: string) => {
    const trimmed = (rawText ?? inputValue).trim();
    if (!trimmed || isBusy) return;

    setStatusNote(null);
    const screenshotToSend = attachedCapture;
    setAttachedCapture(null);
    if (!rawText) setInputValue("");

    const userMsg: ChatMessage = {
      id: makeMessageId(),
      role: "user",
      content: trimmed,
      hasScreenshot: Boolean(screenshotToSend),
    };

    const nextHistory = [...messages, userMsg]
      .filter((m) => !m.isError && m.content.trim().length > 0)
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    await executeAssistantTurn(nextHistory, screenshotToSend);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitQuestion();
  };

  const submitQuestionRef = useRef<(rawText?: string) => Promise<void>>(submitQuestion);
  useEffect(() => {
    submitQuestionRef.current = submitQuestion;
  });

  const {
    isRecording,
    isTranscribing,
    elapsedSeconds,
    toggleRecording,
  } = useVoiceDictation({
    onRecordingChange: (recording) => {
      if (recording) {
        desktopBridge?.setPinned(true);
      } else {
        desktopBridge?.setPinned(pinnedRef.current);
      }
    },
    onError: (msg) => {
      setStatusNote(msg);
    },
    onTranscribed: (text) => {
      const existing = inputValueRef.current.trim();
      if (!existing && !isBusyRef.current) {
        void submitQuestionRef.current(text);
        return;
      }
      const merged = existing ? `${existing} ${text}` : text;
      setInputValue(merged);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
  });

  const hasExpandedArea =
    messages.length > 0 ||
    Boolean(pendingPermission) ||
    Boolean(statusNote) ||
    Boolean(attachedCapture) ||
    isRecording ||
    isTranscribing;

  // Coalesced height sync so macOS NSPanel.setBounds is never flooded while streaming
  useEffect(() => {
    if (!desktopBridge?.isDesktop || !desktopBridge.setWindowHeight) return;
    const node = panelRef.current;
    if (!node) return;

    let rafId: number | null = null;
    let timerId: number | null = null;
    let lastSyncAt = 0;

    const applyHeight = () => {
      rafId = null;
      lastSyncAt = performance.now();
      const measured = Math.ceil(node.getBoundingClientRect().height);
      if (measured <= 0) return;
      // Match outer `p-1` (4px top + 4px bottom = 8px) so window never squeezes or bounces
      const target = Math.min(640, Math.max(152, measured + 8));
      if (Math.abs(target - lastSentHeightRef.current) < 10) return;
      lastSentHeightRef.current = target;
      desktopBridge.setWindowHeight?.(target);
    };

    const scheduleSync = () => {
      if (rafId !== null || timerId !== null) return;
      const elapsed = performance.now() - lastSyncAt;
      if (elapsed >= RESIZE_SYNC_INTERVAL_MS) {
        rafId = requestAnimationFrame(applyHeight);
      } else {
        timerId = window.setTimeout(() => {
          timerId = null;
          rafId = requestAnimationFrame(applyHeight);
        }, Math.max(24, RESIZE_SYNC_INTERVAL_MS - elapsed));
      }
    };

    scheduleSync();
    const observer = new ResizeObserver(scheduleSync);
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [desktopBridge, isAuthenticated, initialized, authLoading]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      void submitQuestion();
    }
  };

  const phaseLabel =
    phase === "asking"
      ? "En attente de ton accord pour voir l'écran…"
      : phase === "capturing"
        ? "📸 Je regarde ton écran…"
        : phase === "drawing"
          ? "✍️ Je te montre…"
          : phase === "thinking"
            ? "Je réfléchis…"
            : null;

  return (
    <div
      className={cn(
        "flex w-full justify-center",
        desktopBridge?.isDesktop ? "p-1" : "min-h-dvh items-center p-4"
      )}
    >
      <div
        ref={panelRef}
        className={cn(
          "quick-glass-panel quick-no-drag flex w-full flex-col overflow-hidden rounded-[22px] text-slate-900",
          desktopBridge?.isDesktop
            ? "max-h-[632px]"
            : "max-h-[90dvh] max-w-[460px] shadow-2xl"
        )}
      >
        {/* Slim Frosted Header */}
        <header className="quick-drag-region flex h-10 shrink-0 items-center justify-between border-b border-white/50 px-3">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="Gradelys"
              className="h-5 w-5 rounded-md object-contain"
            />
            <span className="text-xs font-semibold tracking-tight text-slate-800">
              Gradelys
            </span>
            {desktopBridge?.isDesktop && !isBusy && (
              <span className="rounded-md bg-white/55 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {shortcutLabel}
              </span>
            )}
            {isBusy && (
              <span
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="quick-no-drag flex items-center gap-1">
            {overlayActive && desktopBridge?.isDesktop && (
              <button
                type="button"
                onClick={() => void handleClearOverlay()}
                className="quick-focus inline-flex h-7 items-center gap-1 rounded-lg bg-amber-500/15 px-2 text-[11px] font-medium text-amber-800 transition-colors hover:bg-amber-500/25"
                title="Effacer les dessins sur l'écran (Échap)"
                aria-label="Effacer les dessins sur l'écran"
              >
                <Eraser className="h-3 w-3" aria-hidden="true" />
                <span>Effacer</span>
              </button>
            )}

            {messages.length > 0 && isAuthenticated && (
              <button
                type="button"
                onClick={() => void handleResetChat()}
                className="quick-focus flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white/75 hover:text-slate-900"
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {isAuthenticated && (desktopBridge?.isDesktop || conversationId) && (
              <button
                type="button"
                onClick={handleOpenMainChat}
                className="quick-focus flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-slate-600 transition-colors hover:bg-white/75 hover:text-sky-700"
                title={
                  conversationId
                    ? "Ouvrir cette conversation dans Gradelys"
                    : "Ouvrir l'application complète Gradelys"
                }
                aria-label="Ouvrir dans Gradelys"
              >
                <AppWindow className="h-3.5 w-3.5" aria-hidden="true" />
                {conversationId && <span className="hidden sm:inline">Ouvrir</span>}
              </button>
            )}

            {desktopBridge?.isDesktop && (
              <>
                <button
                  type="button"
                  onClick={handleTogglePin}
                  aria-pressed={pinned}
                  className={cn(
                    "quick-focus flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    pinned
                      ? "bg-sky-500/20 text-sky-800"
                      : "text-slate-600 hover:bg-white/75 hover:text-slate-900"
                  )}
                  title={pinned ? "Détacher la fenêtre" : "Épingler la fenêtre"}
                  aria-label={pinned ? "Détacher la fenêtre" : "Épingler la fenêtre"}
                >
                  {pinned ? (
                    <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => desktopBridge.hideWindow()}
                  className="quick-focus flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/75 hover:text-slate-900"
                  title="Masquer l'assistant (Échap)"
                  aria-label="Masquer l'assistant"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        {!initialized || authLoading ? (
          <main className="flex items-center justify-center p-6">
            <p className="text-xs font-medium text-slate-600">
              Vérification de la session…
            </p>
          </main>
        ) : !isAuthenticated ? (
          <main className="quick-scroll max-h-[520px] overflow-y-auto">
            <QuickLoginView />
          </main>
        ) : (
          <>

          {/* Web-only fallback notice */}
          {!desktopBridge?.isDesktop && (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sky-200/50 bg-sky-50/75 px-3 py-1.5 text-[11px] text-sky-900">
              <span>
                Mode web : utilise l&apos;app desktop pour voir ton écran et dessiner dessus.
              </span>
              <a
                href="https://gradelys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 font-medium text-sky-700 underline hover:text-sky-900"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                <span>App</span>
              </a>
            </div>
          )}

          {/* Response Space: Hidden when idle so only the input/dictation bar appears initially */}
          {hasExpandedArea && (
            <div className="flex min-h-0 flex-1 flex-col border-b border-white/45">
              {messages.length > 0 && (
                <main
                  ref={scrollContainerRef}
                  className="quick-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-2.5"
                >
                  {messages.map((msg) => (
                    <QuickMessageBubble
                      key={msg.id}
                      msg={msg}
                      isStreaming={streamingMsgId === msg.id}
                      streamingStatus={streamingMsgId === msg.id ? phaseLabel : null}
                      isDesktop={Boolean(desktopBridge?.isDesktop)}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </main>
              )}

              {/* Permission Confirmation Card */}
              {pendingPermission && (
                <section
                  aria-label="Autorisation de capture d'écran"
                  className={cn(
                    "mx-3 my-2 rounded-2xl border border-sky-200/80 p-3",
                    desktopBridge?.isDesktop ? "bg-sky-50/95" : "bg-sky-50/85 backdrop-blur-md"
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-sky-900">
                    <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
                    <span>Gradelys veut regarder ton écran</span>
                  </div>
                  <p className="mb-2.5 text-xs text-sky-800">{pendingPermission.reason}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => void resolvePermissionPrompt("allow")}
                      className="h-7 px-2.5 text-xs"
                    >
                      Autoriser
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void resolvePermissionPrompt("always")}
                      className="h-7 px-2.5 text-xs"
                    >
                      Autoriser toujours
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void resolvePermissionPrompt("deny")}
                      className="h-7 px-2.5 text-xs text-slate-700"
                    >
                      Refuser
                    </Button>
                  </div>
                </section>
              )}

              {/* Live Dictation / Assistant Status / Attached Capture */}
              {(isRecording || isTranscribing) && (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "mx-3 my-2 flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-medium",
                    isRecording
                      ? "border-red-200 bg-red-50/85 text-red-700"
                      : "border-sky-200 bg-sky-50/85 text-sky-800"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {isRecording ? (
                      <>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        <span>
                          Dictée en cours ({elapsedSeconds}s) — clique sur Stop pour envoyer
                        </span>
                      </>
                    ) : (
                      <>
                        <QuickSpinnerIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>Transcription de ta voix…</span>
                      </>
                    )}
                  </span>
                </div>
              )}

              {(phaseLabel || statusNote) && !isRecording && !isTranscribing && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mx-3 mb-2 mt-1 flex items-center justify-between rounded-xl border border-white/70 bg-white/65 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  <span>{phaseLabel ?? statusNote}</span>
                  {!phaseLabel && statusNote && (
                    <button
                      type="button"
                      onClick={() => setStatusNote(null)}
                      className="quick-focus ml-2 text-slate-500 hover:text-slate-900"
                      aria-label="Fermer le message"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}

              {attachedCapture && (
                <div className="mx-3 mb-2 flex items-center justify-between rounded-xl border border-sky-200/80 bg-sky-50/85 px-2.5 py-1 text-xs text-sky-900">
                  <span>
                    📸 Capture prête ({attachedCapture.width}×{attachedCapture.height})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedCapture(null)}
                    className="quick-focus rounded p-0.5 text-sky-700 hover:bg-sky-100"
                    aria-label="Retirer la capture jointe"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Minimal Glassmorphism Composer: Write OR Speak (Dictation) */}
          <form onSubmit={handleFormSubmit} className="shrink-0 p-2.5">
            <label htmlFor="quick-chat-input" className="sr-only">
              Écris ou dicte ta question à Gradelys
            </label>
            <div className="quick-glass-composer flex items-end gap-1.5 rounded-2xl px-2.5 py-1.5 transition-all">
              <textarea
                id="quick-chat-input"
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder={
                  isRecording
                    ? "Parle maintenant…"
                    : "Écris ou dicte ta question…"
                }
                rows={1}
                disabled={isBusy || isTranscribing}
                className="quick-textarea quick-focus bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
              />

              <button
                type="button"
                disabled={isBusy || isTranscribing}
                onClick={toggleRecording}
                aria-pressed={isRecording}
                className={cn(
                  "quick-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-45",
                  isRecording
                    ? "quick-mic-recording bg-red-500 text-white hover:bg-red-600"
                    : "text-slate-600 hover:bg-white/80 hover:text-sky-600"
                )}
                title={
                  isRecording
                    ? "Arrêter la dictée et transcrire"
                    : "Dicter ta question au micro"
                }
                aria-label={
                  isRecording ? "Arrêter la dictée" : "Dicter ta question au micro"
                }
              >
                {isTranscribing ? (
                  <QuickSpinnerIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : isRecording ? (
                  <QuickStopIcon className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                ) : (
                  <QuickMicIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              {desktopBridge?.isDesktop && (
                <button
                  type="button"
                  disabled={isBusy || isRecording}
                  onClick={() => void handleManualCapture()}
                  className="quick-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-white/80 hover:text-sky-600 disabled:opacity-45"
                  title="Regarder mon écran maintenant"
                  aria-label="Regarder mon écran"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              {isBusy ? (
                <button
                  type="button"
                  onClick={cancelActiveTurn}
                  className="quick-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm transition-colors hover:bg-slate-900"
                  title="Arrêter la réponse"
                  aria-label="Arrêter la réponse"
                >
                  <QuickStopIcon className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isRecording || isTranscribing || !inputValue.trim()}
                  className="quick-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Envoyer"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </>
        )}
      </div>
    </div>
  );
}
