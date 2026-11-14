"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Layers,
  Eye,
  EyeOff,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
} from "lucide-react";

const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#84cc16", // Lime
];

export interface ChartFunctionDef {
  expr: string;
  label?: string;
  color?: string;
}

export interface ChartAnnotation {
  x?: string | number;
  y?: number;
  label: string;
}

export interface ChartAsymptote {
  x?: number;
  y?: number;
  label?: string;
}

export interface ChartPayload {
  chartType: "bar" | "line" | "area" | "composed" | "pie" | "radar" | "scatter";
  title?: string;
  subtitle?: string;
  unit?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  domain?: [number, number];
  yDomain?: [number, number];
  functions?: ChartFunctionDef[];
  asymptotes?: ChartAsymptote[];
  annotations?: ChartAnnotation[];
  data?: Record<string, any>[];
}

// ─── Safe Mathematical Expression Evaluator ───────────────────────────────────

const MATH_FUNCS: Record<string, (n: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  log10: Math.log10,
  log2: Math.log2,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sign: Math.sign,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

const MATH_CONSTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  tau: Math.PI * 2,
  e: Math.E,
};

function normalizeMathExpr(rawExpr: string): string {
  return rawExpr
    .replace(/^[A-Za-z_][A-Za-z0-9_]*\s*(?:\([^)]*\))?\s*=\s*/, "")
    .replace(/\b(?:np|numpy|math)\./g, "")
    .replace(/−/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/ˣ/g, "^x")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/\*\*/g, "^")
    .trim();
}

