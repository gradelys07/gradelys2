import { app, dialog, Menu, nativeImage, Tray, type Rectangle } from 'electron';
import { join } from 'path';
import log from 'electron-log/main';
import {
  FALLBACK_SHORTCUTS,
  getSettings,
  setAskBeforeCapture,
  setLaunchAtLogin,
  setShortcut,
} from './settings';

let tray: Tray | null = null;
let cachedHandlers: TrayHandlers | null = null;

export interface TrayHandlers {
  onToggleFromTray: (bounds: Rectangle) => void;
  onOpenFromMenu: () => void;
  onOpenMainWindow: () => void;
  onShortcutChanged: (shortcut: string) => void;
  onCheckForUpdates: () => void;
}

function getBuildAssetPath(filename: string): string {
  const base = app.isPackaged ? join(process.resourcesPath, 'build') : join(app.getAppPath(), 'build');
  return join(base, filename);
}

function createTrayImage(): Electron.NativeImage {
  if (process.platform === 'darwin') {
    const iconPath = getBuildAssetPath('trayTemplate.png');
    const img = nativeImage.createFromPath(iconPath);
    img.setTemplateImage(true);
    return img;
  }
  const winIconPath = getBuildAssetPath('tray.ico');
  return nativeImage.createFromPath(winIconPath);
}

function buildContextMenu(handlers: TrayHandlers): Menu {
  const settings = getSettings();

  return Menu.buildFromTemplate([
    {
      label: 'Ouvrir Gradelys (application complète)',
      click: () => handlers.onOpenMainWindow(),
    },
    {
      label: "Ouvrir l'assistant rapide (voir l'écran)",
      accelerator: settings.shortcut,
      registerAccelerator: false,
      click: () => handlers.onOpenFromMenu(),
    },
    { type: 'separator' },
    {
      label: 'Toujours demander avant de regarder mon écran',
      type: 'checkbox',
      checked: settings.askBeforeCapture,
      click: (item) => {
        setAskBeforeCapture(item.checked);
        rebuildTrayMenu();
      },
    },
    {
      label: 'Lancer au démarrage',
      type: 'checkbox',
      checked: settings.launchAtLogin,
      click: (item) => {
        setLaunchAtLogin(item.checked);
        rebuildTrayMenu();
      },
    },
    {
      label: 'Raccourci clavier',
      submenu: FALLBACK_SHORTCUTS.map((sc) => ({
        label: sc.replace('CommandOrControl', process.platform === 'darwin' ? 'Cmd' : 'Ctrl'),
        type: 'radio' as const,
        checked: settings.shortcut === sc,
        click: () => {
          setShortcut(sc);
          handlers.onShortcutChanged(sc);
          rebuildTrayMenu();
        },
      })),
    },
    { type: 'separator' },
    {
      label: 'Rechercher les mises à jour',
      click: () => handlers.onCheckForUpdates(),
    },
    {
      label: 'À propos / Version',
      click: () => {
        void dialog.showMessageBox({
          type: 'info',
          title: 'À propos de Gradelys',
          message: 'Gradelys Desktop',
          detail: `Version ${app.getVersion()}\nPlateforme : ${
            process.platform === 'darwin' ? 'macOS' : 'Windows'
          } (${process.arch})\n\nAssistant d'étude rapide Gradelys.`,
          buttons: ['OK'],
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quitter Gradelys',
      click: () => app.quit(),
    },
  ]);
}

export function createTray(handlers: TrayHandlers): Tray {
  cachedHandlers = handlers;
  if (tray && !tray.isDestroyed()) {
    return tray;
  }

  const image = createTrayImage();
  if (image.isEmpty()) {
    log.warn('Tray icon image loaded empty; check build/ tray assets');
  }

  tray = new Tray(image);
  tray.setToolTip('Gradelys');

  tray.on('click', (event, bounds) => {
    if (event.ctrlKey && process.platform === 'darwin') {
      tray?.popUpContextMenu(buildContextMenu(handlers));
      return;
    }
    handlers.onToggleFromTray(bounds);
  });

  tray.on('right-click', () => {
    tray?.popUpContextMenu(buildContextMenu(handlers));
  });

  return tray;
}

export function rebuildTrayMenu(): void {
  if (!tray || tray.isDestroyed() || !cachedHandlers) return;
  // Menu is built dynamically on popUpContextMenu; kept as explicit hook for state sync.
}

export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
  }
  tray = null;
}

