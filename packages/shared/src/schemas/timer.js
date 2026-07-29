import { z } from 'zod';

export const SleepTimerConfigSchema = z.object({
  mode: z.enum(['minutes', 'hours', 'clock', 'end-track']),
  value: z.number().min(5).default(30), // Minimum 5 minutes
  maxHours: z.number().max(24).default(24), // Max 24h
  fadeOut: z.boolean().default(true),
  fadeOutDuration: z.number().default(30), // seconds
});
