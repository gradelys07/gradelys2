"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { Slide, PresentationElement } from "./types";
import { usePresentationStore } from "./store";
import { ElementRenderer } from "./renderers/ElementRenderer";
import { cn } from "@/lib/utils";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export function SlideThumbnail({ slide, className }: { slide: Slide, className?: string }) {
  // We'll use a CSS transform to scale the 1280x720 canvas to fit the container width perfectly.
  // Using container query or percentage scale is tricky, so we'll use a ref to measure the width.
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.134); // Default rough scale for w-48 sidebar

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setScale(width / CANVAS_WIDTH);
      }
    };
    
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn("w-full aspect-video overflow-hidden bg-white relative pointer-events-none", className)}
    >
      <div 
        className="absolute top-0 left-0"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: slide.background.type === "solid" ? slide.background.value 
            : slide.background.type === "gradient" ? slide.background.value 
            : `url(${slide.background.value}) center/cover no-repeat`,
        }}
      >
        {slide.elements.map(element => (
          <div
            key={element.id}
            style={{
              position: "absolute",
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              rotate: `${element.rotation}deg`,
              zIndex: element.zIndex,
            }}
          >
            <ElementRenderer element={element} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SlideCanvas({ slide, readOnly = false }: { slide: Slide; readOnly?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { selectedElementIds, setSelectedElements, updateElement } = usePresentationStore();

  // Auto-scale canvas to fit container
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const scaleX = width / CANVAS_WIDTH;
        const scaleY = height / CANVAS_HEIGHT;
        setScale(Math.min(scaleX, scaleY) * 0.95); // 95% to leave some padding
      }
    };
    
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (e.target === e.currentTarget) {
      setSelectedElements([]);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden relative"
      onClick={handleCanvasClick}
    >
      <div 
        style={{ 
          width: CANVAS_WIDTH * scale, 
          height: CANVAS_HEIGHT * scale 
        }} 
        className="relative shrink-0 shadow-xl bg-white"
      >
        <div 
          className="absolute top-0 left-0 overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: slide.background.type === "solid" ? slide.background.value 
              : slide.background.type === "gradient" ? slide.background.value 
              : `url(${slide.background.value}) center/cover no-repeat`,
          }}
          onClick={handleCanvasClick}
        >
          {slide.elements.map(element => (
            <CanvasElement key={element.id} element={element} slideId={slide.id} scale={scale} readOnly={readOnly} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CanvasElement({ element, slideId, scale, readOnly }: { element: PresentationElement; slideId: string; scale: number; readOnly?: boolean }) {
  const { selectedElementIds, setSelectedElements, updateElement } = usePresentationStore();
  const isSelected = !readOnly && selectedElementIds.includes(element.id);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setSelectedElements([element.id]);
    
    // Custom drag implementation to correctly account for canvas scale
    const startX = e.clientX;
    const startY = e.clientY;
    const initialElementX = element.x;
    const initialElementY = element.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      
      updateElement(slideId, element.id, {
        x: initialElementX + deltaX,
        y: initialElementY + deltaY
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        rotate: `${element.rotation}deg`,
        zIndex: element.zIndex,
      }}
      className={cn(
        "group",
        !readOnly && "cursor-move",
        isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      onPointerDown={handlePointerDown}
    >
      {/* Content */}
      <div className="w-full h-full pointer-events-none">
        <ElementRenderer element={element} />
      </div>

      {/* Basic Resize Handles (Visual only for now, real resize requires more complex logic) */}
      {isSelected && (
        <>
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nwse-resize" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nesw-resize" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nesw-resize" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nwse-resize" />
        </>
      )}
    </div>
  );
}
