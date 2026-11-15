import type { DrawCommand, Point, Rect } from './types';

const MAX_COMMANDS = 30;
const MAX_TEXT_LENGTH = 60;

function isValidCoord(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000;
}

function isValidPoint(p: unknown): p is Point {
  if (!p || typeof p !== 'object') return false;
  const pt = p as Record<string, unknown>;
  return isValidCoord(pt.x) && isValidCoord(pt.y);
}

/**
 * Validates and normalizes draw commands coming from the web renderer / AI tool output.
 * Invalid or out-of-bounds commands are dropped; at most 30 commands are retained.
 */
export function validateDrawCommands(raw: unknown): DrawCommand[] {
  if (!Array.isArray(raw)) return [];
  const valid: DrawCommand[] = [];

  for (const item of raw) {
    if (valid.length >= MAX_COMMANDS) break;
    if (!item || typeof item !== 'object') continue;
    const cmd = item as Record<string, unknown>;

    switch (cmd.type) {
      case 'circle': {
        if (!isValidPoint(cmd.at)) continue;
        let radius = 40;
        if (cmd.radius !== undefined) {
          if (typeof cmd.radius !== 'number' || !Number.isFinite(cmd.radius) || cmd.radius <= 0 || cmd.radius > 1000) {
            continue;
          }
          radius = cmd.radius;
        }
        valid.push({ type: 'circle', at: { x: cmd.at.x, y: cmd.at.y }, radius });
        break;
      }
      case 'rect':
      case 'arrow':
      case 'highlight': {
        if (!isValidPoint(cmd.from) || !isValidPoint(cmd.to)) continue;
        valid.push({
          type: cmd.type,
          from: { x: cmd.from.x, y: cmd.from.y },
          to: { x: cmd.to.x, y: cmd.to.y },
        });
        break;
      }
      case 'text': {
        if (!isValidPoint(cmd.at) || typeof cmd.text !== 'string') continue;
        const trimmed = cmd.text.trim();
        if (!trimmed) continue;
        valid.push({
          type: 'text',
          at: { x: cmd.at.x, y: cmd.at.y },
          text: trimmed.slice(0, MAX_TEXT_LENGTH),
        });
        break;
      }
      case 'step': {
        if (typeof cmd.n !== 'number' || !Number.isFinite(cmd.n) || cmd.n < 1 || cmd.n > 99) {
          continue;
        }
        const label =
          typeof cmd.label === 'string' && cmd.label.trim().length > 0
            ? cmd.label.trim().slice(0, MAX_TEXT_LENGTH)
            : undefined;
        valid.push({ type: 'step', n: Math.round(cmd.n), ...(label ? { label } : {}) });
        break;
      }
      case 'clear': {
        valid.push({ type: 'clear' });
        break;
      }
      default:
        continue;
    }
  }

  return valid;
}

/**
 * Converts normalized 0..1000 coordinates into global Electron DIP screen coordinates.
 */
export function normalizedToDip(p: Point, displayBounds: Rect): Point {
  return {
    x: displayBounds.x + (p.x / 1000) * displayBounds.width,
    y: displayBounds.y + (p.y / 1000) * displayBounds.height,
  };
}

/**
 * Converts normalized 0..1000 coordinates into local overlay CSS pixels (0..width, 0..height).
 */
export function normalizedToLocalCss(p: Point, displayBounds: Rect): Point {
  return {
    x: (p.x / 1000) * displayBounds.width,
    y: (p.y / 1000) * displayBounds.height,
  };
}

/**
 * Clamps a window rectangle inside the given display workArea.
 */
export function clampToWorkArea(
  x: number,
  y: number,
  width: number,
  height: number,
  workArea: Rect
): { x: number; y: number } {
  const minX = workArea.x;
  const maxX = Math.max(workArea.x, workArea.x + workArea.width - width);
  const minY = workArea.y;
  const maxY = Math.max(workArea.y, workArea.y + workArea.height - height);

  return {
    x: Math.round(Math.min(Math.max(x, minX), maxX)),
    y: Math.round(Math.min(Math.max(y, minY), maxY)),
  };
}

/**
 * Computes chat window coordinates when opened from the tray / menu bar icon.
 */
export function computeTrayWindowPosition(
  trayBounds: Rect,
  workArea: Rect,
  winWidth: number,
  winHeight: number,
  platform: NodeJS.Platform
): { x: number; y: number } {
  const margin = 8;
  const centeredX = trayBounds.x + trayBounds.width / 2 - winWidth / 2;

  let rawY: number;
  if (platform === 'darwin') {
    rawY = Math.max(workArea.y + margin, trayBounds.y + trayBounds.height + margin);
  } else {
    // Windows taskbar is usually at the bottom; place window above the tray icon when room permits
    const spaceAbove = trayBounds.y - workArea.y;
    const spaceBelow = workArea.y + workArea.height - (trayBounds.y + trayBounds.height);
    if (spaceAbove >= winHeight + margin || spaceAbove >= spaceBelow) {
      rawY = trayBounds.y - winHeight - margin;
    } else {
      rawY = trayBounds.y + trayBounds.height + margin;
    }
  }

  return clampToWorkArea(centeredX, rawY, winWidth, winHeight, workArea);
}

/**
 * Computes chat window coordinates when opened via global shortcut:
 * centered horizontally in the upper third of the active cursor display.
 */
export function computeShortcutWindowPosition(
  workArea: Rect,
  winWidth: number,
  winHeight: number
): { x: number; y: number } {
  const x = workArea.x + (workArea.width - winWidth) / 2;
  const upperThirdY = workArea.y + Math.max(24, Math.round(workArea.height * 0.16));
  return clampToWorkArea(x, upperThirdY, winWidth, winHeight, workArea);
}

