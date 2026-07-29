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

const CATEGORY_QUERIES = {
  music: ['Nhạc Trẻ Hay Nhất 2026', 'Rap Việt Mùa 4', 'V-Pop Hits', 'Nhạc Chill Lofi'],
  live: ['Trực Tiếp Tin Tức VTV24', 'Live Stream Music', 'Lofi Girl Live'],
  gaming: ['Gaming Việt Nam Trending', 'Độ Mixi Highlights', 'Liên Quân Mobile'],
  news: ['Tin Tức 24h Mới Nhất', 'Thời Sự VTV', 'Tin Thế Giới'],
  vietnam: ['Phim Ngắn Việt Nam', 'Hài Tết 2026', 'Nhạc Trẻ Remix'],
  recommended: ['Top Hit Việt Nam', 'Music Trends 2026', 'Video Đề Xuất'],
};

app.get('/', async (c) => {
  const region = c.req.query('region') || 'VN';
  const page = parseInt(c.req.query('page') || '1', 10);
  const category = c.req.query('category') || 'all';

  // 1. Page 1 & Category 'all': Fetch Real YouTube Trending Feed
  if (page === 1 && category === 'all') {
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
                category: 'trending',
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
  }

  // 2. Page > 1 or Category selected: Fetch dynamic search queries via Invidious Search API for continuous Infinite Scroll
  let queryCandidates = CATEGORY_QUERIES[category] || [
    'Nhạc Việt Nam Hot',
    'Rap Việt Mới Nhất',
    'Tin Tức 24h Việt Nam',
    'Remix Sôi Động',
    'Hài Việt Nam 2026',
    'Top Trends YouTube',
  ];
  const query = queryCandidates[(page - 1) % queryCandidates.length];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=${page}`;
      const res = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const rawData = await res.json();
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
              category: category !== 'all' ? category : 'recommended',
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
