/**
 * Fetch a YouTube video's duration in seconds using the YouTube Data API v3.
 * Requires YOUTUBE_API_KEY in environment variables.
 * Returns 0 gracefully if the key is missing or the request fails.
 */
export async function fetchYouTubeDuration(youtubeVideoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "your-youtube-api-key-here") return 0;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${encodeURIComponent(youtubeVideoId)}&key=${apiKey}`
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return 0;

    const duration = parseISO8601Duration(item.contentDetails?.duration || "");
    return duration;
  } catch {
    return 0;
  }
}

/**
 * Parse an ISO 8601 duration string (e.g. "PT1H23M45S") to seconds.
 */
function parseISO8601Duration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}
