"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { extractYouTubeId, formatDuration } from "@/lib/utils";
import {
  PlayCircle,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  ClipboardList,
  Clock,
  Pencil,
} from "lucide-react";

/**
 * VideoSection — manages video list + add-video form.
 * Videos open directly on YouTube (no embedded player).
 * Duration is auto-fetched from YouTube API on add/edit.
 */
export default function VideoSection({ stepId, initialVideos, roadmapId }) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({ title: "", youtubeUrl: "" });

  // On mount, refetch duration for ALL videos from YouTube to replace any stale
  // manually-entered values with accurate data from the API.
  useEffect(() => {
    if (initialVideos.length === 0) return;

    let needsRefresh = false;
    Promise.all(
      initialVideos.map(async (v) => {
        try {
          const res = await fetch(`/api/videos/${v.id}/refetch-duration`, { method: "POST" });
          if (!res.ok) return null;
          const updated = await res.json();
          if (updated.durationSeconds !== v.durationSeconds) {
            needsRefresh = true;
            setVideos((prev) =>
              prev.map((vid) => (vid.id === updated.id ? { ...vid, durationSeconds: updated.durationSeconds } : vid))
            );
          }
          return updated;
        } catch {
          return null;
        }
      })
    ).then(() => {
      if (needsRefresh) router.refresh(); // update step header estimatedHours
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({ title: form.title, youtubeUrl: form.youtubeUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add video");
      }
      const newVideo = await res.json();
      setVideos((prev) => [...prev, newVideo]);
      setForm({ title: "", youtubeUrl: "" });
      setShowAddForm(false);
      router.refresh(); // update step header (estimatedHours)
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
    router.refresh(); // update step header (estimatedHours)
  }

  function handleProgressSave(videoId, update) {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, ...update } : v))
    );
  }

  function handleVideoUpdate(videoId, update) {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, ...update } : v))
    );
    router.refresh(); // estimatedHours may have changed
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
              <p className="text-xs text-muted-foreground">
                Duration will be fetched automatically from YouTube.
              </p>
              {addError && <p className="text-sm text-destructive">{addError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={addLoading} className="gap-2">
                  {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {addLoading ? "Fetching duration…" : "Add"}
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
        <div className="grid grid-cols-1 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              stepId={stepId}
              roadmapId={roadmapId}
              onDelete={() => handleDeleteVideo(video.id)}
              onProgressSave={(update) => handleProgressSave(video.id, update)}
              onUpdate={(update) => handleVideoUpdate(video.id, update)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function VideoCard({ video, stepId, roadmapId, onDelete, onProgressSave, onUpdate }) {
  const ytId = extractYouTubeId(video.youtubeUrl);

  const watchPercent =
    video.durationSeconds > 0
      ? Math.min(100, Math.round((video.watchedSeconds / video.durationSeconds) * 100))
      : 0;

  // Log study time state
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ hours: "", minutes: "", notes: "" });
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState("");

  // Edit video state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: video.title, youtubeUrl: video.youtubeUrl });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  function handleLogChange(e) {
    setLogForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLogError("");
  }

  async function handleLogSubmit(e) {
    e.preventDefault();
    const hrs = parseInt(logForm.hours) || 0;
    const mins = parseInt(logForm.minutes) || 0;
    const totalHours = hrs + mins / 60;
    if (totalHours <= 0) {
      setLogError("Please enter at least 1 minute.");
      return;
    }
    setLogLoading(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, roadmapId, timeSpent: totalHours, notes: logForm.notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log");
      }

      // Update this video's watchedSeconds by the logged amount (capped at durationSeconds)
      const addedSeconds = Math.floor(totalHours * 3600);
      const newWatched =
        video.durationSeconds > 0
          ? Math.min(video.watchedSeconds + addedSeconds, video.durationSeconds)
          : video.watchedSeconds + addedSeconds;
      const newCompletion =
        video.durationSeconds > 0
          ? Math.min(100, Math.round((newWatched / video.durationSeconds) * 100))
          : 0;

      await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedSeconds: newWatched, completionPercentage: newCompletion }),
      });
      onProgressSave({ watchedSeconds: newWatched, completionPercentage: newCompletion });

      setLogForm({ hours: "", minutes: "", notes: "" });
      setLogOpen(false);
    } catch (err) {
      setLogError(err.message);
    } finally {
      setLogLoading(false);
    }
  }

  function handleEditChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setEditError("");
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editForm.youtubeUrl.trim()) {
      setEditError("YouTube URL is required.");
      return;
    }
    if (!extractYouTubeId(editForm.youtubeUrl)) {
      setEditError("Please enter a valid YouTube URL.");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editForm.title, youtubeUrl: editForm.youtubeUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update video");
      }
      const updated = await res.json();
      onUpdate(updated);
      setEditOpen(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col group">
      {/* Main row: thumbnail | info | actions */}
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div className="relative w-72 shrink-0 bg-muted overflow-hidden">
          {ytId ? (
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlayCircle className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {video.durationSeconds > 0 && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
              {formatDuration(video.durationSeconds)}
            </span>
          )}
          {watchPercent >= 100 && (
            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
              ✓ Done
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 px-6 py-5 min-w-0 flex flex-col justify-center">
          <p className="font-bold text-base leading-snug line-clamp-2 mb-1">{video.title}</p>
          {video.durationSeconds > 0 && (
            <p className="text-sm text-muted-foreground mb-3">
              {formatDuration(video.durationSeconds)} total
            </p>
          )}
          {/* Progress bar — always visible when duration is known */}
          {video.durationSeconds > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDuration(video.watchedSeconds)} studied</span>
                <span>{watchPercent}%</span>
              </div>
              <Progress value={watchPercent} className="h-2" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-stretch justify-center gap-2 px-5 py-5 border-l border-border shrink-0 w-44">
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 h-9 px-3 w-full transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Watch
          </a>
          <Button
            variant={logOpen ? "secondary" : "outline"}
            className="gap-2 w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
            onClick={() => { setLogOpen((o) => !o); setEditOpen(false); }}
          >
            <ClipboardList className="h-4 w-4" />
            Log
          </Button>
          <div className="flex gap-1 justify-center mt-1">
            <button
              onClick={() => {
                setEditOpen((o) => !o);
                setLogOpen(false);
                setEditForm({ title: video.title, youtubeUrl: video.youtubeUrl });
                setEditError("");
              }}
              className="p-2 rounded-md text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              title="Edit video"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove video"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inline log study time form */}
      {logOpen && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          <form onSubmit={handleLogSubmit} className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Log study time for this video</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  name="hours"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={logForm.hours}
                  onChange={handleLogChange}
                  className="pl-8 pr-9 h-8 text-sm"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">hrs</span>
              </div>
              <div className="relative flex-1">
                <Input
                  name="minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={logForm.minutes}
                  onChange={handleLogChange}
                  className="pr-9 h-8 text-sm"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">min</span>
              </div>
            </div>
            <Textarea
              name="notes"
              placeholder="Notes (optional)"
              value={logForm.notes}
              onChange={handleLogChange}
              rows={2}
              className="text-sm"
            />
            {logError && <p className="text-xs text-destructive">{logError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={logLoading} className="gap-2 flex-1">
                {logLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Log
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setLogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Inline edit form */}
      {editOpen && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Edit video</p>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-title-${video.id}`} className="text-xs">Title</Label>
              <Input
                id={`edit-title-${video.id}`}
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-url-${video.id}`} className="text-xs">YouTube URL</Label>
              <Input
                id={`edit-url-${video.id}`}
                name="youtubeUrl"
                value={editForm.youtubeUrl}
                onChange={handleEditChange}
                className="h-8 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Duration will be re-fetched automatically if the URL changes.
              </p>
            </div>
            {editError && <p className="text-xs text-destructive">{editError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={editLoading} className="gap-2 flex-1">
                {editLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editLoading ? "Saving…" : "Save Changes"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
