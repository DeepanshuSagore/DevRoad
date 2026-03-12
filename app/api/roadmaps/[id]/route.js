import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/roadmaps/[id] — fetch a single roadmap with steps and their video counts
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { orderIndex: "asc" },
          include: {
            _count: { select: { videos: true } },
          },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("GET /api/roadmaps/[id]", error);
    return NextResponse.json({ error: "Failed to fetch roadmap" }, { status: 500 });
  }
}

// PUT /api/roadmaps/[id] — update roadmap title/description
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const roadmap = await prisma.roadmap.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("PUT /api/roadmaps/[id]", error);
    return NextResponse.json({ error: "Failed to update roadmap" }, { status: 500 });
  }
}

// DELETE /api/roadmaps/[id] — delete roadmap and cascade steps/videos/logs
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.roadmap.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/roadmaps/[id]", error);
    return NextResponse.json({ error: "Failed to delete roadmap" }, { status: 500 });
  }
}
