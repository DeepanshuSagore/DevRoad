"use client";

import { useEffect, useRef, useCallback } from "react";
import { buildYouTubeEmbedUrl, extractYouTubeId } from "@/lib/utils";

/**
 * YouTubePlayer — embeds a YouTube video with resume-playback support.
 *
 * Architecture:
 *  - The iframe is built with `?start=watchedSeconds` so it starts at the
 *    last saved position immediately on load (no JS API needed for basic resume).
 *  - The YouTube IFrame Player API is loaded once and used to periodically
 *    save the current playback position back to the server (every 5 seconds).
 *  - On unmount, the final position is saved to prevent data loss.
 *
 * @param {string}   props.videoId         - Prisma Video record ID (for saving progress)
 * @param {string}   props.youtubeUrl      - Full YouTube URL
 * @param {number}   props.watchedSeconds  - Last saved position (enables resume)
 * @param {number}   props.durationSeconds - Total duration (for completion %)
 * @param {Function} props.onProgressSave  - Optional callback after each save
 */
export default function YouTubePlayer({
  videoId,
  youtubeUrl,
  watchedSeconds = 0,
  durationSeconds = 0,
  onProgressSave,
}) {
  const playerRef = useRef(null);
  const iframeId = `yt-player-${videoId}`;
  const saveIntervalRef = useRef(null);
  const lastSavedRef = useRef(watchedSeconds);

  const youtubeVideoId = extractYouTubeId(youtubeUrl);
  const embedUrl = youtubeVideoId
    ? buildYouTubeEmbedUrl(youtubeVideoId, watchedSeconds)
    : null;

  // Save progress to API
  const saveProgress = useCallback(
    async (seconds) => {
      if (!seconds || seconds === lastSavedRef.current) return;
      lastSavedRef.current = seconds;

      const completion =
        durationSeconds > 0
          ? Math.min(100, Math.round((seconds / durationSeconds) * 100))
          : 0;

      try {
        await fetch(`/api/videos/${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchedSeconds: Math.floor(seconds), completionPercentage: completion }),
        });
        onProgressSave?.({ watchedSeconds: Math.floor(seconds), completionPercentage: completion });
      } catch {
        // Silent — progress saves are best-effort
      }
    },
    [videoId, durationSeconds, onProgressSave]
  );

  useEffect(() => {
    if (!youtubeVideoId) return;

    // Load YouTube IFrame API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    function initPlayer() {
      if (!window.YT?.Player) return;

      playerRef.current = new window.YT.Player(iframeId, {
        events: {
          onReady: () => {
            // Start periodic progress saves every 5 seconds while playing
            saveIntervalRef.current = setInterval(async () => {
              const player = playerRef.current;
              if (!player?.getPlayerState) return;
              // YT.PlayerState.PLAYING = 1
              if (player.getPlayerState() === 1) {
                const currentTime = player.getCurrentTime();
                await saveProgress(currentTime);
              }
            }, 5000);
          },
          onStateChange: async (event) => {
            // YT.PlayerState.PAUSED = 2, ENDED = 0
            if (event.data === 2 || event.data === 0) {
              const currentTime = playerRef.current?.getCurrentTime?.() ?? 0;
              await saveProgress(currentTime);
            }
          },
        },
      });
    }

    // If YT API is already loaded, init immediately
    if (window.YT?.Player) {
      initPlayer();
    } else {
      // Otherwise wait for the API ready callback
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
    }

    return () => {
      clearInterval(saveIntervalRef.current);
      // Save position on unmount
      const player = playerRef.current;
      if (player?.getCurrentTime) {
        saveProgress(player.getCurrentTime());
      }
    };
  }, [youtubeVideoId, iframeId, saveProgress]);

  if (!youtubeVideoId) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl bg-muted border border-border text-muted-foreground text-sm">
        Invalid YouTube URL
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black aspect-video shadow-lg">
      <iframe
        id={iframeId}
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
