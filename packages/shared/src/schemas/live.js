import { z } from 'zod';

export const LiveChatMessageSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().default(''),
  message: z.string(),
  timestamp: z.number(),
  isSuperChat: z.boolean().default(false),
  superChatAmount: z.string().optional(),
  badges: z.array(z.string()).default([]), // e.g. ['moderator', 'member', 'owner']
});

export const LiveStreamInfoSchema = z.object({
  videoId: z.string(),
  isLive: z.boolean(),
  viewerCount: z.number().default(0),
  pinnedMessage: LiveChatMessageSchema.nullable().default(null),
  chatMessages: z.array(LiveChatMessageSchema).default([]),
  continuation: z.string().nullable().default(null),
});
