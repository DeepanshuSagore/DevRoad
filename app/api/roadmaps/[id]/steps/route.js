import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/roadmaps/[id]/steps — list all steps for a roadmap
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const steps = await prisma.step.findMany({
      where: { roadmapId: id },
      orderBy: { orderIndex: "asc" },
      include: {
        _count: { select: { videos: true } },
      },
    });
    return NextResponse.json(steps);
  } catch (error) {
    console.error("GET /api/roadmaps/[id]/steps", error);
    return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 });
  }
}

// POST /api/roadmaps/[id]/steps — add a new step
export async function POST(request, { params }) {
  try {
    const { id: roadmapId } = await params;
    const body = await request.json();
    const { title, description, estimatedHours } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Determine next order index
    const lastStep = await prisma.step.findFirst({
      where: { roadmapId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    const nextIndex = (lastStep?.orderIndex ?? -1) + 1;

    // Create step + increment roadmap totalSteps in a transaction
    const [step] = await prisma.$transaction([
      prisma.step.create({
        data: {
          roadmapId,
          title: title.trim(),
          description: description?.trim() || null,
          estimatedHours: parseFloat(estimatedHours) || 0,
          orderIndex: nextIndex,
        },
      }),
      prisma.roadmap.update({
        where: { id: roadmapId },
        data: { totalSteps: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("POST /api/roadmaps/[id]/steps", error);
    return NextResponse.json({ error: "Failed to create step" }, { status: 500 });
  }
}
