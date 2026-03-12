import { NextResponse } from "next/server";
import { computeStreak, getTodayStudyHours } from "@/lib/streak";

const TEMP_USER_ID = "user_default";

// GET /api/streak — returns current streak and today's study time
export async function GET() {
  try {
    const [streakData, todayHours] = await Promise.all([
      computeStreak(TEMP_USER_ID),
      getTodayStudyHours(TEMP_USER_ID),
    ]);

    return NextResponse.json({
      ...streakData,
      todayHours,
    });
  } catch (error) {
    console.error("GET /api/streak", error);
    return NextResponse.json({ error: "Failed to compute streak" }, { status: 500 });
  }
}
