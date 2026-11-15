import { app, BrowserWindow, screen, session, type Rectangle } from 'electron';
import { join } from 'path';
import log from 'electron-log/main';
import {
  clampToWorkArea,
  computeShortcutWindowPosition,
  computeTrayWindowPosition,
} from '../../shared/coordinates';
import { isTrustedOrigin } from '../../shared/securityValidation';
import { IPC_CHANNELS, type CaptureState } from '../../shared/types';
import { prepareQuickOverlayPolicy } from './mainWindow';
import {
  attachChatWindowSecurity,
  configureSessionSecurity,
  getGradelysBaseUrl,
  getGradelysQuickUrl,
} from './security';

const CHAT_WIDTH = 456;
const CHAT_DEFAULT_HEIGHT = 186;
const CHAT_MIN_HEIGHT = 152;
const CHAT_MAX_HEIGHT = 640;
const RESIZE_THROTTLE_MS = 180;

let chatWindow: BrowserWindow | null = null;
let isPinned = false;
let isOperationActive = false;
let lastShownAt = 0;
let lastHiddenAt = 0;
let lastResizeAt = 0;
let pendingResizeHeight: number | null = null;
let pendingResizeTimer: NodeJS.Timeout | null = null;
let blurHideTimer: NodeJS.Timeout | null = null;
let currentChatHeight = CHAT_DEFAULT_HEIGHT;
let anchorBottomOnResize = false;
let escapeHandler: (() => void) | null = null;

export function setChatEscapeHandler(handler: () => void): void {
  escapeHandler = handler;
}

export function getChatWindow(): BrowserWindow | null {
  return chatWindow && !chatWindow.isDestroyed() ? chatWindow : null;
}

export function setChatPinned(pinned: boolean): void {
  isPinned = Boolean(pinned);
}

export function getChatPinned(): boolean {
  return isPinned;
}

export function setChatOperationActive(active: boolean): void {
  isOperationActive = Boolean(active);
}

export function setChatOpacity(opacity: number): void {
  const win = getChatWindow();
  if (!win) return;
  win.setOpacity(Math.max(0, Math.min(1, opacity)));
}

export function sendCaptureState(state: CaptureState): void {
  const win = getChatWindow();
  if (!win) return;
  win.webContents.send(IPC_CHANNELS.CAPTURE_STATE, state);
}

export function sendOverlayState(active: boolean): void {
  const win = getChatWindow();
  if (!win) return;
  win.webContents.send(IPC_CHANNELS.OVERLAY_STATE, Boolean(active));
}

function applyAlwaysOnTopAndWorkspaces(win: BrowserWindow): void {
  const level = process.platform === 'darwin' ? 'pop-up-menu' : 'screen-saver';
  win.setAlwaysOnTop(true, level);
  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  } else {
    win.setVisibleOnAllWorkspaces(true);
  }
}

function loadOfflineFallback(
  win: BrowserWindow,
  quickUrl: string,
  mode: 'offline' | 'not-deployed' = 'offline'
): void {
  resizeChatWindowHeight(340);
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    const target = `${devUrl}/offline/index.html?retryUrl=${encodeURIComponent(quickUrl)}&mode=${mode}`;
    void win.loadURL(target);
    return;
  }
  void win.loadFile(join(__dirname, '../renderer/offline/index.html'), {
    query: { retryUrl: quickUrl, mode },
  });
}

function applyChatWindowHeightNow(clampedHeight: number): void {
  if (Math.abs(clampedHeight - currentChatHeight) < 8) return;
  currentChatHeight = clampedHeight;
  lastResizeAt = Date.now();

  const win = getChatWindow();
  if (!win) return;

  const bounds = win.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const workArea = display.workArea;
  const maxAllowedHeight = Math.min(CHAT_MAX_HEIGHT, Math.max(CHAT_MIN_HEIGHT, workArea.height - 24));
  const nextHeight = Math.min(clampedHeight, maxAllowedHeight);
  const nextY = anchorBottomOnResize ? bounds.y + bounds.height - nextHeight : bounds.y;
  const clampedPos = clampToWorkArea(bounds.x, nextY, CHAT_WIDTH, nextHeight, workArea);
  if (
    Math.abs(bounds.height - nextHeight) < 2 &&
    Math.abs(bounds.y - clampedPos.y) < 2 &&
    Math.abs(bounds.x - clampedPos.x) < 2
  ) {
    return;
  }
  win.setBounds(
    {
      x: clampedPos.x,
      y: clampedPos.y,
      width: CHAT_WIDTH,
      height: nextHeight,
    },
    false
  );
}

export function resizeChatWindowHeight(targetHeight: number): void {
  if (!Number.isFinite(targetHeight)) return;
  const clampedHeight = Math.round(
    Math.min(Math.max(targetHeight, CHAT_MIN_HEIGHT), CHAT_MAX_HEIGHT)
  );
  if (Math.abs(clampedHeight - currentChatHeight) < 8 && pendingResizeHeight === null) {
    return;
  }

  const now = Date.now();
  const elapsed = now - lastResizeAt;
  if (elapsed >= RESIZE_THROTTLE_MS && pendingResizeTimer === null) {
    applyChatWindowHeightNow(clampedHeight);
    return;
  }

  pendingResizeHeight = clampedHeight;
  if (!pendingResizeTimer) {
    const waitMs = Math.max(12, RESIZE_THROTTLE_MS - elapsed);
    pendingResizeTimer = setTimeout(() => {
      pendingResizeTimer = null;
      const next = pendingResizeHeight;
      pendingResizeHeight = null;
      if (next !== null) {
        applyChatWindowHeightNow(next);
      }
    }, waitMs);
  }
}

