/**
 * API Service - Fetches data through Hono API proxy (/api/*)
 */
import { FALLBACK_VIDEOS, YOUTUBE_API_KEY, getFallbackSearch } from '@yourtebu/shared';
import { getWatchHistory } from './watch-history.js';

function fetchWithTimeout(url, options = {}, timeoutMs = 1200) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function fetchYouTubeVideoDetails(videoId, apiKey) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const snippet = item.snippet || {};
    const stats = item.statistics || {};
    const content = item.contentDetails || {};

    return {
      videoId: item.id,
      title: snippet.title
        ? snippet.title
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
        : 'YouTube Video',
      thumbnail:
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      uploaderName: snippet.channelTitle || 'YouTube Creator',
      uploaderAvatar: '',
      uploaderUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
      views: parseInt(stats.viewCount || 0, 10),
      duration: parseISO8601Duration(content.duration),
      uploadedDate: snippet.publishedAt
        ? new Date(snippet.publishedAt).toLocaleDateString('vi-VN')
        : '2026',
      description: snippet.description || '',
      type: 'stream',
    };
  } catch (err) {
    console.warn('[YouTube API] Video details fetch warning:', err);
    return null;
  }
}

export async function fetchVideoInfo(videoId) {
  const storedApiKey = localStorage.getItem('yourtebu_yt_api_key') || YOUTUBE_API_KEY;
  if (storedApiKey && storedApiKey.trim().length > 5) {
    const details = await fetchYouTubeVideoDetails(videoId, storedApiKey.trim());
    if (details) return details;
  }

  try {
    const res = await fetch(`/api/streams/${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) return data;
    }
  } catch {
    /* fallback below */
  }

  const existingFallback = FALLBACK_VIDEOS.find((v) => v.videoId === videoId);
  if (existingFallback) return existingFallback;

  return {
    videoId: videoId,
    title: `Video (${videoId})`,
    uploaderName: 'YouTube Creator',
    uploaderAvatar: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    views: 1250000,
    uploadedDate: '2026',
    description: 'Video trên Yourtebu',
  };
}

function parseISO8601Duration(iso) {
  if (!iso) return 240;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 240;
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchYouTubeDataAPI(query, apiKey) {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&type=video&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetchWithTimeout(searchUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return null;

    const videoIds = items.map((it) => it.id?.videoId).filter(Boolean);
    let statsMap = {};
    if (videoIds.length > 0) {
      try {
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
        const sRes = await fetchWithTimeout(statsUrl);
        if (sRes.ok) {
          const sData = await sRes.json();
          (sData.items || []).forEach((sv) => {
            statsMap[sv.id] = {
              views: parseInt(sv.statistics?.viewCount || 0, 10),
              duration: parseISO8601Duration(sv.contentDetails?.duration),
            };
          });
        }
      } catch (err) {
        console.warn('[YouTube Data API] Stats fetch warning:', err);
      }
    }

    return items.map((it) => {
      const vid = it.id?.videoId;
      const snippet = it.snippet || {};
      const st = statsMap[vid] || {};
      return {
        videoId: vid,
        title: snippet.title
          ? snippet.title
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, '&')
          : '',
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        uploaderName: snippet.channelTitle || 'YouTube Creator',
        uploaderAvatar: '',
        uploaderUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
        views: st.views || 100000,
        duration: st.duration || 240,
        uploadedDate: snippet.publishedAt
          ? new Date(snippet.publishedAt).toLocaleDateString('vi-VN')
          : 'Mới',
        description: snippet.description || '',
        type: 'stream',
      };
    });
  } catch (err) {
    console.error('[YouTube Data API] Fetch error:', err);
    return null;
  }
}

export async function fetchSearchResults(query, filter = 'all', page = 1) {
  // 1. Check if user configured a YouTube Data API Key or if defined in code
  const storedApiKey = localStorage.getItem('yourtebu_yt_api_key') || YOUTUBE_API_KEY;
  if (storedApiKey && storedApiKey.trim().length > 5) {
    const liveData = await fetchYouTubeDataAPI(query, storedApiKey.trim());
    if (Array.isArray(liveData) && liveData.length > 0) {
      console.log('[API Service] Returning live YouTube Data API v3 results!');
      return liveData;
    }
  }

  // 2. Fallback to server search endpoint
  try {
    const res = await fetchWithTimeout(
      `/api/search?q=${encodeURIComponent(query)}&filter=${filter}&page=${page}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('[API Service] Search fetch warning:', err.message);
  }
  return getFallbackSearch(query);
}

export async function fetchYouTubePopularTrending(apiKey, regionCode = 'VN') {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&maxResults=30&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return null;

    return items.map((it) => {
      const snippet = it.snippet || {};
      const stats = it.statistics || {};
      const content = it.contentDetails || {};
      return {
        videoId: it.id,
        title: snippet.title
          ? snippet.title
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, '&')
          : '',
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`,
        uploaderName: snippet.channelTitle || 'YouTube Creator',
        uploaderAvatar: '',
        uploaderUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
        views: parseInt(stats.viewCount || 0, 10),
        duration: parseISO8601Duration(content.duration),
        uploadedDate: snippet.publishedAt
          ? new Date(snippet.publishedAt).toLocaleDateString('vi-VN')
          : 'Mới',
        description: snippet.description || '',
        type: 'stream',
      };
    });
  } catch (err) {
    console.error('[YouTube Data API] Trending fetch error:', err);
    return null;
  }
}

function shuffleArray(array) {
  if (!Array.isArray(array) || array.length === 0) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const CATEGORY_QUERY_POOLS = {
  music: [
    'nhạc trẻ hay nhất 2026',
    'nhạc việt remix lofi chill',
    'nhạc tiktok hot nhất 2026',
    'vpop acoustic acoustic chill',
  ],
  gaming: [
    'game hot nhất 2026 highlight',
    'liên quân mobile trận đấu kịch tính 2026',
    'pubg mobile solo squad 2026',
    'league of legends lck 2026 highlights',
  ],
  news: [
    'tin tức thời sự vtv24 mới nhất',
    'tin tức thế giới 24h mới nhất',
    'tin tức điểm tin hôm nay 2026',
  ],
  live: [
    'trực tiếp âm nhạc live concert 2026',
    'livestream game trực tiếp 2026',
    'trực tiếp thời sự vtv1 2026',
  ],
  vietnam: [
    'khám phá việt nam du lịch',
    'ẩm thực đường phố việt nam ngon nhất',
    'vlog cuộc sống việt nam 2026',
  ],
};

let isGoogleApiBlocked = false;

export async function fetchTrending(region = 'VN', page = 1, category = 'all') {
  const storedApiKey = localStorage.getItem('yourtebu_yt_api_key') || YOUTUBE_API_KEY;
  if (!isGoogleApiBlocked && storedApiKey && storedApiKey.trim().length > 5) {
    try {
      if (category === 'all' || category === 'recommended') {
        const popular = await fetchYouTubePopularTrending(storedApiKey.trim(), region);
        if (Array.isArray(popular) && popular.length > 0) {
          return shuffleArray(popular);
        }
      }

      const catKey = (category || 'all').toLowerCase();
      const queryList = CATEGORY_QUERY_POOLS[catKey] || [
        `${category} hot 2026`,
        `${category} trending 2026`,
      ];
      const queryTopic = queryList[Math.floor(Math.random() * queryList.length)];

      const categoryData = await fetchYouTubeDataAPI(queryTopic, storedApiKey.trim());
      if (Array.isArray(categoryData) && categoryData.length > 0) {
        return shuffleArray(categoryData);
      }
    } catch {
      isGoogleApiBlocked = true;
    }
  }

  try {
    const res = await fetchWithTimeout(
      `/api/trending?region=${region}&page=${page}&category=${encodeURIComponent(category)}`,
      {},
      1000,
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return shuffleArray(data);
    }
  } catch (err) {
    console.warn('[API Service] Trending fetch warning:', err.message);
  }
  return shuffleArray(FALLBACK_VIDEOS);
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
