export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcPercent, formatHours } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock, Plus, ArrowRight } from "lucide-react";

const TEMP_USER_ID = "user_default";

export default async function Home() {
  // Ensure user exists
  await prisma.user.upsert({
    where: { id: TEMP_USER_ID },
    update: {},
    create: { id: TEMP_USER_ID, email: "dev@devroad.local", name: "Developer" },
  });

  // Fetch the most recently updated roadmap with its ordered steps
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: TEMP_USER_ID },
    orderBy: { updatedAt: "desc" },
    include: {
      steps: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome to DevRoad</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            Create your first learning roadmap and track your progress step by step.
          </p>
        </div>
        <Link href="/roadmaps/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first roadmap
          </Button>
        </Link>
      </div>
    );
  }

  const roadmapPercent = calcPercent(roadmap.completedSteps, roadmap.totalSteps);

  // Find the first incomplete step (the "active" one)
  const activeIndex = roadmap.steps.findIndex((s) => !s.isCompleted);

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-2">
      {/* Roadmap header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Roadmap</p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{roadmap.title}</h1>
            {roadmap.description && (
              <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
            )}
          </div>
          <Link href={`/roadmaps/${roadmap.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Progress value={roadmapPercent} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground shrink-0">
            {roadmap.completedSteps}/{roadmap.totalSteps} steps · {roadmapPercent}%
          </span>
        </div>
      </div>

      {/* Linked step tree */}
      {roadmap.steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          No steps yet.{" "}
          <Link href={`/roadmaps/${roadmap.id}`} className="text-primary hover:underline">
            Add your first step →
          </Link>
        </div>
      ) : (
        <div className="relative">
          {roadmap.steps.map((step, i) => {
            const isActive = i === activeIndex;
            const isLocked = !step.isCompleted && i > activeIndex;
            const percent = step.isCompleted
              ? 100
              : calcPercent(step.progressHours, step.estimatedHours);
            const isLast = i === roadmap.steps.length - 1;

            return (
              <div key={step.id} className="flex gap-4">
                {/* Connector column */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  {/* Node icon */}
                  <div
                    className={[
                      "z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 transition-colors",
                      step.isCompleted
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : isActive
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted border-border text-muted-foreground",
                    ].join(" ")}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isLocked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  {/* Vertical connector line */}
                  {!isLast && (
                    <div
                      className={[
                        "w-0.5 flex-1 min-h-[28px]",
                        step.isCompleted ? "bg-emerald-500/40" : "bg-border",
                      ].join(" ")}
                    />
                  )}
                </div>

                {/* Step card */}
                <div className={["flex-1 pb-6", isLast ? "pb-0" : ""].join(" ")}>
                  <Link href={`/steps/${step.id}`} className="block group">
                    <div
                      className={[
                        "rounded-xl border p-4 transition-all",
                        step.isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                          : isActive
                          ? "border-primary/50 bg-primary/5 hover:border-primary ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-border/80 opacity-60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">
                              Step {step.orderIndex + 1}
                            </span>
                            {step.isCompleted && (
                              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                                Completed
                              </Badge>
                            )}
                            {isActive && !step.isCompleted && (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5">
                                Up Next
                              </Badge>
                            )}
                          </div>
                          <p
                            className={[
                              "font-semibold text-sm leading-snug",
                              isLocked ? "text-muted-foreground" : "text-foreground",
                            ].join(" ")}
                          >
                            {step.title}
                          </p>
                          {step.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {step.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 text-xs text-muted-foreground">
                          {step.estimatedHours > 0 && (
                            <span>{formatHours(step.estimatedHours)}</span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar for in-progress steps */}
                      {!step.isCompleted && percent > 0 && (
                        <div className="mt-3 space-y-1">
                          <Progress value={percent} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground text-right">{percent}%</p>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer links */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
        <Link href="/roadmaps" className="hover:text-foreground transition-colors">
          ← All roadmaps
        </Link>
        <Link href="/roadmaps/new" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Plus className="h-3 w-3" />
          New roadmap
        </Link>
      </div>
    </div>
  );
}

