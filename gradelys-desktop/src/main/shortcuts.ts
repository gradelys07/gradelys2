import { globalShortcut, Notification } from 'electron';
import log from 'electron-log/main';

let activeMainShortcut: string | null = null;
let escapeRegistered = false;

export function registerMainShortcut(
  shortcut: string,
  onTrigger: () => void,
  onFailure?: (shortcut: string) => void
): boolean {
  if (activeMainShortcut) {
    try {
      globalShortcut.unregister(activeMainShortcut);
    } catch {
      // Ignore if already unregistered
    }
    activeMainShortcut = null;
  }

  let registered = false;
  try {
    registered = globalShortcut.register(shortcut, onTrigger);
  } catch (err) {
    log.warn(`Error registering shortcut ${shortcut}:`, err instanceof Error ? err.message : String(err));
    registered = false;
  }

  if (registered) {
    activeMainShortcut = shortcut;
    log.info(`Registered global shortcut: ${shortcut}`);
    return true;
  }

  log.warn(`Global shortcut already in use or unavailable: ${shortcut}`);
  if (Notification.isSupported()) {
    new Notification({
      title: 'Gradelys — Raccourci déjà utilisé',
      body: `Le raccourci ${shortcut} est déjà utilisé par une autre application. Choisis-en un autre dans le menu Gradelys.`,
    }).show();
  }
  onFailure?.(shortcut);
  return false;
}

export function registerTemporaryEscapeShortcut(onEscape: () => void): void {
  if (escapeRegistered) return;
  try {
    const ok = globalShortcut.register('Escape', onEscape);
    if (ok) {
      escapeRegistered = true;
    }
  } catch (err) {
    log.warn('Failed to register temporary Escape shortcut:', err instanceof Error ? err.message : String(err));
  }
}

export function unregisterTemporaryEscapeShortcut(): void {
  if (!escapeRegistered) return;
  try {
    globalShortcut.unregister('Escape');
  } catch {
    // Ignore
  }
  escapeRegistered = false;
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
  activeMainShortcut = null;
  escapeRegistered = false;
}

