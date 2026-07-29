import { Hono } from 'hono';
import { PIPED_INSTANCES } from '@yourtebu/shared';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query('q') || '';
  if (!query) return c.json([]);

  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/suggestions?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        return c.json(data);
      }
    } catch {
      // try next
    }
  }

  return c.json([]);
});

export default app;
