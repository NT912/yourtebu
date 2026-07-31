import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query('q') || '';
  if (!query || query.trim().length === 0) return c.json([]);

  const targetUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`;

  try {
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const text = buf.toString('latin1');
      const data = JSON.parse(text);

      if (Array.isArray(data) && Array.isArray(data[1])) {
        return c.json(data[1].slice(0, 10));
      }
    }
  } catch {
    // fallback via allorigins proxy if direct fetch fails
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const text = buf.toString('latin1');
        const data = JSON.parse(text);
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return c.json(data[1].slice(0, 10));
        }
      }
    } catch {
      /* ignore */
    }
  }

  return c.json([]);
});

export default app;
