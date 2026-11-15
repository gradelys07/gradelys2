export class CaptureRateLimiter {
  private readonly minIntervalMs: number;
  private readonly maxPerHour: number;
  private lastCaptureAt = 0;
  private timestamps: number[] = [];

  constructor(minIntervalMs = 3000, maxPerHour = 30) {
    this.minIntervalMs = minIntervalMs;
    this.maxPerHour = maxPerHour;
  }

  public tryAcquire(now = Date.now()): { allowed: boolean; reason?: 'cooldown' | 'hourly_limit' } {
    if (this.lastCaptureAt > 0 && now - this.lastCaptureAt < this.minIntervalMs) {
      return { allowed: false, reason: 'cooldown' };
    }

    const oneHourAgo = now - 3600_000;
    this.timestamps = this.timestamps.filter((ts) => ts > oneHourAgo);

    if (this.timestamps.length >= this.maxPerHour) {
      return { allowed: false, reason: 'hourly_limit' };
    }

    this.lastCaptureAt = now;
    this.timestamps.push(now);
    return { allowed: true };
  }

  public reset(): void {
    this.lastCaptureAt = 0;
    this.timestamps = [];
  }
}

