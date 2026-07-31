/**
 * Extract YouTube video ID from various URL formats or ID strings
 */
export function extractVideoId(urlOrId) {
  if (!urlOrId) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;

  try {
    const url = new URL(urlOrId);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1);
    }
    if (url.searchParams.has('v')) {
      return url.searchParams.get('v');
    }
    if (url.pathname.includes('/embed/') || url.pathname.includes('/shorts/')) {
      return url.pathname.split('/').pop() || '';
    }
  } catch {
    // not a valid URL
  }
  return urlOrId;
}

/**
 * Format duration seconds to string e.g. "03:45" or "1:15:30"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format view count with Vietnamese/English suffix
 */
export function formatViews(views, lang = 'vi') {
  if (!views) return lang === 'vi' ? '0 lượt xem' : '0 views';

  if (lang === 'vi') {
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)} tỷ lượt xem`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)} triệu lượt xem`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)} nghìn lượt xem`;
    return `${views} lượt xem`;
  } else {
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B views`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
    return `${views} views`;
  }
}

/**
 * Safely parse JWT payload decoding UTF-8 properly (fixes Vietnamese diacritics / font corruption)
 */
export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Strips Vietnamese diacritics / accents e.g. "kẻ say tình 2" -> "ke say tinh 2"
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
