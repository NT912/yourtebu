const cacheStore = new Map();

/**
 * In-memory response caching middleware for Hono
 * @param {number} ttlMs - time to live in milliseconds
 */
export function cache(ttlMs = 300_000) {
  return async (c, next) => {
    // Only cache GET requests
    if (c.req.method !== 'GET') {
      return next();
    }

    const key = c.req.url;
    const cached = cacheStore.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      c.header('X-Cache', 'HIT');
      return c.json(cached.data);
    }

    await next();

    // Cache successful non-error JSON responses
    if (c.res.status === 200) {
      try {
        const data = await c.res.clone().json();
        if (data && !data.error) {
          cacheStore.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
          });
          c.header('X-Cache', 'MISS');
        }
      } catch {
        // Response wasn't JSON
      }
    }
  };
}

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of cacheStore.entries()) {
    if (now >= val.expiresAt) {
      cacheStore.delete(key);
    }
  }
}, 600_000);
