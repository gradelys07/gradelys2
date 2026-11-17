import { app, BrowserWindow, Menu, nativeImage, session } from 'electron';
import { join } from 'path';
import log from 'electron-log/main';
import {
  shouldSwitchToAccessoryOnMainHide,
  shouldUseAccessoryForQuickOverlay,
} from '../../shared/windowPolicy';
import {
  attachChatWindowSecurity,
  configureSessionSecurity,
  getGradelysBaseUrl,
} from './security';

let mainWindow: BrowserWindow | null = null;
let isAppQuitting = false;
let isExplicitlyHidden = false;
let currentActivationPolicy: 'regular' | 'accessory' = 'regular';

export function markAppQuitting(): void {
  isAppQuitting = true;
}

export function getAppIconPath(): string {
  const base = app.isPackaged ? join(process.resourcesPath, 'build') : join(app.getAppPath(), 'build');
  return join(base, 'icon.png');
}

function sanitizeMainSubPath(subPath?: string): string {
  if (typeof subPath === 'string' && /^\/chat(?:\/[a-zA-Z0-9_-]+)?$/.test(subPath)) {
    return subPath;
  }
  return '/chat';
}

function getMainAppUrl(subPath?: string): string {
  return `${getGradelysBaseUrl()}${sanitizeMainSubPath(subPath)}`;
}

function loadOfflineFallback(win: BrowserWindow, retryUrl: string): void {
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    const target = `${devUrl}/offline/index.html?retryUrl=${encodeURIComponent(retryUrl)}`;
    void win.loadURL(target);
    return;
  }
  void win.loadFile(join(__dirname, '../renderer/offline/index.html'), {
    query: { retryUrl },
  });
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function setMacActivationPolicy(next: 'regular' | 'accessory'): void {
  if (process.platform !== 'darwin' || currentActivationPolicy === next) {
    return;
  }
  currentActivationPolicy = next;
  app.setActivationPolicy(next);
  if (next === 'regular') {
    const dockIcon = nativeImage.createFromPath(getAppIconPath());
    if (!dockIcon.isEmpty()) {
      app.dock?.setIcon(dockIcon);
    }
    void app.dock?.show();
  } else {
    app.dock?.hide();
  }
}

export function restoreRegularDockPolicy(): void {
  setMacActivationPolicy('regular');
}

export function prepareQuickOverlayPolicy(): void {
  const win = getMainWindow();
  if (
    shouldUseAccessoryForQuickOverlay({
      platform: process.platform,
      hasMainWindow: Boolean(win),
      isMainVisible: win ? win.isVisible() : false,
      isMainMinimized: win ? win.isMinimized() : false,
    })
  ) {
    setMacActivationPolicy('accessory');
  }
}

