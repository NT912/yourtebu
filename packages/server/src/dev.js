import { serve } from '@hono/node-server';
import app from './index.js';

const PORT = 3001;

console.log(`[Yourtebu Server] Starting Hono proxy on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});