export function evalMathExpression(rawExpr: string, env: Record<string, number>): number | null {
  const cleaned = normalizeMathExpr(rawExpr);
  if (!cleaned) return null;

  let pos = 0;

  function skipWs() {
    while (pos < cleaned.length && /\s/.test(cleaned[pos])) pos++;
  }

  function isImplicitMulStart(): boolean {
    skipWs();
    if (pos >= cleaned.length) return false;
    const ch = cleaned[pos];
    return ch === "(" || /[A-Za-z_0-9.]/.test(ch);
  }

  function parseExpression(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (true) {
      skipWs();
      const ch = cleaned[pos];
      if (ch === "+" || ch === "-") {
        pos++;
        const right = parseTerm();
        if (right === null) return null;
        left = ch === "+" ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseSignedPower();
    if (left === null) return null;
    while (true) {
      skipWs();
      const ch = cleaned[pos];
      if (ch === "*" || ch === "/") {
        pos++;
        const right = parseSignedPower();
        if (right === null) return null;
        if (ch === "*") left *= right;
        else left = right === 0 ? NaN : left / right;
      } else if (isImplicitMulStart()) {
        const right = parseSignedPower();
        if (right === null) return null;
        left *= right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseSignedPower(): number | null {
    skipWs();
    if (cleaned[pos] === "+") {
      pos++;
      return parseSignedPower();
    }
    if (cleaned[pos] === "-") {
      pos++;
      const v = parseSignedPower();
      return v === null ? null : -v;
    }
    return parsePower();
  }

  function parsePower(): number | null {
    const base = parsePrimary();
    if (base === null) return null;
    skipWs();
    if (cleaned[pos] === "^") {
      pos++;
      const exp = parseSignedPower();
      if (exp === null) return null;
      return Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary(): number | null {
    skipWs();
    if (cleaned[pos] === "(") {
      pos++;
      const inner = parseExpression();
      skipWs();
      if (cleaned[pos] !== ")") return null;
      pos++;
      return inner;
    }

    const numMatch = cleaned.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (numMatch) {
      pos += numMatch[0].length;
      return Number(numMatch[0]);
    }

    const idMatch = cleaned.slice(pos).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (idMatch) {
      const ident = idMatch[0];
      pos += ident.length;
      skipWs();

      const fn = MATH_FUNCS[ident];
      if (fn && cleaned[pos] === "(") {
        pos++;
        const arg = parseExpression();
        skipWs();
        if (cleaned[pos] !== ")" || arg === null) return null;
        pos++;
        return fn(arg);
      }

      if (Object.prototype.hasOwnProperty.call(MATH_CONSTS, ident)) {
        return MATH_CONSTS[ident];
      }
      if (Object.prototype.hasOwnProperty.call(env, ident)) {
        return env[ident];
      }
      return null;
    }

    return null;
  }

  const result = parseExpression();
  skipWs();
  if (pos !== cleaned.length || result === null || !Number.isFinite(result)) return null;
  return result;
}

export function formatAxisTick(n: number): string {
  if (Math.abs(n) < 1e-9) return "0";
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(2)).toString();
}

function formatMetricValue(n: number, unit?: string): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  let formatted: string;
  if (abs === 0) formatted = "0";
  else if (abs >= 1_000_000) formatted = `${(n / 1_000_000).toFixed(2)}M`;
  else if (abs >= 10_000) formatted = Math.round(n).toLocaleString("fr-FR");
  else if (Number.isInteger(n)) formatted = n.toLocaleString("fr-FR");
  else if (abs < 0.01) formatted = n.toExponential(2);
  else formatted = Number(n.toFixed(2)).toLocaleString("fr-FR");

  return unit ? `${formatted} ${unit}` : formatted;
}

function toFiniteNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function detectSeriesKeys(items: Record<string, any>[]): string[] {
  const candidates = new Set<string>();
  for (const row of items.slice(0, 8)) {
    if (!row || typeof row !== "object") continue;
    for (const key of Object.keys(row)) {
      if (key === "name" || key === "label" || key === "category" || key === "x" || key === "_numX") {
        continue;
      }
      if (toFiniteNumber(row[key]) !== null) {
        candidates.add(key);
      }
    }
  }
  return candidates.size > 0 ? Array.from(candidates) : ["value"];
}

// Evaluate `functions` + `domain` into 121 exact points (hitting 0 cleanly on symmetric ranges)
function buildFunctionRows(
  functions: ChartFunctionDef[],
  domain?: [number, number]
): { rows: Record<string, any>[]; customColors: Record<string, string> } {
  const validDomain =
    Array.isArray(domain) &&
    domain.length === 2 &&
    Number.isFinite(Number(domain[0])) &&
    Number.isFinite(Number(domain[1])) &&
    Number(domain[0]) < Number(domain[1])
      ? [Number(domain[0]), Number(domain[1])]
      : [-10, 10];

  const [minX, maxX] = validDomain;
  const sampleCount = 121;
  const rows: Record<string, any>[] = [];
  const customColors: Record<string, string> = {};

  const namedFns = functions
    .filter((f) => f && typeof f.expr === "string" && f.expr.trim().length > 0)
    .map((f, idx) => {
      const key = (f.label || f.expr || `y${idx + 1}`).trim();
      if (f.color) customColors[key] = f.color;
      return { key, expr: f.expr.trim() };
    });

  if (namedFns.length === 0) return { rows: [], customColors };

  for (let i = 0; i < sampleCount; i++) {
    const xVal = minX + ((maxX - minX) * i) / (sampleCount - 1);
    const cleanX = Math.abs(xVal) < 1e-9 ? 0 : Number(xVal.toFixed(4));
    const row: Record<string, any> = {
      name: formatAxisTick(cleanX),
      _numX: cleanX,
    };

    let hasAnyValidY = false;
    for (const fn of namedFns) {
      const y = evalMathExpression(fn.expr, { x: xVal, t: xVal });
      if (y !== null && Number.isFinite(y) && Math.abs(y) <= 1e6) {
        row[fn.key] = Math.abs(y) < 1e-9 ? 0 : Number(y.toFixed(4));
        hasAnyValidY = true;
      } else {
        row[fn.key] = null;
      }
    }

    if (hasAnyValidY) rows.push(row);
  }

  return { rows, customColors };
}

// Smooth sparse numeric math curves (e.g. LLM emitted 7 points on [-3, 3]) using Catmull-Rom
function maybeDensifyNumericCurve(
  items: Record<string, any>[],
  nameKey: string,
  seriesKeys: string[],
  chartType: ChartPayload["chartType"]
): Record<string, any>[] {
  if (chartType !== "line" && chartType !== "area") return items;
  if (items.length < 4 || items.length > 14 || seriesKeys.length === 0) return items;

  const parsedXs = items.map((r) => toFiniteNumber(r?.[nameKey]));
  if (parsedXs.some((x) => x === null)) return items;
  const xs = parsedXs as number[];

  // Do not interpolate discrete year sequences (e.g., 2018, 2019, 2020)
  const looksLikeYears = xs.every((x) => Number.isInteger(x) && x >= 1800 && x <= 2100);
  if (looksLikeYears) return items;

  // Require strictly increasing X
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] <= xs[i - 1]) return items;
  }

  const hasNegativeOrDecimal = xs.some((x) => x < 0 || !Number.isInteger(x));
  if (!hasNegativeOrDecimal) return items;

  const subdivisions = 6;
  const dense: Record<string, any>[] = [];

  for (let i = 0; i < items.length - 1; i++) {
    const p0Idx = Math.max(0, i - 1);
    const p1Idx = i;
    const p2Idx = i + 1;
    const p3Idx = Math.min(items.length - 1, i + 2);

    const x1 = xs[p1Idx];
    const x2 = xs[p2Idx];

    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;
      const xVal = x1 + (x2 - x1) * t;
      const row: Record<string, any> = {
        [nameKey]: formatAxisTick(xVal),
        _numX: Number(xVal.toFixed(4)),
      };

      for (const key of seriesKeys) {
        const y0 = toFiniteNumber(items[p0Idx][key]);
        const y1 = toFiniteNumber(items[p1Idx][key]);
        const y2 = toFiniteNumber(items[p2Idx][key]);
        const y3 = toFiniteNumber(items[p3Idx][key]);
        if (y0 !== null && y1 !== null && y2 !== null && y3 !== null) {
          const interp =
            0.5 *
            (2 * y1 +
              (-y0 + y2) * t +
              (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 +
              (-y0 + 3 * y1 - 3 * y2 + y3) * t3);
          row[key] = Number(interp.toFixed(4));
        } else if (y1 !== null) {
          row[key] = y1;
        }
      }
      dense.push(row);
    }
  }

  const lastRow = { ...items[items.length - 1], _numX: xs[xs.length - 1] };
  dense.push(lastRow);
  return dense;
}

// ─── Custom Glassmorphic Tooltip ─────────────────────────────────────────────

function CustomChartTooltip({
  active,
  payload,
  label,
  unit,
  xAxisLabel,
  isPie,
  pieTotal,
}: {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  unit?: string;
  xAxisLabel?: string;
  isPie?: boolean;
  pieTotal?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      {label !== undefined && label !== null && String(label) !== "" && (
        <div className="mb-1.5 border-b border-slate-100 pb-1 font-semibold text-slate-800">
          {xAxisLabel ? `${xAxisLabel}: ${label}` : String(label)}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, idx: number) => {
          const rawVal = toFiniteNumber(entry?.value);
          const color = entry?.color || entry?.payload?.fill || COLORS[idx % COLORS.length];
          const pct =
            isPie && pieTotal && pieTotal > 0 && rawVal !== null
              ? ` (${((rawVal / pieTotal) * 100).toFixed(1)}%)`
              : "";
          return (
            <div key={`${entry?.name ?? idx}-${idx}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate max-w-[160px]">{String(entry?.name || "Valeur")}</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">
                {rawVal !== null ? `${formatMetricValue(rawVal, unit)}${pct}` : String(entry?.value ?? "—")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Interactive Infinite-Plane Mathematical Function Grapher (-∞ to +∞) ─────

interface MathViewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function getNiceTicks(min: number, max: number, targetCount = 8): number[] {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const roughStep = span / Math.max(targetCount, 2);
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm = roughStep / mag;
  const niceNorm = norm <= 1.5 ? 1 : norm <= 3.5 ? 2 : norm <= 7.5 ? 5 : 10;
  const step = niceNorm * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let i = 0; i < 40; i++) {
    const val = start + i * step;
    if (val > max + step * 1e-6) break;
    ticks.push(Math.abs(val) < step * 1e-6 ? 0 : val);
  }
  return ticks;
}

function formatMathTick(val: number, span: number): string {
  if (Math.abs(val) < span * 1e-7) return "0";
  const abs = Math.abs(val);
  if (abs >= 1e5 || (abs > 0 && abs < 1e-3)) {
    return val.toExponential(1).replace("+", "");
  }
  return Number(val.toPrecision(4)).toString();
}

function formatLiveCoord(val: number): string {
  if (!Number.isFinite(val)) return "±∞";
  if (Math.abs(val) < 1e-12) return "0";
  const abs = Math.abs(val);
  if (abs >= 1e6 || abs < 1e-4) return val.toExponential(3);
  return Number(val.toFixed(4)).toString();
}

function computeSmartYDomain(
  functions: ChartFunctionDef[],
  xMin: number,
  xMax: number,
  explicitYDomain?: [number, number]
): [number, number] {
  if (
    Array.isArray(explicitYDomain) &&
    explicitYDomain.length === 2 &&
    Number.isFinite(Number(explicitYDomain[0])) &&
    Number.isFinite(Number(explicitYDomain[1])) &&
    Number(explicitYDomain[0]) < Number(explicitYDomain[1])
  ) {
    return [Number(explicitYDomain[0]), Number(explicitYDomain[1])];
  }

  const samples: number[] = [];
  const N = 241;
  for (const fn of functions) {
    for (let i = 0; i < N; i++) {
      const x = xMin + ((xMax - xMin) * i) / (N - 1);
      const y = evalMathExpression(fn.expr, { x, t: x });
      if (y !== null && Number.isFinite(y) && Math.abs(y) < 1e9) {
        samples.push(y);
      }
    }
  }

  if (samples.length === 0) return [-6, 6];

  const sorted = [...samples].sort((a, b) => a - b);
  const minY = sorted[0];
  const maxY = sorted[sorted.length - 1];
  const p10 = sorted[Math.floor(sorted.length * 0.1)];
  const p15 = sorted[Math.floor(sorted.length * 0.15)];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p80 = sorted[Math.floor(sorted.length * 0.8)];
  const p85 = sorted[Math.floor(sorted.length * 0.85)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];

  const fullSpan = Math.max(maxY - minY, 1e-6);
  const centralSpan = Math.max(p85 - p15, 1e-3);

  // Detect extreme exponential growth or vertical asymptotes that would squash the main curve
  const hasExtremeTail =
    fullSpan > 8 * Math.max(1, centralSpan) ||
    (maxY > 45 && p50 >= -2 && p50 < 5);

  let low = hasExtremeTail ? Math.max(minY, p10) : minY;
  let high = hasExtremeTail ? Math.min(maxY, p80) : maxY;

  if (hasExtremeTail && minY >= 0 && minY < 1.5 && p50 < 6) {
    // Frame asymptotic curves like exp(x) cleanly around y = 0..12
    high = Math.max(8, Math.min(high * 1.25, 18));
    low = -Math.max(1.2, high * 0.16);
  } else {
    const pad = Math.max((high - low) * 0.16, 0.8);
    low -= pad;
    high += pad;
    // Keep x-axis visible if curve approaches 0 from above
    if (minY >= 0 && minY < (high - low) * 0.25 && low > -0.5) {
      low = -Math.max(0.8, (high - 0) * 0.14);
    }
  }

  if (high - low < 1) {
    const mid = (high + low) / 2;
    return [mid - 2, mid + 2];
  }

  // Keep negative/positive symmetry slightly balanced if raw values are nearly constant
  if (Math.abs(p90 - p10) < 1e-9 && low === high) {
    return [p50 - 4, p50 + 4];
  }

  return [Number(low.toFixed(3)), Number(high.toFixed(3))];
}

function MathFunctionGrapher({ data, height = 360 }: { data: ChartPayload; height?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(640);
  const svgHeight = Math.max(height, 320);

  const validFunctions = useMemo(
    () =>
      (data.functions || []).filter(
        (f): f is ChartFunctionDef => Boolean(f && typeof f.expr === "string" && f.expr.trim())
      ),
    [data.functions]
  );

  const initialViewport = useMemo<MathViewport>(() => {
    const validX =
      Array.isArray(data.domain) &&
      data.domain.length === 2 &&
      Number.isFinite(Number(data.domain[0])) &&
      Number.isFinite(Number(data.domain[1])) &&
      Number(data.domain[0]) < Number(data.domain[1])
        ? [Number(data.domain[0]), Number(data.domain[1])]
        : [-6, 6];

    const [yMin, yMax] = computeSmartYDomain(validFunctions, validX[0], validX[1], data.yDomain);
    return { xMin: validX[0], xMax: validX[1], yMin, yMax };
  }, [validFunctions, data.domain, data.yDomain]);

  const [viewport, setViewport] = useState<MathViewport>(initialViewport);
  const [showArea, setShowArea] = useState(data.chartType === "area");
  const [hiddenMap, setHiddenMap] = useState<Record<number, boolean>>({});
  const [hoverPx, setHoverPx] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<{
    clientX: number;
    clientY: number;
    startViewport: MathViewport;
  } | null>(null);

  useEffect(() => {
    setViewport(initialViewport);
  }, [initialViewport]);

  useEffect(() => {
    setShowArea(data.chartType === "area");
  }, [data.chartType]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.round(el.clientWidth);
      if (w >= 240) setSvgWidth(w);
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, []);

  const pad = { top: 20, right: 24, bottom: 24, left: 28 };
  const plotW = Math.max(svgWidth - pad.left - pad.right, 100);
  const plotH = Math.max(svgHeight - pad.top - pad.bottom, 100);

  const xSpan = viewport.xMax - viewport.xMin;
  const ySpan = viewport.yMax - viewport.yMin;

  const toPxX = (x: number) => pad.left + ((x - viewport.xMin) / xSpan) * plotW;
  const toPxY = (y: number) => pad.top + ((viewport.yMax - y) / ySpan) * plotH;
  const toMathX = (px: number) => viewport.xMin + ((px - pad.left) / plotW) * xSpan;
  const toMathY = (py: number) => viewport.yMax - ((py - pad.top) / plotH) * ySpan;

  // Support Ctrl/Cmd/Shift + wheel zoom anchored under the pointer without blocking normal page scroll
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return;
      e.preventDefault();
      const rect = svgEl.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 1.18 : 0.85;

      setViewport((prev) => {
        const curXSpan = prev.xMax - prev.xMin;
        const curYSpan = prev.yMax - prev.yMin;
        const nextXSpan = Math.min(Math.max(curXSpan * factor, 1e-4), 1e9);
        const nextYSpan = Math.min(Math.max(curYSpan * factor, 1e-4), 1e9);
        const ratioX = Math.min(Math.max((px - pad.left) / plotW, 0), 1);
        const ratioY = Math.min(Math.max((py - pad.top) / plotH, 0), 1);
        const anchorX = prev.xMin + ratioX * curXSpan;
        const anchorY = prev.yMax - ratioY * curYSpan;
        return {
          xMin: anchorX - ratioX * nextXSpan,
          xMax: anchorX + (1 - ratioX) * nextXSpan,
          yMin: anchorY - (1 - ratioY) * nextYSpan,
          yMax: anchorY + ratioY * nextYSpan,
        };
      });
    };

    svgEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => svgEl.removeEventListener("wheel", handleWheel);
  }, [pad.left, pad.top, plotW, plotH]);

  const zoomCenter = (factor: number) => {
    setViewport((prev) => {
      const cx = (prev.xMin + prev.xMax) / 2;
      const cy = (prev.yMin + prev.yMax) / 2;
      const nextHalfX = Math.min(Math.max(((prev.xMax - prev.xMin) / 2) * factor, 1e-4), 5e8);
      const nextHalfY = Math.min(Math.max(((prev.yMax - prev.yMin) / 2) * factor, 1e-4), 5e8);
      return {
        xMin: cx - nextHalfX,
        xMax: cx + nextHalfX,
        yMin: cy - nextHalfY,
        yMax: cy + nextHalfY,
      };
    });
  };

  const panBy = (dxFrac: number, dyFrac: number) => {
    setViewport((prev) => {
      const dx = (prev.xMax - prev.xMin) * dxFrac;
      const dy = (prev.yMax - prev.yMin) * dyFrac;
      return {
        xMin: prev.xMin + dx,
        xMax: prev.xMax + dx,
        yMin: prev.yMin + dy,
        yMax: prev.yMax + dy,
      };
    });
  };

  const applySymmetricX = (halfRange: number) => {
    const x0 = -halfRange;
    const x1 = halfRange;
    const [y0, y1] = computeSmartYDomain(validFunctions, x0, x1);
    setViewport({ xMin: x0, xMax: x1, yMin: y0, yMax: y1 });
  };

  const fitYToCurrentX = () => {
    const [y0, y1] = computeSmartYDomain(validFunctions, viewport.xMin, viewport.xMax);
    setViewport((prev) => ({ ...prev, yMin: y0, yMax: y1 }));
  };

  const xTicks = useMemo(
    () => getNiceTicks(viewport.xMin, viewport.xMax, Math.max(5, Math.floor(plotW / 75))),
    [viewport.xMin, viewport.xMax, plotW]
  );
  const yTicks = useMemo(
    () => getNiceTicks(viewport.yMin, viewport.yMax, Math.max(4, Math.floor(plotH / 52))),
    [viewport.yMin, viewport.yMax, plotH]
  );

  // Sample 361 points across visible [xMin, xMax] and build smooth clipped SVG paths
  const curves = useMemo(() => {
    const N = 361;
    const clampPxY = (y: number) => {
      const raw = pad.top + ((viewport.yMax - y) / ySpan) * plotH;
      return Math.min(Math.max(raw, pad.top - 400), svgHeight - pad.bottom + 400);
    };
    const zeroYClamped = clampPxY(0);

    return validFunctions.map((fn, idx) => {
      const color = fn.color || COLORS[idx % COLORS.length];
      const label = (fn.label || fn.expr).trim();
      const strokeCommands: string[] = [];
      const areaCommands: string[] = [];

      let currentStroke: string[] = [];
      let currentArea: string[] = [];
      let firstSegmentX: number | null = null;
      let lastSegmentX: number | null = null;
      let prevY: number | null = null;

      const flushSegment = () => {
        if (currentStroke.length >= 2) {
          strokeCommands.push(currentStroke.join(" "));
          if (firstSegmentX !== null && lastSegmentX !== null) {
            areaCommands.push(
              `${currentArea.join(" ")} L ${lastSegmentX.toFixed(1)} ${zeroYClamped.toFixed(
                1
              )} L ${firstSegmentX.toFixed(1)} ${zeroYClamped.toFixed(1)} Z`
            );
          }
        }
        currentStroke = [];
        currentArea = [];
        firstSegmentX = null;
        lastSegmentX = null;
      };

      for (let i = 0; i < N; i++) {
        const xVal = viewport.xMin + (xSpan * i) / (N - 1);
        const yVal = evalMathExpression(fn.expr, { x: xVal, t: xVal });

        if (yVal === null || !Number.isFinite(yVal)) {
          flushSegment();
          prevY = null;
          continue;
        }

        // Break path cleanly on vertical asymptotes (e.g. 1/x or tan(x))
        if (
          prevY !== null &&
          Math.abs(yVal - prevY) > ySpan * 1.35 &&
          ((prevY > viewport.yMax && yVal < viewport.yMin) ||
            (prevY < viewport.yMin && yVal > viewport.yMax))
        ) {
          flushSegment();
        }

        const pxX = pad.left + ((xVal - viewport.xMin) / xSpan) * plotW;
        const pxY = clampPxY(yVal);
        const cmd = currentStroke.length === 0 ? "M" : "L";
        const ptStr = `${cmd} ${pxX.toFixed(1)} ${pxY.toFixed(1)}`;
        currentStroke.push(ptStr);
        currentArea.push(ptStr);
        if (firstSegmentX === null) firstSegmentX = pxX;
        lastSegmentX = pxX;
        prevY = yVal;
      }
      flushSegment();

      // Compute Y-intercept (0, f(0)) when x=0 is inside viewport
      let yIntercept: number | null = null;
      if (viewport.xMin <= 0 && viewport.xMax >= 0) {
        const y0 = evalMathExpression(fn.expr, { x: 0, t: 0 });
        if (y0 !== null && Number.isFinite(y0) && y0 >= viewport.yMin && y0 <= viewport.yMax) {
          yIntercept = y0;
        }
      }

      return {
        idx,
        expr: fn.expr,
        label,
        color,
        strokePath: strokeCommands.join(" "),
        areaPath: areaCommands.join(" "),
        yIntercept,
      };
    });
  }, [validFunctions, viewport, xSpan, ySpan, plotW, plotH, pad.left, pad.top, pad.bottom, svgHeight]);

  // Live hover values
  const hoverInfo = useMemo(() => {
    if (!hoverPx) return null;
    if (
      hoverPx.x < pad.left ||
      hoverPx.x > svgWidth - pad.right ||
      hoverPx.y < pad.top ||
      hoverPx.y > svgHeight - pad.bottom
    ) {
      return null;
    }
    const mathX = viewport.xMin + ((hoverPx.x - pad.left) / plotW) * xSpan;
    const points = curves
      .filter((c) => !hiddenMap[c.idx])
      .map((c) => {
        const mathY = evalMathExpression(c.expr, { x: mathX, t: mathX });
        const inView =
          mathY !== null &&
          Number.isFinite(mathY) &&
          mathY >= viewport.yMin &&
          mathY <= viewport.yMax;
        return {
          ...c,
          mathY,
          pxY:
            mathY !== null && Number.isFinite(mathY)
              ? pad.top + ((viewport.yMax - mathY) / ySpan) * plotH
              : null,
          inView,
        };
      });

    return { mathX, pxX: hoverPx.x, points };
  }, [
    hoverPx,
    curves,
    hiddenMap,
    viewport,
    xSpan,
    ySpan,
    plotW,
    plotH,
    pad.left,
    pad.right,
    pad.top,
    pad.bottom,
    svgWidth,
    svgHeight,
  ]);

  // Axis positions (centered on (0, 0) when visible, clamped to frame edge when panned away)
  const rawX0Px = toPxX(0);
  const rawY0Px = toPxY(0);
  const xAxisVisible = rawY0Px >= pad.top + 8 && rawY0Px <= svgHeight - pad.bottom - 12;
  const yAxisVisible = rawX0Px >= pad.left + 26 && rawX0Px <= svgWidth - pad.right - 12;
  const xAxisLineY = xAxisVisible ? rawY0Px : rawY0Px < pad.top + 8 ? pad.top : svgHeight - pad.bottom;
  const yAxisLineX = yAxisVisible ? rawX0Px : rawX0Px < pad.left + 26 ? pad.left : svgWidth - pad.right;

  return (
    <motion.div
      dir="ltr"
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full space-y-2.5 text-slate-900 select-none"
    >
      {/* Title + Interactive Controls */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {data.title && (
            <h4 className="text-sm font-bold tracking-tight text-slate-900">{data.title}</h4>
          )}
          {data.subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{data.subtitle}</p>
          )}
        </div>

        {/* Pan & Infinite Zoom Controls */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => panBy(-0.35, 0)}
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Déplacer vers -∞"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>−∞</span>
          </button>
          <button
            type="button"
            onClick={() => panBy(0.35, 0)}
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Déplacer vers +∞"
          >
            <span>+∞</span>
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => panBy(0, 0.3)}
            className="inline-flex items-center rounded-md px-1.5 py-1 text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Monter"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => panBy(0, -0.3)}
            className="inline-flex items-center rounded-md px-1.5 py-1 text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Descendre"
          >
            <ArrowDown className="h-3 w-3" />
          </button>

          <span className="mx-0.5 h-3.5 w-px bg-slate-200" />

          <button
            type="button"
            onClick={() => zoomCenter(0.6)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Zoomer"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => zoomCenter(1.8)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Dézoomer vers -∞ / +∞"
          >
            <ZoomOut className="h-3 w-3" />
          </button>

          <span className="mx-0.5 h-3.5 w-px bg-slate-200" />

          {[6, 25, 100].map((span) => (
            <button
              key={span}
              type="button"
              onClick={() => applySymmetricX(span)}
              className="hidden sm:inline-flex items-center rounded-md px-1.5 py-1 font-mono text-[10px] font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
              title={`Afficher sur [-${span}, ${span}]`}
            >
              ±{span}
            </button>
          ))}

          <button
            type="button"
            onClick={fitYToCurrentX}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Ajuster l'axe Y automatiquement"
          >
            <Maximize2 className="h-3 w-3" />
            <span className="hidden md:inline">Ajuster Y</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArea((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium transition-colors ${
              showArea
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Activer/désactiver le remplissage"
          >
            <Layers className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={() => setViewport(initialViewport)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-600 hover:bg-white hover:text-indigo-600"
            title="Recentrer sur l'origine"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Function Expression Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {curves.map((c) => {
          const hidden = Boolean(hiddenMap[c.idx]);
          return (
            <button
              key={`${c.idx}-${c.label}`}
              type="button"
              onClick={() =>
                setHiddenMap((prev) => {
                  const next = { ...prev, [c.idx]: !prev[c.idx] };
                  if (curves.every((item) => next[item.idx])) return prev;
                  return next;
                })
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-opacity ${
                hidden
                  ? "border-slate-200 bg-slate-50 text-slate-400 opacity-60"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-mono">{c.label}</span>
              {c.yIntercept !== null && (
                <span className="text-[10px] text-slate-400">
                  · f(0)={formatMathTick(c.yIntercept, ySpan)}
                </span>
              )}
              {curves.length > 1 &&
                (hidden ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5 text-slate-400" />)}
            </button>
          );
        })}
      </div>

      {/* Interactive Cartesian SVG Canvas */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
        style={{ height: svgHeight }}
      >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          className={`block touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={(e) => {
            dragStateRef.current = {
              clientX: e.clientX,
              clientY: e.clientY,
              startViewport: viewport,
            };
            setIsDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverPx({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            if (!dragStateRef.current) return;
            const dxPx = e.clientX - dragStateRef.current.clientX;
            const dyPx = e.clientY - dragStateRef.current.clientY;
            const sv = dragStateRef.current.startViewport;
            const dxMath = -(dxPx / plotW) * (sv.xMax - sv.xMin);
            const dyMath = (dyPx / plotH) * (sv.yMax - sv.yMin);
            setViewport({
              xMin: sv.xMin + dxMath,
              xMax: sv.xMax + dxMath,
              yMin: sv.yMin + dyMath,
              yMax: sv.yMax + dyMath,
            });
          }}
          onPointerUp={() => {
            dragStateRef.current = null;
            setIsDragging(false);
          }}
          onPointerCancel={() => {
            dragStateRef.current = null;
            setIsDragging(false);
          }}
          onPointerLeave={() => {
            if (!dragStateRef.current) setHoverPx(null);
          }}
        >
          <defs>
            <clipPath id={`clip-${uid}`}>
              <rect x={pad.left} y={pad.top} width={plotW} height={plotH} rx={4} />
            </clipPath>
            <marker
              id={`arrow-${uid}`}
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
            </marker>
            {curves.map((c) => (
              <linearGradient key={c.idx} id={`mgrad-${uid}-${c.idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c.color} stopOpacity={0.28} />
                <stop offset="95%" stopColor={c.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          <g>
            {xTicks.map((t) => {
              const px = toPxX(t);
              if (px < pad.left || px > svgWidth - pad.right) return null;
              return (
                <line
                  key={`gx-${t}`}
                  x1={px}
                  y1={pad.top}
                  x2={px}
                  y2={svgHeight - pad.bottom}
                  stroke={t === 0 ? "#cbd5e1" : "#f1f5f9"}
                  strokeWidth={1}
                />
              );
            })}
            {yTicks.map((t) => {
              const py = toPxY(t);
              if (py < pad.top || py > svgHeight - pad.bottom) return null;
              return (
                <line
                  key={`gy-${t}`}
                  x1={pad.left}
                  y1={py}
                  x2={svgWidth - pad.right}
                  y2={py}
                  stroke={t === 0 ? "#cbd5e1" : "#f1f5f9"}
                  strokeWidth={1}
                />
              );
            })}
          </g>

          {/* Cartesian Axes (x=0 and y=0) with -∞ / +∞ arrows */}
          <g>
            <line
              x1={pad.left}
              y1={xAxisLineY}
              x2={svgWidth - pad.right}
              y2={xAxisLineY}
              stroke={xAxisVisible ? "#475569" : "#94a3b8"}
              strokeWidth={xAxisVisible ? 1.5 : 1}
              markerStart={xAxisVisible ? `url(#arrow-${uid})` : undefined}
              markerEnd={xAxisVisible ? `url(#arrow-${uid})` : undefined}
            />
            <line
              x1={yAxisLineX}
              y1={svgHeight - pad.bottom}
              x2={yAxisLineX}
              y2={pad.top}
              stroke={yAxisVisible ? "#475569" : "#94a3b8"}
              strokeWidth={yAxisVisible ? 1.5 : 1}
              markerStart={yAxisVisible ? `url(#arrow-${uid})` : undefined}
              markerEnd={yAxisVisible ? `url(#arrow-${uid})` : undefined}
            />

            {/* −∞ and +∞ markers at axis tips */}
            <text
              x={pad.left + 4}
              y={Math.min(xAxisLineY - 6, svgHeight - pad.bottom - 6)}
              fontSize={10}
              fontWeight={600}
              fill="#64748b"
            >
              −∞
            </text>
            <text
              x={svgWidth - pad.right - 4}
              y={Math.min(xAxisLineY - 6, svgHeight - pad.bottom - 6)}
              textAnchor="end"
              fontSize={10}
              fontWeight={600}
              fill="#64748b"
            >
              +∞ {data.xAxisLabel ? `(${data.xAxisLabel})` : ""}
            </text>
            {yAxisVisible && (
              <text
                x={Math.min(yAxisLineX + 8, svgWidth - pad.right - 36)}
                y={pad.top + 11}
                fontSize={10}
                fontWeight={600}
                fill="#64748b"
              >
                +∞ {data.yAxisLabel ? `(${data.yAxisLabel})` : ""}
              </text>
            )}
            {yAxisVisible && (
              <text
                x={Math.min(yAxisLineX + 8, svgWidth - pad.right - 26)}
                y={svgHeight - pad.bottom - 4}
                fontSize={10}
                fontWeight={600}
                fill="#64748b"
              >
                −∞
              </text>
            )}
          </g>

          {/* Axis Tick Labels */}
          <g fontSize={10} fill="#475569" className="font-mono">
            {xTicks.map((t) => {
              const px = toPxX(t);
              if (px < pad.left + 16 || px > svgWidth - pad.right - 16) return null;
              if (t === 0 && xAxisVisible && yAxisVisible) return null;
              const labelY =
                xAxisLineY > svgHeight - pad.bottom - 16
                  ? svgHeight - pad.bottom + 14
                  : xAxisLineY + 13;
              return (
                <text key={`tx-${t}`} x={px} y={labelY} textAnchor="middle">
                  {formatMathTick(t, xSpan)}
                </text>
              );
            })}
            {yTicks.map((t) => {
              const py = toPxY(t);
              if (py < pad.top + 12 || py > svgHeight - pad.bottom - 12) return null;
              if (t === 0 && xAxisVisible && yAxisVisible) return null;
              const onRightOfAxis = yAxisLineX <= pad.left + 32;
              const labelX = onRightOfAxis ? yAxisLineX + 6 : yAxisLineX - 6;
              return (
                <text
                  key={`ty-${t}`}
                  x={labelX}
                  y={py + 3}
                  textAnchor={onRightOfAxis ? "start" : "end"}
                >
                  {formatMathTick(t, ySpan)}
                </text>
              );
            })}
            {xAxisVisible && yAxisVisible && (
              <text x={yAxisLineX - 6} y={xAxisLineY + 13} textAnchor="end" fontWeight={700}>
                0
              </text>
            )}
          </g>

          {/* Clipped Curves, Asymptotes & Intercepts */}
          <g clipPath={`url(#clip-${uid})`}>
            {/* Asymptotes */}
            {Array.isArray(data.asymptotes) &&
              data.asymptotes.map((asym, i) => {
                if (typeof asym.y === "number" && Number.isFinite(asym.y)) {
                  const py = toPxY(asym.y);
                  return (
                    <g key={`ay-${i}`}>
                      <line
                        x1={pad.left}
                        y1={py}
                        x2={svgWidth - pad.right}
                        y2={py}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="6 4"
                      />
                      {asym.label && (
                        <text x={pad.left + 8} y={py - 5} fontSize={10} fontWeight={600} fill="#d97706">
                          {asym.label}
                        </text>
                      )}
                    </g>
                  );
                }
                if (typeof asym.x === "number" && Number.isFinite(asym.x)) {
                  const px = toPxX(asym.x);
                  return (
                    <g key={`ax-${i}`}>
                      <line
                        x1={px}
                        y1={pad.top}
                        x2={px}
                        y2={svgHeight - pad.bottom}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="6 4"
                      />
                      {asym.label && (
                        <text x={px + 6} y={pad.top + 16} fontSize={10} fontWeight={600} fill="#d97706">
                          {asym.label}
                        </text>
                      )}
                    </g>
                  );
                }
                return null;
              })}

            {/* Area shading */}
            {showArea &&
              curves.map((c) =>
                hiddenMap[c.idx] || !c.areaPath ? null : (
                  <motion.path
                    key={`area-${c.idx}`}
                    d={c.areaPath}
                    fill={`url(#mgrad-${uid}-${c.idx})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.12 }}
                  />
                )
              )}

            {/* Function strokes */}
            {curves.map((c) =>
              hiddenMap[c.idx] || !c.strokePath ? null : (
                <motion.path
                  key={`line-${c.idx}`}
                  d={c.strokePath}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0.35 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: c.idx * 0.08 }}
                />
              )
            )}

            {/* Y-Intercept Highlight Points (0, f(0)) */}
            {curves.map((c) => {
              if (hiddenMap[c.idx] || c.yIntercept === null) return null;
              const cx = toPxX(0);
              const cy = toPxY(c.yIntercept);
              return (
                <motion.g
                  key={`yi-${c.idx}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 22, delay: 0.3 }}
                >
                  <circle cx={cx} cy={cy} r={4.5} fill="#ffffff" stroke={c.color} strokeWidth={2.5} />
                  {curves.length === 1 && (
                    <g>
                      <rect
                        x={cx + 7}
                        y={cy - 18}
                        width={54}
                        height={16}
                        rx={4}
                        fill="rgba(255,255,255,0.92)"
                        stroke="#e2e8f0"
                      />
                      <text
                        x={cx + 34}
                        y={cy - 7}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill={c.color}
                        className="font-mono"
                      >
                        (0, {formatMathTick(c.yIntercept, ySpan)})
                      </text>
                    </g>
                  )}
                </motion.g>
              );
            })}

            {/* Live Hover Crosshair & Snapped Points */}
            {hoverInfo && (
              <g>
                <line
                  x1={hoverInfo.pxX}
                  y1={pad.top}
                  x2={hoverInfo.pxX}
                  y2={svgHeight - pad.bottom}
                  stroke="#6366f1"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                {hoverInfo.points.map((pt) =>
                  pt.inView && pt.pxY !== null ? (
                    <circle
                      key={`hp-${pt.idx}`}
                      cx={hoverInfo.pxX}
                      cy={pt.pxY}
                      r={5}
                      fill={pt.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ) : null
                )}
              </g>
            )}
          </g>
        </svg>

        {/* Live Coordinate Readout HUD */}
        <AnimatePresence>
          {hoverInfo && (
            <motion.div
              key="math-hud"
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.14 }}
              className="pointer-events-none absolute top-2 right-2 rounded-lg border border-slate-200/90 bg-white/95 px-2.5 py-1.5 text-[11px] shadow-md backdrop-blur-sm"
            >
              <div className="font-mono font-semibold text-slate-800">
                x = {formatLiveCoord(hoverInfo.mathX)}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {hoverInfo.points.map((pt) => (
                  <div key={`hud-${pt.idx}`} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pt.color }} />
                      <span className="max-w-[110px] truncate">{pt.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {pt.mathY === null
                        ? "indéfini"
                        : !Number.isFinite(pt.mathY)
                        ? pt.mathY > 0
                          ? "+∞"
                          : "−∞"
                        : formatLiveCoord(pt.mathY)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Domain & Navigation Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="font-mono">
          x ∈ [{formatMathTick(viewport.xMin, xSpan)} ; {formatMathTick(viewport.xMax, xSpan)}] · y ∈ [
          {formatMathTick(viewport.yMin, ySpan)} ; {formatMathTick(viewport.yMax, ySpan)}]
        </span>
        <span>Glisser pour explorer de −∞ à +∞ · Ctrl+molette pour zoomer</span>
      </div>
    </motion.div>
  );
}

// ─── Main ChartRenderer ──────────────────────────────────────────────────────

type CartesianMode = "area" | "line" | "bar" | "composed";

export function ChartRenderer({ data, height = 340 }: { data: ChartPayload; height?: number }) {
  const validFns = Array.isArray(data?.functions)
    ? data.functions.filter((f) => f && typeof f.expr === "string" && f.expr.trim().length > 0)
    : [];
  if (validFns.length > 0) {
    return <MathFunctionGrapher data={data} height={height} />;
  }
  return <StandardChartRenderer data={data} height={height} />;
}

function StandardChartRenderer({ data, height = 340 }: { data: ChartPayload; height?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const initialMode: CartesianMode =
    data?.chartType === "area" ||
    data?.chartType === "line" ||
    data?.chartType === "bar" ||
    data?.chartType === "composed"
      ? data.chartType
      : "area";

  const [viewMode, setViewMode] = useState<CartesianMode>(initialMode);
  const [showMean, setShowMean] = useState(false);
  const [showPoints, setShowPoints] = useState<boolean | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode]);

  const { items, customColors, isFunctionPlot } = useMemo(() => {
    const hasFunctions = Array.isArray(data?.functions) && data.functions.length > 0;
    const rawData = Array.isArray(data?.data) ? data.data : [];

    if (hasFunctions) {
      const generated = buildFunctionRows(data.functions!, data.domain);
      if (generated.rows.length > 0) {
        return {
          items: generated.rows,
          customColors: generated.customColors,
          isFunctionPlot: true,
        };
      }
    }

    const normalizedRows = rawData.map((row) => {
      if (!row || typeof row !== "object") return row;
      const normalized: Record<string, any> = { ...row };
      for (const key of Object.keys(normalized)) {
        if (key === "name" || key === "label" || key === "category") continue;
        const num = toFiniteNumber(normalized[key]);
        if (num !== null) normalized[key] = num;
      }
      return normalized;
    });

    const detectedKeys = detectSeriesKeys(normalizedRows);
    const detectedNameKey =
      normalizedRows[0]?.name !== undefined
        ? "name"
        : normalizedRows[0]?.label !== undefined
        ? "label"
        : normalizedRows[0]?.x !== undefined
        ? "x"
        : "name";

    const densified = maybeDensifyNumericCurve(
      normalizedRows,
      detectedNameKey,
      detectedKeys,
      data?.chartType || "line"
    );

    return {
      items: densified,
      customColors: {} as Record<string, string>,
      isFunctionPlot: false,
    };
  }, [data]);

  const nameKey =
    items[0]?.name !== undefined
      ? "name"
      : items[0]?.label !== undefined
      ? "label"
      : items[0]?.x !== undefined
      ? "x"
      : "name";

  const seriesKeys = useMemo(() => detectSeriesKeys(items), [items]);
  const visibleSeries = useMemo(
    () => seriesKeys.filter((k) => !hiddenSeries[k]),
    [seriesKeys, hiddenSeries]
  );
  const activeSeriesKeys = visibleSeries.length > 0 ? visibleSeries : seriesKeys;

  const getSeriesColor = (key: string, idx: number) =>
    customColors[key] || COLORS[idx % COLORS.length];

  // Compute KPI summary metrics + Cartesian axis crossing info
  const stats = useMemo(() => {
    const primaryKey = activeSeriesKeys[0];
    const nums: number[] = [];
    let yMinAll = Infinity;
    let yMaxAll = -Infinity;

    for (const row of items) {
      if (!row || typeof row !== "object") continue;
      const vPrimary = toFiniteNumber(row[primaryKey]);
      if (vPrimary !== null) nums.push(vPrimary);
      for (const key of activeSeriesKeys) {
        const v = toFiniteNumber(row[key]);
        if (v !== null) {
          if (v < yMinAll) yMinAll = v;
          if (v > yMaxAll) yMaxAll = v;
        }
      }
    }

    // Detect if X-axis spans 0
    let zeroXLabel: string | null = null;
    for (const row of items) {
      const nx = toFiniteNumber(row?._numX ?? row?.[nameKey]);
      if (nx !== null && Math.abs(nx) < 1e-6) {
        zeroXLabel = String(row[nameKey]);
        break;
      }
    }

    if (nums.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        sum: 0,
        deltaPct: null as number | null,
        crossesZeroY: false,
        zeroXLabel,
        hasStats: false,
      };
    }

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const first = nums[0];
    const last = nums[nums.length - 1];
    const deltaPct =
      Math.abs(first) > 1e-9 && nums.length >= 2 ? ((last - first) / Math.abs(first)) * 100 : null;

    return {
      min,
      max,
      mean,
      sum,
      deltaPct,
      crossesZeroY: yMinAll < 0 && yMaxAll > 0,
      zeroXLabel,
      hasStats: true,
    };
  }, [items, activeSeriesKeys, nameKey]);

  const effectiveShowPoints =
    showPoints !== null ? showPoints : items.length <= 24 && !isFunctionPlot;

  const isCartesian =
    data.chartType !== "pie" && data.chartType !== "radar" && data.chartType !== "scatter";

  const gradientDefs = (
    <defs>
      {seriesKeys.map((key, idx) => {
        const color = getSeriesColor(key, idx);
        return (
          <linearGradient key={key} id={`grad-${uid}-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.38} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        );
      })}
    </defs>
  );

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent hiding every single series
      if (seriesKeys.every((k) => next[k])) return prev;
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
        Aucune donnée numérique exploitable pour ce graphique.
      </div>
    );
  }

  const renderCartesianAxes = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={viewMode === "line" || viewMode === "area" || viewMode === "composed"} />
      <XAxis
        dataKey={nameKey}
        stroke="#94a3b8"
        tick={{ fill: "#475569", fontSize: 11 }}
        tickLine={{ stroke: "#cbd5e1" }}
        minTickGap={24}
        interval={items.length > 35 ? "preserveStartEnd" : "preserveEnd"}
        label={
          data.xAxisLabel
            ? {
                value: data.xAxisLabel,
                position: "insideBottom",
                offset: -12,
                fontSize: 11,
                fill: "#475569",
                fontWeight: 600,
              }
            : undefined
        }
      />
      <YAxis
        stroke="#94a3b8"
        tick={{ fill: "#475569", fontSize: 11 }}
        tickLine={{ stroke: "#cbd5e1" }}
        width={52}
        tickFormatter={(v) => formatMetricValue(Number(v))}
        label={
          data.yAxisLabel
            ? {
                value: data.yAxisLabel,
                angle: -90,
                position: "insideLeft",
                offset: 4,
                fontSize: 11,
                fill: "#475569",
                fontWeight: 600,
              }
            : undefined
        }
      />
      {stats.crossesZeroY && (
        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.25} strokeOpacity={0.65} />
      )}
      {stats.zeroXLabel !== null && (
        <ReferenceLine x={stats.zeroXLabel} stroke="#64748b" strokeWidth={1.25} strokeOpacity={0.65} />
      )}
      {showMean && stats.hasStats && (
        <ReferenceLine
          y={stats.mean}
          stroke="#f59e0b"
          strokeDasharray="6 4"
          strokeWidth={1.75}
          label={{
            value: `Moy: ${formatMetricValue(stats.mean, data.unit)}`,
            position: "insideTopRight",
            fill: "#d97706",
            fontSize: 11,
            fontWeight: 600,
          }}
        />
      )}
      {Array.isArray(data.annotations) &&
        data.annotations.map((ann, idx) =>
          ann.y !== undefined ? (
            <ReferenceLine
              key={`ann-y-${idx}`}
              y={ann.y}
              stroke="#ec4899"
              strokeDasharray="4 4"
              label={{
                value: ann.label,
                position: "insideTopLeft",
                fill: "#db2777",
                fontSize: 11,
              }}
            />
          ) : ann.x !== undefined ? (
            <ReferenceLine
              key={`ann-x-${idx}`}
              x={String(ann.x)}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{
                value: ann.label,
                position: "top",
                fill: "#4f46e5",
                fontSize: 11,
              }}
            />
          ) : null
        )}
      <Tooltip content={<CustomChartTooltip unit={data.unit} xAxisLabel={data.xAxisLabel} />} />
    </>
  );

  const renderChartBody = () => {
    // ─── Pie / Donut ──────────────────────────────────────────────────────────
    if (data.chartType === "pie") {
      const pieKey = seriesKeys[0] || "value";
      const total = items.reduce((acc, row) => acc + (toFiniteNumber(row?.[pieKey]) ?? 0), 0);

      return (
        <div className="space-y-3">
          <ResponsiveContainer width="100%" height={Math.max(240, height - 40)}>
            <PieChart>
              <Pie
                data={items}
                dataKey={pieKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="82%"
                paddingAngle={3}
                cornerRadius={6}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {items.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomChartTooltip unit={data.unit} isPie pieTotal={total} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {items.map((row, idx) => {
              const val = toFiniteNumber(row?.[pieKey]) ?? 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={`${row?.[nameKey] ?? idx}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate font-medium text-slate-700">
                      {String(row?.[nameKey] ?? `Item ${idx + 1}`)}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-900">
                    {formatMetricValue(val, data.unit)} <span className="text-slate-400">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ─── Radar ────────────────────────────────────────────────────────────────
    if (data.chartType === "radar") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={items} cx="50%" cy="50%" outerRadius="74%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey={nameKey} tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }} />
            <PolarRadiusAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip content={<CustomChartTooltip unit={data.unit} />} />
            {seriesKeys.map((key, idx) =>
              hiddenSeries[key] ? null : (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={getSeriesColor(key, idx)}
                  fill={getSeriesColor(key, idx)}
                  fillOpacity={0.26}
                  strokeWidth={2.25}
                />
              )
            )}
            {seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    // ─── Scatter ──────────────────────────────────────────────────────────────
    if (data.chartType === "scatter") {
      const hasXY =
        items.some((r) => typeof r?.x === "number") && items.some((r) => typeof r?.y === "number");
      const xKey = hasXY ? "x" : seriesKeys[0] || "x";
      const yKey = hasXY ? "y" : seriesKeys[1] || seriesKeys[0] || "value";
      const xVals = items.map((r) => toFiniteNumber(r?.[xKey])).filter((v): v is number => v !== null);
      const yVals = items.map((r) => toFiniteNumber(r?.[yKey])).filter((v): v is number => v !== null);
      const crossesX0 = xVals.some((v) => v < 0) && xVals.some((v) => v > 0);
      const crossesY0 = yVals.some((v) => v < 0) && yVals.some((v) => v > 0);

      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 14, right: 20, bottom: data.xAxisLabel ? 24 : 10, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey={xKey}
              name={data.xAxisLabel || xKey}
              stroke="#94a3b8"
              tick={{ fill: "#475569", fontSize: 11 }}
              label={
                data.xAxisLabel
                  ? { value: data.xAxisLabel, position: "insideBottom", offset: -12, fontSize: 11, fill: "#475569", fontWeight: 600 }
                  : undefined
              }
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name={data.yAxisLabel || yKey}
              stroke="#94a3b8"
              tick={{ fill: "#475569", fontSize: 11 }}
              label={
                data.yAxisLabel
                  ? { value: data.yAxisLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#475569", fontWeight: 600 }
                  : undefined
              }
            />
            {crossesX0 && <ReferenceLine x={0} stroke="#64748b" strokeOpacity={0.6} />}
            {crossesY0 && <ReferenceLine y={0} stroke="#64748b" strokeOpacity={0.6} />}
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "#6366f1" }}
              content={<CustomChartTooltip unit={data.unit} />}
            />
            <Scatter name={data.title || "Points"} data={items} fill={COLORS[0]} fillOpacity={0.85} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    const marginBottom = data.xAxisLabel ? 24 : 10;

    // ─── Bar ──────────────────────────────────────────────────────────────────
    if (viewMode === "bar") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={items} margin={{ top: 14, right: 18, bottom: marginBottom, left: 6 }}>
            {gradientDefs}
            {renderCartesianAxes()}
            {seriesKeys.map((key, idx) =>
              hiddenSeries[key] ? null : (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={getSeriesColor(key, idx)}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              )
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // ─── Composed (Area/Bar + Line overlay) ───────────────────────────────────
    if (viewMode === "composed") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={items} margin={{ top: 14, right: 18, bottom: marginBottom, left: 6 }}>
            {gradientDefs}
            {renderCartesianAxes()}
            {seriesKeys.map((key, idx) => {
              if (hiddenSeries[key]) return null;
              const color = getSeriesColor(key, idx);
              if (idx === 0) {
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={`url(#grad-${uid}-${idx})`}
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={effectiveShowPoints ? { r: 3, fill: color, strokeWidth: 1.5, stroke: "#fff" } : false}
                    activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
                  />
                );
              }
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={effectiveShowPoints ? { r: 3, fill: color, strokeWidth: 1.5, stroke: "#fff" } : false}
                  activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // ─── Line ─────────────────────────────────────────────────────────────────
    if (viewMode === "line") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={items} margin={{ top: 14, right: 18, bottom: marginBottom, left: 6 }}>
            {renderCartesianAxes()}
            {seriesKeys.map((key, idx) => {
              if (hiddenSeries[key]) return null;
              const color = getSeriesColor(key, idx);
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2.75}
                  connectNulls={false}
                  dot={effectiveShowPoints ? { r: 3.2, fill: color, strokeWidth: 1.5, stroke: "#fff" } : false}
                  activeDot={{ r: 5.5, fill: color, stroke: "#fff", strokeWidth: 2 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // ─── Area (Default smooth gradient curve) ─────────────────────────────────
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={items} margin={{ top: 14, right: 18, bottom: marginBottom, left: 6 }}>
          {gradientDefs}
          {renderCartesianAxes()}
          {seriesKeys.map((key, idx) => {
            if (hiddenSeries[key]) return null;
            const color = getSeriesColor(key, idx);
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                fill={`url(#grad-${uid}-${idx})`}
                strokeWidth={2.6}
                connectNulls={false}
                dot={effectiveShowPoints ? { r: 3, fill: color, strokeWidth: 1.5, stroke: "#fff" } : false}
                activeDot={{ r: 5.5, fill: color, stroke: "#fff", strokeWidth: 2 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      dir="ltr"
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="w-full space-y-3 text-slate-900"
    >
      {/* Header + Interactive View Controls */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {data.title && (
            <h4 className="text-sm font-bold tracking-tight text-slate-900">{data.title}</h4>
          )}
          {data.subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{data.subtitle}</p>
          )}
        </div>

        {isCartesian && (
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode("area")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                viewMode === "area"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Vue Aire"
            >
              <Layers className="h-3 w-3" />
              <span>Aire</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("line")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                viewMode === "line"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Vue Courbe"
            >
              <TrendingUp className="h-3 w-3" />
              <span>Courbe</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("bar")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                viewMode === "bar"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Vue Barres"
            >
              <BarChart3 className="h-3 w-3" />
              <span>Barres</span>
            </button>
            {seriesKeys.length > 1 && (
              <button
                type="button"
                onClick={() => setViewMode("composed")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                  viewMode === "composed"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Vue Combinée"
              >
                <Activity className="h-3 w-3" />
                <span>Mixte</span>
              </button>
            )}
            <span className="mx-0.5 h-3.5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setShowMean((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                showMean
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Afficher la ligne de moyenne"
            >
              <Minus className="h-3 w-3" />
              <span>Moy.</span>
            </button>
            {viewMode !== "bar" && (
              <button
                type="button"
                onClick={() => setShowPoints(!effectiveShowPoints)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                  effectiveShowPoints
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Afficher les points"
              >
                <Activity className="h-3 w-3" />
                <span>Points</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Automatic KPI Summary Strip */}
      {stats.hasStats && data.chartType !== "scatter" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {data.chartType === "pie" ? (
            <>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Total
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {formatMetricValue(stats.sum, data.unit)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Maximum
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {formatMetricValue(stats.max, data.unit)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Moyenne
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {formatMetricValue(stats.mean, data.unit)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Catégories
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">{items.length}</div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Minimum
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {formatMetricValue(stats.min, data.unit)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Maximum
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {formatMetricValue(stats.max, data.unit)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Moyenne
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {formatMetricValue(stats.mean, data.unit)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {isFunctionPlot ? "Résolution" : stats.deltaPct !== null ? "Évolution (Δ)" : "Points"}
                </div>
                {isFunctionPlot ? (
                  <div className="font-mono text-xs font-bold text-indigo-600">
                    {items.length} pts lissés
                  </div>
                ) : stats.deltaPct !== null ? (
                  <div
                    className={`font-mono text-xs font-bold ${
                      stats.deltaPct >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {stats.deltaPct >= 0 ? "+" : ""}
                    {stats.deltaPct.toFixed(1)}%
                  </div>
                ) : (
                  <div className="font-mono text-xs font-bold text-slate-900">{items.length}</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Interactive Series Pills */}
      {isCartesian && seriesKeys.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {seriesKeys.map((key, idx) => {
            const color = getSeriesColor(key, idx);
            const hidden = Boolean(hiddenSeries[key]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSeries(key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-opacity ${
                  hidden
                    ? "border-slate-200 bg-slate-50 text-slate-400 opacity-60"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{key}</span>
                {seriesKeys.length > 1 &&
                  (hidden ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5 text-slate-400" />)}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Chart Surface */}
      <AnimatePresence mode="wait">
        <motion.div
          key={data.chartType === "pie" || data.chartType === "radar" || data.chartType === "scatter" ? data.chartType : viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="w-full pt-1"
        >
          {renderChartBody()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
