import { normalizedToLocalCss } from '../../../shared/coordinates';
import type { DrawCommand, OverlayPreloadAPI, Point, Rect } from '../../../shared/types';

declare global {
  interface Window {
    gradelysOverlay?: OverlayPreloadAPI;
  }
}

const STROKE_COLOR = '#FF3B30';
const STROKE_HALO = 'rgba(255, 255, 255, 0.9)';
const STROKE_WIDTH = 4;
const HIGHLIGHT_FILL = 'rgba(255, 214, 10, 0.28)';
const HIGHLIGHT_BORDER = 'rgba(255, 159, 10, 0.9)';
const FADE_IN_MS = 200;
const PULSE_DURATION_MS = 1600;
const FRAME_INTERVAL_MS = 33; // ~30 fps cap to keep full-screen Retina compositing lightweight
const MAX_PULSED_COMMANDS = 6;

const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement | null;
const ctx = canvas?.getContext('2d') ?? null;

let activeCommands: DrawCommand[] = [];
let activeBounds: Rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
let animStart = 0;
let lastFrameAt = 0;
let rafId: number | null = null;
let resizeRafId: number | null = null;

const prefersReducedMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeCanvas(): void {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function toLocal(p: Point): Point {
  return normalizedToLocalCss(p, {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function getCommandAnchor(cmd: DrawCommand | undefined): Point | null {
  if (!cmd) return null;
  switch (cmd.type) {
    case 'circle':
      return toLocal(cmd.at);
    case 'rect':
    case 'highlight': {
      const p1 = toLocal(cmd.from);
      const p2 = toLocal(cmd.to);
      return { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y) };
    }
    case 'arrow':
      return toLocal(cmd.to);
    case 'text':
      return toLocal(cmd.at);
    default:
      return null;
  }
}

function drawRoundedRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.arcTo(x + w, y, x + w, y + h, radius);
  c.arcTo(x + w, y + h, x, y + h, radius);
  c.arcTo(x, y + h, x, y, radius);
  c.arcTo(x, y, x + w, y, radius);
  c.closePath();
}

function drawArrow(
  c: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  pulseScale: number
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;

  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(20, Math.max(12, len * 0.25)) * pulseScale;

  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Main shaft (stop slightly before tip so arrowhead stays sharp)
  const shaftEndX = to.x - Math.cos(angle) * (headLen * 0.65);
  const shaftEndY = to.y - Math.sin(angle) * (headLen * 0.65);
  const headLeftX = to.x - headLen * Math.cos(angle - Math.PI / 6);
  const headLeftY = to.y - headLen * Math.sin(angle - Math.PI / 6);
  const headRightX = to.x - headLen * Math.cos(angle + Math.PI / 6);
  const headRightY = to.y - headLen * Math.sin(angle + Math.PI / 6);

  // Fast crisp white halo (avoids expensive per-frame Gaussian shadowBlur)
  c.strokeStyle = STROKE_HALO;
  c.lineWidth = STROKE_WIDTH + 4;
  c.beginPath();
  c.moveTo(from.x, from.y);
  c.lineTo(shaftEndX, shaftEndY);
  c.stroke();

  c.fillStyle = STROKE_HALO;
  c.beginPath();
  c.moveTo(to.x, to.y);
  c.lineTo(headLeftX, headLeftY);
  c.lineTo(headRightX, headRightY);
  c.closePath();
  c.lineWidth = 4;
  c.stroke();

  // Foreground red shaft + arrowhead
  c.strokeStyle = STROKE_COLOR;
  c.fillStyle = STROKE_COLOR;
  c.lineWidth = STROKE_WIDTH;
  c.beginPath();
  c.moveTo(from.x, from.y);
  c.lineTo(shaftEndX, shaftEndY);
  c.stroke();

  c.beginPath();
  c.moveTo(to.x, to.y);
  c.lineTo(headLeftX, headLeftY);
  c.lineTo(headRightX, headRightY);
  c.closePath();
  c.fill();
  c.restore();
}

function drawTextPill(c: CanvasRenderingContext2D, at: Point, text: string): void {
  c.save();
  c.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
  const metrics = c.measureText(text);
  const padX = 12;
  const boxW = Math.ceil(metrics.width + padX * 2);
  const boxH = 34;

  const x = Math.min(Math.max(8, at.x - boxW / 2), window.innerWidth - boxW - 8);
  const y = Math.min(Math.max(8, at.y - boxH / 2), window.innerHeight - boxH - 8);

  c.fillStyle = 'rgba(15, 23, 42, 0.14)';
  drawRoundedRectPath(c, x, y + 2, boxW, boxH, 10);
  c.fill();

  c.fillStyle = 'rgba(255, 255, 255, 0.97)';
  drawRoundedRectPath(c, x, y, boxW, boxH, 10);
  c.fill();

  c.strokeStyle = 'rgba(255, 59, 48, 0.45)';
  c.lineWidth = 1.5;
  c.stroke();

  c.fillStyle = '#0f172a';
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText(text, x + padX, y + boxH / 2 + 0.5);
  c.restore();
}

function drawStepBadge(
  c: CanvasRenderingContext2D,
  anchor: Point,
  n: number,
  label?: string
): void {
  c.save();
  const radius = 15;
  const badgeX = Math.min(Math.max(radius + 8, anchor.x - 10), window.innerWidth - radius - 8);
  const badgeY = Math.min(Math.max(radius + 8, anchor.y - 26), window.innerHeight - radius - 8);

  c.fillStyle = 'rgba(15, 23, 42, 0.16)';
  c.beginPath();
  c.arc(badgeX, badgeY + 2, radius + 1.5, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = STROKE_COLOR;
  c.beginPath();
  c.arc(badgeX, badgeY, radius, 0, Math.PI * 2);
  c.fill();

  c.strokeStyle = '#ffffff';
  c.lineWidth = 2.5;
  c.stroke();

  c.fillStyle = '#ffffff';
  c.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(n), badgeX, badgeY + 0.5);

  if (label) {
    c.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
    const w = Math.ceil(c.measureText(label).width + 18);
    const lx = Math.min(badgeX + radius + 6, window.innerWidth - w - 8);
    const ly = Math.max(8, badgeY - 14);
    c.fillStyle = 'rgba(15, 23, 42, 0.14)';
    drawRoundedRectPath(c, lx, ly + 2, w, 28, 8);
    c.fill();

    c.fillStyle = 'rgba(255, 255, 255, 0.97)';
    drawRoundedRectPath(c, lx, ly, w, 28, 8);
    c.fill();

    c.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    c.lineWidth = 1;
    c.stroke();

    c.fillStyle = '#0f172a';
    c.textAlign = 'left';
    c.fillText(label, lx + 9, ly + 14.5);
  }

  c.restore();
}

function renderFrame(now: number): void {
  if (!canvas || !ctx) return;

  if (activeCommands.length === 0) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    rafId = null;
    return;
  }

  const elapsed = prefersReducedMotion ? PULSE_DURATION_MS : now - animStart;
  const allowPulse =
    !prefersReducedMotion &&
    activeCommands.length <= MAX_PULSED_COMMANDS &&
    activeCommands.some((c) => c.type === 'circle' || c.type === 'arrow');
  const stopAt = allowPulse ? PULSE_DURATION_MS : FADE_IN_MS;
  const isFinished = prefersReducedMotion || elapsed >= stopAt;

  // Throttle intermediate animation frames to ~30 fps; always render the final static frame immediately
  if (!isFinished && lastFrameAt > 0 && now - lastFrameAt < FRAME_INTERVAL_MS) {
    rafId = requestAnimationFrame(renderFrame);
    return;
  }
  lastFrameAt = now;

  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  const fadeProgress = isFinished ? 1 : Math.min(1, Math.max(0, elapsed / FADE_IN_MS));
  const pulse =
    isFinished || !allowPulse
      ? 1
      : 1 + 0.04 * Math.sin((elapsed / 1000) * Math.PI * 2);

  ctx.save();
  ctx.globalAlpha = fadeProgress;

  for (let i = 0; i < activeCommands.length; i++) {
    const cmd = activeCommands[i];

    if (cmd.type === 'highlight') {
      const p1 = toLocal(cmd.from);
      const p2 = toLocal(cmd.to);
      const rx = Math.min(p1.x, p2.x);
      const ry = Math.min(p1.y, p2.y);
      const rw = Math.max(4, Math.abs(p2.x - p1.x));
      const rh = Math.max(4, Math.abs(p2.y - p1.y));

      ctx.save();
      ctx.fillStyle = HIGHLIGHT_FILL;
      ctx.strokeStyle = HIGHLIGHT_BORDER;
      ctx.lineWidth = 2;
      drawRoundedRectPath(ctx, rx, ry, rw, rh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (cmd.type === 'rect') {
      const p1 = toLocal(cmd.from);
      const p2 = toLocal(cmd.to);
      const rx = Math.min(p1.x, p2.x);
      const ry = Math.min(p1.y, p2.y);
      const rw = Math.max(4, Math.abs(p2.x - p1.x));
      const rh = Math.max(4, Math.abs(p2.y - p1.y));

      ctx.save();
      drawRoundedRectPath(ctx, rx, ry, rw, rh, 8);
      ctx.strokeStyle = STROKE_HALO;
      ctx.lineWidth = STROKE_WIDTH + 4;
      ctx.stroke();
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = STROKE_WIDTH;
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (cmd.type === 'circle') {
      const center = toLocal(cmd.at);
      const radiusNorm = cmd.radius ?? 40;
      const baseDim = Math.min(width, height);
      const radiusPx = Math.max(10, (radiusNorm / 1000) * baseDim) * pulse;

      ctx.save();
      ctx.beginPath();
      ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = STROKE_HALO;
      ctx.lineWidth = STROKE_WIDTH + 4;
      ctx.stroke();
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = STROKE_WIDTH;
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (cmd.type === 'arrow') {
      drawArrow(ctx, toLocal(cmd.from), toLocal(cmd.to), pulse);
    }
  }

  // Render labels and numbered step badges in a second pass so they always sit cleanly above shapes
  for (let i = 0; i < activeCommands.length; i++) {
    const cmd = activeCommands[i];
    if (cmd.type === 'text') {
      drawTextPill(ctx, toLocal(cmd.at), cmd.text);
      continue;
    }
    if (cmd.type === 'step') {
      const targetAnchor =
        getCommandAnchor(activeCommands[i + 1]) ||
        getCommandAnchor(activeCommands[i - 1]) || {
          x: Math.min(80, width * 0.08),
          y: Math.min(80, height * 0.08),
        };
      drawStepBadge(ctx, targetAnchor, cmd.n, cmd.label);
    }
  }

  ctx.restore();

  if (!isFinished) {
    rafId = requestAnimationFrame(renderFrame);
  } else {
    rafId = null;
  }
}

function startRendering(commands: DrawCommand[], displayBounds: Rect): void {
  activeCommands = commands;
  activeBounds = displayBounds;
  void activeBounds;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  resizeCanvas();
  animStart = performance.now();
  lastFrameAt = 0;
  rafId = requestAnimationFrame(renderFrame);
}

function clearCanvas(): void {
  activeCommands = [];
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (ctx) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

resizeCanvas();
window.addEventListener('resize', () => {
  if (resizeRafId !== null) {
    cancelAnimationFrame(resizeRafId);
  }
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null;
    resizeCanvas();
    if (activeCommands.length > 0) {
      renderFrame(performance.now());
    }
  });
});

window.gradelysOverlay?.onRenderCommands(({ commands, displayBounds }) => {
  startRendering(commands, displayBounds);
});

window.gradelysOverlay?.onClear(() => {
  clearCanvas();
});
