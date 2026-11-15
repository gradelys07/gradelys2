import { desktopCapturer, screen, type NativeImage } from 'electron';
import log from 'electron-log/main';
import { CaptureRateLimiter } from '../../shared/captureRateLimit';
import type { CaptureResponse, CaptureResult } from '../../shared/types';
import {
  getChatWindow,
  sendCaptureState,
  setChatOpacity,
  setChatOperationActive,
} from './chatWindow';
import { hasScreenCapturePermission, showOnboardingWindow } from './permissions';

const TARGET_MAX_BYTES = 85 * 1024; // ~85 KB target to keep vision tokens/cost to fractions of a millicent
const HARD_MAX_BYTES = 160 * 1024;
const PRIMARY_MAX_SIDE = 1024;
const COMPACT_MAX_SIDE = 896;
const TINY_MAX_SIDE = 768;

const captureLimiter = new CaptureRateLimiter(3000, 30);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function fitDimensions(
  srcWidth: number,
  srcHeight: number,
  maxSide: number
): { width: number; height: number } {
  if (srcWidth <= maxSide && srcHeight <= maxSide) {
    return { width: Math.max(1, srcWidth), height: Math.max(1, srcHeight) };
  }
  const ratio = Math.min(maxSide / srcWidth, maxSide / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
  };
}

async function encodeWithSharp(
  pngBuffer: Buffer,
  srcWidth: number,
  srcHeight: number
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;

    const attempts: { maxSide: number; quality: number }[] = [
      { maxSide: PRIMARY_MAX_SIDE, quality: 58 },
      { maxSide: PRIMARY_MAX_SIDE, quality: 46 },
      { maxSide: COMPACT_MAX_SIDE, quality: 42 },
      { maxSide: TINY_MAX_SIDE, quality: 36 },
    ];

    for (const attempt of attempts) {
      const target = fitDimensions(srcWidth, srcHeight, attempt.maxSide);
      const result = await sharp(pngBuffer)
        .resize({
          width: target.width,
          height: target.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        // Light sharpening preserves small UI text & button labels at low JPEG quality
        .sharpen({ sigma: 0.65 })
        .jpeg({
          quality: attempt.quality,
          mozjpeg: true,
          progressive: false,
          chromaSubsampling: '4:2:0',
          trellisQuantisation: true,
          overshootDeringing: true,
          optimiseCoding: true,
        })
        .toBuffer({ resolveWithObject: true });

      if (
        result.data.length <= TARGET_MAX_BYTES ||
        (result.data.length <= HARD_MAX_BYTES && attempt === attempts[attempts.length - 1]) ||
        attempt === attempts[attempts.length - 1]
      ) {
        return {
          buffer: result.data,
          width: result.info.width,
          height: result.info.height,
        };
      }
    }
    return null;
  } catch (err) {
    log.warn('sharp encoding unavailable, falling back to nativeImage:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

function encodeWithNativeImage(
  thumbnail: NativeImage,
  srcWidth: number,
  srcHeight: number
): { buffer: Buffer; width: number; height: number } {
  const attempts: { maxSide: number; quality: number }[] = [
    { maxSide: PRIMARY_MAX_SIDE, quality: 58 },
    { maxSide: PRIMARY_MAX_SIDE, quality: 46 },
    { maxSide: COMPACT_MAX_SIDE, quality: 42 },
    { maxSide: TINY_MAX_SIDE, quality: 36 },
  ];

  for (const attempt of attempts) {
    const target = fitDimensions(srcWidth, srcHeight, attempt.maxSide);
    const resized =
      target.width === srcWidth && target.height === srcHeight
        ? thumbnail
        : thumbnail.resize({ width: target.width, height: target.height, quality: 'good' });
    const buffer = resized.toJPEG(attempt.quality);
    const size = resized.getSize();

    if (buffer.length <= TARGET_MAX_BYTES || attempt === attempts[attempts.length - 1]) {
      return {
        buffer,
        width: size.width,
        height: size.height,
      };
    }
  }

  const fallbackBuf = thumbnail.toJPEG(36);
  const fallbackSize = thumbnail.getSize();
  return { buffer: fallbackBuf, width: fallbackSize.width, height: fallbackSize.height };
}

export async function captureActiveDisplay(): Promise<CaptureResult> {
  const chatWin = getChatWindow();
  const wasVisible = Boolean(chatWin && chatWin.isVisible());
  const cursor = screen.getCursorScreenPoint();
  const display =
    chatWin && wasVisible
      ? screen.getDisplayMatching(chatWin.getBounds())
      : screen.getDisplayNearestPoint(cursor);
  const allDisplays = screen.getAllDisplays();
  const displayIndex = Math.max(
    0,
    allDisplays.findIndex((d) => d.id === display.id)
  );

  setChatOperationActive(true);
  sendCaptureState('capturing');

  try {
    if (wasVisible) {
      setChatOpacity(0);
      await delay(130);
    }

    const thumbTarget = fitDimensions(
      Math.max(1, Math.round(display.size.width * display.scaleFactor)),
      Math.max(1, Math.round(display.size.height * display.scaleFactor)),
      PRIMARY_MAX_SIDE
    );

    const sources = await withTimeout(
      desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: thumbTarget,
      }),
      8000,
      'desktopCapturer.getSources'
    );

    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    const matchedSource =
      sources.find((s) => String(s.display_id) === String(display.id)) ||
      sources[displayIndex] ||
      sources[0];

    const thumbnail = matchedSource.thumbnail;
    if (thumbnail.isEmpty()) {
      throw new Error('Captured thumbnail is empty');
    }

    const rawSize = thumbnail.getSize();
    const pngBuffer = thumbnail.toPNG();
    let encoded: { buffer: Buffer; width: number; height: number } | null = null;
    try {
      encoded = await withTimeout(
        encodeWithSharp(pngBuffer, rawSize.width, rawSize.height),
        4000,
        'encodeWithSharp'
      );
    } catch (sharpTimeoutErr) {
      log.warn(
        'sharp encode timed out, falling back to nativeImage:',
        sharpTimeoutErr instanceof Error ? sharpTimeoutErr.message : String(sharpTimeoutErr)
      );
      encoded = null;
    }
    if (!encoded) {
      encoded = encodeWithNativeImage(thumbnail, rawSize.width, rawSize.height);
    }

    const imageBase64 = encoded.buffer.toString('base64');
    log.info(
      `Screen capture completed: display=${display.id}, size=${encoded.width}x${encoded.height}, bytes=${encoded.buffer.length}`
    );

    return {
      imageBase64,
      mimeType: 'image/jpeg',
      width: encoded.width,
      height: encoded.height,
      displayId: display.id,
      displayBounds: { ...display.bounds },
      scaleFactor: display.scaleFactor,
    };
  } finally {
    if (wasVisible) {
      setChatOpacity(1);
    }
    setChatOperationActive(false);
    sendCaptureState('done');
  }
}

export async function handleCaptureRequest(): Promise<CaptureResponse> {
  if (!hasScreenCapturePermission()) {
    showOnboardingWindow();
    return { error: 'permission' };
  }

  const limitCheck = captureLimiter.tryAcquire();
  if (!limitCheck.allowed) {
    log.warn(`Client capture rate limit reached: ${limitCheck.reason}`);
    return { error: 'denied' };
  }

  try {
    return await captureActiveDisplay();
  } catch (err) {
    log.error('Screen capture failed:', err instanceof Error ? err.message : String(err));
    return { error: 'failed' };
  }
}

