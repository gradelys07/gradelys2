"use client";

import React, { useState, useEffect, useRef } from "react";
import { Slide } from "./types";
import { SlideCanvas } from "./SlideCanvas";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PresentationViewer({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Request fullscreen on mount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request failed", err);
      });
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, onClose]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      onClick={handleNext}
    >
      {/* Controls - visible on hover or constantly if needed, but usually hidden in present mode */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 text-white px-4 py-2 rounded-full z-50 opacity-0 hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium">
          {currentIndex + 1} / {slides.length}
        </span>
        <button 
          onClick={handleNext} 
          disabled={currentIndex === slides.length - 1}
          className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/20 rounded-full z-50 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full h-full flex items-center justify-center" ref={containerRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full flex items-center justify-center"
          >
            {slides[currentIndex] && (
              <SlideCanvas slide={slides[currentIndex]} readOnly />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
