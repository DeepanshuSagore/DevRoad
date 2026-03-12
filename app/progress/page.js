export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { computeStreak, getTodayStudyHours } from "@/lib/streak";
import { Card, CardContent } from "@/components/ui/card";
import StreakCounter from "@/components/StreakCounter";
import { BookOpen, Clock, TrendingUp } from "lucide-react";
import { formatHours } from "@/lib/utils";

const TEMP_USER_ID = "user_default";

/**
 * Progress Log page — Server Component.
 * Shows all study sessions grouped by date, plus streak and today stats.
 */
export default async function ProgressPage() {
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: TEMP_USER_ID },
    select: { id: true },
  });

  const roadmapIds = roadmaps.map((r) => r.id);

  const [logs, streakData, todayHours] = await Promise.all([
    prisma.progressLog.findMany({
      where: { roadmapId: { in: roadmapIds } },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        roadmap: { select: { title: true } },
        step: { select: { title: true } },
      },
    }),
    computeStreak(TEMP_USER_ID),
    getTodayStudyHours(TEMP_USER_ID),
  ]);

  // Group logs by calendar date
  const grouped = logs.reduce((acc, log) => {
    const date = new Date(log.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const totalHoursLogged = logs.reduce((acc, l) => acc + l.timeSpent, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Progress Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your complete study history.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold">{formatHours(todayHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Logged</span>
            </div>
            <p className="text-2xl font-bold">{formatHours(totalHoursLogged)}</p>
          </CardContent>
        </Card>
        <div className="col-span-2 md:col-span-1">
          <StreakCounter
            streak={streakData.streak}
            todayStudied={streakData.todayStudied}
          />
        </div>
      </div>

      {/* Log entries */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No study sessions logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Open a step and log your study time to start building your streak.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => {
            const dayTotal = entries.reduce((acc, l) => acc + l.timeSpent, 0);
            return (
              <section key={date}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">{date}</h2>
                  <span className="text-xs text-muted-foreground">
                    {formatHours(dayTotal)} total
                  </span>
                </div>
                <div className="space-y-2">
                  {entries.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{log.step.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.roadmap.title}
                          </p>
                          {log.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              &quot;{log.notes}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">
                          +{formatHours(log.timeSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
