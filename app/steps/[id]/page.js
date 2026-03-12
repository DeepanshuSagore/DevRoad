export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcPercent, formatDuration, formatHours } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import VideoSection from "./VideoSection";
import MarkCompleteButton from "./MarkCompleteButton";

/**
 * Step Detail — Server Component.
 *
 * Architecture decision:
 *  Videos are rendered as a Client Component (VideoSection) so the
 *  YouTube player API and add-video form can be interactive.
 *  The progress log form is also a Client Component.
 */
export default async function StepDetailPage({ params }) {
  const { id } = await params;

  const step = await prisma.step.findUnique({
    where: { id },
    include: {
      videos: { orderBy: { createdAt: "asc" } },
      roadmap: { select: { id: true, title: true } },
    },
  });

  if (!step) notFound();

  const percent = step.isCompleted
    ? 100
    : calcPercent(step.progressHours, step.estimatedHours);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/roadmaps/${step.roadmap.id}`}
          className="hover:text-foreground transition-colors"
        >
          {step.roadmap.title}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{step.title}</span>
      </div>

      {/* Step header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Step {step.orderIndex + 1}
                </span>
                <Badge variant={step.isCompleted ? "success" : percent > 0 ? "default" : "secondary"}>
                  {step.isCompleted ? "Completed" : percent > 0 ? "In Progress" : "Not Started"}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">{step.title}</h1>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              )}
            </div>
            <MarkCompleteButton stepId={id} isCompleted={step.isCompleted} />
          </div>

          <Separator className="my-4" />

          {/* Progress stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold">{percent}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{formatHours(step.progressHours)}</p>
              <p className="text-xs text-muted-foreground">Studied</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{formatHours(step.estimatedHours)}</p>
              <p className="text-xs text-muted-foreground">Estimated</p>
            </div>
          </div>

          <Progress value={percent} />
        </CardContent>
      </Card>

      {/* Videos section — Client Component handles YouTube player + add form */}
      <VideoSection
        stepId={id}
        initialVideos={step.videos}
        roadmapId={step.roadmap.id}
      />
    </div>
  );
}
