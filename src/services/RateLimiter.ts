export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRatePerSec: number;
}

export class RateLimiter {
  private static buckets = new Map<string, Bucket>();

  private static getBucket(key: string, maxTokens: number, refillRatePerSec: number): Bucket {
    let bucket = this.buckets.get(key);
    const now = Date.now();

    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
        maxTokens,
        refillRatePerSec,
      };
      this.buckets.set(key, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsedSec * bucket.refillRatePerSec);
      bucket.lastRefill = now;
    }

    return bucket;
  }

  /**
   * Checks if an action is allowed under the rate limit.
   */
  public static checkLimit(actionKey: string, maxPerMinute: number = 10): RateLimitStatus {
    const refillRate = maxPerMinute / 60;
    const bucket = this.getBucket(actionKey, maxPerMinute, refillRate);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTimeMs: Math.ceil((bucket.maxTokens - bucket.tokens) / refillRate) * 1000,
      };
    }

    const deficit = 1 - bucket.tokens;
    const waitSeconds = Math.ceil(deficit / refillRate);

    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: waitSeconds * 1000,
      retryAfterSeconds: waitSeconds,
    };
  }

  /**
   * Helper specifically for AI scenario generation requests.
   */
  public static checkAILimit(clientId: string = 'global'): RateLimitStatus {
    return this.checkLimit(`ai_synth_${clientId}`, 5);
  }

  /**
   * Helper for scenario saving rate limit.
   */
  public static checkScenarioSaveLimit(clientId: string = 'global'): RateLimitStatus {
    return this.checkLimit(`scenario_save_${clientId}`, 15);
  }

  /**
   * Helper for simulation run submissions.
   */
  public static checkRunSaveLimit(clientId: string = 'global'): RateLimitStatus {
    return this.checkLimit(`run_save_${clientId}`, 20);
  }

  /**
   * Resets rate limiter (useful for tests).
   */
  public static resetAll(): void {
    this.buckets.clear();
  }
}
