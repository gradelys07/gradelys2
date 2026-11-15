import { describe, expect, it } from 'vitest';
import { CaptureRateLimiter } from '../shared/captureRateLimit';
import {
  isSafeExternalHttpsUrl,
  isTrustedEmbedUrl,
  isTrustedOrigin,
  isTrustedRendererUrl,
  isValidLoopbackPort,
  isValidOAuthState,
  normalizeBaseUrl,
} from '../shared/securityValidation';

describe('security origin and IPC sender validation', () => {
  it('allows only matching origin for Gradelys routes and rejects foreign origins', () => {
    const prodOrigin = normalizeBaseUrl(undefined, true);
    expect(prodOrigin).toBe('https://gradelys.com');

    expect(isTrustedRendererUrl('https://gradelys.com/quick', prodOrigin)).toBe(true);
    expect(isTrustedRendererUrl('https://www.gradelys.com/quick', prodOrigin)).toBe(true);
    expect(isTrustedRendererUrl('https://gradelys.com/login?redirect=/quick', prodOrigin)).toBe(true);

    // Foreign / spoofed origins must be rejected for IPC
    expect(isTrustedRendererUrl('https://evil.example/quick', prodOrigin)).toBe(false);
    expect(isTrustedRendererUrl('https://evil.gradelys.com/quick', prodOrigin)).toBe(false);
    expect(isTrustedRendererUrl('https://gradelys.com.evil.com/quick', prodOrigin)).toBe(false);
    expect(isTrustedRendererUrl('http://gradelys.com/quick', prodOrigin)).toBe(false);
    expect(isTrustedRendererUrl('file:///etc/passwd', prodOrigin)).toBe(false);
    expect(isTrustedRendererUrl('javascript:alert(1)', prodOrigin)).toBe(false);
    expect(isTrustedRendererUrl('', prodOrigin)).toBe(false);
  });

  it('allows localhost only in dev or explicit localhost override', () => {
    const devOrigin = normalizeBaseUrl(undefined, false);
    expect(devOrigin).toBe('http://localhost:3000');
    expect(isTrustedOrigin('http://localhost:3000/quick', devOrigin)).toBe(true);
    expect(isTrustedOrigin('http://localhost:4000/quick', devOrigin)).toBe(false);

    // Rejects insecure remote HTTP in production
    expect(normalizeBaseUrl('http://gradelys.com', true)).toBe('https://gradelys.com');
  });

  it('permits only https URLs for shell.openExternal', () => {
    expect(isSafeExternalHttpsUrl('https://gradelys.com/pricing')).toBe(true);
    expect(isSafeExternalHttpsUrl('http://gradelys.com')).toBe(false);
    expect(isSafeExternalHttpsUrl('file:///Applications/Calculator.app')).toBe(false);
    expect(isSafeExternalHttpsUrl('ms-msdt:something')).toBe(false);
  });

  it('allows only Gradelys and HTTPS YouTube /embed/ frames inside subframes', () => {
    const prodOrigin = normalizeBaseUrl(undefined, true);
    expect(isTrustedEmbedUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0', prodOrigin)).toBe(true);
    expect(isTrustedEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ', prodOrigin)).toBe(true);
    expect(isTrustedEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', prodOrigin)).toBe(false);
    expect(isTrustedEmbedUrl('http://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', prodOrigin)).toBe(false);
    expect(isTrustedEmbedUrl('https://evil.example/embed/abc', prodOrigin)).toBe(false);
  });

  it('validates loopback OAuth port and cryptographic hex state', () => {
    expect(isValidLoopbackPort(54321)).toBe(true);
    expect(isValidLoopbackPort(1024)).toBe(true);
    expect(isValidLoopbackPort(65535)).toBe(true);
    expect(isValidLoopbackPort(80)).toBe(false);
    expect(isValidLoopbackPort(70000)).toBe(false);
    expect(isValidLoopbackPort(Number.NaN)).toBe(false);
    expect(isValidLoopbackPort('54321')).toBe(false);

    expect(isValidOAuthState('a'.repeat(48))).toBe(true);
    expect(isValidOAuthState('short')).toBe(false);
    expect(isValidOAuthState('z'.repeat(48))).toBe(false);
    expect(isValidOAuthState(`${'a'.repeat(47)}<`)).toBe(false);
  });
});

describe('CaptureRateLimiter', () => {
  it('enforces 1 capture every 3 seconds and max 30 per hour', () => {
    const limiter = new CaptureRateLimiter(3000, 30);
    const t0 = 1_700_000_000_000;

    expect(limiter.tryAcquire(t0)).toEqual({ allowed: true });
    expect(limiter.tryAcquire(t0 + 1000)).toEqual({ allowed: false, reason: 'cooldown' });
    expect(limiter.tryAcquire(t0 + 3000)).toEqual({ allowed: true });

    for (let i = 2; i < 30; i++) {
      expect(limiter.tryAcquire(t0 + i * 4000)).toEqual({ allowed: true });
    }

    // 31st within an hour is denied
    expect(limiter.tryAcquire(t0 + 30 * 4000)).toEqual({
      allowed: false,
      reason: 'hourly_limit',
    });

    // After 1 hour + 1 ms from t0, slot opens again
    expect(limiter.tryAcquire(t0 + 3_600_001)).toEqual({ allowed: true });
  });
});

