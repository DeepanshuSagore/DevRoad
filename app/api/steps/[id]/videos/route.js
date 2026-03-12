import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractYouTubeId } from "@/lib/utils";
import { fetchYouTubeDuration } from "@/lib/youtube";

// GET /api/steps/[id]/videos — list all videos for a step
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const videos = await prisma.video.findMany({
      where: { stepId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// POST /api/steps/[id]/videos — add a YouTube video to a step
// Duration is auto-fetched from YouTube API; step estimatedHours is recalculated.
export async function POST(request, { params }) {
  try {
    const { id: stepId } = await params;
    const body = await request.json();
    const { title, youtubeUrl } = body;

    if (!youtubeUrl?.trim()) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    const ytId = extractYouTubeId(youtubeUrl.trim());
    if (!ytId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Auto-fetch duration from YouTube Data API
    const durationSeconds = await fetchYouTubeDuration(ytId);

    const video = await prisma.video.create({
      data: {
        stepId,
        title: title?.trim() || `Video ${ytId}`,
        youtubeUrl: youtubeUrl.trim(),
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
        durationSeconds,
      },
    });

    // Recalculate step estimatedHours = sum of all video durations
    await recalcStepEstimatedHours(stepId);

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("POST /api/steps/[id]/videos", error);
    return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
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
