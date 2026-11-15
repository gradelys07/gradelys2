export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DrawCommand =
  | { type: 'circle'; at: Point; radius?: number }
  | { type: 'rect'; from: Point; to: Point }
  | { type: 'arrow'; from: Point; to: Point }
  | { type: 'highlight'; from: Point; to: Point }
  | { type: 'text'; at: Point; text: string }
  | { type: 'step'; n: number; label?: string }
  | { type: 'clear' };

export interface CaptureResult {
  imageBase64: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  displayId: number;
  displayBounds: Rect;
  scaleFactor: number;
}

export type CaptureErrorCode = 'denied' | 'permission' | 'failed';

export interface CaptureError {
  error: CaptureErrorCode;
}

export type CaptureResponse = CaptureResult | CaptureError;

export type CaptureState = 'asking' | 'capturing' | 'done';

export type GoogleOAuthResult =
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; cancelled?: boolean; error: string };

export interface PublicDesktopSettings {
  askBeforeCapture: boolean;
  shortcut: string;
}

export interface DesktopSettings extends PublicDesktopSettings {
  launchAtLogin: boolean;
}

export interface GradelysDesktopAPI {
  isDesktop: true;
  platform: 'darwin' | 'win32';
  version: string;
  captureScreen: () => Promise<CaptureResponse>;
  drawOverlay: (commands: DrawCommand[], displayId: number, displayBounds: Rect) => Promise<void>;
  clearOverlay: () => Promise<void>;
  onCaptureState: (cb: (state: CaptureState) => void) => () => void;
  onOverlayState: (cb: (active: boolean) => void) => () => void;
  setPinned: (pinned: boolean) => void;
  hideWindow: () => void;
  openQuickAssistant: () => void;
  openMainApp: (subPath?: string) => void;
  setWindowHeight: (height: number) => void;
  getSettings: () => Promise<PublicDesktopSettings>;
  setAskBeforeCapture: (ask: boolean) => Promise<void>;
  startGoogleOAuth: () => Promise<GoogleOAuthResult>;
  cancelGoogleOAuth: () => void;
  notifyAuthChanged: () => void;
  onAuthChanged: (cb: () => void) => () => void;
}

export interface OverlayPreloadAPI {
  onRenderCommands: (cb: (payload: { commands: DrawCommand[]; displayBounds: Rect }) => void) => () => void;
  onClear: (cb: () => void) => () => void;
}

export interface OnboardingPreloadAPI {
  openScreenPermissionSettings: () => Promise<void>;
  triggerPermissionPrompt: () => Promise<boolean>;
  relaunchApp: () => Promise<void>;
  closeWindow: () => void;
}

export const IPC_CHANNELS = {
  CAPTURE_SCREEN: 'gradelys:capture-screen',
  DRAW_OVERLAY: 'gradelys:draw-overlay',
  CLEAR_OVERLAY: 'gradelys:clear-overlay',
  CAPTURE_STATE: 'gradelys:capture-state',
  OVERLAY_STATE: 'gradelys:overlay-state',
  SET_PINNED: 'chat:set-pinned',
  HIDE_WINDOW: 'chat:hide-window',
  OPEN_QUICK_ASSISTANT: 'chat:open-quick',
  OPEN_MAIN_APP: 'chat:open-main',
  RESIZE_WINDOW: 'chat:resize-height',
  GET_SETTINGS: 'gradelys:get-settings',
  SET_ASK_BEFORE_CAPTURE: 'gradelys:set-ask-before-capture',
  START_GOOGLE_OAUTH: 'gradelys:start-google-oauth',
  CANCEL_GOOGLE_OAUTH: 'gradelys:cancel-google-oauth',
  NOTIFY_AUTH_CHANGED: 'gradelys:notify-auth-changed',
  AUTH_CHANGED: 'gradelys:auth-changed',
  OVERLAY_RENDER: 'overlay:render-commands',
  OVERLAY_CLEAR: 'overlay:clear',
  ONBOARDING_OPEN_SETTINGS: 'onboarding:open-settings',
  ONBOARDING_TRIGGER_PROMPT: 'onboarding:trigger-prompt',
  ONBOARDING_RELAUNCH: 'onboarding:relaunch',
  ONBOARDING_CLOSE: 'onboarding:close',
} as const;

