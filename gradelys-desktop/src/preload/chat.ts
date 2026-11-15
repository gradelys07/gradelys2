import { contextBridge, ipcRenderer } from 'electron';
import type {
  CaptureResponse,
  CaptureState,
  DrawCommand,
  GoogleOAuthResult,
  GradelysDesktopAPI,
  IPC_CHANNELS,
  PublicDesktopSettings,
  Rect,
} from '../../shared/types';

declare const __APP_VERSION__: string;

const CHANNELS = {
  CAPTURE_SCREEN: 'gradelys:capture-screen' satisfies typeof IPC_CHANNELS.CAPTURE_SCREEN,
  DRAW_OVERLAY: 'gradelys:draw-overlay' satisfies typeof IPC_CHANNELS.DRAW_OVERLAY,
  CLEAR_OVERLAY: 'gradelys:clear-overlay' satisfies typeof IPC_CHANNELS.CLEAR_OVERLAY,
  CAPTURE_STATE: 'gradelys:capture-state' satisfies typeof IPC_CHANNELS.CAPTURE_STATE,
  OVERLAY_STATE: 'gradelys:overlay-state' satisfies typeof IPC_CHANNELS.OVERLAY_STATE,
  SET_PINNED: 'chat:set-pinned' satisfies typeof IPC_CHANNELS.SET_PINNED,
  HIDE_WINDOW: 'chat:hide-window' satisfies typeof IPC_CHANNELS.HIDE_WINDOW,
  OPEN_QUICK_ASSISTANT: 'chat:open-quick' satisfies typeof IPC_CHANNELS.OPEN_QUICK_ASSISTANT,
  OPEN_MAIN_APP: 'chat:open-main' satisfies typeof IPC_CHANNELS.OPEN_MAIN_APP,
  RESIZE_WINDOW: 'chat:resize-height' satisfies typeof IPC_CHANNELS.RESIZE_WINDOW,
  GET_SETTINGS: 'gradelys:get-settings' satisfies typeof IPC_CHANNELS.GET_SETTINGS,
  SET_ASK_BEFORE_CAPTURE:
    'gradelys:set-ask-before-capture' satisfies typeof IPC_CHANNELS.SET_ASK_BEFORE_CAPTURE,
  START_GOOGLE_OAUTH:
    'gradelys:start-google-oauth' satisfies typeof IPC_CHANNELS.START_GOOGLE_OAUTH,
  CANCEL_GOOGLE_OAUTH:
    'gradelys:cancel-google-oauth' satisfies typeof IPC_CHANNELS.CANCEL_GOOGLE_OAUTH,
  NOTIFY_AUTH_CHANGED:
    'gradelys:notify-auth-changed' satisfies typeof IPC_CHANNELS.NOTIFY_AUTH_CHANGED,
  AUTH_CHANGED: 'gradelys:auth-changed' satisfies typeof IPC_CHANNELS.AUTH_CHANGED,
} as const;

const platform: 'darwin' | 'win32' = process.platform === 'darwin' ? 'darwin' : 'win32';
const version: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '1.0.0';

const api: GradelysDesktopAPI = {
  isDesktop: true,
  platform,
  version,
  captureScreen: (): Promise<CaptureResponse> => {
    return ipcRenderer.invoke(CHANNELS.CAPTURE_SCREEN);
  },
  drawOverlay: (commands: DrawCommand[], displayId: number, displayBounds: Rect): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.DRAW_OVERLAY, commands, displayId, displayBounds);
  },
  clearOverlay: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.CLEAR_OVERLAY);
  },
  onCaptureState: (cb: (state: CaptureState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: CaptureState): void => {
      cb(state);
    };
    ipcRenderer.on(CHANNELS.CAPTURE_STATE, listener);
    return () => {
      ipcRenderer.removeListener(CHANNELS.CAPTURE_STATE, listener);
    };
  },
  onOverlayState: (cb: (active: boolean) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, active: boolean): void => {
      cb(active);
    };
    ipcRenderer.on(CHANNELS.OVERLAY_STATE, listener);
    return () => {
      ipcRenderer.removeListener(CHANNELS.OVERLAY_STATE, listener);
    };
  },
  setPinned: (pinned: boolean): void => {
    ipcRenderer.send(CHANNELS.SET_PINNED, Boolean(pinned));
  },
  hideWindow: (): void => {
    ipcRenderer.send(CHANNELS.HIDE_WINDOW);
  },
  openQuickAssistant: (): void => {
    ipcRenderer.send(CHANNELS.OPEN_QUICK_ASSISTANT);
  },
  openMainApp: (subPath?: string): void => {
    ipcRenderer.send(CHANNELS.OPEN_MAIN_APP, typeof subPath === 'string' ? subPath : undefined);
  },
  setWindowHeight: (height: number): void => {
    ipcRenderer.send(CHANNELS.RESIZE_WINDOW, Number(height));
  },
  getSettings: (): Promise<PublicDesktopSettings> => {
    return ipcRenderer.invoke(CHANNELS.GET_SETTINGS);
  },
  setAskBeforeCapture: (ask: boolean): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.SET_ASK_BEFORE_CAPTURE, Boolean(ask));
  },
  startGoogleOAuth: (): Promise<GoogleOAuthResult> => {
    return ipcRenderer.invoke(CHANNELS.START_GOOGLE_OAUTH);
  },
  cancelGoogleOAuth: (): void => {
    ipcRenderer.send(CHANNELS.CANCEL_GOOGLE_OAUTH);
  },
  notifyAuthChanged: (): void => {
    ipcRenderer.send(CHANNELS.NOTIFY_AUTH_CHANGED);
  },
  onAuthChanged: (cb: () => void): (() => void) => {
    const listener = (): void => {
      cb();
    };
    ipcRenderer.on(CHANNELS.AUTH_CHANGED, listener);
    return () => {
      ipcRenderer.removeListener(CHANNELS.AUTH_CHANGED, listener);
    };
  },
};

contextBridge.exposeInMainWorld('gradelysDesktop', api);
