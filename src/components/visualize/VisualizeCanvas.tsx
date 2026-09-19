import React, { useRef, useEffect, useCallback } from 'react';
import { useVisualizeStore, Point } from './useVisualizeStore';
import { nanoid } from 'nanoid';
import { MermaidDiagram } from '@/components/mermaid-diagram';
import { ChartRenderer } from '@/components/chart-renderer';
import { Markdown } from '@/components/markdown';

const getSvgPath = (points: Point[]) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
};

const ThoughtBubbleSvg = ({ w, h, color }: { w: number; h: number; color: string }) => (
  <svg width={w} height={h + 30} viewBox={`0 0 ${w} ${h + 30}`} fill="none">
    <rect x="2" y="2" width={w - 4} height={h - 4} rx="24" stroke={color} strokeWidth="2" fill="rgba(255,255,255,0.04)" />
    <circle cx={w * 0.25} cy={h + 8} r="6" stroke={color} strokeWidth="2" fill="rgba(255,255,255,0.04)" />
    <circle cx={w * 0.18} cy={h + 22} r="4" stroke={color} strokeWidth="2" fill="rgba(255,255,255,0.04)" />
  </svg>
);

const ArrowSvg = ({ w, h, color }: { w: number; h: number; color: string }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
    <line x1="0" y1={h / 2} x2={w - 16} y2={h / 2} stroke={color} strokeWidth="3" strokeLinecap="round" />
    <polyline points={`${w - 24},${h / 2 - 12} ${w - 4},${h / 2} ${w - 24},${h / 2 + 12}`} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function HtmlVisual({ code, isEditable }: { code: string; isEditable: boolean }) {
  const [height, setHeight] = React.useState(600);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let interval: NodeJS.Timeout;
    const updateHeight = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.documentElement) {
          const scrollHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + 20;
          setHeight((prev) => (prev !== scrollHeight ? scrollHeight : prev));
        }
      } catch (e) {}
    };

    const handleLoad = () => {
      updateHeight();
      interval = setInterval(updateHeight, 500);
      
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body) {
          doc.body.contentEditable = isEditable ? 'true' : 'false';
          doc.body.style.cursor = isEditable ? 'text' : 'default';
        }
      } catch (e) {}
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearInterval(interval);
    };
  }, [isEditable]);

  useEffect(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.body) {
        doc.body.contentEditable = isEditable ? 'true' : 'false';
        doc.body.style.cursor = isEditable ? 'text' : 'default';
      }
    } catch (e) {}
  }, [isEditable]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin allow-scripts"
      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script><style>html, body { height: auto !important; min-height: 100% !important; overflow: hidden !important; margin: 0; padding: 0; background: transparent; }</style></head><body>${code}</body></html>`}
      style={{ width: '100%', height, border: 'none', borderRadius: 8, minWidth: 600, transition: 'height 0.2s ease-out' }}
      className="bg-transparent"
    />
  );
}

// Editable text component on canvas
function EditableText({ el, isSelected, onPointerDown }: { el: any; isSelected: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const activeTool = useVisualizeStore(s => s.activeTool);

  const handleBlur = () => {
    const text = ref.current?.innerText || '';
    if (text.trim()) {
      useVisualizeStore.getState().updateElement(el.id, { content: text, isEditing: false });
    } else {
      useVisualizeStore.getState().deleteElement(el.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    useVisualizeStore.getState().pushHistory();
    useVisualizeStore.getState().updateElement(el.id, { isEditing: true });
    setTimeout(() => ref.current?.focus(), 50);
  };

  useEffect(() => {
    if (el.isEditing && ref.current) {
      ref.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [el.isEditing]);

  const isEmpty = !el.content || el.content === '';
  const showPlaceholder = isEmpty && !el.isEditing;

  return (
    <div
      onPointerDown={el.isEditing ? (e) => e.stopPropagation() : onPointerDown}
      onDoubleClick={handleDoubleClick}
      className="absolute select-none"
      style={{
        left: el.x, top: el.y, zIndex: el.zIndex,
        cursor: el.isEditing ? 'text' : activeTool === 'select' ? 'move' : undefined,
        outline: isSelected && !el.isEditing ? '2px solid #0EA5E9' : 'none', outlineOffset: 4, borderRadius: 4,
        minWidth: 60,
      }}
    >
      <div
        ref={ref}
        contentEditable={el.isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); ref.current?.blur(); } }}
        className={el.isEditing ? 'outline-none ring-2 ring-sky-500/50 rounded px-1 -mx-1' : ''}
        style={{
          color: showPlaceholder ? 'rgba(255,255,255,0.3)' : (el.color || '#fff'),
          fontSize: el.fontSize || 20,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          whiteSpace: 'pre-wrap',
          minHeight: '1.2em',
        }}
      >
        {showPlaceholder ? 'Tapez ici...' : el.content}
      </div>
    </div>
  );
}

export function VisualizeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { camera } = useVisualizeStore.getState();
    return {
      x: (clientX - rect.left - camera.x) / camera.zoom,
      y: (clientY - rect.top - camera.y) / camera.zoom,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = useVisualizeStore.getState();
      if (e.ctrlKey || e.metaKey) {
        const factor = 1 - e.deltaY * 0.005;
        s.setCamera({ ...s.camera, zoom: Math.max(0.1, Math.min(5, s.camera.zoom * factor)) });
      } else {
        s.setCamera({ ...s.camera, x: s.camera.x - e.deltaX, y: s.camera.y - e.deltaY });
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = (e.target as HTMLElement).isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) return;
      const s = useVisualizeStore.getState();
      if (e.code === 'Space' && !s.isPanning) { e.preventDefault(); s.setIsPanning(true); }
      if ((e.key === 'Backspace' || e.key === 'Delete') && s.selectedElementIds.length > 0) { e.preventDefault(); s.deleteSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); }
      if (e.key === 'v' || e.key === 'V') s.setActiveTool('select');
      if (e.key === 'h' || e.key === 'H') s.setActiveTool('pan');
      if (e.key === 'p' || e.key === 'P') s.setActiveTool('pen');
      if (e.key === 'e' || e.key === 'E') s.setActiveTool('eraser');
      if (e.key === 't' || e.key === 'T') s.setActiveTool('text');
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') useVisualizeStore.getState().setIsPanning(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  const eraseAt = useCallback((pt: Point) => {
    const s = useVisualizeStore.getState();
    const threshold = 12 / s.camera.zoom;
    const ids: string[] = [];
    s.elements.forEach(el => {
      if (el.type === 'freehand' && el.points) {
        if (el.points.some(p => Math.abs(p.x - pt.x) < threshold && Math.abs(p.y - pt.y) < threshold)) ids.push(el.id);
      }
    });
    ids.forEach(id => s.deleteElement(id));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const s = useVisualizeStore.getState();
    const { activeTool, isPanning, camera, elements, currentColor, penSize, textSize, activeShapeKind } = s;

    if (e.button === 1 || isPanning || activeTool === 'pan') {
      s.setDragStart({ x: e.clientX, y: e.clientY, camX: camera.x, camY: camera.y });
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const pt = getCanvasPoint(e.clientX, e.clientY);

    if (activeTool === 'pen') {
      const id = nanoid();
      s.setIsDrawing(true);
      s.setCurrentStrokeId(id);
      s.addElement({ id, type: 'freehand', x: 0, y: 0, points: [pt], color: currentColor, strokeWidth: penSize, zIndex: elements.length });
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    if (activeTool === 'eraser') {
      s.setIsDrawing(true);
      eraseAt(pt);
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    if (activeTool === 'text') {
      // Place an editable text element with placeholder
      s.addElement({
        id: nanoid(), type: 'text', x: pt.x, y: pt.y,
        content: '', color: currentColor, fontSize: textSize, isEditing: true, zIndex: elements.length,
      });
      return;
    }
    if (activeTool === 'shape') {
      const w = activeShapeKind === 'arrow' ? 200 : 160;
      const h = activeShapeKind === 'arrow' ? 40 : 100;
      s.addElement({ id: nanoid(), type: 'shape', shapeKind: activeShapeKind, x: pt.x - w / 2, y: pt.y - h / 2, width: w, height: h, color: currentColor, zIndex: elements.length });
      return;
    }
    if (activeTool === 'select') s.clearSelection();
  }, [getCanvasPoint, eraseAt]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = useVisualizeStore.getState();
    const { activeTool, isPanning, dragStart, isDrawing, currentStrokeId, elementDrag, camera } = s;
    if (dragStart && (isPanning || activeTool === 'pan' || e.buttons === 4)) {
      s.setCamera({ ...camera, x: dragStart.camX + (e.clientX - dragStart.x), y: dragStart.camY + (e.clientY - dragStart.y) });
      return;
    }
    if (elementDrag && e.buttons === 1) {
      const dx = (e.clientX - elementDrag.startX) / camera.zoom;
      const dy = (e.clientY - elementDrag.startY) / camera.zoom;
      s.updateElement(elementDrag.id, { x: elementDrag.elX + dx, y: elementDrag.elY + dy });
      return;
    }
    if (isDrawing && activeTool === 'pen' && currentStrokeId) {
      const pt = getCanvasPoint(e.clientX, e.clientY);
      const el = s.elements.find(x => x.id === currentStrokeId);
      if (el?.points) s.updateElement(currentStrokeId, { points: [...el.points, pt] });
      return;
    }
    if (isDrawing && activeTool === 'eraser') eraseAt(getCanvasPoint(e.clientX, e.clientY));
  }, [getCanvasPoint, eraseAt]);

  const onPointerUp = useCallback(() => {
    const s = useVisualizeStore.getState();
    s.setIsDrawing(false); s.setCurrentStrokeId(null); s.setDragStart(null); s.setElementDrag(null);
  }, []);

  const onElementPointerDown = useCallback((e: React.PointerEvent, elId: string) => {
    e.stopPropagation();
    const s = useVisualizeStore.getState();
    if (s.activeTool !== 'select') return;
    s.selectElement(elId);
    const el = s.elements.find(x => x.id === elId);
    if (el) {
      s.pushHistory();
      s.setElementDrag({ id: elId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  }, []);

  const camera = useVisualizeStore(s => s.camera);
  const elements = useVisualizeStore(s => s.elements);
  const selectedIds = useVisualizeStore(s => s.selectedElementIds);
  const activeTool = useVisualizeStore(s => s.activeTool);
  const isPanning = useVisualizeStore(s => s.isPanning);

  const cursor = isPanning || activeTool === 'pan' ? 'grab'
    : activeTool === 'pen' || activeTool === 'eraser' || activeTool === 'shape' ? 'crosshair'
    : activeTool === 'text' ? 'text' : 'default';

  return (
    <div ref={containerRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      className="absolute inset-0 overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
        backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        cursor,
      }}
    >
      <div className="absolute origin-top-left" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`, willChange: 'transform' }}>
        {/* Freehand strokes */}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ overflow: 'visible', width: 1, height: 1 }}>
          {elements.filter(el => el.type === 'freehand' && el.points && el.points.length > 1).map(el => (
            <path key={el.id} d={getSvgPath(el.points!)} fill="none" stroke={el.color || '#0EA5E9'} strokeWidth={(el.strokeWidth || 3) / camera.zoom} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>

        {elements.map((el) => {
          const isSelected = selectedIds.includes(el.id);
          if (el.type === 'freehand') return null;

          if (el.type === 'text') {
            return <EditableText key={el.id} el={el} isSelected={isSelected} onPointerDown={(e) => onElementPointerDown(e, el.id)} />;
          }

          if (el.type === 'shape') {
            const w = el.width || 160; const h = el.height || 100; const c = el.color || '#0EA5E9';
            if (el.shapeKind === 'thought') return (
              <div key={el.id} onPointerDown={(e) => onElementPointerDown(e, el.id)} className="absolute"
                style={{ left: el.x, top: el.y, zIndex: el.zIndex, cursor: activeTool === 'select' ? 'move' : undefined, outline: isSelected ? '2px solid #0EA5E9' : 'none', outlineOffset: 4, borderRadius: 24 }}>
                <ThoughtBubbleSvg w={w} h={h} color={c} />
              </div>
            );
            if (el.shapeKind === 'arrow') return (
              <div key={el.id} onPointerDown={(e) => onElementPointerDown(e, el.id)} className="absolute"
                style={{ left: el.x, top: el.y, zIndex: el.zIndex, cursor: activeTool === 'select' ? 'move' : undefined, outline: isSelected ? '2px solid #0EA5E9' : 'none', outlineOffset: 4 }}>
                <ArrowSvg w={w} h={h} color={c} />
              </div>
            );
            return (
              <div key={el.id} onPointerDown={(e) => onElementPointerDown(e, el.id)} className="absolute"
                style={{ left: el.x, top: el.y, width: w, height: h, zIndex: el.zIndex, border: `2px solid ${c}`, borderRadius: el.shapeKind === 'ellipse' ? '50%' : 8, backgroundColor: 'rgba(255,255,255,0.04)', cursor: activeTool === 'select' ? 'move' : undefined, outline: isSelected ? '2px solid #0EA5E9' : 'none', outlineOffset: 4 }} />
            );
          }

          if (el.type === 'image' && el.imageUrl) {
            return (
              <div key={el.id} onPointerDown={(e) => onElementPointerDown(e, el.id)} className="absolute rounded-xl overflow-hidden shadow-2xl"
                style={{ left: el.x, top: el.y, zIndex: el.zIndex, maxWidth: el.width || 400, cursor: activeTool === 'select' ? 'move' : undefined, outline: isSelected ? '2px solid #0EA5E9' : 'none', outlineOffset: 4 }}>
                <img src={el.imageUrl} alt="" className="w-full h-auto block" draggable={false} />
              </div>
            );
          }

          if (el.type === 'ai_visual' && el.content) {
            let parsed: any;
            try { parsed = JSON.parse(el.content); } catch { return null; }
            if (!parsed) return null;
            const isInteractive = activeTool === 'text';
            return (
              <div key={el.id} onPointerDown={(e) => onElementPointerDown(e, el.id)} className="absolute"
                style={{ left: el.x - 400, top: el.y - 300, zIndex: el.zIndex, cursor: activeTool === 'select' ? 'move' : undefined, outline: isSelected ? '2px solid #0EA5E9' : 'none', outlineOffset: 8, borderRadius: 16 }}>
                {/* No border/frame - rendered directly like a landing page */}
                <div className={isInteractive ? "pointer-events-auto" : "pointer-events-none"} style={{ minWidth: 700 }}>
                  {parsed.kind === 'image' ? (
                    <HtmlVisual code={parsed.code?.replace('__IMAGE_SRC__', `data:${parsed.mimeType};base64,${parsed.imageBase64}`)} isEditable={isInteractive} />
                  ) : parsed.kind === 'html' ? (
                    <HtmlVisual code={parsed.code} isEditable={isInteractive} />
                  ) : parsed.kind === 'mermaid' ? (
                    <MermaidDiagram code={parsed.code} id={el.id} />
                  ) : parsed.kind === 'chart' ? (
                    <div className="bg-white/90 p-4 rounded-xl"><ChartRenderer data={parsed} /></div>
                  ) : (
                    <div className="prose prose-invert max-w-none"><Markdown content={JSON.stringify(parsed, null, 2)} /></div>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
