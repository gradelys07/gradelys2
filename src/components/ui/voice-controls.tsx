"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";
import { useSettingsStore } from "@/stores/settings-store";

function VoiceWaveBars({ colorClass }: { colorClass: string }) {
  return (
    <span className="inline-flex h-3 items-center gap-0.5" aria-hidden="true">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className={cn("w-0.5 h-3 rounded-full origin-center", colorClass)}
          animate={{ scaleY: [0.35, 1, 0.45, 0.85, 0.35] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

// ─── Web Speech API minimal local types (strict TS compatible) ───────────────

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ─── Text cleanup & language detection ───────────────────────────────────────

export function stripMarkdownForSpeech(raw: string): string {
  if (!raw) return "";

  let text = raw
    // Remove presentation modification JSON blocks
    .replace(/```json_(?:presentation|slide_update|theme_update)[\s\S]*?```/gi, "")
    // Remove rich visual / plot / media code blocks so TTS never reads code or search JSON aloud
    .replace(/```(?:python|python-plot|py|chart|json-chart|mermaid|images|gallery|photos|youtube|video|videos)\b[\s\S]*?```/gi, " ")
    // Remove fenced code block markers while keeping readable inner text if short, or skipping raw JSON blocks
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, (_match, inner: string) => {
      const trimmed = inner.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) return " ";
      return ` ${trimmed} `;
    })
    // Inline code
    .replace(/`([^`]+)`/g, "$1")
    // Markdown images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Bare URLs
    .replace(/https?:\/\/\S+/gi, "")
    // HTML tags
    .replace(/<[^>]+>/g, " ")
    // LaTeX common commands and delimiters
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1 / $2")
    .replace(/\\sqrt\{([^{}]+)\}/g, "$1")
    .replace(/\\(?:text|mathbf|mathrm|mathit|textbf|emph)\{([^{}]+)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\approx/g, "≈")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\(?:rightarrow|to)/g, "→")
    .replace(/\$\$?/g, "")
    .replace(/\\[\[\]()]/g, "")
    // Markdown table separators
    .replace(/^\|?[\s:-]+\|[\s|:-]*$/gm, "")
    .replace(/\|/g, " ")
    // Headings, blockquotes, horizontal rules, list markers
    .replace(/^[\s]*([-*_]){3,}[\s]*$/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // Bold, italic, strikethrough
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/(^|[^\w])\*([^*\n]+)\*(?!\w)/g, "$1$2")
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1$2")
    .replace(/\*\*/g, "")
    // Turn line breaks into natural pauses if not already punctuated
    .replace(/([^\n.!?:;…])\n+/g, "$1. ")
    .replace(/\n+/g, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function mapLocaleToBcp47(locale?: string): string {
  switch (locale) {
    case "fr":
      return "fr-FR";
    case "ar":
      return "ar-SA";
    case "es":
      return "es-ES";
    case "en":
      return "en-US";
    default:
      return "fr-FR";
  }
}

export function detectSpeechLang(text: string, fallbackLocale?: string): string {
  const sample = text.slice(0, 800);

  const arabicMatches = sample.match(/[\u0600-\u06FF]/g);
  if (arabicMatches && arabicMatches.length >= 2) {
    return "ar-SA";
  }

  const frDiacritics = (sample.match(/[àâäæçéèêëîïôœùûüÿ]/gi) || []).length;
  const frWords = (
    sample.match(
      /\b(le|la|les|des|du|un|une|et|est|sont|dans|pour|avec|sur|pas|que|qui|ce|cette|ces|nous|vous|je|tu|il|elle|mais|ou|donc|car|comme|plus|aussi|bien|être|avoir|fait|faire|peut|très|tout|tous)\b/gi
    ) || []
  ).length;
  const frScore = frDiacritics * 2 + frWords;

  const esSpecial = (sample.match(/[ñ¿¡]/gi) || []).length;
  const esAccents = (sample.match(/[áéíóúü]/gi) || []).length;
  const esWords = (
    sample.match(
      /\b(el|la|los|las|un|una|unos|unas|y|es|son|en|para|con|por|que|qué|como|cómo|este|esta|estos|pero|más|muy|ser|estar|hacer|tiene|tienen|sobre)\b/gi
    ) || []
  ).length;
  const esScore = esSpecial * 3 + esAccents + esWords;

  const enWords = (
    sample.match(
      /\b(the|and|is|are|was|were|in|on|at|to|for|of|with|that|this|these|those|it|its|you|your|we|from|by|as|be|have|has|can|will|not|but|what|how|why|which)\b/gi
    ) || []
  ).length;

  if (frScore > enWords && frScore >= esScore && frScore > 0) return "fr-FR";
  if (esScore > enWords && esScore > frScore && esScore > 0) return "es-ES";
  if (enWords > frScore && enWords > esScore && enWords > 0) return "en-US";

  if (fallbackLocale && fallbackLocale !== "en") {
    return mapLocaleToBcp47(fallbackLocale);
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return mapLocaleToBcp47(fallbackLocale);
}

export function getRecognitionLang(locale?: string): string {
  if (locale === "fr") return "fr-FR";
  if (locale === "ar") return "ar-SA";
  if (locale === "es") return "es-ES";

  if (typeof navigator !== "undefined" && navigator.language) {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("fr")) return "fr-FR";
    if (nav.startsWith("ar")) return "ar-SA";
    if (nav.startsWith("es")) return "es-ES";
    return navigator.language;
  }
  return "fr-FR";
}

// ─── Global SpeechSynthesis singleton (anti-GC & Chrome chunking) ────────────

let activeSpeechId: string | null = null;
let speechSessionCounter = 0;
let activeUtterances: SpeechSynthesisUtterance[] = [];
const speechListeners = new Set<() => void>();

function notifySpeechListeners() {
  speechListeners.forEach((fn) => fn());
}

function subscribeSpeech(fn: () => void): () => void {
  speechListeners.add(fn);
  return () => {
    speechListeners.delete(fn);
  };
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}

function splitIntoChunks(text: string, maxLen = 220): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.split(/(?<=[.!?;…])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!sentence) continue;
    if (sentence.length > maxLen) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // Break overly long sentences on commas or whitespace
      const words = sentence.split(/\s+/);
      let part = "";
      for (const word of words) {
        if (part && part.length + 1 + word.length > maxLen) {
          chunks.push(part.trim());
          part = word;
        } else {
          part = part ? `${part} ${word}` : word;
        }
      }
      if (part) current = part;
      continue;
    }

    if (current && current.length + 1 + sentence.length > maxLen) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

function pickBestVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const targetLang = lang.toLowerCase();
  const prefix = targetLang.split("-")[0];

  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (!matching.length) return undefined;

  const exact = matching.filter((v) => v.lang.toLowerCase() === targetLang);
  const pool = exact.length > 0 ? exact : matching;

  const preferred =
    pool.find((v) => /natural|enhanced|premium|google|siri|thomas|amelie|audrey|aurelie/i.test(v.name)) ||
    pool.find((v) => v.localService) ||
    pool.find((v) => v.default) ||
    pool[0];

  return preferred;
}

export function stopSpeaking() {
  speechSessionCounter += 1;
  activeSpeechId = null;
  activeUtterances = [];
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  notifySpeechListeners();
}

export function speakText(id: string, rawText: string, fallbackLocale?: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  if (activeSpeechId === id) {
    stopSpeaking();
    return true;
  }

  const cleaned = stripMarkdownForSpeech(rawText);
  if (!cleaned) {
    stopSpeaking();
    return true;
  }

  speechSessionCounter += 1;
  const session = speechSessionCounter;

  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const lang = detectSpeechLang(cleaned, fallbackLocale);
  const voices = window.speechSynthesis.getVoices();
  const voice = pickBestVoice(voices, lang);
  const chunks = splitIntoChunks(cleaned);

  activeSpeechId = id;
  activeUtterances = [];
  notifySpeechListeners();

  const speakChunk = (index: number) => {
    if (session !== speechSessionCounter) return;
    if (index >= chunks.length) {
      activeSpeechId = null;
      activeUtterances = [];
      notifySpeechListeners();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (session !== speechSessionCounter) return;
      speakChunk(index + 1);
    };

    utterance.onerror = (event) => {
      if (session !== speechSessionCounter) return;
      const err = (event as SpeechSynthesisErrorEvent).error;
      if (err === "interrupted" || err === "canceled") return;
      activeSpeechId = null;
      activeUtterances = [];
      notifySpeechListeners();
    };

    activeUtterances.push(utterance);
    window.speechSynthesis.speak(utterance);
  };

  speakChunk(0);
  return true;
}

// ─── SpeakMessageButton ──────────────────────────────────────────────────────

export function SpeakMessageButton({
  text,
  messageId,
  className,
  showLabel = false,
}: {
  text: string;
  messageId?: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const reactId = React.useId();
  const effectiveId = messageId || reactId;
  const [currentSpeechId, setCurrentSpeechId] = React.useState<string | null>(() => activeSpeechId);

  React.useEffect(() => {
    setCurrentSpeechId(activeSpeechId);
    const unsub = subscribeSpeech(() => {
      setCurrentSpeechId(activeSpeechId);
    });
    return () => {
      unsub();
      if (activeSpeechId === effectiveId) {
        stopSpeaking();
      }
    };
  }, [effectiveId]);

  if (!text || !text.trim()) return null;

  const isSpeaking = currentSpeechId === effectiveId;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error(t("voice.notSupported"));
      return;
    }

    const ok = speakText(effectiveId, text, locale);
    if (!ok) {
      toast.error(t("voice.notSupported"));
    }
  }

  const label = isSpeaking ? t("voice.stopReading") : t("voice.readAloud");

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.94 }}
      title={label}
      aria-label={label}
      aria-pressed={isSpeaking}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md p-1.5 text-text-muted transition-colors hover:bg-hover hover:text-text-primary",
        isSpeaking && "bg-[var(--primary-subtle)] text-primary hover:bg-[var(--primary-subtle)] hover:text-primary",
        showLabel && "px-2.5 py-1 text-label-lg",
        className
      )}
    >
      {isSpeaking ? (
        <>
          <Square className="h-3 w-3 fill-current" />
          <VoiceWaveBars colorClass="bg-primary" />
        </>
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      {showLabel && <span>{label}</span>}
    </motion.button>
  );
}

// ─── VoiceDictationButton ────────────────────────────────────────────────────

export function VoiceDictationButton({
  value,
  onChange,
  disabled = false,
  className,
  variant = "toolbar",
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: "toolbar" | "pill" | "icon";
}) {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const [listening, setListening] = React.useState(false);

  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null);
  const startingRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const baseTextRef = React.useRef("");
  const lastInjectedRef = React.useRef("");
  const onChangeRef = React.useRef(onChange);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const stopRecognition = React.useCallback((abort = false) => {
    const rec = recognitionRef.current;
    if (rec) {
      recognitionRef.current = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        if (abort) rec.abort();
        else rec.stop();
      } catch {}
    }
    setListening(false);
  }, []);

  // Stop dictation cleanly if the input was cleared (e.g. message submitted) or disabled
  React.useEffect(() => {
    if (listening && value === "" && lastInjectedRef.current !== "") {
      lastInjectedRef.current = "";
      baseTextRef.current = "";
      stopRecognition(true);
    }
  }, [listening, value, stopRecognition]);

  React.useEffect(() => {
    if (disabled && listening) {
      stopRecognition(true);
    }
  }, [disabled, listening, stopRecognition]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRecognition(true);
    };
  }, [stopRecognition]);

  async function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || startingRef.current) return;

    if (listening) {
      stopRecognition(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast.error(t("voice.notSupported"));
      return;
    }

    startingRef.current = true;
    try {
      // Trigger the browser's native microphone permission dialog directly
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          if (mountedRef.current) {
            toast.error(t("voice.micDenied"));
          }
          return;
        }
      }

      if (!mountedRef.current) return;

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = getRecognitionLang(locale);

      baseTextRef.current = valueRef.current;
      lastInjectedRef.current = valueRef.current;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let spoken = "";

        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i]?.[0]?.transcript || "";
          if (!text) continue;
          if (!spoken) {
            spoken = text.trimStart();
          } else if (!/\s$/.test(spoken) && !/^\s/.test(text)) {
            spoken += ` ${text}`;
          } else {
            spoken += text;
          }
        }

        const base = baseTextRef.current;
        const separator = base && !/\s$/.test(base) && spoken ? " " : "";
        const nextValue = `${base}${separator}${spoken}`;

        lastInjectedRef.current = nextValue;
        onChangeRef.current(nextValue);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const err = event.error;
        if (err === "aborted") {
          setListening(false);
          return;
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          toast.error(t("voice.micDenied"));
        } else if (err === "audio-capture") {
          toast.error(t("voice.micDenied"));
        } else if (err !== "no-speech") {
          toast.error(t("voice.notSupported"));
        }
        stopRecognition(true);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };

      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      toast.error(t("voice.notSupported"));
    } finally {
      startingRef.current = false;
    }
  }

  const label = listening ? t("voice.stopDictation") : t("voice.dictate");

  if (variant === "pill") {
    return (
      <motion.button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        title={label}
        aria-label={label}
        aria-pressed={listening}
        className={cn(
          "flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-label-sm font-medium transition-colors duration-200 disabled:opacity-40",
          listening
            ? "border-red-500/40 bg-red-500/15 text-red-600 shadow-sm"
            : "border-black/5 bg-black/5 text-text-secondary hover:bg-black/10 hover:text-text-primary",
          className
        )}
      >
        {listening ? (
          <>
            <VoiceWaveBars colorClass="bg-red-500" />
            <MicOff className="h-4 w-4" />
            <span className="hidden sm:inline">{t("voice.listening")}</span>
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </motion.button>
    );
  }

  if (variant === "icon") {
    return (
      <motion.button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        title={label}
        aria-label={label}
        aria-pressed={listening}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40",
          listening
            ? "border-red-500/40 bg-red-500/15 text-red-600"
            : "border-border bg-surface text-text-muted hover:bg-hover hover:text-text-primary",
          className
        )}
      >
        {listening ? <VoiceWaveBars colorClass="bg-red-500" /> : <Mic className="h-4 w-4" />}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      title={label}
      aria-label={label}
      aria-pressed={listening}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-body-sm transition-colors disabled:opacity-40",
        listening
          ? "bg-red-500/15 text-red-600 font-medium"
          : "text-text-muted hover:bg-hover hover:text-text-primary",
        className
      )}
    >
      {listening ? (
        <>
          <VoiceWaveBars colorClass="bg-red-500" />
          <MicOff className="h-4 w-4" />
          <span className="hidden sm:inline text-label-md">{t("voice.listening")}</span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </motion.button>
  );
}
