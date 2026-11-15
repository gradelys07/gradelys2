import { app } from 'electron';
import Store from 'electron-store';
import log from 'electron-log/main';
import type { DesktopSettings, PublicDesktopSettings } from '../../shared/types';

export const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Space';

export const FALLBACK_SHORTCUTS = [
  'CommandOrControl+Shift+Space',
  'CommandOrControl+Alt+Space',
  'CommandOrControl+Shift+G',
  'Alt+Shift+Space',
] as const;

const store = new Store<DesktopSettings>({
  name: 'gradelys-settings',
  defaults: {
    askBeforeCapture: true,
    shortcut: DEFAULT_SHORTCUT,
    launchAtLogin: false,
  },
});

export function getSettings(): DesktopSettings {
  return {
    askBeforeCapture: Boolean(store.get('askBeforeCapture', true)),
    shortcut: String(store.get('shortcut', DEFAULT_SHORTCUT) || DEFAULT_SHORTCUT),
    launchAtLogin: Boolean(store.get('launchAtLogin', false)),
  };
}

export function getPublicSettings(): PublicDesktopSettings {
  const { askBeforeCapture, shortcut } = getSettings();
  return { askBeforeCapture, shortcut };
}

export function setAskBeforeCapture(askBeforeCapture: boolean): void {
  store.set('askBeforeCapture', Boolean(askBeforeCapture));
  log.info(`Setting updated: askBeforeCapture=${Boolean(askBeforeCapture)}`);
}

export function setShortcut(shortcut: string): void {
  const trimmed = shortcut.trim();
  if (!trimmed) return;
  store.set('shortcut', trimmed);
  log.info(`Setting updated: shortcut=${trimmed}`);
}

export function setLaunchAtLogin(launchAtLogin: boolean): void {
  const enabled = Boolean(launchAtLogin);
  store.set('launchAtLogin', enabled);
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true,
    });
    log.info(`Login item updated: openAtLogin=${enabled}`);
  } catch (err) {
    log.warn('Failed to update login item settings:', err instanceof Error ? err.message : String(err));
  }
}

export function syncLaunchAtLoginOnBoot(): void {
  const { launchAtLogin } = getSettings();
  try {
    const current = app.getLoginItemSettings();
    if (current.openAtLogin !== launchAtLogin) {
      app.setLoginItemSettings({
        openAtLogin: launchAtLogin,
        openAsHidden: true,
      });
    }
  } catch (err) {
    log.warn('Could not sync login item settings on boot:', err instanceof Error ? err.message : String(err));
  }
}

