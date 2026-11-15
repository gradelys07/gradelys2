import { describe, expect, it } from 'vitest';
import {
  clampToWorkArea,
  computeShortcutWindowPosition,
  computeTrayWindowPosition,
  normalizedToDip,
  normalizedToLocalCss,
  validateDrawCommands,
} from '../shared/coordinates';
import type { Rect } from '../shared/types';

describe('normalized coordinate conversions', () => {
  it('maps center (500, 500) on Mac Retina 2x (1728x1117 DIP)', () => {
    const macRetinaBounds: Rect = { x: 0, y: 0, width: 1728, height: 1117 };
    const dip = normalizedToDip({ x: 500, y: 500 }, macRetinaBounds);
    const local = normalizedToLocalCss({ x: 500, y: 500 }, macRetinaBounds);

    expect(dip).toEqual({ x: 864, y: 558.5 });
    expect(local).toEqual({ x: 864, y: 558.5 });
  });

  it('maps coordinates on Windows 125% scaling (1920x1080 physical -> 1536x864 DIP)', () => {
    const win125Bounds: Rect = { x: 0, y: 0, width: 1536, height: 864 };
    const dip = normalizedToDip({ x: 500, y: 500 }, win125Bounds);
    const topRight = normalizedToDip({ x: 1000, y: 0 }, win125Bounds);

    expect(dip).toEqual({ x: 768, y: 432 });
    expect(topRight).toEqual({ x: 1536, y: 0 });
  });

  it('maps coordinates on Windows 150% scaling (2560x1440 physical -> 1707x960 DIP)', () => {
    const win150Bounds: Rect = { x: 0, y: 0, width: 1707, height: 960 };
    const dip = normalizedToDip({ x: 500, y: 500 }, win150Bounds);
    const quarter = normalizedToLocalCss({ x: 250, y: 750 }, win150Bounds);

    expect(dip).toEqual({ x: 853.5, y: 480 });
    expect(quarter).toEqual({ x: 426.75, y: 720 });
  });

  it('maps coordinates on secondary display with negative X/Y coordinates', () => {
    const secondaryLeftBounds: Rect = { x: -1920, y: -120, width: 1920, height: 1080 };
    const centerDip = normalizedToDip({ x: 500, y: 500 }, secondaryLeftBounds);
    const originDip = normalizedToDip({ x: 0, y: 0 }, secondaryLeftBounds);
    const localCenter = normalizedToLocalCss({ x: 500, y: 500 }, secondaryLeftBounds);

    expect(centerDip).toEqual({ x: -960, y: 420 });
    expect(originDip).toEqual({ x: -1920, y: -120 });
    // Local overlay canvas starts at (0,0) relative to its display window
    expect(localCenter).toEqual({ x: 960, y: 540 });
  });

  it('maps coordinates on vertical portrait display (1080x1920)', () => {
    const portraitBounds: Rect = { x: 1920, y: -300, width: 1080, height: 1920 };
    const centerDip = normalizedToDip({ x: 500, y: 500 }, portraitBounds);
    const bottomLocal = normalizedToLocalCss({ x: 1000, y: 1000 }, portraitBounds);

    expect(centerDip).toEqual({ x: 2460, y: 660 });
    expect(bottomLocal).toEqual({ x: 1080, y: 1920 });
  });
});

describe('window positioning & clamping', () => {
  it('clamps chat window inside negative secondary display workArea', () => {
    const workArea: Rect = { x: -1920, y: 25, width: 1920, height: 1055 };
    const pos = clampToWorkArea(-2000, 900, 420, 560, workArea);

    expect(pos.x).toBe(-1920);
    expect(pos.y).toBe(25 + 1055 - 560);
  });

  it('positions below tray icon on macOS and stays within workArea', () => {
    const workArea: Rect = { x: 0, y: 25, width: 1440, height: 875 };
    const trayBounds: Rect = { x: 1380, y: 2, width: 28, height: 22 };
    const pos = computeTrayWindowPosition(trayBounds, workArea, 420, 560, 'darwin');

    expect(pos.x).toBe(1440 - 420);
    expect(pos.y).toBeGreaterThanOrEqual(25);
  });

  it('positions above taskbar tray icon on Windows', () => {
    const workArea: Rect = { x: 0, y: 0, width: 1536, height: 816 };
    const trayBounds: Rect = { x: 1320, y: 822, width: 24, height: 36 };
    const pos = computeTrayWindowPosition(trayBounds, workArea, 420, 560, 'win32');

    expect(pos.y).toBe(822 - 560 - 8);
    expect(pos.x + 420).toBeLessThanOrEqual(1536);
  });

  it('centers horizontally in upper third on shortcut', () => {
    const workArea: Rect = { x: -1920, y: 0, width: 1920, height: 1080 };
    const pos = computeShortcutWindowPosition(workArea, 420, 560);

    expect(pos.x).toBe(-1920 + (1920 - 420) / 2);
    expect(pos.y).toBe(Math.round(1080 * 0.16));
  });
});

describe('validateDrawCommands', () => {
  it('filters out-of-range, NaN, and unknown commands and caps at 30', () => {
    const input = [
      { type: 'circle', at: { x: 500, y: 500 } },
      { type: 'circle', at: { x: -1, y: 500 } },
      { type: 'circle', at: { x: 1001, y: 500 } },
      { type: 'arrow', from: { x: NaN, y: 10 }, to: { x: 100, y: 100 } },
      { type: 'text', at: { x: 200, y: 300 }, text: 'A'.repeat(100) },
      { type: 'step', n: 1, label: 'Clique ici' },
      { type: 'unknown', foo: 'bar' },
    ];

    const valid = validateDrawCommands(input);
    expect(valid).toHaveLength(3);
    expect(valid[0]).toEqual({ type: 'circle', at: { x: 500, y: 500 }, radius: 40 });
    expect(valid[1]).toEqual({ type: 'text', at: { x: 200, y: 300 }, text: 'A'.repeat(60) });
    expect(valid[2]).toEqual({ type: 'step', n: 1, label: 'Clique ici' });

    const many = Array.from({ length: 45 }, () => ({ type: 'circle', at: { x: 10, y: 10 } }));
    expect(validateDrawCommands(many)).toHaveLength(30);
  });
});

