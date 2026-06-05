import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  _ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: false,
  });

  return _ratelimit;
}

export async function checkRateLimit(identifier: string) {
  const limiter = getRatelimit();

  if (!limiter) {
    return { success: true, remaining: 999 };
  }

  const { success, remaining } = await limiter.limit(identifier);
  return { success, remaining };
}
