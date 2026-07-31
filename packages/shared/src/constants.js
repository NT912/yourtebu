export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  (typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID) ||
  '370117982466-fuc92d8krhloqbu7e6lad91lj4ia4gg2.apps.googleusercontent.com';

export const YOUTUBE_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YOUTUBE_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.YOUTUBE_API_KEY) ||
  atob('QUl6YVN5QmtVbjJ4ckI0c0JKcFNiYmdtZFdtYngtN0s1bXdTdWs0');

export const MIN_SLEEP_TIMER_MINUTES = 5;
export const MAX_SLEEP_TIMER_MINUTES = 240;
export const MAX_SLEEP_TIMER_HOURS = 24;
export const MAX_SLEEP_TIMER_CLOCK_HOURS = 24;

export const DEFAULT_PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.mha.fi',
];

// Alias for backward compatibility with server routes
export const PIPED_INSTANCES = DEFAULT_PIPED_INSTANCES;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const DEFAULT_LANG = 'vi';

export const YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch?v=';
export const YOUTUBE_CHANNEL_BASE = 'https://www.youtube.com/channel/';