export function createChatWindow(): BrowserWindow {
  const existing = getChatWindow();
  if (existing) return existing;

  const baseOrigin = getGradelysBaseUrl();
  const quickUrl = getGradelysQuickUrl();
  const chatSession = session.fromPartition('persist:gradelys');
  configureSessionSecurity(chatSession);

  const win = new BrowserWindow({
    width: CHAT_WIDTH,
    height: currentChatHeight,
    minWidth: 380,
    minHeight: CHAT_MIN_HEIGHT,
    maxWidth: 520,
    maxHeight: CHAT_MAX_HEIGHT,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    show: false,
    skipTaskbar: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    ...(process.platform === 'darwin'
      ? {
          type: 'panel',
          vibrancy: 'under-window' as const,
          visualEffectState: 'active' as const,
          roundedCorners: true,
        }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: join(__dirname, '../preload/chat.js'),
      session: chatSession,
    },
  });

  applyAlwaysOnTopAndWorkspaces(win);
  attachChatWindowSecurity(win, baseOrigin);

  win.webContents.on('did-fail-load', (_event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    if (validatedURL.startsWith('file://') || validatedURL.includes('/offline/index.html')) return;
    log.warn(`Chat window failed to load (code=${errorCode}), showing offline page`);
    loadOfflineFallback(win, quickUrl, 'offline');
  });

  win.webContents.on('did-navigate', (_event, url, httpResponseCode) => {
    if (url.startsWith('file://') || url.includes('/offline/index.html')) return;
    if (httpResponseCode >= 400 && isTrustedOrigin(url, baseOrigin)) {
      log.warn(`Chat window received HTTP ${httpResponseCode} for ${url}, showing deploy fallback`);
      loadOfflineFallback(win, quickUrl, 'not-deployed');
    }
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
      event.preventDefault();
      if (escapeHandler) {
        escapeHandler();
      } else {
        hideChatWindow();
      }
    }
  });

  win.on('focus', () => {
    if (blurHideTimer) {
      clearTimeout(blurHideTimer);
      blurHideTimer = null;
    }
  });

  win.on('blur', () => {
    if (Date.now() - lastShownAt < 400) return;
    if (isPinned || isOperationActive) return;
    if (blurHideTimer) {
      clearTimeout(blurHideTimer);
    }
    // Brief confirmation delay avoids hiding during transient focus blips
    blurHideTimer = setTimeout(() => {
      blurHideTimer = null;
      const activeWin = getChatWindow();
      if (!activeWin || activeWin.isFocused() || isPinned || isOperationActive) return;
      hideChatWindow();
    }, 120);
  });

  win.on('closed', () => {
    if (blurHideTimer) {
      clearTimeout(blurHideTimer);
      blurHideTimer = null;
    }
    if (pendingResizeTimer) {
      clearTimeout(pendingResizeTimer);
      pendingResizeTimer = null;
    }
    pendingResizeHeight = null;
    chatWindow = null;
  });

  void win.loadURL(quickUrl);
  chatWindow = win;
  return win;
}

function showChatWindowAt(x: number, y: number): void {
  if (blurHideTimer) {
    clearTimeout(blurHideTimer);
    blurHideTimer = null;
  }
  prepareQuickOverlayPolicy();
  const win = createChatWindow();
  applyAlwaysOnTopAndWorkspaces(win);
  win.setBounds({ x, y, width: CHAT_WIDTH, height: currentChatHeight }, false);
  lastShownAt = Date.now();
  win.show();
  win.moveTop();
  win.focus();
  win.webContents.focus();
}

export function hideChatWindow(): void {
  if (blurHideTimer) {
    clearTimeout(blurHideTimer);
    blurHideTimer = null;
  }
  const win = getChatWindow();
  if (!win || !win.isVisible()) return;
  lastHiddenAt = Date.now();
  win.hide();
}

export function showChatWindowAtCursorDisplay(): void {
  anchorBottomOnResize = false;
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const pos = computeShortcutWindowPosition(display.workArea, CHAT_WIDTH, currentChatHeight);
  showChatWindowAt(pos.x, pos.y);
}

export function toggleChatWindowAtCursor(): void {
  const win = getChatWindow();
  if (win && win.isVisible()) {
    hideChatWindow();
    return;
  }
  showChatWindowAtCursorDisplay();
}

export function toggleChatWindowFromTray(trayBounds: Rectangle): void {
  const win = getChatWindow();
  if (win && win.isVisible()) {
    hideChatWindow();
    return;
  }
  // Prevent immediate re-open when clicking the tray icon triggered blur-hide milliseconds earlier
  if (Date.now() - lastHiddenAt < 250) {
    return;
  }
  const display =
    trayBounds.width > 0 && trayBounds.height > 0
      ? screen.getDisplayMatching(trayBounds)
      : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const pos = computeTrayWindowPosition(
    trayBounds,
    display.workArea,
    CHAT_WIDTH,
    currentChatHeight,
    process.platform
  );
  anchorBottomOnResize = process.platform !== 'darwin' && pos.y < trayBounds.y;
  showChatWindowAt(pos.x, pos.y);
}

export function repositionChatWindowIfVisible(): void {
  const win = getChatWindow();
  if (!win || !win.isVisible()) return;
  const bounds = win.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const clamped = clampToWorkArea(bounds.x, bounds.y, bounds.width, bounds.height, display.workArea);
  win.setPosition(clamped.x, clamped.y, false);
}

export function reloadQuickPage(): void {
  const win = getChatWindow();
  if (!win) return;
  void win.loadURL(getGradelysQuickUrl());
}

