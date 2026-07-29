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
