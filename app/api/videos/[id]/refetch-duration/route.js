import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractYouTubeId } from "@/lib/utils";
import { fetchYouTubeDuration } from "@/lib/youtube";

// POST /api/videos/[id]/refetch-duration
// Fetches the YouTube duration for an existing video and updates the record.
// Also recalculates the parent step's estimatedHours.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const ytId = extractYouTubeId(video.youtubeUrl);
    if (!ytId) {
      return NextResponse.json({ error: "Invalid YouTube URL on this video" }, { status: 400 });
    }

    const durationSeconds = await fetchYouTubeDuration(ytId);
    if (durationSeconds === 0) {
      // API key missing or quota hit — return current record unchanged
      return NextResponse.json(video);
    }

    const updated = await prisma.video.update({
      where: { id },
      data: { durationSeconds },
    });

    // Recalculate step estimatedHours
    const videos = await prisma.video.findMany({
      where: { stepId: video.stepId },
      select: { durationSeconds: true },
    });
    const totalSeconds = videos.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
    await prisma.step.update({
      where: { id: video.stepId },
      data: { estimatedHours: totalSeconds / 3600 },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/videos/[id]/refetch-duration", error);
    return NextResponse.json({ error: "Failed to refetch duration" }, { status: 500 });
  }
}
