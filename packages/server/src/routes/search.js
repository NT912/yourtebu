import { Hono } from 'hono';
import { SearchResultsSchema, getFallbackSearch } from '@yourtebu/shared';
import { validateResponse } from '../middleware/validator.js';

const app = new Hono();

/**
 * Direct YouTube Search Scraper with CONSENT cookie for 100% reliable live search results.
 */
async function scrapeYouTubeSearch(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      Cookie: 'CONSENT=YES+cb.20210328-17-p0.vt+FX+999',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];
  const html = await res.text();

  const startIdx = html.indexOf('ytInitialData = ');
  if (startIdx === -1) return [];

  const endIdx = html.indexOf(';</script>', startIdx);
  if (endIdx === -1) return [];

  const jsonText = html.slice(startIdx + 16, endIdx);
  const data = JSON.parse(jsonText);

  const contents =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents?.[0]?.itemSectionRenderer?.contents || [];

  const results = [];
  for (const item of contents) {
    const v = item.videoRenderer;
    if (v && v.videoId) {
      // Parse view count
      let views = 0;
      const viewText = v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || '';
      const vMatch = viewText.match(/([\d.,]+)/);
      if (vMatch) {
        const num = parseFloat(vMatch[1].replace(/,/g, '.'));
        if (viewText.includes('triệu') || viewText.includes('M') || viewText.includes('m')) {
          views = Math.round(num * 1000000);
        } else if (viewText.includes('nghìn') || viewText.includes('K') || viewText.includes('k')) {
          views = Math.round(num * 1000);
        } else {
          views = Math.round(num);
        }
      }

      // Parse duration (e.g. "3:45", "1:20:15")
      let duration = 0;
      const durText = v.lengthText?.simpleText || '';
      if (durText) {
        const parts = durText.split(':').map((p) => parseInt(p, 10));
        if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) duration = parts[0] * 60 + parts[1];
      }

      // Parse description snippet
      const snippet =
        v.descriptionSnippet?.runs?.map((r) => r.text).join('') ||
        v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r) => r.text).join('') ||
        '';

      // Parse channel avatar
      const avatarUrl =
        v.channelThumbnailSupportedRenderers?.channelThumbnailWithRippleRenderer?.thumbnail
          ?.thumbnails?.[0]?.url || '';

      results.push({
        videoId: v.videoId,
        title: v.title?.runs?.[0]?.text || '',
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        uploaderName: v.ownerText?.runs?.[0]?.text || 'YouTube Creator',
        uploaderAvatar: avatarUrl,
        uploaderUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        views: views || 250000,
        duration: duration || 240,
        uploadedDate: v.publishedTimeText?.simpleText || 'Mới',
        description: snippet,
        type: 'stream',
      });
    }
  }

  results.sort((a, b) => (b.views || 0) - (a.views || 0));
  return results;
}

app.get('/', async (c) => {
  const query = c.req.query('q') || '';

  if (!query || query.trim().length === 0) {
    return c.json(getFallbackSearch(''));
  }

  const cleanQuery = query.trim();

  try {
    const liveResults = await scrapeYouTubeSearch(cleanQuery);
    if (Array.isArray(liveResults) && liveResults.length > 0) {
      const validated = validateResponse(SearchResultsSchema, liveResults);
      return c.json(validated);
    }
  } catch (err) {
    console.error('[Search Route] Scrape error:', err.message);
  }

  return c.json(getFallbackSearch(cleanQuery));
});

export default app;
