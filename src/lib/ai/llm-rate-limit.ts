import 'server-only';

import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  hasUpstashRedisForRateLimit,
  isLlmRateLimitDisabled,
} from '@/lib/env';

export type LlmRateLimitIdentity = {
  userId: string;
  clientIp: string;
};

type Limiters = {
  userBurst: Ratelimit;
  userMinute: Ratelimit;
  userHour: Ratelimit;
  userDay: Ratelimit;
  ipBurst: Ratelimit;
  ipMinute: Ratelimit;
  ipHour: Ratelimit;
  ipDay: Ratelimit;
};

let limiters: Limiters | null = null;

function createLimiters(redis: Redis): Limiters {
  return {
    userBurst: new Ratelimit({
      redis,
      prefix: 'tether:llm:u:burst',
      limiter: Ratelimit.slidingWindow(3, '5 s'),
    }),
    userMinute: new Ratelimit({
      redis,
      prefix: 'tether:llm:u:min',
      limiter: Ratelimit.slidingWindow(5, '1 m'),
    }),
    userHour: new Ratelimit({
      redis,
      prefix: 'tether:llm:u:hr',
      limiter: Ratelimit.slidingWindow(200, '1 h'),
    }),
    userDay: new Ratelimit({
      redis,
      prefix: 'tether:llm:u:day',
      limiter: Ratelimit.slidingWindow(1000, '1 d'),
    }),
    ipBurst: new Ratelimit({
      redis,
      prefix: 'tether:llm:ip:burst',
      limiter: Ratelimit.slidingWindow(3, '5 s'),
    }),
    ipMinute: new Ratelimit({
      redis,
      prefix: 'tether:llm:ip:min',
      limiter: Ratelimit.slidingWindow(5, '1 m'),
    }),
    ipHour: new Ratelimit({
      redis,
      prefix: 'tether:llm:ip:hr',
      limiter: Ratelimit.slidingWindow(200, '1 h'),
    }),
    ipDay: new Ratelimit({
      redis,
      prefix: 'tether:llm:ip:day',
      limiter: Ratelimit.slidingWindow(1000, '1 d'),
    }),
  };
}

function getLimiters(): Limiters | null {
  if (!hasUpstashRedisForRateLimit()) {
    return null;
  }
  if (!limiters) {
    limiters = createLimiters(Redis.fromEnv());
  }
  return limiters;
}

function pickClientIp(get: (name: string) => string | null): string {
  const forwarded = get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

export async function getLlmRateLimitClientIp(): Promise<string> {
  const h = await headers();
  return pickClientIp((name) => h.get(name));
}

export function getLlmRateLimitClientIpFromRequest(request: Request): string {
  return pickClientIp((name) => request.headers.get(name));
}

function ipKey(ip: string) {
  return `ip:${ip}`;
}

export type LlmRateLimitResult =
  | { ok: true }
  | { ok: false; message: string; retryAfterMs: number };

/**
 * Enforces per-user and per-IP limits on each LLM call:
 * - Burst: 3 requests / 5s (quick back-to-back clicks)
 * - 5 / minute, 200 / hour, 1000 / day (sliding windows)
 *
 * Requires Upstash Redis in production, unless PRM_DISABLE_LLM_RATE_LIMIT is set.
 * In development, missing Redis is allowed so local work does not need Upstash.
 */
export async function enforceLlmRateLimits(
  id: LlmRateLimitIdentity,
): Promise<LlmRateLimitResult> {
  if (isLlmRateLimitDisabled()) {
    return { ok: true };
  }

  const l = getLimiters();
  if (!l) {
    if (process.env.NODE_ENV !== 'production') {
      return { ok: true };
    }
    return {
      ok: false,
      message:
        'AI rate limiting is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or set PRM_DISABLE_LLM_RATE_LIMIT=true only for controlled environments.',
      retryAfterMs: 60_000,
    };
  }

  const ip = ipKey(id.clientIp);

  const results = await Promise.all([
    l.userBurst.limit(id.userId),
    l.userMinute.limit(id.userId),
    l.userHour.limit(id.userId),
    l.userDay.limit(id.userId),
    l.ipBurst.limit(ip),
    l.ipMinute.limit(ip),
    l.ipHour.limit(ip),
    l.ipDay.limit(ip),
  ]);

  await Promise.all(results.map((r) => r.pending));

  const failed = results.find((r) => !r.success);
  if (!failed) {
    return { ok: true };
  }

  const retryAfterMs = Math.max(0, failed.reset - Date.now());
  return {
    ok: false,
    message:
      'Too many AI requests right now. Please wait a bit and try again.',
    retryAfterMs,
  };
}
