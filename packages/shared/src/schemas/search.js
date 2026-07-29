import { z } from 'zod';

export const SearchResultItemSchema = z.object({
  videoId: z.string(),
  title: z.string().default(''),
  thumbnail: z.string().default(''),
  uploaderName: z.string().default(''),
  uploaderAvatar: z.string().default(''),
  uploaderUrl: z.string().default(''),
  views: z.number().default(0),
  duration: z.number().default(0),
  uploadedDate: z.string().default(''),
  type: z.string().default('stream'),
});

export const SearchResultsSchema = z.array(SearchResultItemSchema);

export const SuggestionSchema = z.array(z.string());
