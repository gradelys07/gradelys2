import { app, BrowserWindow, ipcMain } from 'electron';
import {
  IPC_CHANNELS,
  type CaptureResponse,
  type DrawCommand,
  type GoogleOAuthResult,
  type PublicDesktopSettings,
  type Rect,
} from '../../shared/types';
import { isTrustedOrigin } from '../../shared/securityValidation';
import { handleCaptureRequest } from './capture';
import {
  getChatWindow,
  hideChatWindow,
  resizeChatWindowHeight,
  setChatPinned,
  showChatWindowAtCursorDisplay,
} from './chatWindow';
import { getMainWindow, showMainWindow } from './mainWindow';
import { cancelDesktopGoogleOAuth, startDesktopGoogleOAuth } from './oauth';
import { clearAllOverlays, drawOverlay } from './overlayWindow';
import {
  closeOnboardingWindow,
  getOnboardingUrl,
  openMacScreenPrivacySettings,
  triggerMacScreenPermissionPrompt,
} from './permissions';
import {
  getGradelysBaseUrl,
  validateChatIpcSender,
  validateOnboardingIpcSender,
} from './security';
import { getPublicSettings, setAskBeforeCapture } from './settings';
import { rebuildTrayMenu } from './tray';

function isValidRect(rect: unknown): rect is Rect {
  if (!rect || typeof rect !== 'object') return false;
  const r = rect as Record<string, unknown>;
  return (
    typeof r.x === 'number' &&
    Number.isFinite(r.x) &&
    typeof r.y === 'number' &&
    Number.isFinite(r.y) &&
    typeof r.width === 'number' &&
    Number.isFinite(r.width) &&
    r.width > 0 &&
    typeof r.height === 'number' &&
    Number.isFinite(r.height) &&
    r.height > 0
  );
}

export function registerIpcHandlers(): void {
  const baseOrigin = getGradelysBaseUrl();
  const onboardingUrl = getOnboardingUrl();

  ipcMain.handle(IPC_CHANNELS.CAPTURE_SCREEN, async (event): Promise<CaptureResponse> => {
    if (!validateChatIpcSender(event, baseOrigin)) {
      throw new Error('Unauthorized IPC sender');
    }
    return handleCaptureRequest();
  });

  ipcMain.handle(
    IPC_CHANNELS.DRAW_OVERLAY,
    async (event, commands: DrawCommand[], displayId: number, displayBounds: Rect): Promise<void> => {
      if (!validateChatIpcSender(event, baseOrigin)) {
        throw new Error('Unauthorized IPC sender');
      }
      if (typeof displayId !== 'number' || !Number.isFinite(displayId) || !isValidRect(displayBounds)) {
        throw new Error('Invalid display parameters');
      }
      await drawOverlay(commands, displayId, displayBounds);
    }
  );

  ipcMain.handle(IPC_CHANNELS.CLEAR_OVERLAY, async (event): Promise<void> => {
    if (!validateChatIpcSender(event, baseOrigin)) {
      throw new Error('Unauthorized IPC sender');
    }
    clearAllOverlays();
  });

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async (event): Promise<PublicDesktopSettings> => {
    if (!validateChatIpcSender(event, baseOrigin)) {
      throw new Error('Unauthorized IPC sender');
    }
    return getPublicSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SET_ASK_BEFORE_CAPTURE, async (event, ask: boolean): Promise<void> => {
    if (!validateChatIpcSender(event, baseOrigin)) {
      throw new Error('Unauthorized IPC sender');
    }
    setAskBeforeCapture(Boolean(ask));
    rebuildTrayMenu();
  });

  ipcMain.handle(IPC_CHANNELS.START_GOOGLE_OAUTH, async (event): Promise<GoogleOAuthResult> => {
    if (!validateChatIpcSender(event, baseOrigin)) {
      throw new Error('Unauthorized IPC sender');
    }
    const senderUrl = event.senderFrame?.url || '';
    const callerWc = event.sender;
    return startDesktopGoogleOAuth(senderUrl, () => {
      const chatWin = getChatWindow();
      if (chatWin && chatWin.webContents === callerWc) {
        showChatWindowAtCursorDisplay();
        if (process.platform === 'darwin') {
          app.focus({ steal: true });
        }
        return;
      }
      const mainWin = getMainWindow();
      if (mainWin && mainWin.webContents === callerWc) {
        showMainWindow();
        if (process.platform === 'darwin') {
          app.focus({ steal: true });
        }
      }
    });
  });

  ipcMain.on(IPC_CHANNELS.CANCEL_GOOGLE_OAUTH, (event) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    cancelDesktopGoogleOAuth();
  });

  ipcMain.on(IPC_CHANNELS.NOTIFY_AUTH_CHANGED, (event) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isDestroyed()) continue;
      const wc = win.webContents;
      if (wc === event.sender) continue;
      if (!isTrustedOrigin(wc.getURL(), baseOrigin)) continue;
      wc.send(IPC_CHANNELS.AUTH_CHANGED);
    }
  });

  ipcMain.on(IPC_CHANNELS.SET_PINNED, (event, pinned: boolean) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    setChatPinned(Boolean(pinned));
  });

  ipcMain.on(IPC_CHANNELS.HIDE_WINDOW, (event) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    hideChatWindow();
  });

  ipcMain.on(IPC_CHANNELS.OPEN_QUICK_ASSISTANT, (event) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    showChatWindowAtCursorDisplay();
  });

  ipcMain.on(IPC_CHANNELS.OPEN_MAIN_APP, (event, subPath?: unknown) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    showMainWindow(typeof subPath === 'string' ? subPath : undefined);
  });

  ipcMain.on(IPC_CHANNELS.RESIZE_WINDOW, (event, height: unknown) => {
    if (!validateChatIpcSender(event, baseOrigin)) return;
    if (typeof height === 'number' && Number.isFinite(height)) {
      resizeChatWindowHeight(height);
    }
  });

  // Onboarding window IPC (strictly scoped to local onboarding HTML)
  ipcMain.handle(IPC_CHANNELS.ONBOARDING_OPEN_SETTINGS, async (event) => {
    if (!validateOnboardingIpcSender(event, onboardingUrl)) {
      throw new Error('Unauthorized onboarding IPC sender');
    }
    await openMacScreenPrivacySettings();
  });

  ipcMain.handle(IPC_CHANNELS.ONBOARDING_TRIGGER_PROMPT, async (event): Promise<boolean> => {
    if (!validateOnboardingIpcSender(event, onboardingUrl)) {
      throw new Error('Unauthorized onboarding IPC sender');
    }
    return triggerMacScreenPermissionPrompt();
  });

  ipcMain.handle(IPC_CHANNELS.ONBOARDING_RELAUNCH, async (event) => {
    if (!validateOnboardingIpcSender(event, onboardingUrl)) {
      throw new Error('Unauthorized onboarding IPC sender');
    }
    app.relaunch();
    app.exit(0);
  });

  ipcMain.on(IPC_CHANNELS.ONBOARDING_CLOSE, (event) => {
    if (!validateOnboardingIpcSender(event, onboardingUrl)) return;
    closeOnboardingWindow();
  });
}

