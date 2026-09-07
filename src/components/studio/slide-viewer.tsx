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

/* --- Types --- */
interface HtmlSlide {
  html: string;
  title: string;
  keyPoints?: string[];
}

/* Backward compatibility: detect old format and convert */
interface LegacySlide {
  title: string;
  subtitle?: string;
  bullets?: (string | { icon?: string; text: string; detail?: string })[];
}

function isLegacyFormat(slide: any): slide is LegacySlide {
  return slide && !slide.html && (Array.isArray(slide.bullets) || typeof slide.title === "string");
}

function legacyToHtml(slide: LegacySlide, index: number): HtmlSlide {
  const colors = [
    { bg: "linear-gradient(135deg, #0f172a, #1e3a5f)", accent: "#38bdf8", card: "rgba(255,255,255,0.1)", text: "#f1f5f9" },
    { bg: "linear-gradient(135deg, #1e1b4b, #312e81)", accent: "#a78bfa", card: "rgba(255,255,255,0.1)", text: "#e0e7ff" },
    { bg: "linear-gradient(135deg, #042f2e, #134e4a)", accent: "#2dd4bf", card: "rgba(255,255,255,0.1)", text: "#ccfbf1" },
    { bg: "linear-gradient(135deg, #431407, #7c2d12)", accent: "#fb923c", card: "rgba(255,255,255,0.1)", text: "#fed7aa" },
  ];
  const c = colors[index % colors.length];
  const bullets = (slide.bullets || []).map((b) => {
    if (typeof b === "string") return { icon: "▸", text: b, detail: "" };
    return { icon: b.icon || "▸", text: b.text, detail: b.detail || "" };
  });

  const bulletsHtml = bullets.map((b) =>
    `<div style="display:flex;align-items:flex-start;gap:12px;background:${c.card};border-radius:10px;padding:14px 16px;backdrop-filter:blur(8px)">
      <span style="font-size:20px;flex-shrink:0;margin-top:2px">${b.icon}</span>
      <div><div style="font-weight:700;font-size:15px;color:${c.text}">${b.text}</div>${b.detail ? `<div style="font-size:12px;color:${c.text};opacity:0.7;margin-top:4px">${b.detail}</div>` : ""}</div>
    </div>`
  ).join("");

  const html = `<div style="width:100%;height:100%;background:${c.bg};padding:40px 48px;display:flex;flex-direction:column;justify-content:center;font-family:system-ui,sans-serif;position:relative;overflow:hidden">
    <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:${c.accent};opacity:0.08"></div>
    <div style="position:absolute;bottom:-80px;left:-80px;width:250px;height:250px;border-radius:50%;background:${c.accent};opacity:0.05"></div>
    <div style="border-left:4px solid ${c.accent};padding-left:16px;margin-bottom:24px">
      <h2 style="margin:0;font-size:28px;font-weight:800;color:${c.text};letter-spacing:-0.02em">${slide.title}</h2>
      ${slide.subtitle ? `<p style="margin:6px 0 0;font-size:14px;color:${c.text};opacity:0.7">${slide.subtitle}</p>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(bullets.length, 2)}, 1fr);gap:12px">${bulletsHtml}</div>
  </div>`;

  return { html, title: slide.title, keyPoints: bullets.map((b) => b.text) };
}

export function SlideViewer({
  title,
  slides: rawSlides,
  onExport,
}: {
  title: string;
  slides: (HtmlSlide | LegacySlide)[];
  onExport: () => void;
}) {
  const [current, setCurrent] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Normalize slides
  const slides: HtmlSlide[] = React.useMemo(() => {
    return rawSlides.map((s, i) => (isLegacyFormat(s) ? legacyToHtml(s, i) : s as HtmlSlide));
  }, [rawSlides]);

  const prev = () => setCurrent((s) => Math.max(0, s - 1));
  const next = () => setCurrent((s) => Math.min(slides.length - 1, s + 1));

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
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        isFullscreen ? "fixed inset-0 z-50 bg-black/95 p-4" : "p-6"
      )}
    >
      <Script src="/pptxgen.bundle.js" strategy="lazyOnload" />

      {/* Slide container */}
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16 / 9",
          boxShadow: "0 25px 80px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Render the HTML slide */}
        <div
          className="absolute inset-0"
          dangerouslySetInnerHTML={{ __html: currentSlide.html }}
        />
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full max-w-5xl h-1 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between w-full max-w-5xl">
        {/* Dot navigation */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "rounded-full transition-all duration-200",
                i === current ? "h-2.5 w-7 bg-blue-500" : "h-2.5 w-2.5 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            {current + 1} / {slides.length}
          </span>
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            disabled={current === slides.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
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

/* ========== PPTX EXPORT ========== */

const PPTX_COLORS = [
  { bg: "0F172A", accent: "38BDF8", title: "F1F5F9", text: "94A3B8" },
  { bg: "1E1B4B", accent: "A78BFA", title: "E0E7FF", text: "A5B4FC" },
  { bg: "042F2E", accent: "2DD4BF", title: "CCFBF1", text: "5EEAD4" },
  { bg: "431407", accent: "FB923C", title: "FED7AA", text: "FDBA74" },
  { bg: "0C4A6E", accent: "38BDF8", title: "E0F2FE", text: "7DD3FC" },
  { bg: "3B0764", accent: "D946EF", title: "F5D0FE", text: "E879F9" },
  { bg: "14532D", accent: "4ADE80", title: "DCFCE7", text: "86EFAC" },
  { bg: "1C1917", accent: "F97316", title: "FED7AA", text: "FDBA74" },
];

export async function exportToPptx(title: string, slides: (HtmlSlide | LegacySlide)[]) {
  if (typeof window === "undefined" || !window.PptxGenJS) {
    console.error("PptxGenJS not loaded");
    return;
  }
  const pres = new window.PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = title;

  // Normalize
  const normalized: HtmlSlide[] = slides.map((s, i) =>
    isLegacyFormat(s) ? legacyToHtml(s, i) : (s as HtmlSlide)
  );

  // Title slide
  const titleSlide = pres.addSlide();
  const t0 = PPTX_COLORS[0];
  titleSlide.background = { color: t0.bg };
  titleSlide.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
    x: 0, y: 0, w: "100%", h: 0.06, fill: { color: t0.accent },
  });
  titleSlide.addText(title, {
    x: 1, y: 1.5, w: 8, h: 2,
    fontSize: 40, bold: true, color: t0.title,
    align: "center", fontFace: "Calibri",
  });
  titleSlide.addText(`${normalized.length} slides`, {
    x: 1, y: 3.5, w: 8, h: 0.5,
    fontSize: 16, color: t0.text,
    align: "center", fontFace: "Calibri",
  });
  titleSlide.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
    x: 4, y: 3.3, w: 2, h: 0.04, fill: { color: t0.accent },
  });

  // Content slides
  normalized.forEach((slide, idx) => {
    const s = pres.addSlide();
    const c = PPTX_COLORS[(idx + 1) % PPTX_COLORS.length];
    s.background = { color: c.bg };

    // Accent bar
    s.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
      x: 0, y: 0, w: "100%", h: 0.06, fill: { color: c.accent },
    });

    // Number badge
    s.addText(String(idx + 1).padStart(2, "0"), {
      x: 0.4, y: 0.35, w: 0.5, h: 0.5,
      fontSize: 14, bold: true, color: "0F172A",
      align: "center", valign: "middle", fontFace: "Calibri",
      fill: { color: c.accent },
      shape: pres.ShapeType ? pres.ShapeType.roundRect : "roundRect",
      rectRadius: 0.08,
    });

    // Title
    s.addText(slide.title, {
      x: 1.1, y: 0.3, w: 8, h: 0.7,
      fontSize: 26, bold: true, color: c.title, fontFace: "Calibri",
    });

    // Key points
    const points = slide.keyPoints || [];
    if (points.length > 0) {
      s.addText(
        points.map((p) => ({
          text: p,
          options: {
            bullet: { type: "number" as const },
            color: c.text,
            fontSize: 16,
            fontFace: "Calibri",
            paraSpaceAfter: 8,
          },
        })),
        { x: 0.8, y: 1.3, w: 8.4, h: 4, valign: "top" }
      );
    }

    // Footer
    s.addText(`${idx + 1} / ${normalized.length}`, {
      x: 8.2, y: 4.9, w: 1, h: 0.3,
      fontSize: 9, color: c.text, align: "right", fontFace: "Calibri",
    });
  });

  pres.writeFile({ fileName: `${title}.pptx` });
}
