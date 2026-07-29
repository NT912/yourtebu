import { Hono } from 'hono';

const app = new Hono();

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Helper: Call YouTube Data API v3 with access token.
 */
async function ytApiFetch(endpoint, accessToken, params = {}) {
  const url = new URL(`${YT_API_BASE}/${endpoint}`);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`YouTube API ${res.status}: ${errText.slice(0, 200)}`);
  }

  return await res.json();
}

/**
 * Normalize YouTube API video item to our format.
 */
function normalizeVideo(item, source = '') {
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const contentDetails = item.contentDetails || {};

  // Parse ISO 8601 duration (PT4M13S -> seconds)
  let duration = 0;
  const durationStr = contentDetails.duration || '';
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    duration =
      parseInt(match[1] || 0) * 3600 + parseInt(match[2] || 0) * 60 + parseInt(match[3] || 0);
  }

  return {
    videoId: item.id?.videoId || item.id || item.contentDetails?.videoId || '',
    title: snippet.title || '',
    thumbnail:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      '',
    uploaderName: snippet.channelTitle || '',
    uploaderAvatar: '',
    uploaderUrl: snippet.channelId ? `https://www.youtube.com/channel/${snippet.channelId}` : '',
    views: parseInt(stats.viewCount || 0),
    duration,
    uploadedDate: snippet.publishedAt || '',
    type: 'stream',
    source, // 'subscription', 'liked', 'related'
  };
}

/**
 * GET /subscriptions
 * Fetches user's subscribed channels, then gets latest videos from them.
 */
app.get('/subscriptions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing access token' }, 401);
  }
  const accessToken = authHeader.slice(7);

  try {
    // Step 1: Get subscriptions (up to 20 channels)
    const subsData = await ytApiFetch('subscriptions', accessToken, {
      part: 'snippet',
      mine: 'true',
      maxResults: '20',
      order: 'relevance',
    });

    const channelIds = (subsData.items || [])
      .map((item) => item.snippet?.resourceId?.channelId)
      .filter(Boolean);

    if (channelIds.length === 0) {
      return c.json([]);
    }

    // Step 2: Get latest videos from each channel (batch via search)
    // Use max 5 channels to save quota (search costs 100 units each)
    const selectedChannels = channelIds.slice(0, 5);
    const videoPromises = selectedChannels.map(async (channelId) => {
      try {
        const searchData = await ytApiFetch('search', accessToken, {
          part: 'snippet',
          channelId,
          type: 'video',
          order: 'date',
          maxResults: '4',
        });
        return (searchData.items || []).map((item) => normalizeVideo(item, 'subscription'));
      } catch {
        return [];
      }
    });

    const results = await Promise.all(videoPromises);
    const allVideos = results.flat();

    // Step 3: Get video details (views, duration) for all found videos
    if (allVideos.length > 0) {
      const videoIds = allVideos
        .map((v) => v.videoId)
        .filter(Boolean)
        .join(',');
      try {
        const detailsData = await ytApiFetch('videos', accessToken, {
          part: 'statistics,contentDetails',
          id: videoIds,
        });
        const detailsMap = {};
        for (const item of detailsData.items || []) {
          detailsMap[item.id] = item;
        }
        for (const v of allVideos) {
          const detail = detailsMap[v.videoId];
          if (detail) {
            const normalized = normalizeVideo(detail, 'subscription');
            v.views = normalized.views;
            v.duration = normalized.duration;
          }
        }
      } catch {
        // details fetch failed, continue with basic data
      }
    }

    return c.json(allVideos);
  } catch (err) {
    console.error('[Recommendations] Subscriptions error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /liked
 * Fetches user's liked videos playlist.
 */
app.get('/liked', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing access token' }, 401);
  }
  const accessToken = authHeader.slice(7);

  try {
    // The "Liked Videos" playlist has the special ID "LL"
    const data = await ytApiFetch('playlistItems', accessToken, {
      part: 'snippet,contentDetails',
      playlistId: 'LL',
      maxResults: '20',
    });

    const videoIds = (data.items || []).map((item) => item.contentDetails?.videoId).filter(Boolean);

    if (videoIds.length === 0) {
      return c.json([]);
    }

    // Get full video details
    const detailsData = await ytApiFetch('videos', accessToken, {
      part: 'snippet,statistics,contentDetails',
      id: videoIds.join(','),
    });

    const videos = (detailsData.items || []).map((item) => normalizeVideo(item, 'liked'));
    return c.json(videos);
  } catch (err) {
    console.error('[Recommendations] Liked error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /related?videoIds=id1,id2,id3
 * Fetches videos related to the given video IDs (from watch history).
 */
app.get('/related', async (c) => {
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const videoIdsParam = c.req.query('videoIds') || '';
  const videoIds = videoIdsParam.split(',').filter(Boolean).slice(0, 3);

  if (videoIds.length === 0) {
    return c.json([]);
  }

  try {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
      : { Accept: 'application/json' };

    // For each video ID, search for related content
    const relatedPromises = videoIds.map(async (videoId) => {
      try {
        // First, get the video's details to know the channel
        const url = new URL(`${YT_API_BASE}/search`);
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('relatedToVideoId', videoId);
        url.searchParams.set('type', 'video');
        url.searchParams.set('maxResults', '5');

        // If we have access token, use it; otherwise need API key
        if (accessToken) {
          const res = await fetch(url.toString(), {
            headers,
            signal: AbortSignal.timeout(4000),
          });
          if (res.ok) {
            const data = await res.json();
            return (data.items || []).map((item) => normalizeVideo(item, 'related'));
          }
        }
        return [];
      } catch {
        return [];
      }
    });

    const results = await Promise.all(relatedPromises);
    const allRelated = results.flat();

    // Deduplicate
    const seen = new Set();
    const deduped = allRelated.filter((v) => {
      if (!v.videoId || seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });

    return c.json(deduped);
  } catch (err) {
    console.error('[Recommendations] Related error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
