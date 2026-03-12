import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractYouTubeId } from "@/lib/utils";
import { fetchYouTubeDuration } from "@/lib/youtube";

// PATCH /api/videos/[id] — update video watch progress
// Body: { watchedSeconds: number, completionPercentage: number }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { watchedSeconds, completionPercentage } = body;

    const video = await prisma.video.update({
      where: { id },
      data: {
        watchedSeconds: Math.max(0, Math.floor(watchedSeconds ?? 0)),
        completionPercentage: Math.min(100, Math.max(0, completionPercentage ?? 0)),
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("PATCH /api/videos/[id]", error);
    return NextResponse.json({ error: "Failed to update video progress" }, { status: 500 });
  }
}

// PUT /api/videos/[id] — edit video title and/or URL
// Re-fetches duration if the URL changes; recalculates step estimatedHours.
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, youtubeUrl } = body;

    if (!youtubeUrl?.trim()) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }
    const ytId = extractYouTubeId(youtubeUrl.trim());
    if (!ytId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Re-fetch duration only when the URL changed
    const urlChanged = youtubeUrl.trim() !== existing.youtubeUrl;
    const durationSeconds = urlChanged
      ? await fetchYouTubeDuration(ytId)
      : existing.durationSeconds;

    const video = await prisma.video.update({
      where: { id },
      data: {
        title: title?.trim() || existing.title,
        youtubeUrl: youtubeUrl.trim(),
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
        durationSeconds,
      },
    });

    // Recalculate step estimatedHours
    await recalcStepEstimatedHours(existing.stepId);

    return NextResponse.json(video);
  } catch (error) {
    console.error("PUT /api/videos/[id]", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

// DELETE /api/videos/[id] — remove a video and recalculate step estimatedHours
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({ where: { id }, select: { stepId: true } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    await prisma.video.delete({ where: { id } });
    await recalcStepEstimatedHours(video.stepId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}

/** Recalculate and persist the step's estimatedHours from its videos' durations. */
async function recalcStepEstimatedHours(stepId) {
  const videos = await prisma.video.findMany({
    where: { stepId },
    select: { durationSeconds: true },
  });
  const totalSeconds = videos.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
  await prisma.step.update({
    where: { id: stepId },
    data: { estimatedHours: totalSeconds / 3600 },
  });
}
