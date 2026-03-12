export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcPercent } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StepCard from "@/components/StepCard";
import AddStepForm from "./AddStepForm";
import { ArrowLeft, Pencil, BookOpen, Clock } from "lucide-react";

/**
 * Roadmap Detail — Server Component.
 * Fetches roadmap + all steps server-side for fast initial render.
 * The AddStepForm and StepCard components handle mutations client-side.
 */
export default async function RoadmapDetailPage({ params }) {
  const { id } = await params;

  const roadmap = await prisma.roadmap.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { videos: true } } },
      },
    },
  });

  if (!roadmap) notFound();

  const percent = calcPercent(roadmap.completedSteps, roadmap.totalSteps);
  const totalHours = roadmap.steps.reduce((acc, s) => acc + s.progressHours, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/roadmaps">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" />
          All Roadmaps
        </Button>
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-snug">
                {roadmap.title}
              </h1>
              {roadmap.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {roadmap.description}
                </p>
              )}
            </div>
            <Link href={`/roadmaps/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{percent}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {roadmap.completedSteps}/{roadmap.totalSteps}
              </p>
              <p className="text-xs text-muted-foreground">Steps</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {totalHours.toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">Studied</p>
            </div>
          </div>

          <Progress value={percent} className="h-2" />
        </CardContent>
      </Card>

      {/* Steps list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Steps ({roadmap.steps.length})
          </h2>
        </div>

        {roadmap.steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No steps yet. Add your first step below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {roadmap.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                roadmapId={id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add step form */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Add Step
        </h2>
        <AddStepForm roadmapId={id} />
      </section>
    </div>
  );
}
