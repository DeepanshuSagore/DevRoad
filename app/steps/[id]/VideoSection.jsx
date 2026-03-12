"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import YouTubePlayer from "@/components/YouTubePlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { extractYouTubeId, formatDuration } from "@/lib/utils";
import {
  PlayCircle,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

/**
 * VideoSection — manages video list + YouTube player + add-video form.
 *
 * Resume-playback architecture:
 *  Each Video record stores `watchedSeconds` in the DB.
 *  When the player is opened, we pass `watchedSeconds` to YouTubePlayer,
 *  which builds the embed URL with `?start=watchedSeconds`.
 *  The player then saves progress back to /api/videos/[id] every 5s.
 */
export default function VideoSection({ stepId, initialVideos, roadmapId }) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({ title: "", youtubeUrl: "", durationSeconds: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setAddError("");
  }

  async function handleAddVideo(e) {
    e.preventDefault();
    if (!form.youtubeUrl.trim()) {
      setAddError("YouTube URL is required.");
      return;
    }
    if (!extractYouTubeId(form.youtubeUrl)) {
      setAddError("Please enter a valid YouTube URL.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch(`/api/steps/${stepId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add video");
      }
      const newVideo = await res.json();
      setVideos((prev) => [...prev, newVideo]);
      setForm({ title: "", youtubeUrl: "", durationSeconds: "" });
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteVideo(videoId) {
    if (!confirm("Remove this video?")) return;
    await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    if (activeVideoId === videoId) setActiveVideoId(null);
  }

  function handleProgressSave(videoId, update) {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, ...update } : v))
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Videos ({videos.length})
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowAddForm((s) => !s)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Video
        </Button>
      </div>

      {/* Add video form */}
      {showAddForm && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yt-url">YouTube URL *</Label>
                <Input
                  id="yt-url"
                  name="youtubeUrl"
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.youtubeUrl}
                  onChange={handleChange}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vid-title">Title (optional)</Label>
                <Input
                  id="vid-title"
                  name="title"
                  placeholder="e.g. Python Tutorial for Beginners"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vid-duration">Duration in seconds (optional)</Label>
                <Input
                  id="vid-duration"
                  name="durationSeconds"
                  type="number"
                  min="0"
                  placeholder="e.g. 3600 for 1 hour"
                  value={form.durationSeconds}
                  onChange={handleChange}
                />
              </div>
              {addError && <p className="text-sm text-destructive">{addError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={addLoading} className="gap-2">
                  {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowAddForm(false); setAddError(""); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Video list */}
      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <PlayCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No videos yet. Add a YouTube tutorial to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isActive={activeVideoId === video.id}
              onToggle={() =>
                setActiveVideoId((prev) => (prev === video.id ? null : video.id))
              }
              onDelete={() => handleDeleteVideo(video.id)}
              onProgressSave={(update) => handleProgressSave(video.id, update)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function VideoCard({ video, isActive, onToggle, onDelete, onProgressSave }) {
  const ytId = extractYouTubeId(video.youtubeUrl);
  const resumeLabel =
    video.watchedSeconds > 0
      ? `Resume at ${formatDuration(video.watchedSeconds)}`
      : "Watch";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Video header */}
        <div className="flex items-center gap-3 p-4">
          {/* Thumbnail */}
          {ytId && (
            <img
              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
              alt=""
              className="h-12 w-20 rounded-lg object-cover shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{video.title}</p>
            <div className="flex items-center gap-2 mt-1">
              {video.completionPercentage > 0 && (
                <Badge
                  variant={video.completionPercentage >= 100 ? "success" : "default"}
                  className="text-xs"
                >
                  {Math.round(video.completionPercentage)}%
                </Badge>
              )}
              {video.durationSeconds > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(video.durationSeconds)}
                </span>
              )}
            </div>
            {video.completionPercentage > 0 && video.completionPercentage < 100 && (
              <Progress
                value={video.completionPercentage}
                className="h-1 mt-1.5"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={onToggle}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {isActive ? "Hide" : resumeLabel}
              {isActive ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Open on YouTube"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"
              title="Remove video"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded player — only rendered when active to save resources */}
        {isActive && (
          <div className="px-4 pb-4">
            <YouTubePlayer
              videoId={video.id}
              youtubeUrl={video.youtubeUrl}
              watchedSeconds={video.watchedSeconds}
              durationSeconds={video.durationSeconds}
              onProgressSave={onProgressSave}
            />
            {video.watchedSeconds > 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Resuming from {formatDuration(video.watchedSeconds)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
