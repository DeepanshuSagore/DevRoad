"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calcPercent, formatDate } from "@/lib/utils";
import { Pencil, Trash2, ArrowRight, BookOpen } from "lucide-react";
import { useState } from "react";

/**
 * RoadmapCard — displays a single roadmap with progress, metadata, and actions.
 *
 * @param {Object} props.roadmap - Roadmap object from Prisma
 * @param {Function} props.onDelete - Callback after deletion
 */
export default function RoadmapCard({ roadmap, onDelete }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const percent = calcPercent(roadmap.completedSteps, roadmap.totalSteps);

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirm(`Delete "${roadmap.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/roadmaps/${roadmap.id}`, { method: "DELETE" });
      onDelete?.(roadmap.id);
    } catch {
      alert("Failed to delete roadmap.");
    } finally {
      setDeleting(false);
    }
  }

  const statusVariant =
    percent === 100 ? "success" : percent > 0 ? "default" : "secondary";
  const statusLabel =
    percent === 100 ? "Completed" : percent > 0 ? "In Progress" : "Not Started";

  return (
    <Card className="group hover:border-primary/50 hover:glow-primary transition-all duration-200">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <h3 className="font-semibold text-foreground truncate text-base leading-snug">
              {roadmap.title}
            </h3>
            {roadmap.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {roadmap.description}
              </p>
            )}
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/roadmaps/${roadmap.id}/edit`)}
              title="Edit roadmap"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete roadmap"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-foreground">
              {percent}%
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>
              {roadmap.completedSteps}/{roadmap.totalSteps} steps
            </span>
          </div>
          <Link href={`/roadmaps/${roadmap.id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              View
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Created {formatDate(roadmap.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
