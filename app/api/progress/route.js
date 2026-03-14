import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TEMP_USER_ID = "user_default";

// GET /api/progress — recent progress logs
export async function GET(request) {
  try {
    // Guard against build-time invocation where request metadata can be unavailable.
    const searchParams = request?.nextUrl?.searchParams ?? new URL(request?.url ?? "http://localhost").searchParams;
    const parsedLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Number.isNaN(parsedLimit) ? 20 : Math.max(1, Math.min(parsedLimit, 200));
    const roadmapId = searchParams.get("roadmapId");

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: TEMP_USER_ID },
      select: { id: true },
    });
    const roadmapIds = roadmaps.map((r) => r.id);

    const logs = await prisma.progressLog.findMany({
      where: {
        roadmapId: roadmapId ? roadmapId : { in: roadmapIds },
      },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        roadmap: { select: { title: true } },
        step: { select: { title: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/progress", error);
    return NextResponse.json({ error: "Failed to fetch progress logs" }, { status: 500 });
  }
}

// POST /api/progress — log a study session
// Body: { roadmapId, stepId, timeSpent (hours), notes }
// Side effects:
//   - Updates step.progressHours and step.completionPercentage
//   - If step completion >= 100%, marks it complete and updates roadmap.completedSteps
export async function POST(request) {
  try {
    const body = await request.json();
    const { roadmapId, stepId, timeSpent, notes } = body;

    if (!roadmapId || !stepId) {
      return NextResponse.json({ error: "roadmapId and stepId are required" }, { status: 400 });
    }

    const hours = parseFloat(timeSpent);
    if (isNaN(hours) || hours <= 0) {
      return NextResponse.json({ error: "timeSpent must be a positive number" }, { status: 400 });
    }

    // Fetch current step state
    const step = await prisma.step.findUnique({ where: { id: stepId } });
    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const newProgressHours = step.progressHours + hours;
    const newPercent =
      step.estimatedHours > 0
        ? Math.min(100, Math.round((newProgressHours / step.estimatedHours) * 100))
        : 0;
    const nowCompleted = newPercent >= 100 && !step.isCompleted;

    // Run everything atomically
    const [log] = await prisma.$transaction([
      prisma.progressLog.create({
        data: { roadmapId, stepId, timeSpent: hours, notes: notes?.trim() || null },
      }),
      prisma.step.update({
        where: { id: stepId },
        data: {
          progressHours: newProgressHours,
          completionPercentage: newPercent,
          isCompleted: nowCompleted ? true : step.isCompleted,
        },
      }),
      ...(nowCompleted
        ? [
            prisma.roadmap.update({
              where: { id: roadmapId },
              data: { completedSteps: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/progress", error);
    return NextResponse.json({ error: "Failed to log progress" }, { status: 500 });
  }
}
