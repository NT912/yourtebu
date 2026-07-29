import { Hono } from 'hono';
import { PIPED_INSTANCES, SearchResultsSchema, FALLBACK_VIDEOS } from '@yourtebu/shared';
import { validateResponse } from '../middleware/validator.js';

const app = new Hono();

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
  'https://invidious.drgns.space',
];

app.get('/', async (c) => {
  const region = c.req.query('region') || 'VN';

  // 1. Try Invidious instances (Fast & Returns 60 real YouTube Vietnam trending videos)
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/trending?region=${region}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const rawData = await res.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          const items = rawData
            .map((item) => ({
              videoId: item.videoId || (item.url ? item.url.replace('/watch?v=', '') : ''),
              title: item.title || '',
              thumbnail:
                item.videoThumbnails?.[0]?.url ||
                `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
              uploaderName: item.author || item.uploaderName || 'YouTube Creator',
              uploaderAvatar: item.authorThumbnails?.[0]?.url || '',
              uploaderUrl: item.authorUrl || '',
              views: typeof item.viewCount === 'number' ? item.viewCount : item.views || 0,
              duration:
                typeof item.lengthSeconds === 'number' ? item.lengthSeconds : item.duration || 0,
              uploadedDate: item.publishedText || item.uploadedDate || '',
              type: 'stream',
            }))
            .filter((v) => v.videoId);

          if (items.length > 0) {
            const validated = validateResponse(SearchResultsSchema, items);
            return c.json(validated);
          }
        }
      }
    } catch {
      // try next instance
    }
  }

  // 2. Try Piped instances
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/trending?region=${region}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const rawData = await res.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          const items = rawData
            .map((item) => ({
              videoId: item.url ? item.url.replace('/watch?v=', '') : '',
              title: item.title || '',
              thumbnail: item.thumbnail || '',
              uploaderName: item.uploaderName || '',
              uploaderAvatar: item.uploaderAvatar || '',
              uploaderUrl: item.uploaderUrl || '',
              views: item.views || 0,
              duration: item.duration || 0,
              uploadedDate: item.uploadedDate || item.uploaded || '',
              type: 'stream',
            }))
            .filter((v) => v.videoId);

          if (items.length > 0) {
            const validated = validateResponse(SearchResultsSchema, items);
            return c.json(validated);
          }
        }
      }
    } catch {
      // try next
    }
  }

  // 3. Fallback to rich default catalog
  return c.json(FALLBACK_VIDEOS);
});

export default app;
