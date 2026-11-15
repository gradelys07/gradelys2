"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { BarChart3, GitBranch, Loader2 } from "lucide-react";
import type { ChartPayload } from "@/components/chart-renderer";
import {
  isPlottingPython,
  pythonCodeToChartPayload,
} from "@/components/chat/chat-rich-blocks";

const DynamicChartRenderer = dynamic(
  () => import("@/components/chart-renderer").then((m) => m.ChartRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[210px] items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden="true" />
        <span>Affichage du graphique…</span>
      </div>
    ),
  }
);

const DynamicMermaidDiagram = dynamic(
  () => import("@/components/mermaid-diagram").then((m) => m.MermaidDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-28 items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden="true" />
        <span>Préparation du schéma…</span>
      </div>
    ),
  }
);

function parseChartJson(code: string): ChartPayload | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    if (!json || (!Array.isArray(json.data) && !Array.isArray(json.functions))) {
      return null;
    }
    const hasFunctions = Array.isArray(json.functions) && json.functions.length > 0;
    return {
      ...(json as unknown as ChartPayload),
      chartType:
        (json.chartType as ChartPayload["chartType"]) || (hasFunctions ? "area" : "line"),
      data: Array.isArray(json.data) ? (json.data as Record<string, unknown>[]) : [],
    };
  } catch {
    return null;
  }
}

function QuickChartSurface({ parsed }: { parsed: ChartPayload }) {
  const title = parsed.title?.trim() || "Graphique";
  const subtitle = parsed.subtitle?.trim();

  return (
    <div
      className="my-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
      style={{ contain: "layout" }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
            <BarChart3 className="h-3 w-3" aria-hidden="true" />
            <span>Graphique</span>
          </span>
          <span className="truncate text-[11px] font-semibold text-slate-800">{title}</span>
        </div>
        {subtitle && (
          <span className="hidden max-w-[140px] truncate text-[10px] text-slate-500 sm:inline">
            {subtitle}
          </span>
        )}
      </div>
      <div className="p-2">
        <DynamicChartRenderer data={parsed} height={210} />
      </div>
    </div>
  );
}

export const QuickChartBlock = memo(function QuickChartBlock({
  code,
  isStreaming = false,
}: {
  code: string;
  isStreaming?: boolean;
}) {
  const parsed = useMemo(() => parseChartJson(code), [code]);

  if (parsed) {
    return <QuickChartSurface parsed={parsed} />;
  }

  if (isStreaming) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" aria-hidden="true" />
        <span>Tracé du graphique…</span>
      </div>
    );
  }

  return (
    <pre className="my-1.5 overflow-x-auto rounded-md bg-slate-900/90 p-2 text-xs text-slate-100">
      <code>{code}</code>
    </pre>
  );
});

export const QuickPythonChartBlock = memo(function QuickPythonChartBlock({
  code,
  isStreaming = false,
}: {
  code: string;
  isStreaming?: boolean;
}) {
  const isPlot = isPlottingPython(code);
  const parsed = useMemo(() => {
    if (!isPlot) return null;
    if (isStreaming && !/\bplt\.show\s*\(/.test(code)) return null;
    return pythonCodeToChartPayload(code);
  }, [code, isPlot, isStreaming]);

  if (parsed) {
    return <QuickChartSurface parsed={parsed} />;
  }

  if (isStreaming && isPlot) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" aria-hidden="true" />
        <span>Tracé du graphique…</span>
      </div>
    );
  }

  return (
    <pre className="my-1.5 overflow-x-auto rounded-md bg-slate-900/90 p-2 text-xs text-slate-100">
      <code>{code}</code>
    </pre>
  );
});

export const QuickMermaidBlock = memo(function QuickMermaidBlock({
  code,
  id,
  isStreaming = false,
}: {
  code: string;
  id: string;
  isStreaming?: boolean;
}) {
  if (isStreaming) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" aria-hidden="true" />
        <span>Préparation du schéma…</span>
      </div>
    );
  }

  return (
    <div
      className="my-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
      style={{ contain: "layout" }}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-800">
        <GitBranch className="h-3 w-3 text-sky-600" aria-hidden="true" />
        <span>Schéma</span>
      </div>
      <div className="p-2">
        <DynamicMermaidDiagram code={code} id={id} />
      </div>
    </div>
  );
});
