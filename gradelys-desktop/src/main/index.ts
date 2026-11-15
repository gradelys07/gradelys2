import { app, nativeImage, screen, session } from 'electron';
import log from 'electron-log/main';
import {
  createChatWindow,
  hideChatWindow,
  repositionChatWindowIfVisible,
  setChatEscapeHandler,
  showChatWindowAtCursorDisplay,
  toggleChatWindowAtCursor,
  toggleChatWindowFromTray,
} from './chatWindow';
import { registerIpcHandlers } from './ipc';
import {
  createMainWindow,
  getAppIconPath,
  installApplicationMenu,
  markAppQuitting,
  showMainWindow,
} from './mainWindow';
import { clearAllOverlays, destroyAllOverlays, isOverlayActive } from './overlayWindow';
import { checkMacPermissionOnLaunch } from './permissions';
import { cancelDesktopGoogleOAuth } from './oauth';
import { configureSessionSecurity } from './security';
import { getSettings, syncLaunchAtLoginOnBoot } from './settings';
import { registerMainShortcut, unregisterAllShortcuts } from './shortcuts';
import { createTray, destroyTray } from './tray';
import { checkForUpdatesManually, setupAutoUpdater, stopAutoUpdater } from './updater';

log.initialize();
log.transports.file.level = 'info';

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.on('activate', () => {
    showMainWindow();
  });

  // Keep background tray & global shortcut active when windows are closed.
  app.on('window-all-closed', () => {
    // Intentionally kept alive in tray until explicit quit.
  });

  app.on('before-quit', () => {
    markAppQuitting();
    cancelDesktopGoogleOAuth();
    destroyAllOverlays();
    stopAutoUpdater();
  });

  app.on('will-quit', () => {
    unregisterAllShortcuts();
    destroyTray();
  });

  void app.whenReady().then(() => {
    configureSessionSecurity(session.defaultSession);
    syncLaunchAtLoginOnBoot();
    registerIpcHandlers();

    if (process.platform === 'darwin' && app.dock) {
      const dockIcon = nativeImage.createFromPath(getAppIconPath());
      if (!dockIcon.isEmpty()) {
        app.dock.setIcon(dockIcon);
      }
    }

    setChatEscapeHandler(() => {
      if (isOverlayActive()) {
        clearAllOverlays();
      } else {
        hideChatWindow();
      }
    });

    createMainWindow();
    createChatWindow();

    const bindShortcut = (shortcut: string): void => {
      registerMainShortcut(shortcut, () => {
        toggleChatWindowAtCursor();
      });
      installApplicationMenu({
        shortcut,
        onOpenQuickAssistant: () => showChatWindowAtCursorDisplay(),
        onOpenMainWindow: () => showMainWindow(),
      });
    };

    createTray({
      onToggleFromTray: (bounds) => toggleChatWindowFromTray(bounds),
      onOpenFromMenu: () => showChatWindowAtCursorDisplay(),
      onOpenMainWindow: () => showMainWindow(),
      onShortcutChanged: (shortcut) => bindShortcut(shortcut),
      onCheckForUpdates: () => checkForUpdatesManually(),
    });

    bindShortcut(getSettings().shortcut);
    checkMacPermissionOnLaunch();
    setupAutoUpdater();

    const handleDisplayChange = (): void => {
      destroyAllOverlays();
      repositionChatWindowIfVisible();
    };

    screen.on('display-added', handleDisplayChange);
    screen.on('display-removed', handleDisplayChange);
    screen.on('display-metrics-changed', handleDisplayChange);

    log.info(`Gradelys Desktop ready (${process.platform}/${process.arch})`);
  });
}
