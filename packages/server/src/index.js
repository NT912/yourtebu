import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from './middleware/cache.js';

import streamsRoute from './routes/streams.js';
import searchRoute from './routes/search.js';
import trendingRoute from './routes/trending.js';
import suggestionsRoute from './routes/suggestions.js';
import liveChatRoute from './routes/live-chat.js';

const app = new Hono();

// CORS Middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Routes with caching
app.use('/api/streams/*', cache(300_000)); // 5 min
app.use('/api/search/*', cache(120_000)); // 2 min
app.use('/api/trending/*', cache(600_000)); // 10 min
app.use('/api/suggestions/*', cache(300_000));
app.use('/api/live-chat/*', cache(3_000)); // 3 seconds for live data

app.route('/api/streams', streamsRoute);
app.route('/api/search', searchRoute);
app.route('/api/trending', trendingRoute);
app.route('/api/suggestions', suggestionsRoute);
app.route('/api/live-chat', liveChatRoute);

// Thumbnail proxy — fetches YouTube CDN images server-side to bypass CORS/referrer blocks
app.get('/api/thumbnail/:videoId', async (c) => {
  const videoId = c.req.param('videoId');
  if (!videoId || !/^[a-zA-Z0-9_-]{6,15}$/.test(videoId)) {
    return c.text('Invalid video ID', 400);
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    Referer: 'https://www.youtube.com/',
    Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // Use wsrv.nl image proxy to fetch YouTube thumbnails reliably
  const targetImage = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const candidateUrls = [
    `https://wsrv.nl/?url=${encodeURIComponent(targetImage)}`,
    `https://images.weserv.nl/?url=${encodeURIComponent(`i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}`,
    `https://wsrv.nl/?url=${encodeURIComponent(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new Response(buf, {
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch {
      // try next candidate
    }
  }

  return c.text('Thumbnail unavailable', 404);
});

export default app;
