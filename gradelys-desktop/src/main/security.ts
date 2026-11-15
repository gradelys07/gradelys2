import {
  app,
  shell,
  systemPreferences,
  type BrowserWindow,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type Session,
} from 'electron';
import log from 'electron-log/main';
import {
  isSafeExternalHttpsUrl,
  isTrustedEmbedUrl,
  isTrustedOrigin,
  isTrustedRendererUrl,
  normalizeBaseUrl,
} from '../../shared/securityValidation';

const ALLOWED_PERMISSIONS = new Set(['clipboard-sanitized-write', 'notifications']);

export function getGradelysBaseUrl(): string {
  return normalizeBaseUrl(process.env.GRADELYS_BASE_URL, app.isPackaged);
}

export function getGradelysQuickUrl(): string {
  return `${getGradelysBaseUrl()}/quick`;
}

export function validateChatIpcSender(
  event: IpcMainInvokeEvent | IpcMainEvent,
  baseOrigin: string
): boolean {
  const frameUrl = event.senderFrame?.url;
  const ok = isTrustedRendererUrl(frameUrl, baseOrigin);
  if (!ok) {
    log.warn('Blocked IPC call from untrusted sender origin:', frameUrl || 'unknown');
  }
  return ok;
}

export function validateOnboardingIpcSender(
  event: IpcMainInvokeEvent | IpcMainEvent,
  expectedUrl: string
): boolean {
  const frameUrl = event.senderFrame?.url;
  if (!frameUrl) return false;
  try {
    const parsedFrame = new URL(frameUrl);
    const parsedExpected = new URL(expectedUrl);
    if (parsedExpected.protocol === 'file:') {
      return parsedFrame.protocol === 'file:' && parsedFrame.pathname === parsedExpected.pathname;
    }
    return parsedFrame.origin === parsedExpected.origin && parsedFrame.pathname === parsedExpected.pathname;
  } catch {
    return false;
  }
}

export function configureSessionSecurity(ses: Session): void {
  const baseOrigin = getGradelysBaseUrl();
  const desktopToken = `GradelysDesktop/${app.getVersion()}`;
  const currentUa = ses.getUserAgent();
  if (!currentUa.includes('GradelysDesktop/')) {
    ses.setUserAgent(`${currentUa} ${desktopToken}`);
  }

  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (ALLOWED_PERMISSIONS.has(permission)) {
      callback(true);
      return;
    }

    if (permission === 'media') {
      const mediaDetails = details as Electron.MediaAccessPermissionRequest;
      const originCandidate = mediaDetails.securityOrigin || webContents.getURL();
      const mediaTypes = mediaDetails.mediaTypes;
      const audioOnly =
        !mediaTypes || (mediaTypes.length > 0 && mediaTypes.every((kind) => kind === 'audio'));

      if (!audioOnly || !isTrustedOrigin(originCandidate, baseOrigin)) {
        callback(false);
        return;
      }

      if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('microphone');
        if (status === 'granted') {
          callback(true);
          return;
        }
        if (status === 'not-determined') {
          void systemPreferences
            .askForMediaAccess('microphone')
            .then((granted) => callback(granted))
            .catch(() => callback(false));
          return;
        }
        callback(false);
        return;
      }

      callback(true);
      return;
    }

    callback(false);
  });

  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (ALLOWED_PERMISSIONS.has(permission)) {
      return true;
    }

    if (permission === 'media') {
      const originCandidate = details.securityOrigin || requestingOrigin || webContents?.getURL() || '';
      const audioOnly = !details.mediaType || details.mediaType === 'audio';
      if (!audioOnly || !isTrustedOrigin(originCandidate, baseOrigin)) {
        return false;
      }
      if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('microphone');
        return status === 'granted' || status === 'not-determined';
      }
      return true;
    }

    return false;
  });
}

export function attachChatWindowSecurity(win: BrowserWindow, baseOrigin: string): void {
  const wc = win.webContents;

  wc.on('will-navigate', (event, url) => {
    if (isTrustedOrigin(url, baseOrigin)) {
      return;
    }
    event.preventDefault();
    if (isSafeExternalHttpsUrl(url)) {
      void shell.openExternal(url);
    } else {
      log.warn('Blocked unsafe navigation attempt:', url);
    }
  });

  wc.on('will-frame-navigate', (details) => {
    const allowed = details.isMainFrame
      ? isTrustedOrigin(details.url, baseOrigin)
      : isTrustedEmbedUrl(details.url, baseOrigin);
    if (allowed) {
      return;
    }
    details.preventDefault();
    log.warn('Blocked untrusted frame navigation attempt:', details.url);
  });

  wc.setWindowOpenHandler((details) => {
    if (isSafeExternalHttpsUrl(details.url)) {
      void shell.openExternal(details.url);
    } else {
      log.warn('Blocked window.open for non-HTTPS URL:', details.url);
    }
    return { action: 'deny' };
  });

  wc.on('will-attach-webview', (event) => {
    event.preventDefault();
    log.warn('Blocked webview attachment attempt in chat window');
  });
}

export function attachLocalWindowSecurity(win: BrowserWindow, allowedUrl: string): void {
  const wc = win.webContents;

  wc.on('will-navigate', (event, url) => {
    if (url === allowedUrl) return;
    event.preventDefault();
    if (isSafeExternalHttpsUrl(url)) {
      void shell.openExternal(url);
    }
  });

  wc.setWindowOpenHandler(() => ({ action: 'deny' }));

  wc.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
}

