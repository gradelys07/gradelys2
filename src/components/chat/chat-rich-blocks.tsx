"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  PanelRightOpen,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Youtube,
  BarChart3,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChartRenderer,
  evalMathExpression,
  formatAxisTick,
  type ChartPayload,
} from "@/components/chart-renderer";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import {
  useChatCanvasStore,
  type CanvasMediaItem,
  type CanvasYouTubeVideo,
} from "@/stores/chat-canvas-store";

// ─── Lightbox Modal for Images & Python Figures ──────────────────────────────

function ImageLightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: { url: string; caption?: string; source?: string; pageUrl?: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [items.length, onClose]);

  const current = items[index];
  if (!current) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center rounded-2xl bg-surface p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </motion.button>

        <div className="relative flex items-center justify-center">
          {items.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 rtl:rotate-180"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
          )}
          <AnimatePresence mode="wait">
            <motion.img
              key={current.url}
              src={current.url}
              alt={current.caption || "Illustration"}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="max-h-[75vh] max-w-full rounded-xl object-contain bg-white"
            />
          </AnimatePresence>
          {items.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 rtl:rotate-180"
              aria-label="Suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          )}
        </div>

        {(current.caption || current.source) && (
          <div className="mt-2.5 flex w-full flex-wrap items-center justify-between gap-2 px-2 text-xs text-text-secondary">
            <span>{current.caption}</span>
            {current.source && (
              <span className="text-text-muted">
                {current.pageUrl ? (
                  <a
                    href={current.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                  >
                    {current.source} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  current.source
                )}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}

// ─── Direct Chart Conversion & Auto-Open Canvas ──────────────────────────────

const autoOpenedCharts = new Set<string>();

function simpleHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function splitTopLevelArgs(argStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i];
    if (quote) {
      if (ch === quote && argStr[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      args.push(argStr.slice(start, i).trim());
      start = i + 1;
    }
  }
  const tail = argStr.slice(start).trim();
  if (tail) args.push(tail);
  return args;
}

function parsePythonArrayLiteral(raw: string): (string | number)[] | null {
  const trimmed = raw.trim();
  const unwrapped = trimmed.replace(/^np\.array\(([\s\S]+)\)$/, "$1").trim();
  if (!(unwrapped.startsWith("[") && unwrapped.endsWith("]"))) return null;
  try {
    const jsonLike = unwrapped.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, inner) =>
      JSON.stringify(inner)
    );
    const parsed = JSON.parse(jsonLike);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore invalid list literal
  }
  return null;
}

export function isPlottingPython(code: string): boolean {
  return (
    /\b(matplotlib|plt|pylab|seaborn|sns)\b/.test(code) ||
    /\.(plot|scatter|bar|barh|hist|pie|imshow|contour|contourf|stem|step|boxplot|violinplot|fill_between|subplots|figure|savefig)\s*\(/.test(
      code
    )
  );
}

export function pythonCodeToChartPayload(code: string): ChartPayload | null {
  if (!isPlottingPython(code)) return null;

  const titleMatch = code.match(/(?:plt|ax\d*)\.(?:set_)?title\(\s*[frFR]?(['"])([\s\S]*?)\1/);
  const xLabelMatch = code.match(/(?:plt|ax\d*)\.(?:set_)?xlabel\(\s*[frFR]?(['"])([\s\S]*?)\1/);
  const yLabelMatch = code.match(/(?:plt|ax\d*)\.(?:set_)?ylabel\(\s*[frFR]?(['"])([\s\S]*?)\1/);
  const title = titleMatch?.[2]?.trim() || "Chart";
  const xAxisLabel = xLabelMatch?.[2]?.trim();
  const yAxisLabel = yLabelMatch?.[2]?.trim();

  let chartType: ChartPayload["chartType"] = "line";
  if (/\.(?:pie)\s*\(/.test(code)) chartType = "pie";
  else if (/\.(?:barh?)\s*\(/.test(code)) chartType = "bar";
  else if (/\.(?:scatter)\s*\(/.test(code)) chartType = "scatter";
  else if (/\.(?:fill_between|stackplot)\s*\(/.test(code)) chartType = "area";

  const arrayVars = new Map<string, (string | number)[]>();
  const xRanges = new Map<string, number[]>();
  const exprVars = new Map<string, string>();

  for (const rawLine of code.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line || line.startsWith("import ") || line.startsWith("from ")) continue;
    const assignMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]+)$/);
    if (!assignMatch) continue;
    const [, varName, rhs] = assignMatch;

    const linMatch = rhs.match(/^np\.linspace\(\s*([^,]+),\s*([^,)]+)(?:,\s*([^)]+))?\)/);
    if (linMatch) {
      const start = evalMathExpression(linMatch[1], {});
      const stop = evalMathExpression(linMatch[2], {});
      const rawN = linMatch[3] ? evalMathExpression(linMatch[3], {}) : 121;
      if (start !== null && stop !== null) {
        const count = Math.min(Math.max(Math.round(rawN || 121), 16), 121);
        const pts: number[] = [];
        for (let i = 0; i < count; i++) {
          const v = start + ((stop - start) * i) / Math.max(count - 1, 1);
          pts.push(Number(v.toFixed(4)));
        }
        xRanges.set(varName, pts);
        arrayVars.set(varName, pts);
        continue;
      }
    }

    const arangeMatch = rhs.match(/^np\.arange\(\s*([^,]+),\s*([^,)]+)(?:,\s*([^)]+))?\)/);
    if (arangeMatch) {
      const start = evalMathExpression(arangeMatch[1], {});
      const stop = evalMathExpression(arangeMatch[2], {});
      const step = arangeMatch[3] ? evalMathExpression(arangeMatch[3], {}) : 1;
      if (start !== null && stop !== null && step && step > 0) {
        const pts: number[] = [];
        for (let v = start; v < stop && pts.length < 121; v += step) {
          pts.push(Number(v.toFixed(4)));
        }
        if (pts.length > 1) {
          xRanges.set(varName, pts);
          arrayVars.set(varName, pts);
          continue;
        }
      }
    }

    const arr = parsePythonArrayLiteral(rhs);
    if (arr) {
      arrayVars.set(varName, arr);
      continue;
    }

    exprVars.set(varName, rhs);
  }

  function resolveSeries(expr: string, xDomainVar?: string): (string | number)[] | null {
    const trimmed = expr.trim();
    if (arrayVars.has(trimmed)) return arrayVars.get(trimmed)!;
    const lit = parsePythonArrayLiteral(trimmed);
    if (lit) return lit;

    const targetExpr = exprVars.get(trimmed) || trimmed;
    const xVar =
      xDomainVar && xRanges.has(xDomainVar)
        ? xDomainVar
        : Array.from(xRanges.keys()).find((k) => new RegExp(`\\b${k}\\b`).test(targetExpr)) ||
          Array.from(xRanges.keys())[0];

    if (xVar) {
      const xs = xRanges.get(xVar)!;
      const ys: number[] = [];
      for (const xVal of xs) {
        const yVal = evalMathExpression(targetExpr, { [xVar]: xVal });
        if (yVal === null) return null;
        ys.push(Number(yVal.toFixed(4)));
      }
      return ys;
    }
    return null;
  }

  const callRegex = /(?:plt|ax\d*)\.(plot|bar|barh|scatter|pie|fill_between)\s*\(([^;]+)\)/g;
  const rowsMap = new Map<number, Record<string, any>>();
  const seriesNames: string[] = [];
  const extractedFunctions: { expr: string; label?: string }[] = [];
  let extractedDomain: [number, number] | undefined;
  let match: RegExpExecArray | null;

  while ((match = callRegex.exec(code)) !== null) {
    const fnName = match[1];
    const args = splitTopLevelArgs(match[2]);
    const positional = args.filter((a) => !/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(a));
    const kwMap = new Map<string, string>();
    for (const a of args) {
      const km = a.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]+)$/);
      if (km) kwMap.set(km[1], km[2].trim());
    }

    const labelKw = kwMap.get("label")?.match(/^(['"])([\s\S]*)\1$/)?.[2];

    if (fnName === "pie" && positional.length >= 1) {
      const vals = resolveSeries(positional[0]);
      const labels = kwMap.get("labels") ? resolveSeries(kwMap.get("labels")!) : null;
      if (vals && vals.length > 0) {
        return {
          chartType: "pie",
          title,
          data: vals.map((v, idx) => ({
            name: String(labels?.[idx] ?? `Item ${idx + 1}`),
            value: Number(v) || 0,
          })),
        };
      }
    }

    if (fnName === "scatter" && positional.length >= 2) {
      const xs = resolveSeries(positional[0]);
      const ys = resolveSeries(positional[1], arrayVars.has(positional[0]) ? positional[0] : undefined);
      if (xs && ys && xs.length > 0 && ys.length > 0) {
        const len = Math.min(xs.length, ys.length);
        const data = [];
        for (let i = 0; i < len; i++) {
          const xNum = Number(xs[i]);
          const yNum = Number(ys[i]);
          if (Number.isFinite(xNum) && Number.isFinite(yNum)) {
            data.push({ name: formatAxisTick(xNum), x: xNum, y: yNum });
          }
        }
        if (data.length > 0) {
          return { chartType: "scatter", title, xAxisLabel, yAxisLabel, data };
        }
      }
    }

    if ((fnName === "bar" || fnName === "barh") && positional.length >= 2) {
      const xs = resolveSeries(positional[0]);
      const ys = resolveSeries(positional[1]);
      if (xs && ys && xs.length > 0 && ys.length > 0) {
        const len = Math.min(xs.length, ys.length);
        const seriesKey = labelKw || (seriesNames.length === 0 ? "value" : `series${seriesNames.length + 1}`);
        seriesNames.push(seriesKey);
        for (let i = 0; i < len; i++) {
          const existing = rowsMap.get(i) || { name: String(xs[i]) };
          existing[seriesKey] = Number(ys[i]) || 0;
          rowsMap.set(i, existing);
        }
        continue;
      }
    }

    if ((fnName === "plot" || fnName === "fill_between") && positional.length >= 1) {
      let xs: (string | number)[] | null = null;
      let ys: (string | number)[] | null = null;
      let domainVarName: string | undefined;
      let rawYExpr: string | undefined;

      if (positional.length === 1) {
        rawYExpr = positional[0].trim();
        ys = resolveSeries(rawYExpr);
        if (ys) xs = ys.map((_, idx) => idx);
      } else {
        const xExpr = positional[0].trim();
        const yExpr = positional[1].trim();
        rawYExpr = yExpr;
        domainVarName = xRanges.has(xExpr) ? xExpr : undefined;
        xs = resolveSeries(xExpr);
        ys = resolveSeries(yExpr, domainVarName);
      }

      if (rawYExpr && !arrayVars.has(rawYExpr) && !parsePythonArrayLiteral(rawYExpr)) {
        const resolvedExpr = (exprVars.get(rawYExpr) || rawYExpr).trim();
        const xVar =
          domainVarName ||
          Array.from(xRanges.keys()).find((k) => new RegExp(`\\b${k}\\b`).test(resolvedExpr)) ||
          Array.from(xRanges.keys())[0];
        if (xVar && xRanges.has(xVar)) {
          const range = xRanges.get(xVar)!;
          const exprForX =
            xVar === "x" ? resolvedExpr : resolvedExpr.replace(new RegExp(`\\b${xVar}\\b`, "g"), "x");
          extractedFunctions.push({ expr: exprForX, label: labelKw || resolvedExpr });
          extractedDomain = [range[0], range[range.length - 1]];
        }
      }

      if (xs && ys && xs.length > 0 && ys.length > 0) {
        const len = Math.min(xs.length, ys.length);
        const seriesKey = labelKw || (seriesNames.length === 0 ? "value" : `series${seriesNames.length + 1}`);
        seriesNames.push(seriesKey);
        for (let i = 0; i < len; i++) {
          const rawX = xs[i];
          const label = typeof rawX === "number" ? formatAxisTick(rawX) : String(rawX);
          const existing = rowsMap.get(i) || { name: label };
          const numVal = Number(ys[i]);
          if (Number.isFinite(numVal)) {
            existing[seriesKey] = Number(numVal.toFixed(3));
            rowsMap.set(i, existing);
          }
        }
      }
    }
  }

  if (rowsMap.size > 0 || extractedFunctions.length > 0) {
    return {
      chartType,
      title,
      xAxisLabel,
      yAxisLabel,
      ...(extractedDomain ? { domain: extractedDomain } : {}),
      ...(extractedFunctions.length > 0 ? { functions: extractedFunctions } : {}),
      data: Array.from(rowsMap.values()),
    };
  }

  return null;
}

function ChartCard({
  parsed,
  conversationId,
}: {
  parsed: ChartPayload;
  conversationId?: string;
}) {
  const upsertArtifact = useChatCanvasStore((s) => s.upsertArtifact);
  const openArtifact = useChatCanvasStore((s) => s.openArtifact);

  const stableId = React.useMemo(() => {
    const signature = JSON.stringify({
      t: parsed.title || "Chart",
      c: parsed.chartType,
      d: parsed.data,
      f: parsed.functions,
      dom: parsed.domain,
      yd: parsed.yDomain,
      as: parsed.asymptotes,
    });
    return `${conversationId || "global"}-chart-${simpleHash(signature)}`;
  }, [conversationId, parsed]);

  const title = parsed.title?.trim() || "Chart";
  const subtitle = parsed.subtitle?.trim();

  React.useEffect(() => {
    const autoOpenKey = `${conversationId || "global"}:${stableId}`;
    const shouldAutoOpen = !autoOpenedCharts.has(autoOpenKey);
    if (shouldAutoOpen) {
      autoOpenedCharts.add(autoOpenKey);
    }
    upsertArtifact(
      {
        id: stableId,
        conversationId,
        type: "chart",
        title,
        chartData: parsed,
      },
      shouldAutoOpen
    );
  }, [stableId, conversationId, title, parsed, upsertArtifact]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="my-3 not-prose rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-base/70 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <BarChart3 className="h-3.5 w-3.5" />
            Chart
          </span>
          <span className="truncate text-xs font-semibold text-text-primary">{title}</span>
          {subtitle && (
            <span className="hidden sm:inline truncate text-[11px] text-text-muted">
              — {subtitle}
            </span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => openArtifact(stableId)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <PanelRightOpen className="h-3.5 w-3.5 rtl:rotate-180" />
          <span>Ouvrir à droite</span>
        </motion.button>
      </div>
      <div className="bg-white p-3">
        <ChartRenderer data={parsed} height={300} />
      </div>
    </motion.div>
  );
}

export function ChatPythonBlock({
  code,
  conversationId,
  isStreaming = false,
}: {
  code: string;
  id?: string;
  conversationId?: string;
  isStreaming?: boolean;
  autoRun?: boolean;
}) {
  const isPlot = isPlottingPython(code);
  const parsed = React.useMemo(() => {
    if (!isPlot) return null;
    if (isStreaming && !/\bplt\.show\s*\(/.test(code)) return null;
    return pythonCodeToChartPayload(code);
  }, [code, isPlot, isStreaming]);

  if (parsed) {
    return <ChartCard parsed={parsed} conversationId={conversationId} />;
  }

  if (isStreaming && isPlot) {
    return (
      <div className="my-3 not-prose flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 py-4 text-xs text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Chargement du graphique...</span>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className="my-2 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs whitespace-pre text-slate-100"
    >
      {code}
    </div>
  );
}

export function ChatChartBlock({
  code,
  conversationId,
  isStreaming = false,
}: {
  code: string;
  id?: string;
  conversationId?: string;
  isStreaming?: boolean;
}) {
  const parsed: ChartPayload | null = React.useMemo(() => {
    try {
      const cleaned = code.trim();
      const json = JSON.parse(cleaned);
      if (json && (Array.isArray(json.data) || Array.isArray(json.functions))) {
        const hasFunctions = Array.isArray(json.functions) && json.functions.length > 0;
        return {
          ...json,
          chartType: json.chartType || (hasFunctions ? "area" : "line"),
          data: Array.isArray(json.data) ? json.data : [],
        } as ChartPayload;
      }
      return null;
    } catch {
      return null;
    }
  }, [code]);

  if (parsed) {
    return <ChartCard parsed={parsed} conversationId={conversationId} />;
  }

  if (isStreaming) {
    return (
      <div className="my-3 not-prose flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 py-4 text-xs text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Chargement du graphique...</span>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className="my-2 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs whitespace-pre text-slate-100"
    >
      {code}
    </div>
  );
}

// ─── Mermaid Diagram Wrapper with Canvas Support ─────────────────────────────

export function ChatMermaidBlock({
  code,
  id,
  conversationId,
  isStreaming = false,
}: {
  code: string;
  id: string;
  conversationId?: string;
  isStreaming?: boolean;
}) {
  const upsertArtifact = useChatCanvasStore((s) => s.upsertArtifact);
  const openArtifact = useChatCanvasStore((s) => s.openArtifact);

  React.useEffect(() => {
    if (isStreaming || !code.trim()) return;
    upsertArtifact(
      {
        id,
        conversationId,
        type: "mermaid",
        title: "Schéma",
        code,
      },
      false
    );
  }, [code, id, conversationId, isStreaming, upsertArtifact]);

  if (isStreaming) {
    return (
      <div className="my-3 not-prose flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 py-4 text-xs text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Construction du schéma...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="my-3 not-prose rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-base/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-text-primary">Schéma</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => openArtifact(id)}
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <PanelRightOpen className="h-3.5 w-3.5 rtl:rotate-180" />
          <span>Ouvrir à droite</span>
        </motion.button>
      </div>
      <div className="bg-white p-3">
        <MermaidDiagram code={code} id={id} />
      </div>
    </motion.div>
  );
}

// ─── Multi-Photo Image Gallery Block ─────────────────────────────────────────

const imageSearchCache = new Map<string, CanvasMediaItem[]>();
const videoSearchCache = new Map<string, CanvasYouTubeVideo[]>();

function buildPollinationsFallback(query: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${query}, educational diagram or realistic illustration`
  )}?nologo=true&width=800&height=600`;
}

interface ImageQuerySpec {
  query: string;
  caption?: string;
  count?: number;
}

function parseImageSpecs(raw: string): ImageQuerySpec[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const valid = arr
      .filter((x) => x && typeof x.query === "string" && x.query.trim())
      .map((x) => ({
        query: String(x.query).trim(),
        caption: typeof x.caption === "string" ? x.caption.trim() : undefined,
        count: typeof x.count === "number" ? x.count : undefined,
      }));
    return valid.length > 0 ? valid : null;
  } catch {
    // Fallback for plain text lines when not JSON and not partial JSON
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) return null;
    const lines = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;
    return lines.map((line) => {
      const [query, caption] = line.split("|").map((s) => s.trim());
      return { query, caption };
    });
  }
}

function FallbackImageCard({
  item,
  index,
  onClick,
}: {
  item: CanvasMediaItem;
  index: number;
  onClick: () => void;
}) {
  const urls = React.useMemo(() => {
    const list = [item.url, ...(item.candidates || [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [item]);

  const [candidateIdx, setCandidateIdx] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const currentUrl = urls[candidateIdx];

  if (!currentUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200/70" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUrl}
          alt={item.caption || item.title || "Photo"}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setCandidateIdx((i) => i + 1);
          }}
          className={cn(
            "!m-0 h-full w-full !rounded-none !border-0 object-cover !shadow-none transition-all duration-300 group-hover:scale-105",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
      {(item.caption || item.source) && (
        <div className="flex flex-1 flex-col justify-between gap-1 p-2.5 text-left rtl:text-right">
          {item.caption && (
            <p className="line-clamp-2 text-xs font-medium text-text-primary">{item.caption}</p>
          )}
          {item.source && (
            <span className="truncate text-[11px] text-text-muted">{item.source}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function ChatImageGallery({
  raw,
  id,
  conversationId,
  isStreaming = false,
}: {
  raw: string;
  id: string;
  conversationId?: string;
  isStreaming?: boolean;
}) {
  const upsertArtifact = useChatCanvasStore((s) => s.upsertArtifact);
  const openArtifact = useChatCanvasStore((s) => s.openArtifact);

  const cacheKey = React.useMemo(() => raw.trim(), [raw]);
  const [items, setItems] = React.useState<CanvasMediaItem[]>(() => imageSearchCache.get(cacheKey) || []);
  const [loading, setLoading] = React.useState(() => !(imageSearchCache.get(cacheKey)?.length));
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const specs = React.useMemo(() => parseImageSpecs(raw), [raw]);
  const isReadyToFetch = React.useMemo(() => {
    if (!specs || specs.length === 0) return false;
    if (!isStreaming) return true;
    return cacheKey.endsWith("]") || cacheKey.endsWith("}");
  }, [specs, isStreaming, cacheKey]);

  React.useEffect(() => {
    if (!isReadyToFetch || !specs || specs.length === 0) return;

    const cached = imageSearchCache.get(cacheKey);
    if (cached && cached.length > 0) {
      setItems(cached);
      setLoading(false);
      upsertArtifact(
        {
          id,
          conversationId,
          type: "images",
          title: specs[0]?.caption || specs[0]?.query || "Galerie photos",
          mediaItems: cached,
        },
        false
      );
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadImages() {
      try {
        if (specs!.length === 1) {
          const spec = specs![0];
          const fallbackUrl = buildPollinationsFallback(spec.query);
          const requestedCount = Math.min(Math.max(spec.count || 4, 4), 6);
          let found: any[] = [];
          try {
            const res = await fetch(
              `/api/media/search?type=images&q=${encodeURIComponent(spec.query)}&count=${requestedCount}`
            );
            const data = await res.json().catch(() => ({}));
            found = Array.isArray(data?.images) ? data.images : [];
          } catch {
            found = [];
          }
          if (cancelled) return;

          const built: CanvasMediaItem[] =
            found.length > 0
              ? found.map((img, idx) => ({
                  url: img.url,
                  candidates: [
                    ...found.filter((_, i) => i !== idx).map((x) => x.url),
                    fallbackUrl,
                  ],
                  caption:
                    img.title && img.title.toLowerCase() !== spec.query.toLowerCase()
                      ? img.title
                      : spec.caption || spec.query,
                  title: img.title,
                  source: img.source,
                  pageUrl: img.pageUrl,
                }))
              : [
                  {
                    url: fallbackUrl,
                    candidates: [fallbackUrl],
                    caption: spec.caption || spec.query,
                    title: spec.query,
                    source: "AI Illustration",
                  },
                ];

          imageSearchCache.set(cacheKey, built);
          setItems(built);
          upsertArtifact(
            {
              id,
              conversationId,
              type: "images",
              title: spec.caption || spec.query,
              mediaItems: built,
            },
            false
          );
          return;
        }

        const results = await Promise.all(
          specs!.slice(0, 6).map(async (spec) => {
            try {
              const res = await fetch(
                `/api/media/search?type=images&q=${encodeURIComponent(spec.query)}&count=4`
              );
              const data = await res.json().catch(() => ({}));
              return { spec, found: Array.isArray(data?.images) ? data.images : [] };
            } catch {
              return { spec, found: [] as any[] };
            }
          })
        );

        if (cancelled) return;

        const usedUrls = new Set<string>();
        const built: CanvasMediaItem[] = [];

        for (const { spec, found } of results) {
          const fallbackUrl = buildPollinationsFallback(spec.query);
          if (found.length === 0) {
            built.push({
              url: fallbackUrl,
              candidates: [fallbackUrl],
              caption: spec.caption || spec.query,
              title: spec.query,
              source: "AI Illustration",
            });
            continue;
          }
          const preferred = found.find((f: any) => !usedUrls.has(f.url)) || found[0];
          usedUrls.add(preferred.url);
          built.push({
            url: preferred.url,
            candidates: [...found.map((f: any) => f.url), fallbackUrl],
            caption: spec.caption || preferred.title || spec.query,
            title: preferred.title,
            source: preferred.source,
            pageUrl: preferred.pageUrl,
          });
        }

        if (built.length > 0) {
          imageSearchCache.set(cacheKey, built);
          setItems(built);
          upsertArtifact(
            {
              id,
              conversationId,
              type: "images",
              title: specs![0]?.caption || "Galerie photos",
              mediaItems: built,
            },
            false
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadImages();
    return () => {
      cancelled = true;
    };
  }, [isReadyToFetch, specs, cacheKey, id, conversationId, upsertArtifact]);

  if (!isReadyToFetch || (!specs && loading)) {
    return (
      <div className="my-3 not-prose grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-border-subtle bg-base" />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="my-3 not-prose rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-base/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-text-primary">
            Illustrations ({loading ? "…" : items.length})
          </span>
        </div>
        {items.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => openArtifact(id)}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <PanelRightOpen className="h-3.5 w-3.5 rtl:rotate-180" />
            <span>Panneau droite</span>
          </motion.button>
        )}
      </div>

      <div className="p-3">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-base" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {items.map((item, idx) => (
              <FallbackImageCard
                key={`${item.url}-${idx}`}
                item={item}
                index={idx}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <ImageLightbox
            items={items.map((it) => ({
              url: it.url,
              caption: it.caption,
              source: it.source,
              pageUrl: it.pageUrl,
            }))}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── YouTube Video Embed Block ───────────────────────────────────────────────

interface VideoQuerySpec {
  query?: string;
  title?: string;
  videoId?: string;
}

function parseVideoSpecs(raw: string): VideoQuerySpec[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const valid = arr
      .filter((x) => x && (typeof x.query === "string" || typeof x.videoId === "string"))
      .map((x) => ({
        query: typeof x.query === "string" ? x.query.trim() : undefined,
        title: typeof x.title === "string" ? x.title.trim() : undefined,
        videoId: typeof x.videoId === "string" ? x.videoId.trim() : undefined,
      }));
    return valid.length > 0 ? valid : null;
  } catch {
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) return null;
    const lines = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.length > 0 ? lines.map((q) => ({ query: q })) : null;
  }
}

export function ChatYouTubeEmbed({
  raw,
  id,
  conversationId,
  isStreaming = false,
}: {
  raw: string;
  id: string;
  conversationId?: string;
  isStreaming?: boolean;
}) {
  const upsertArtifact = useChatCanvasStore((s) => s.upsertArtifact);
  const openArtifact = useChatCanvasStore((s) => s.openArtifact);

  const cacheKey = React.useMemo(() => raw.trim(), [raw]);
  const [videos, setVideos] = React.useState<CanvasYouTubeVideo[]>(() => videoSearchCache.get(cacheKey) || []);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(() => !(videoSearchCache.get(cacheKey)?.length));

  const specs = React.useMemo(() => parseVideoSpecs(raw), [raw]);
  const isReadyToFetch = React.useMemo(() => {
    if (!specs || specs.length === 0) return false;
    if (!isStreaming) return true;
    return cacheKey.endsWith("]") || cacheKey.endsWith("}");
  }, [specs, isStreaming, cacheKey]);

  React.useEffect(() => {
    if (!isReadyToFetch || !specs || specs.length === 0) return;

    const cached = videoSearchCache.get(cacheKey);
    if (cached && cached.length > 0) {
      setVideos(cached);
      setLoading(false);
      upsertArtifact(
        {
          id,
          conversationId,
          type: "youtube",
          title: cached[0].title,
          youtubeVideos: cached,
        },
        false
      );
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadVideos() {
      try {
        const collected: CanvasYouTubeVideo[] = [];
        const seen = new Set<string>();

        for (const spec of specs!.slice(0, 3)) {
          if (spec.videoId && /^[a-zA-Z0-9_-]{11}$/.test(spec.videoId)) {
            if (!seen.has(spec.videoId)) {
              seen.add(spec.videoId);
              collected.push({
                videoId: spec.videoId,
                title: spec.title || "Vidéo YouTube",
              });
            }
            continue;
          }
          if (!spec.query) continue;
          const res = await fetch(
            `/api/media/search?type=videos&q=${encodeURIComponent(spec.query)}&count=3`
          );
          const data = await res.json().catch(() => ({}));
          const found: any[] = Array.isArray(data?.videos) ? data.videos : [];
          for (const v of found) {
            if (!v?.videoId || seen.has(v.videoId)) continue;
            seen.add(v.videoId);
            collected.push({
              videoId: v.videoId,
              title: v.title || spec.title || spec.query,
              channel: v.channel,
              duration: v.duration,
            });
          }
        }

        if (cancelled) return;
        const limited = collected.slice(0, 4);
        if (limited.length > 0) {
          videoSearchCache.set(cacheKey, limited);
        }
        setVideos(limited);
        setActiveIdx(0);

        if (limited.length > 0) {
          upsertArtifact(
            {
              id,
              conversationId,
              type: "youtube",
              title: limited[0].title,
              youtubeVideos: limited,
            },
            false
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVideos();
    return () => {
      cancelled = true;
    };
  }, [isReadyToFetch, specs, cacheKey, id, conversationId, upsertArtifact]);

  if (!isReadyToFetch || (!specs && loading)) {
    return (
      <div className="my-3 not-prose flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 py-4 text-xs text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
        <span>Recherche de vidéos YouTube pertinentes...</span>
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return null;
  }

  const active = videos[activeIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="my-3 not-prose rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-base/70 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Youtube className="h-4 w-4 text-red-600 shrink-0" />
          <span className="truncate text-xs font-semibold text-text-primary">
            {active?.title || "Vidéo YouTube"}
          </span>
        </div>
        {videos.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {active && (
              <a
                href={`https://www.youtube.com/watch?v=${active.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">YouTube</span>
              </a>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => openArtifact(id)}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <PanelRightOpen className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>Panneau droite</span>
            </motion.button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="aspect-video w-full animate-pulse bg-slate-200" />
      ) : active ? (
        <div className="p-3 space-y-2.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.videoId}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${active.videoId}?rel=0`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </motion.div>
          </AnimatePresence>

          {(active.channel || active.duration) && (
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{active.channel}</span>
              <span>{active.duration}</span>
            </div>
          )}

          {videos.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {videos.map((v, idx) => (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  key={v.videoId}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "max-w-[240px] truncate rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    idx === activeIdx
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border bg-base text-text-secondary hover:bg-hover hover:text-text-primary"
                  )}
                  title={v.title}
                >
                  {idx + 1}. {v.title}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
