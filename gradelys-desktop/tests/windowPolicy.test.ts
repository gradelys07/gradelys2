import { describe, expect, it } from 'vitest';
import {
  shouldSwitchToAccessoryOnMainHide,
  shouldUseAccessoryForQuickOverlay,
} from '../shared/windowPolicy';

describe('macOS activation policy and fullscreen window guards', () => {
  it('ignores transient macOS hide events during fullscreen enter and exit animations', () => {
    expect(
      shouldSwitchToAccessoryOnMainHide({
        platform: 'darwin',
        isAppQuitting: false,
        isExplicitlyHidden: false,
        isVisible: true,
        isFullScreen: true,
      })
    ).toBe(false);

    expect(
      shouldSwitchToAccessoryOnMainHide({
        platform: 'darwin',
        isAppQuitting: false,
        isExplicitlyHidden: false,
        isVisible: true,
        isFullScreen: false,
      })
    ).toBe(false);
  });

  it('switches to accessory mode on genuine hide (red close button or Cmd+H)', () => {
    expect(
      shouldSwitchToAccessoryOnMainHide({
        platform: 'darwin',
        isAppQuitting: false,
        isExplicitlyHidden: true,
        isVisible: false,
        isFullScreen: false,
      })
    ).toBe(true);

    expect(
      shouldSwitchToAccessoryOnMainHide({
        platform: 'darwin',
        isAppQuitting: false,
        isExplicitlyHidden: false,
        isVisible: false,
        isFullScreen: false,
      })
    ).toBe(true);
  });

  it('keeps regular policy for visible/fullscreen main window when opening quick assistant', () => {
    expect(
      shouldUseAccessoryForQuickOverlay({
        platform: 'darwin',
        hasMainWindow: true,
        isMainVisible: true,
        isMainMinimized: false,
      })
    ).toBe(false);

    expect(
      shouldUseAccessoryForQuickOverlay({
        platform: 'darwin',
        hasMainWindow: true,
        isMainVisible: false,
        isMainMinimized: false,
      })
    ).toBe(true);

    expect(
      shouldUseAccessoryForQuickOverlay({
        platform: 'darwin',
        hasMainWindow: true,
        isMainVisible: true,
        isMainMinimized: true,
      })
    ).toBe(true);
  });
});

