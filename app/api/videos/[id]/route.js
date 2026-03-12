import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/videos/[id] — update video watch progress (called by YouTubePlayer)
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

// DELETE /api/videos/[id] — remove a video from a step
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.video.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
