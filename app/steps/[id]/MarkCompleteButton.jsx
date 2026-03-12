"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * MarkCompleteButton — toggles isCompleted on a step.
 * Client Component to handle the optimistic update.
 */
export default function MarkCompleteButton({ stepId, isCompleted }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  async function toggle() {
    setLoading(true);
    const newState = !completed;
    setCompleted(newState); // optimistic
    try {
      const res = await fetch(`/api/steps/${stepId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: newState }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setCompleted(!newState); // revert
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={completed ? "secondary" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-2 shrink-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2
          className={`h-4 w-4 ${completed ? "text-emerald-400" : "text-muted-foreground"}`}
        />
      )}
      {completed ? "Completed" : "Mark Complete"}
    </Button>
  );
}
