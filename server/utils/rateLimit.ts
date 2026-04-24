import { H3Event } from 'h3';

interface RateLimitConfig {
  max: number;
  window: number; // in seconds
}

export const defineRateLimit = (config: RateLimitConfig) => {
  return async (event: H3Event) => {
    const storage = useStorage();
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const key = `rate-limit:${event.path}:${ip}`;
    
    const now = Date.now();
    const windowMs = config.window * 1000;
    
    let record = (await storage.getItem(key)) as { count: number; expires: number } | null;
    
    if (!record || record.expires < now) {
      record = { count: 1, expires: now + windowMs };
    } else {
      record.count++;
    }
    
    await storage.setItem(key, record);
    
    if (record.count > config.max) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        data: {
          retryAfter: Math.ceil((record.expires - now) / 1000)
        }
      });
    }
    
    // Add headers
    setResponseHeader(event, 'X-RateLimit-Limit', config.max);
    setResponseHeader(event, 'X-RateLimit-Remaining', Math.max(0, config.max - record.count));
    setResponseHeader(event, 'X-RateLimit-Reset', Math.ceil(record.expires / 1000));
  };
};
