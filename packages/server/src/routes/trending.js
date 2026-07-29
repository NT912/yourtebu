import { Hono } from 'hono';
import { getShuffledPage, FALLBACK_VIDEOS } from '@yourtebu/shared';

const app = new Hono();

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
];

app.get('/', async (c) => {
  const region = c.req.query('region') || 'VN';
  const page = parseInt(c.req.query('page') || '1', 10);
  const category = c.req.query('category') || 'all';

  // Strategy: Return shuffled local videos IMMEDIATELY, then try live API in background
  // This ensures zero lag for the user

  // For page 1 + category all, try live API with very short timeout (1.5s)
  if (page === 1 && category === 'all') {
    const liveResult = await raceFetchTrending(region);
    if (liveResult && liveResult.length > 10) {
      return c.json(liveResult);
    }
  }

  // Instant fallback: shuffled videos from our 120+ video pool
  return c.json(getShuffledPage(page, category));
});

/**
 * Try to fetch live trending from Invidious with a very aggressive timeout.
 * Returns null if all fail (so caller uses local pool instantly).
 */
async function raceFetchTrending(region) {
  // Race all instances simultaneously with 1.5s timeout
  const promises = INVIDIOUS_INSTANCES.map(async (instance) => {
    try {
      const res = await fetch(`${instance}/api/v1/trending?region=${region}`, {
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) return null;
      const rawData = await res.json();
      if (!Array.isArray(rawData) || rawData.length === 0) return null;

      return rawData
        .map((item) => ({
          videoId: item.videoId || '',
          title: item.title || '',
          thumbnail:
            item.videoThumbnails?.[0]?.url ||
            `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
          uploaderName: item.author || 'YouTube Creator',
          uploaderAvatar: item.authorThumbnails?.[0]?.url || '',
          uploaderUrl: item.authorUrl || '',
          views: typeof item.viewCount === 'number' ? item.viewCount : 0,
          duration: typeof item.lengthSeconds === 'number' ? item.lengthSeconds : 0,
          uploadedDate: item.publishedText || '',
          type: 'stream',
          category: 'trending',
        }))
        .filter((v) => v.videoId);
    } catch {
      return null;
    }
  });

  try {
    // Use Promise.any - returns first successful result
    const result = await Promise.any(promises);
    return result;
  } catch {
    return null;
  }
}

export default app;
