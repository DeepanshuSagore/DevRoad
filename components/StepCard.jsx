"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calcPercent, formatDuration, formatHours } from "@/lib/utils";
import { Pencil, Trash2, ArrowRight, Clock, PlayCircle } from "lucide-react";
import { useState } from "react";

/**
 * StepCard — displays a single step within a roadmap.
 *
 * @param {Object} props.step - Step object from Prisma
 * @param {string} props.roadmapId - Parent roadmap ID
 * @param {Function} props.onDelete - Callback after deletion
 */
export default function StepCard({ step, roadmapId, onDelete }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const percent = step.isCompleted
    ? 100
    : calcPercent(step.progressHours, step.estimatedHours);

  const statusVariant = step.isCompleted
    ? "success"
    : percent > 0
    ? "default"
    : "secondary";
  const statusLabel = step.isCompleted
    ? "Completed"
    : percent > 0
    ? "In Progress"
    : "Not Started";

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirm(`Delete step "${step.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/steps/${step.id}`, { method: "DELETE" });
      onDelete?.(step.id);
    } catch {
      alert("Failed to delete step.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="group hover:border-primary/40 transition-all duration-200">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Order + status */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                #{step.orderIndex + 1}
              </span>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <h3 className="font-semibold text-foreground truncate">{step.title}</h3>
            {step.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {step.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/steps/${step.id}/edit`)}
              title="Edit step"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete step"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatHours(step.progressHours)} / {formatHours(step.estimatedHours)}
            </span>
            {step._count?.videos > 0 && (
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                {step._count.videos} video{step._count.videos !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Link href={`/steps/${step.id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Open
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
