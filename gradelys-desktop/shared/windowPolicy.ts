/**
 * Pure macOS Dock / activation-policy decision helpers for Electron windows.
 * Kept free of Electron imports so they can run in both main process and Vitest.
 */

export interface MainWindowHideState {
  platform: NodeJS.Platform;
  isAppQuitting: boolean;
  isExplicitlyHidden: boolean;
  isVisible: boolean;
  isFullScreen: boolean;
}

export interface QuickOverlayPolicyState {
  platform: NodeJS.Platform;
  hasMainWindow: boolean;
  isMainVisible: boolean;
  isMainMinimized: boolean;
}

/**
 * macOS emits spurious `hide` events on NSWindow during native Fullscreen Space animations
 * while the window actually remains visible/fullscreen. Switching to `accessory` then makes
 * the app vanish from Dock/Spaces. Only switch to `accessory` when genuinely hidden.
 */
export function shouldSwitchToAccessoryOnMainHide(state: MainWindowHideState): boolean {
  if (state.platform !== 'darwin' || state.isAppQuitting) {
    return false;
  }
  if (state.isExplicitlyHidden) {
    return true;
  }
  return !state.isVisible && !state.isFullScreen;
}

/**
 * Only drop to `accessory` mode for `/quick` when the main window is closed-to-tray or
 * minimized; keeping `regular` while open preserves Dock, menu bar, and Fullscreen Spaces.
 */
export function shouldUseAccessoryForQuickOverlay(state: QuickOverlayPolicyState): boolean {
  if (state.platform !== 'darwin') {
    return false;
  }
  if (!state.hasMainWindow) {
    return true;
  }
  return !state.isMainVisible || state.isMainMinimized;
}

