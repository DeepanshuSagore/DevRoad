// Force dynamic rendering — this page reads from the DB on every request
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeStreak, getTodayStudyHours } from "@/lib/streak";
import { calcPercent, formatDuration, formatHours } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StreakCounter from "@/components/StreakCounter";
import {
  Map,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const TEMP_USER_ID = "user_default";

/**
 * Dashboard — Server Component.
 * Fetches all data on the server for zero client-side loading state.
 */
export default async function DashboardPage() {
  // Ensure user exists
  await prisma.user.upsert({
    where: { id: TEMP_USER_ID },
    update: {},
    create: { id: TEMP_USER_ID, email: "dev@devroad.local", name: "Developer" },
  });

  const [roadmaps, streakData, todayHours] = await Promise.all([
    prisma.roadmap.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { steps: true } } },
    }),
    computeStreak(TEMP_USER_ID),
    getTodayStudyHours(TEMP_USER_ID),
  ]);

  const inProgressRoadmaps = roadmaps.filter(
    (r) => r.completedSteps > 0 && r.completedSteps < r.totalSteps
  );
  const totalStudyHours = roadmaps.reduce((acc, r) => acc, 0); // computed via logs

  // Recent progress (last 5 logs)
  const recentLogs = await prisma.progressLog.findMany({
    where: { roadmapId: { in: roadmaps.map((r) => r.id) } },
    orderBy: { date: "desc" },
    take: 5,
    include: {
      roadmap: { select: { title: true } },
      step: { select: { title: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your learning progress at a glance.
          </p>
        </div>
        <Link href="/roadmaps/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Roadmap
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Map className="h-4 w-4 text-primary" />}
          label="Total Roadmaps"
          value={roadmaps.length}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          label="In Progress"
          value={inProgressRoadmaps.length}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          label="Studied Today"
          value={formatHours(todayHours)}
        />
        <div className="col-span-1">
          <StreakCounter
            streak={streakData.streak}
            todayStudied={streakData.todayStudied}
          />
        </div>
      </div>

      {/* Active roadmaps */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Active Roadmaps
          </h2>
          <Link href="/roadmaps">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {roadmaps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {roadmaps.slice(0, 4).map((roadmap) => {
              const percent = calcPercent(roadmap.completedSteps, roadmap.totalSteps);
              return (
                <Link key={roadmap.id} href={`/roadmaps/${roadmap.id}`}>
                  <Card className="hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{roadmap.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {roadmap.completedSteps}/{roadmap.totalSteps} steps completed
                          </p>
                        </div>
                        <Badge
                          variant={
                            percent === 100
                              ? "success"
                              : percent > 0
                              ? "default"
                              : "secondary"
                          }
                        >
                          {percent}%
                        </Badge>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {log.step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.roadmap.title}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    +{formatHours(log.timeSpent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <Map className="h-10 w-10 text-muted-foreground mb-4" />
      <p className="text-sm font-medium text-foreground">No roadmaps yet</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Create your first learning roadmap to get started.
      </p>
      <Link href="/roadmaps/new">
        <Button size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Create Roadmap
        </Button>
      </Link>
    </div>
  );
}
