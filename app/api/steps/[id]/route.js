import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/steps/[id] — fetch step with videos
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const step = await prisma.step.findUnique({
      where: { id },
      include: {
        videos: { orderBy: { createdAt: "asc" } },
        roadmap: { select: { id: true, title: true } },
      },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error("GET /api/steps/[id]", error);
    return NextResponse.json({ error: "Failed to fetch step" }, { status: 500 });
  }
}

// PUT /api/steps/[id] — update step metadata
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, estimatedHours, isCompleted } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const existing = await prisma.step.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const wasCompleted = existing.isCompleted;
    const nowCompleted = isCompleted ?? existing.isCompleted;

    const step = await prisma.step.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        estimatedHours: parseFloat(estimatedHours) ?? existing.estimatedHours,
        isCompleted: nowCompleted,
        completionPercentage: nowCompleted ? 100 : existing.completionPercentage,
      },
    });

    // Update roadmap completedSteps if completion status changed
    if (wasCompleted !== nowCompleted) {
      await prisma.roadmap.update({
        where: { id: existing.roadmapId },
        data: { completedSteps: { increment: nowCompleted ? 1 : -1 } },
      });
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error("PUT /api/steps/[id]", error);
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}

// DELETE /api/steps/[id] — delete step and decrement roadmap counter
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const step = await prisma.step.findUnique({ where: { id } });
    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.step.delete({ where: { id } }),
      prisma.roadmap.update({
        where: { id: step.roadmapId },
        data: {
          totalSteps: { decrement: 1 },
          completedSteps: step.isCompleted ? { decrement: 1 } : undefined,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/steps/[id]", error);
    return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
  }
}
