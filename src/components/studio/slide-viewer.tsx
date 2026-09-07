"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Presentation, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

interface SlideData {
  title: string;
  bullets: string[];
}

/* --- Color palettes for slide backgrounds --- */
const SLIDE_THEMES = [
  { bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", accent: "#38bdf8", text: "#f1f5f9", bullet: "#94a3b8", decorFrom: "rgba(56,189,248,0.15)", decorTo: "rgba(56,189,248,0.03)" },
  { bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", accent: "#a78bfa", text: "#e0e7ff", bullet: "#a5b4fc", decorFrom: "rgba(167,139,250,0.18)", decorTo: "rgba(167,139,250,0.03)" },
  { bg: "linear-gradient(135deg, #042f2e 0%, #134e4a 100%)", accent: "#2dd4bf", text: "#ccfbf1", bullet: "#5eead4", decorFrom: "rgba(45,212,191,0.15)", decorTo: "rgba(45,212,191,0.03)" },
  { bg: "linear-gradient(135deg, #1c1917 0%, #292524 100%)", accent: "#fb923c", text: "#fed7aa", bullet: "#fdba74", decorFrom: "rgba(251,146,60,0.15)", decorTo: "rgba(251,146,60,0.03)" },
  { bg: "linear-gradient(135deg, #0c4a6e 0%, #075985 100%)", accent: "#38bdf8", text: "#e0f2fe", bullet: "#7dd3fc", decorFrom: "rgba(56,189,248,0.15)", decorTo: "rgba(56,189,248,0.03)" },
  { bg: "linear-gradient(135deg, #3b0764 0%, #581c87 100%)", accent: "#d946ef", text: "#f5d0fe", bullet: "#e879f9", decorFrom: "rgba(217,70,239,0.15)", decorTo: "rgba(217,70,239,0.03)" },
  { bg: "linear-gradient(135deg, #14532d 0%, #166534 100%)", accent: "#4ade80", text: "#dcfce7", bullet: "#86efac", decorFrom: "rgba(74,222,128,0.15)", decorTo: "rgba(74,222,128,0.03)" },
  { bg: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)", accent: "#fca5a5", text: "#fef2f2", bullet: "#fca5a5", decorFrom: "rgba(252,165,165,0.12)", decorTo: "rgba(252,165,165,0.03)" },
];

export function SlideViewer({
  title,
  slides,
  onExport,
}: {
  title: string;
  slides: SlideData[];
  onExport: () => void;
}) {
  const [current, setCurrent] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const prev = () => setCurrent((s) => Math.max(0, s - 1));
  const next = () => setCurrent((s) => Math.min(slides.length - 1, s + 1));

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, isFullscreen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[current];
  const isTitle = current === 0;
  const theme = SLIDE_THEMES[current % SLIDE_THEMES.length];
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col items-center justify-center",
        isFullscreen
          ? "fixed inset-0 z-50 bg-black/95 p-4"
          : "p-6"
      )}
    >
      <Script src="/pptxgen.bundle.js" strategy="lazyOnload" />

      {/* Slide Card */}
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl"
        style={{
          aspectRatio: "16 / 9",
        }}
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{ background: theme.bg }}
        />

        {/* Decorative circle top-right */}
        <div
          className="absolute -top-20 -right-20 h-80 w-80 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.decorFrom}, ${theme.decorTo})`,
          }}
        />

        {/* Decorative circle bottom-left */}
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.decorFrom}, ${theme.decorTo})`,
          }}
        />

        {/* Accent line top */}
        <div
          className="absolute top-0 left-0 h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-center px-[8%] py-[6%]">
          {isTitle ? (
            /* --- Title Slide --- */
            <div className="flex flex-col items-center justify-center text-center gap-6">
              <div
                className="h-1 w-24 rounded-full mb-2"
                style={{ backgroundColor: theme.accent }}
              />
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight"
                style={{ color: theme.text }}
              >
                {title}
              </h1>
              <p
                className="text-lg font-medium opacity-70"
                style={{ color: theme.bullet }}
              >
                {slides.length} slides
              </p>
              <div
                className="h-1 w-24 rounded-full mt-2"
                style={{ backgroundColor: theme.accent }}
              />
            </div>
          ) : (
            /* --- Content Slide --- */
            <>
              <div className="flex items-center gap-4 mb-8">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold shrink-0"
                  style={{
                    backgroundColor: theme.accent,
                    color: "#0f172a",
                  }}
                >
                  {current}
                </div>
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug"
                  style={{ color: theme.text }}
                >
                  {currentSlide.title}
                </h2>
              </div>

              <ul className="space-y-4 pl-2">
                {currentSlide.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div
                      className="mt-2.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span
                      className="text-lg sm:text-xl md:text-2xl leading-relaxed font-medium"
                      style={{ color: theme.bullet }}
                    >
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Slide number badge */}
        <div
          className="absolute bottom-4 right-6 z-10 rounded-lg px-3 py-1 text-sm font-semibold"
          style={{
            backgroundColor: `${theme.accent}22`,
            color: theme.accent,
          }}
        >
          {current + 1} / {slides.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full max-w-5xl h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)`,
          }}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between w-full max-w-5xl">
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                i === current ? "w-8" : "w-2 opacity-40 hover:opacity-70"
              )}
              style={{
                backgroundColor: i === current ? theme.accent : "var(--text-muted)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            disabled={current === slides.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <Button onClick={onExport} variant="outline" icon={<Presentation className="h-4 w-4" />}>
            Export .pptx
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- PPTX EXPORT (professional styling) ---------- */

const PPTX_THEMES = [
  { bg: "0F172A", accent: "38BDF8", titleColor: "F1F5F9", bulletColor: "94A3B8" },
  { bg: "1E1B4B", accent: "A78BFA", titleColor: "E0E7FF", bulletColor: "A5B4FC" },
  { bg: "042F2E", accent: "2DD4BF", titleColor: "CCFBF1", bulletColor: "5EEAD4" },
  { bg: "1C1917", accent: "FB923C", titleColor: "FED7AA", bulletColor: "FDBA74" },
  { bg: "0C4A6E", accent: "38BDF8", titleColor: "E0F2FE", bulletColor: "7DD3FC" },
  { bg: "3B0764", accent: "D946EF", titleColor: "F5D0FE", bulletColor: "E879F9" },
  { bg: "14532D", accent: "4ADE80", titleColor: "DCFCE7", bulletColor: "86EFAC" },
  { bg: "450A0A", accent: "FCA5A5", titleColor: "FEF2F2", bulletColor: "FCA5A5" },
];

export async function exportToPptx(title: string, slides: SlideData[]) {
  if (typeof window === "undefined" || !window.PptxGenJS) {
    console.error("PptxGenJS not loaded");
    return;
  }
  const pres = new window.PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = title;

  // --- Title Slide ---
  const titleSlide = pres.addSlide();
  const t0 = PPTX_THEMES[0];
  titleSlide.background = { color: t0.bg };

  // Accent line top
  titleSlide.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
    x: 0, y: 0, w: "100%", h: 0.06, fill: { color: t0.accent },
  });

  // Title text
  titleSlide.addText(title, {
    x: 1, y: 1.8, w: 8, h: 2,
    fontSize: 40, bold: true, color: t0.titleColor,
    align: "center", fontFace: "Calibri",
  });

  // Subtitle
  titleSlide.addText(`${slides.length} slides`, {
    x: 1, y: 3.8, w: 8, h: 0.6,
    fontSize: 16, color: t0.bulletColor,
    align: "center", fontFace: "Calibri",
  });

  // Accent bar
  titleSlide.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
    x: 4, y: 3.5, w: 2, h: 0.06, fill: { color: t0.accent },
  });

  // --- Content Slides ---
  slides.forEach((slide, idx) => {
    const s = pres.addSlide();
    const theme = PPTX_THEMES[(idx + 1) % PPTX_THEMES.length];
    s.background = { color: theme.bg };

    // Accent line top
    s.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
      x: 0, y: 0, w: "100%", h: 0.06, fill: { color: theme.accent },
    });

    // Slide number badge
    s.addText(`${idx + 1}`, {
      x: 0.4, y: 0.4, w: 0.5, h: 0.5,
      fontSize: 16, bold: true, color: "0F172A",
      align: "center", valign: "middle", fontFace: "Calibri",
      fill: { color: theme.accent },
      shape: pres.ShapeType ? pres.ShapeType.roundRect : "roundRect",
      rectRadius: 0.1,
    });

    // Slide title
    s.addText(slide.title, {
      x: 1.1, y: 0.35, w: 8, h: 0.7,
      fontSize: 28, bold: true, color: theme.titleColor,
      fontFace: "Calibri",
    });

    // Bullets
    s.addText(
      slide.bullets.map((b) => ({
        text: b,
        options: {
          bullet: { type: "number", numberType: "arabicPeriod" },
          color: theme.bulletColor,
          fontSize: 18,
          fontFace: "Calibri",
          paraSpaceAfter: 10,
        },
      })),
      {
        x: 0.8, y: 1.4, w: 8.4, h: 4,
        valign: "top",
      }
    );

    // Slide count bottom-right
    s.addText(`${idx + 1} / ${slides.length}`, {
      x: 8, y: 4.9, w: 1.5, h: 0.4,
      fontSize: 10, color: theme.bulletColor,
      align: "right", fontFace: "Calibri",
    });
  });

  pres.writeFile({ fileName: `${title}.pptx` });
}
