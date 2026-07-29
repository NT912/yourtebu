import { Hono } from 'hono';
import { PIPED_INSTANCES, LiveStreamInfoSchema } from '@yourtebu/shared';
import { validateResponse } from '../middleware/validator.js';

const app = new Hono();

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  for (const instance of PIPED_INSTANCES) {
    try {
      // Piped live chat API endpoint
      const res = await fetch(`${instance}/livechat/${id}`);
      if (res.ok) {
        const raw = await res.json();

        const normalized = {
          videoId: id,
          isLive: raw.isLive ?? true,
          viewerCount: raw.viewerCount || 0,
          pinnedMessage: raw.pinnedMessage
            ? {
                id: raw.pinnedMessage.id || 'pin-1',
                authorName: raw.pinnedMessage.authorName || '',
                authorAvatar: raw.pinnedMessage.authorAvatar || '',
                message: raw.pinnedMessage.message || '',
                timestamp: raw.pinnedMessage.timestamp || Date.now(),
                isSuperChat: false,
                badges: raw.pinnedMessage.badges || [],
              }
            : null,
          chatMessages: (raw.messages || raw.chat || []).map((msg, i) => ({
            id: msg.id || `msg-${i}-${Date.now()}`,
            authorName: msg.author || msg.authorName || 'Anonymous',
            authorAvatar: msg.avatar || msg.authorAvatar || '',
            message: msg.message || msg.text || '',
            timestamp: msg.timestamp || Date.now(),
            isSuperChat: Boolean(msg.superChat || msg.amount),
            superChatAmount: msg.superChatAmount || msg.amount || undefined,
            badges: msg.badges || [],
          })),
          continuation: raw.continuation || null,
        };

        const validated = validateResponse(LiveStreamInfoSchema, normalized);
        return c.json(validated);
      }
    } catch {
      // try next instance
    }
  }

  // Fallback structure if live chat service unavailable
  return c.json({
    videoId: id,
    isLive: true,
    viewerCount: 0,
    pinnedMessage: null,
    chatMessages: [],
    continuation: null,
  });
});

export default app;
