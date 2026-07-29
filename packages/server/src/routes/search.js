import { Hono } from 'hono';
import { getFallbackSearch } from '@yourtebu/shared';

const app = new Hono();

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
];

app.get('/', async (c) => {
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1', 10);

  if (!query) {
    return c.json(getFallbackSearch(''));
  }

  // Try live search with 1.5s race timeout
  const liveResult = await raceSearch(query, page);
  if (liveResult && liveResult.length > 0) {
    return c.json(liveResult);
  }

  // Instant fallback
  return c.json(getFallbackSearch(query));
});

async function raceSearch(query, page) {
  const promises = INVIDIOUS_INSTANCES.map(async (instance) => {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=${page}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
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
        }))
        .filter((v) => v.videoId);
    } catch {
      return null;
    }
  });

  try {
    return await Promise.any(promises);
  } catch {
    return null;
  }
}

export default app;
