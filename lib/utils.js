import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — Merge Tailwind classes safely.
 * Combines clsx (conditional classes) with tailwind-merge (deduplicate conflicts).
 * Example: cn("px-2 py-1", isActive && "bg-primary", "px-4")  → "py-1 bg-primary px-4"
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a duration in seconds into a human-readable string.
 * e.g. 3725 → "1h 2m 5s"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && h === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * Format a decimal hours value into "x hrs y min" (e.g. 1.5 → "1 hr 30 min").
 */
export function formatHours(hours) {
  if (!hours || hours <= 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr${h !== 1 ? "s" : ""}`;
  return `${h} hr${h !== 1 ? "s" : ""} ${m} min`;
}

/**
 * Calculate completion percentage (0-100), clamped.
 */
export function calcPercent(value, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

/**
 * Format ISO date string to "Mar 12, 2026" style.
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Extract YouTube video ID from a URL.
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /\/embed\/([^?&#]+)/,
    /\/shorts\/([^?&#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Build a YouTube embed URL with optional start time and API enablement.
 */
export function buildYouTubeEmbedUrl(videoId, startSeconds = 0) {
  const base = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams({
    enablejsapi: "1",
    start: Math.floor(startSeconds).toString(),
    rel: "0",
    modestbranding: "1",
  });
  return `${base}?${params.toString()}`;
}
