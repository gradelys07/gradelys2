import { app, BrowserWindow, desktopCapturer, shell, systemPreferences } from 'electron';
import { join } from 'path';
import log from 'electron-log/main';
import { attachLocalWindowSecurity } from './security';

let onboardingWindow: BrowserWindow | null = null;

export function hasScreenCapturePermission(): boolean {
  if (process.platform !== 'darwin') {
    return true;
  }
  return systemPreferences.getMediaAccessStatus('screen') === 'granted';
}

export async function openMacScreenPrivacySettings(): Promise<void> {
  if (process.platform !== 'darwin') return;
  await shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
  );
}

export async function triggerMacScreenPermissionPrompt(): Promise<boolean> {
  if (process.platform !== 'darwin') return true;
  try {
    await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1, height: 1 },
    });
  } catch (err) {
    log.warn('Test screen capture prompt failed:', err instanceof Error ? err.message : String(err));
  }
  return hasScreenCapturePermission();
}

export function getOnboardingUrl(): string {
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    return `${devUrl}/onboarding/index.html`;
  }
  return `file://${join(__dirname, '../renderer/onboarding/index.html')}`;
}

export function closeOnboardingWindow(): void {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.close();
  }
  onboardingWindow = null;
}

export function showOnboardingWindow(): BrowserWindow | null {
  if (process.platform !== 'darwin') return null;

  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.show();
    onboardingWindow.focus();
    return onboardingWindow;
  }

  const targetUrl = getOnboardingUrl();

  const win = new BrowserWindow({
    width: 480,
    height: 540,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Autoriser la capture — Gradelys',
    backgroundColor: '#ffffff',
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: join(__dirname, '../preload/onboarding.js'),
    },
  });

  attachLocalWindowSecurity(win, targetUrl);

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  win.on('closed', () => {
    onboardingWindow = null;
  });

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    void win.loadURL(targetUrl);
  } else {
    void win.loadFile(join(__dirname, '../renderer/onboarding/index.html'));
  }

  onboardingWindow = win;
  return win;
}

export function checkMacPermissionOnLaunch(): void {
  if (process.platform !== 'darwin') return;
  if (!hasScreenCapturePermission()) {
    log.info('macOS screen capture permission not granted yet; showing onboarding');
    void triggerMacScreenPermissionPrompt().then((granted) => {
      if (!granted) {
        showOnboardingWindow();
      }
    });
  }
}

