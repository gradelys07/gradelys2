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
interface BulletItem {
  icon: string;
  text: string;
  detail: string;
}

interface SlideData {
  title: string;
  subtitle?: string;
  bullets: (string | BulletItem)[];
}

/* --- Normalize bullets (backward compat with old string[] format) --- */
function normalizeBullet(b: string | BulletItem): BulletItem {
  if (typeof b === "string") {
    return { icon: "▸", text: b, detail: "" };
  }
  return b;
}

/* --- Slide color themes (light, clean, infographic) --- */
const SLIDE_PALETTES = [
  { bg: "#f8fafc", accent: "#0ea5e9", accentLight: "#e0f2fe", cardBg: "#ffffff", title: "#0f172a", subtitle: "#475569", text: "#1e293b", detail: "#64748b", border: "#e2e8f0", pattern: "rgba(14,165,233,0.04)" },
  { bg: "#faf5ff", accent: "#8b5cf6", accentLight: "#ede9fe", cardBg: "#ffffff", title: "#1e1b4b", subtitle: "#6b21a8", text: "#1e1b4b", detail: "#7c3aed", border: "#e9d5ff", pattern: "rgba(139,92,246,0.04)" },
  { bg: "#f0fdf4", accent: "#10b981", accentLight: "#d1fae5", cardBg: "#ffffff", title: "#052e16", subtitle: "#166534", text: "#064e3b", detail: "#059669", border: "#a7f3d0", pattern: "rgba(16,185,129,0.04)" },
  { bg: "#fff7ed", accent: "#f97316", accentLight: "#fed7aa", cardBg: "#ffffff", title: "#431407", subtitle: "#9a3412", text: "#7c2d12", detail: "#ea580c", border: "#fdba74", pattern: "rgba(249,115,22,0.04)" },
  { bg: "#f0f9ff", accent: "#0284c7", accentLight: "#bae6fd", cardBg: "#ffffff", title: "#0c4a6e", subtitle: "#0369a1", text: "#075985", detail: "#0284c7", border: "#7dd3fc", pattern: "rgba(2,132,199,0.04)" },
  { bg: "#fdf2f8", accent: "#ec4899", accentLight: "#fce7f3", cardBg: "#ffffff", title: "#500724", subtitle: "#9d174d", text: "#831843", detail: "#db2777", border: "#f9a8d4", pattern: "rgba(236,72,153,0.04)" },
  { bg: "#ecfeff", accent: "#06b6d4", accentLight: "#cffafe", cardBg: "#ffffff", title: "#083344", subtitle: "#0e7490", text: "#155e75", detail: "#0891b2", border: "#67e8f9", pattern: "rgba(6,182,212,0.04)" },
  { bg: "#fefce8", accent: "#eab308", accentLight: "#fef08a", cardBg: "#ffffff", title: "#422006", subtitle: "#854d0e", text: "#713f12", detail: "#ca8a04", border: "#fde047", pattern: "rgba(234,179,8,0.04)" },
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
  const isTitle = current === 0;
  const palette = SLIDE_PALETTES[current % SLIDE_PALETTES.length];
  const normalizedBullets = currentSlide.bullets.map(normalizeBullet);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        isFullscreen ? "fixed inset-0 z-50 bg-black/90 p-4" : "p-6"
      )}
    >
      <Script src="/pptxgen.bundle.js" strategy="lazyOnload" />

      {/* --- Slide --- */}
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16 / 9",
          backgroundColor: palette.bg,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${palette.accent}15 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Accent stripe left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: palette.accent }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-[6%] py-[4%]">
          {isTitle ? (
            /* ============ TITLE SLIDE ============ */
            <div className="flex h-full flex-col items-center justify-center text-center gap-5">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
                style={{ backgroundColor: palette.accentLight, color: palette.accent }}
              >
                📊 {slides.length} slides
              </div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight max-w-[85%]"
                style={{ color: palette.title }}
              >
                {title}
              </h1>
              {currentSlide.subtitle && (
                <p
                  className="text-lg sm:text-xl font-medium max-w-[70%] leading-relaxed"
                  style={{ color: palette.subtitle }}
                >
                  {currentSlide.subtitle}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-0.5 w-12 rounded-full" style={{ backgroundColor: palette.accent }} />
                <div className="h-0.5 w-6 rounded-full" style={{ backgroundColor: `${palette.accent}44` }} />
              </div>
            </div>
          ) : (
            /* ============ CONTENT SLIDE ============ */
            <>
              {/* Header */}
              <div className="mb-auto">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ backgroundColor: palette.accent, color: "#fff" }}
                  >
                    {String(current).padStart(2, "0")}
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight"
                    style={{ color: palette.title }}
                  >
                    {currentSlide.title}
                  </h2>
                </div>
                {currentSlide.subtitle && (
                  <p
                    className="text-sm sm:text-base font-medium ml-11"
                    style={{ color: palette.subtitle }}
                  >
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              {/* Cards grid */}
              <div
                className={cn(
                  "grid gap-3 mt-4",
                  normalizedBullets.length <= 2 ? "grid-cols-2" :
                  normalizedBullets.length === 3 ? "grid-cols-3" :
                  "grid-cols-2 lg:grid-cols-4"
                )}
              >
                {normalizedBullets.map((bullet, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-xl p-4 transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: palette.cardBg,
                      border: `1px solid ${palette.border}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: palette.accentLight }}
                    >
                      {bullet.icon}
                    </div>
                    <h3
                      className="text-sm sm:text-base font-bold leading-snug"
                      style={{ color: palette.text }}
                    >
                      {bullet.text}
                    </h3>
                    {bullet.detail && (
                      <p
                        className="text-xs sm:text-sm leading-relaxed"
                        style={{ color: palette.detail }}
                      >
                        {bullet.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Slide number badge */}
        {!isTitle && (
          <div
            className="absolute bottom-3 right-5 z-10 rounded-full px-3 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: palette.accentLight, color: palette.accent }}
          >
            {current + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* --- Controls --- */}
      <div className="mt-5 flex items-center justify-between w-full max-w-5xl">
        {/* Dot navigation */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "rounded-full transition-all duration-200",
                i === current ? "h-2.5 w-7" : "h-2.5 w-2.5 opacity-30 hover:opacity-60"
              )}
              style={{
                backgroundColor: i === current ? palette.accent : palette.title,
              }}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
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

/* ========== PPTX EXPORT (professional infographic style) ========== */

const PPTX_PALETTES = [
  { bg: "F8FAFC", accent: "0EA5E9", accentLight: "E0F2FE", title: "0F172A", text: "1E293B", detail: "64748B" },
  { bg: "FAF5FF", accent: "8B5CF6", accentLight: "EDE9FE", title: "1E1B4B", text: "1E1B4B", detail: "7C3AED" },
  { bg: "F0FDF4", accent: "10B981", accentLight: "D1FAE5", title: "052E16", text: "064E3B", detail: "059669" },
  { bg: "FFF7ED", accent: "F97316", accentLight: "FED7AA", title: "431407", text: "7C2D12", detail: "EA580C" },
  { bg: "F0F9FF", accent: "0284C7", accentLight: "BAE6FD", title: "0C4A6E", text: "075985", detail: "0284C7" },
  { bg: "FDF2F8", accent: "EC4899", accentLight: "FCE7F3", title: "500724", text: "831843", detail: "DB2777" },
  { bg: "ECFEFF", accent: "06B6D4", accentLight: "CFFAFE", title: "083344", text: "155E75", detail: "0891B2" },
  { bg: "FEFCE8", accent: "EAB308", accentLight: "FEF08A", title: "422006", text: "713F12", detail: "CA8A04" },
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
  const t0 = PPTX_PALETTES[0];
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: t0.bg };

  // Left accent bar
  titleSlide.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
    x: 0, y: 0, w: 0.12, h: "100%", fill: { color: t0.accent },
  });

  // Badge
  titleSlide.addText(`📊 ${slides.length} slides`, {
    x: 2.5, y: 1.5, w: 5, h: 0.5,
    fontSize: 14, color: t0.accent, align: "center", fontFace: "Calibri",
    fill: { color: t0.accentLight },
    shape: pres.ShapeType ? pres.ShapeType.roundRect : "roundRect",
    rectRadius: 0.2,
  });

  // Title
  titleSlide.addText(title, {
    x: 1, y: 2.2, w: 8, h: 1.5,
    fontSize: 36, bold: true, color: t0.title,
    align: "center", fontFace: "Calibri",
  });

  // Accent bar
  titleSlide.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
    x: 4, y: 3.9, w: 2, h: 0.05, fill: { color: t0.accent },
  });

  // --- Content Slides ---
  slides.forEach((slide, idx) => {
    const s = pres.addSlide();
    const p = PPTX_PALETTES[(idx + 1) % PPTX_PALETTES.length];
    s.background = { color: p.bg };

    // Left accent bar
    s.addShape(pres.ShapeType ? pres.ShapeType.rect : "rect", {
      x: 0, y: 0, w: 0.12, h: "100%", fill: { color: p.accent },
    });

    // Slide number
    s.addText(String(idx + 1).padStart(2, "0"), {
      x: 0.35, y: 0.3, w: 0.5, h: 0.5,
      fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle", fontFace: "Calibri",
      fill: { color: p.accent },
      shape: pres.ShapeType ? pres.ShapeType.roundRect : "roundRect",
      rectRadius: 0.08,
    });

    // Title
    s.addText(slide.title, {
      x: 1, y: 0.25, w: 8, h: 0.6,
      fontSize: 24, bold: true, color: p.title, fontFace: "Calibri",
    });

    // Subtitle
    if (slide.subtitle) {
      s.addText(slide.subtitle, {
        x: 1, y: 0.8, w: 8, h: 0.4,
        fontSize: 13, color: p.detail, fontFace: "Calibri",
      });
    }

    // Bullet cards
    const bullets = slide.bullets.map(normalizeBullet);
    const cols = Math.min(bullets.length, 4);
    const cardW = (9 / cols) - 0.2;
    const startY = slide.subtitle ? 1.5 : 1.3;

    bullets.forEach((b, bi) => {
      const col = bi % cols;
      const row = Math.floor(bi / cols);
      const x = 0.4 + col * (cardW + 0.2);
      const y = startY + row * 2.2;

      // Card background
      s.addShape(pres.ShapeType ? pres.ShapeType.roundRect : "roundRect", {
        x, y, w: cardW, h: 2,
        fill: { color: "FFFFFF" },
        line: { color: "E2E8F0", width: 1 },
        rectRadius: 0.1,
        shadow: { type: "outer", blur: 4, offset: 2, color: "00000010" },
      });

      // Icon
      s.addText(b.icon, {
        x: x + 0.15, y: y + 0.15, w: 0.6, h: 0.6,
        fontSize: 20, align: "center", valign: "middle",
        fill: { color: p.accentLight },
        shape: pres.ShapeType ? pres.ShapeType.roundRect : "roundRect",
        rectRadius: 0.08,
      });

      // Text
      s.addText(b.text, {
        x: x + 0.15, y: y + 0.85, w: cardW - 0.3, h: 0.4,
        fontSize: 12, bold: true, color: p.text, fontFace: "Calibri",
      });

      // Detail
      if (b.detail) {
        s.addText(b.detail, {
          x: x + 0.15, y: y + 1.25, w: cardW - 0.3, h: 0.6,
          fontSize: 10, color: p.detail, fontFace: "Calibri",
          valign: "top",
        });
      }
    });

    // Slide count
    s.addText(`${idx + 1} / ${slides.length}`, {
      x: 8.2, y: 4.9, w: 1.3, h: 0.3,
      fontSize: 9, color: p.detail, align: "right", fontFace: "Calibri",
      fill: { color: p.accentLight },
      shape: pres.ShapeType ? pres.ShapeType.roundRect : "roundRect",
      rectRadius: 0.15,
    });
  });

  pres.writeFile({ fileName: `${title}.pptx` });
}
