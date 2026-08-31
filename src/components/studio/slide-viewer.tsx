"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Presentation } from "lucide-react";
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

  const prev = () => setCurrent((s) => Math.max(0, s - 1));
  const next = () => setCurrent((s) => Math.min(slides.length - 1, s + 1));

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[current];

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 bg-[var(--base-subtle)]">
      <Script src="/pptxgen.bundle.js" strategy="lazyOnload" />
      <div className="relative aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg border border-border">
        {/* Slide Content */}
        <div className="flex h-full flex-col px-16 py-12">
          <h2 className="text-3xl font-bold text-text-primary mb-8">{currentSlide.title}</h2>
          <ul className="list-disc pl-6 space-y-4 text-xl text-text-secondary">
            {currentSlide.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between w-full max-w-4xl">
        <div className="flex items-center gap-4 text-text-secondary">
          <span className="text-sm font-medium">Slide {current + 1} of {slides.length}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-base text-text-primary hover:bg-hover disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            disabled={current === slides.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-base text-text-primary hover:bg-hover disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <Button onClick={onExport} variant="outline" icon={<Presentation className="h-4 w-4" />}>
          Export .pptx
        </Button>
      </div>
    </div>
  );
}

export async function exportToPptx(title: string, slides: SlideData[]) {
  if (typeof window === "undefined" || !window.PptxGenJS) {
    console.error("PptxGenJS not loaded");
    return;
  }
  const pres = new window.PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = title;

  // Title Slide
  const titleSlide = pres.addSlide();
  titleSlide.addText(title, {
    x: 1,
    y: 2,
    w: "80%",
    h: 1,
    fontSize: 44,
    bold: true,
    color: "333333",
    align: "center",
  });

  // Content Slides
  slides.forEach((slide) => {
    const s = pres.addSlide();
    s.addText(slide.title, {
      x: 0.5,
      y: 0.5,
      w: "90%",
      h: 1,
      fontSize: 32,
      bold: true,
      color: "333333",
    });
    
    s.addText(
      slide.bullets.map(b => ({ text: b, options: { bullet: true } })),
      {
        x: 0.5,
        y: 1.8,
        w: "90%",
        h: 4.5,
        fontSize: 20,
        color: "666666",
        valign: "top",
      }
    );
  });

  pres.writeFile({ fileName: `${title}.pptx` });
}
