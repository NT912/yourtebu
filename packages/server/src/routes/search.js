import { Hono } from 'hono';
import { SearchResultsSchema, getFallbackSearch } from '@yourtebu/shared';
import { validateResponse } from '../middleware/validator.js';

const app = new Hono();

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
  'https://invidious.drgns.space',
];

async function fetchViaProxy(targetUrl) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    targetUrl,
  ];
  for (const pUrl of proxies) {
    try {
      const res = await fetch(pUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next
    }
  }
  return null;
}

app.get('/', async (c) => {
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1', 10);

  if (!query) {
    return c.json(getFallbackSearch(''));
  }

  // 1. Try Invidious search API via CORS proxies
  for (const instance of INVIDIOUS_INSTANCES) {
    const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=${page}`;
    const rawData = await fetchViaProxy(searchUrl);
    if (Array.isArray(rawData) && rawData.length > 0) {
      const items = rawData
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

      if (items.length > 0) {
        const validated = validateResponse(SearchResultsSchema, items);
        return c.json(validated);
      }
    }
  }

  return c.json(getFallbackSearch(query));
});

export default app;
