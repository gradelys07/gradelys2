import { app, BrowserWindow, screen } from 'electron';
import { join } from 'path';
import log from 'electron-log/main';
import { validateDrawCommands } from '../../shared/coordinates';
import { IPC_CHANNELS, type DrawCommand, type Rect } from '../../shared/types';
import { getChatWindow, sendOverlayState, setChatOperationActive } from './chatWindow';
import { attachLocalWindowSecurity } from './security';
import {
  registerTemporaryEscapeShortcut,
  unregisterTemporaryEscapeShortcut,
} from './shortcuts';

const AUTO_CLEAR_MS = 45_000;
const DESTROY_INACTIVE_MS = 60_000;

const overlayWindows = new Map<number, BrowserWindow>();
let autoClearTimer: NodeJS.Timeout | null = null;
let destroyInactiveTimer: NodeJS.Timeout | null = null;
let overlayActive = false;

function clearTimers(): void {
  if (autoClearTimer) {
    clearTimeout(autoClearTimer);
    autoClearTimer = null;
  }
  if (destroyInactiveTimer) {
    clearTimeout(destroyInactiveTimer);
    destroyInactiveTimer = null;
  }
}

function getOverlayUrl(): string {
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    return `${devUrl}/overlay/index.html`;
  }
  return `file://${join(__dirname, '../renderer/overlay/index.html')}`;
}

function resolveDisplay(displayId: number, fallbackBounds: Rect): Electron.Display {
  const displays = screen.getAllDisplays();
  if (displayId >= 0) {
    const byId = displays.find((d) => d.id === displayId);
    if (byId) return byId;
    if (fallbackBounds.width > 10 && fallbackBounds.height > 10) {
      return screen.getDisplayMatching(fallbackBounds);
    }
  }
  const chatWin = getChatWindow();
  if (chatWin && chatWin.isVisible()) {
    return screen.getDisplayMatching(chatWin.getBounds());
  }
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

async function createOrGetOverlayWindow(display: Electron.Display): Promise<BrowserWindow> {
  const existing = overlayWindows.get(display.id);
  if (existing && !existing.isDestroyed()) {
    existing.setBounds(display.bounds);
    return existing;
  }

  const targetUrl = getOverlayUrl();

  const win = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    fullscreen: false,
    fullscreenable: false,
    thickFrame: false,
    enableLargerThanScreen: true,
    show: false,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: join(__dirname, '../preload/overlay.js'),
    },
  });

  win.setBounds(display.bounds);
  win.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  } else {
    win.setVisibleOnAllWorkspaces(true);
  }
  win.setIgnoreMouseEvents(true);
  win.setContentProtection(true);

  attachLocalWindowSecurity(win, targetUrl);

  win.on('closed', () => {
    overlayWindows.delete(display.id);
  });

  overlayWindows.set(display.id, win);

  await new Promise<void>((resolve) => {
    win.webContents.once('did-finish-load', () => resolve());
    const devUrl = process.env['ELECTRON_RENDERER_URL'];
    if (!app.isPackaged && devUrl) {
      void win.loadURL(targetUrl);
    } else {
      void win.loadFile(join(__dirname, '../renderer/overlay/index.html'));
    }
  });

  return win;
}

function clearCanvasKeepWindows(): void {
  for (const win of overlayWindows.values()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.OVERLAY_CLEAR);
    }
  }
  overlayActive = false;
  unregisterTemporaryEscapeShortcut();
  setChatOperationActive(false);
  sendOverlayState(false);
}

export function destroyAllOverlays(): void {
  clearTimers();
  for (const win of overlayWindows.values()) {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  }
  overlayWindows.clear();
  if (overlayActive) {
    overlayActive = false;
    sendOverlayState(false);
  }
  unregisterTemporaryEscapeShortcut();
  setChatOperationActive(false);
}

export function clearAllOverlays(): void {
  clearCanvasKeepWindows();
  destroyAllOverlays();
}

export function isOverlayActive(): boolean {
  return overlayActive;
}

export async function drawOverlay(
  rawCommands: DrawCommand[],
  displayId: number,
  displayBounds: Rect
): Promise<void> {
  const commands = validateDrawCommands(rawCommands);
  const nonClearCommands = commands.filter((c) => c.type !== 'clear');

  if (commands.length === 0 || nonClearCommands.length === 0) {
    clearAllOverlays();
    return;
  }

  const display = resolveDisplay(displayId, displayBounds);

  // Destroy overlays on other displays so each step cleanly targets the active display
  for (const [id, existingWin] of overlayWindows.entries()) {
    if (id !== display.id) {
      if (!existingWin.isDestroyed()) existingWin.destroy();
      overlayWindows.delete(id);
    }
  }

  const win = await createOrGetOverlayWindow(display);
  if (win.isDestroyed()) return;

  win.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  } else {
    win.setVisibleOnAllWorkspaces(true);
  }
  win.setIgnoreMouseEvents(true);
  win.setContentProtection(true);
  win.webContents.send(IPC_CHANNELS.OVERLAY_RENDER, {
    commands,
    displayBounds: { ...display.bounds },
  });
  win.showInactive();
  win.moveTop();

  overlayActive = true;
  setChatOperationActive(true);
  sendOverlayState(true);
  registerTemporaryEscapeShortcut(() => {
    clearAllOverlays();
  });

  clearTimers();
  autoClearTimer = setTimeout(() => {
    log.info('Overlay auto-cleared after 45s timeout');
    clearCanvasKeepWindows();
  }, AUTO_CLEAR_MS);

  destroyInactiveTimer = setTimeout(() => {
    log.info('Overlay window destroyed after 60s inactivity');
    destroyAllOverlays();
  }, DESTROY_INACTIVE_MS);
}