export function createMainWindow(subPath?: string): BrowserWindow {
  const existing = getMainWindow();
  if (existing) return existing;

  const baseOrigin = getGradelysBaseUrl();
  const appUrl = getMainAppUrl(subPath);
  const sharedSession = session.fromPartition('persist:gradelys');
  configureSessionSecurity(sharedSession);

  const icon = nativeImage.createFromPath(getAppIconPath());

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 620,
    fullscreenable: true,
    title: 'Gradelys',
    icon: icon.isEmpty() ? undefined : icon,
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: join(__dirname, '../preload/chat.js'),
      session: sharedSession,
    },
  });

  attachChatWindowSecurity(win, baseOrigin);

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      isExplicitlyHidden = false;
      restoreRegularDockPolicy();
      win.show();
      win.focus();
    }
  });

  win.webContents.on(
    'did-fail-load',
    (_event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      if (validatedURL.startsWith('file://') || validatedURL.includes('/offline/index.html')) return;
      log.warn(`Main window failed to load (code=${errorCode}), showing offline page`);
      loadOfflineFallback(win, appUrl);
    }
  );

  // Keep background assistant & tray running when user closes the main window
  win.on('close', (event) => {
    if (!isAppQuitting) {
      event.preventDefault();
      isExplicitlyHidden = true;
      if (process.platform === 'darwin' && win.isFullScreen()) {
        win.once('leave-full-screen', () => {
          if (!isAppQuitting && isExplicitlyHidden && !win.isDestroyed()) {
            win.hide();
            setMacActivationPolicy('accessory');
          }
        });
        win.setFullScreen(false);
        return;
      }
      win.hide();
      setMacActivationPolicy('accessory');
    }
  });

  win.on('show', () => {
    isExplicitlyHidden = false;
    restoreRegularDockPolicy();
  });

  win.on('focus', () => {
    isExplicitlyHidden = false;
    restoreRegularDockPolicy();
  });

  win.on('enter-full-screen', () => {
    isExplicitlyHidden = false;
    restoreRegularDockPolicy();
  });

  win.on('leave-full-screen', () => {
    if (!isExplicitlyHidden) {
      restoreRegularDockPolicy();
    }
  });

  win.on('hide', () => {
    if (
      shouldSwitchToAccessoryOnMainHide({
        platform: process.platform,
        isAppQuitting,
        isExplicitlyHidden,
        isVisible: win.isVisible(),
        isFullScreen: win.isFullScreen(),
      })
    ) {
      setMacActivationPolicy('accessory');
    }
  });

  win.on('closed', () => {
    isExplicitlyHidden = false;
    mainWindow = null;
  });

  mainWindow = win;
  void win.loadURL(appUrl);
  return win;
}

export function showMainWindow(subPath?: string): void {
  isExplicitlyHidden = false;
  restoreRegularDockPolicy();
  const sanitized = subPath ? sanitizeMainSubPath(subPath) : null;
  const existing = getMainWindow();
  const win = existing ?? createMainWindow(sanitized ?? undefined);
  if (existing && sanitized) {
    const targetUrl = getMainAppUrl(sanitized);
    if (existing.webContents.getURL() !== targetUrl) {
      void existing.loadURL(targetUrl);
    }
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
}

export function installApplicationMenu(handlers: {
  shortcut: string;
  onOpenQuickAssistant: () => void;
  onOpenMainWindow: () => void;
}): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'Gradelys',
            submenu: [
              { label: 'À propos de Gradelys', role: 'about' as const },
              { type: 'separator' as const },
              {
                label: "Ouvrir l'assistant rapide (voir l'écran)",
                accelerator: handlers.shortcut,
                click: () => handlers.onOpenQuickAssistant(),
              },
              { type: 'separator' as const },
              { label: 'Masquer Gradelys', role: 'hide' as const },
              { label: 'Masquer les autres', role: 'hideOthers' as const },
              { label: 'Tout afficher', role: 'unhide' as const },
              { type: 'separator' as const },
              {
                label: 'Quitter Gradelys',
                accelerator: 'Command+Q',
                click: () => app.quit(),
              },
            ],
          },
        ]
      : []),
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', role: 'undo' },
        { label: 'Rétablir', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', role: 'cut' },
        { label: 'Copier', role: 'copy' },
        { label: 'Coller', role: 'paste' },
        { label: 'Tout sélectionner', role: 'selectAll' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Recharger', role: 'reload' },
        { label: 'Actualiser complètement', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Taille réelle', role: 'resetZoom' },
        { label: 'Zoom avant', role: 'zoomIn' },
        { label: 'Zoom arrière', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Plein écran', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Fenêtre',
      submenu: [
        {
          label: 'Fenêtre principale Gradelys',
          click: () => handlers.onOpenMainWindow(),
        },
        {
          label: "Assistant rapide (voir l'écran)",
          click: () => handlers.onOpenQuickAssistant(),
        },
        { type: 'separator' },
        { label: 'Réduire', role: 'minimize' },
        { label: 'Fermer la fenêtre', role: 'close' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

