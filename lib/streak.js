import { prisma } from "@/lib/prisma";

/**
 * Compute the current learning streak for a user.
 *
 * Algorithm:
 *  1. Fetch all distinct UTC calendar dates on which the user logged study time.
 *  2. Sort descending (most recent first).
 *  3. Starting from today (or yesterday if today has no log), count consecutive days.
 *
 * Returns: { streak: number, lastStudied: Date | null, todayStudied: boolean }
 */
export async function computeStreak(userId) {
  // Get all roadmap IDs for this user
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    select: { id: true },
  });

  if (roadmaps.length === 0) {
    return { streak: 0, lastStudied: null, todayStudied: false };
  }

  const roadmapIds = roadmaps.map((r) => r.id);

  // Fetch distinct study dates (as date strings YYYY-MM-DD)
  const logs = await prisma.progressLog.findMany({
    where: { roadmapId: { in: roadmapIds } },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  if (logs.length === 0) {
    return { streak: 0, lastStudied: null, todayStudied: false };
  }

  // Deduplicate to unique calendar days (UTC)
  const uniqueDays = [
    ...new Set(
      logs.map((log) => {
        const d = new Date(log.date);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      })
    ),
  ].sort((a, b) => (a > b ? -1 : 1)); // descending

  const todayStr = (() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  })();

  const yesterdayStr = (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  })();

  const todayStudied = uniqueDays[0] === todayStr;

  // Streak starts from today if studied today, or yesterday if studied yesterday
  // Otherwise streak is 0
  let streak = 0;
  let cursor = todayStudied ? todayStr : yesterdayStr;

  if (!uniqueDays.includes(cursor)) {
    return {
      streak: 0,
      lastStudied: logs[0]?.date ?? null,
      todayStudied: false,
    };
  }

  // Walk backwards through consecutive days
  for (const day of uniqueDays) {
    if (day === cursor) {
      streak++;
      // Move cursor back one day
      const d = new Date(cursor + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      cursor = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    } else if (day < cursor) {
      // Gap found — streak ends
      break;
    }
  }

  return {
    streak,
    lastStudied: logs[0]?.date ?? null,
    todayStudied,
  };
}

/**
 * Get today's total study hours across all roadmaps for a user.
 */
export async function getTodayStudyHours(userId) {
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    select: { id: true },
  });

  if (roadmaps.length === 0) return 0;

  const roadmapIds = roadmaps.map((r) => r.id);
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const result = await prisma.progressLog.aggregate({
    where: {
      roadmapId: { in: roadmapIds },
      date: { gte: todayStart },
    },
    _sum: { timeSpent: true },
  });

  return result._sum.timeSpent ?? 0;
}
