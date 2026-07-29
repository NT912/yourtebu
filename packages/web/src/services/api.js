/**
 * API Service - Fetches data through Hono API proxy (/api/*)
 */

export async function fetchVideoInfo(videoId) {
  const res = await fetch(`/api/streams/${videoId}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch video info`);
  }
  return await res.json();
}

export async function fetchSearchResults(query, filter = 'all', page = 1) {
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&filter=${filter}&page=${page}`,
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Search failed`);
  }
  return await res.json();
}

export async function fetchTrending(region = 'VN', page = 1, category = 'all') {
  const res = await fetch(
    `/api/trending?region=${region}&page=${page}&category=${encodeURIComponent(category)}`,
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Trending failed`);
  }
  return await res.json();
}

export async function fetchSuggestions(query) {
  if (!query) return [];
  try {
    const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchLiveChat(videoId) {
  try {
    const res = await fetch(`/api/live-chat/${videoId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============ PERSONALIZED RECOMMENDATIONS ============

/**
 * Fetch videos from user's subscribed channels.
 * @param {string} accessToken - Google OAuth2 access token with YouTube scope
 * @returns {Promise<Array>}
 */
export async function fetchSubscriptionVideos(accessToken) {
  if (!accessToken) return [];
  try {
    const res = await fetch('/api/recommendations/subscriptions', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch user's liked videos.
 * @param {string} accessToken - Google OAuth2 access token with YouTube scope
 * @returns {Promise<Array>}
 */
export async function fetchLikedVideos(accessToken) {
  if (!accessToken) return [];
  try {
    const res = await fetch('/api/recommendations/liked', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch videos related to given video IDs (from watch history).
 * @param {string[]} videoIds
 * @param {string|null} accessToken
 * @returns {Promise<Array>}
 */
export async function fetchRelatedVideos(videoIds, accessToken = null) {
  if (!videoIds || videoIds.length === 0) return [];
  try {
    const headers = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`/api/recommendations/related?videoIds=${videoIds.join(',')}`, {
      headers,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch personalized feed combining all 3 sources.
 * Runs all 3 fetches in parallel, merges, shuffles, and returns.
 * @param {string} accessToken
 * @param {string[]} recentVideoIds - From local watch history
 * @returns {Promise<Array>}
 */
export async function fetchPersonalizedFeed(accessToken, recentVideoIds = []) {
  const [subscriptionVids, likedVids, relatedVids] = await Promise.all([
    fetchSubscriptionVideos(accessToken),
    fetchLikedVideos(accessToken),
    fetchRelatedVideos(recentVideoIds, accessToken),
  ]);

  // Combine with source badges
  const all = [
    ...subscriptionVids.map((v) => ({ ...v, source: 'subscription' })),
    ...likedVids.map((v) => ({ ...v, source: 'liked' })),
    ...relatedVids.map((v) => ({ ...v, source: 'related' })),
  ];

  // Deduplicate by videoId
  const seen = new Set();
  const deduped = all.filter((v) => {
    if (!v.videoId || seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });

  // Shuffle
  for (let i = deduped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
  }

  return deduped;
}
