/**
 * Watch History Service
 * Tracks videos watched in the app locally (localStorage).
 * Used to generate "related" recommendations.
 */

const STORAGE_KEY = 'yourtebu_watch_history';
const MAX_HISTORY = 100;

/**
 * Add a video to watch history.
 * @param {{ videoId: string, title: string, uploaderName: string, category?: string }} videoInfo
 */
export function addToWatchHistory(videoInfo) {
  if (!videoInfo?.videoId) return;

  const history = getWatchHistory();

  // Remove if already exists (will re-add at top)
  const filtered = history.filter((v) => v.videoId !== videoInfo.videoId);

  // Add to beginning
  filtered.unshift({
    videoId: videoInfo.videoId,
    title: videoInfo.title || '',
    uploaderName: videoInfo.uploaderName || '',
    category: videoInfo.category || '',
    watchedAt: Date.now(),
  });

  // Trim to max
  const trimmed = filtered.slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full, clear old entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed.slice(0, 20)));
  }
}

/**
 * Get full watch history.
 * @returns {Array<{ videoId: string, title: string, uploaderName: string, category: string, watchedAt: number }>}
 */
export function getWatchHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Get the N most recently watched video IDs.
 * @param {number} n
 * @returns {string[]}
 */
export function getRecentVideoIds(n = 5) {
  return getWatchHistory()
    .slice(0, n)
    .map((v) => v.videoId);
}

/**
 * Get unique channel/uploader names from recent history for related search.
 * @param {number} n
 * @returns {string[]}
 */
export function getRecentUploaders(n = 5) {
  const history = getWatchHistory();
  const seen = new Set();
  const result = [];
  for (const v of history) {
    if (v.uploaderName && !seen.has(v.uploaderName)) {
      seen.add(v.uploaderName);
      result.push(v.uploaderName);
      if (result.length >= n) break;
    }
  }
  return result;
}

/**
 * Clear watch history.
 */
export function clearWatchHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
