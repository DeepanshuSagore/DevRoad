import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary: hardcoded userId until auth is wired up.
// Replace with session.user.id once NextAuth is configured.
const TEMP_USER_ID = "user_default";

/**
 * Ensure the default user exists in the database.
 * This is a dev-only helper — remove when real auth is added.
 */
async function ensureUser() {
  return prisma.user.upsert({
    where: { id: TEMP_USER_ID },
    update: {},
    create: {
      id: TEMP_USER_ID,
      email: "dev@devroad.local",
      name: "Developer",
    },
  });
}

// GET /api/roadmaps — list all roadmaps for the current user
export async function GET() {
  try {
    await ensureUser();
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { steps: true, progressLogs: true } },
      },
    });
    return NextResponse.json(roadmaps);
  } catch (error) {
    console.error("GET /api/roadmaps", error);
    return NextResponse.json({ error: "Failed to fetch roadmaps" }, { status: 500 });
  }
}

// POST /api/roadmaps — create a new roadmap
export async function POST(request) {
  try {
    await ensureUser();
    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: TEMP_USER_ID,
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(roadmap, { status: 201 });
  } catch (error) {
    console.error("POST /api/roadmaps", error);
    return NextResponse.json({ error: "Failed to create roadmap" }, { status: 500 });
  }
}
