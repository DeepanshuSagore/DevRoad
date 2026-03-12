"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Clock } from "lucide-react";

/**
 * ProgressLogForm — logs study sessions for a step.
 * After saving, router.refresh() re-fetches the server component
 * so step progress and stats update immediately.
 */
export default function ProgressLogForm({ stepId, roadmapId, stepTitle, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ hours: "", minutes: "", notes: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const hrs = parseInt(form.hours) || 0;
    const mins = parseInt(form.minutes) || 0;
    const totalHours = hrs + mins / 60;
    if (totalHours <= 0) {
      setError("Please enter at least 1 minute of study time.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          roadmapId,
          timeSpent: totalHours,
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log progress");
      }

      setForm({ hours: "", minutes: "", notes: "" });
      setSuccess(true);
      // Refresh server component to show updated progress
      router.refresh();
      // Collapse the log panel if a callback was provided
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Time studied on &quot;{stepTitle}&quot; *
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time-hours"
                  name="hours"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.hours}
                  onChange={handleChange}
                  className="pl-9 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">hrs</span>
              </div>
              <div className="relative flex-1">
                <Input
                  id="time-minutes"
                  name="minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={form.minutes}
                  onChange={handleChange}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">min</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This will update your step completion and streak.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="What did you cover today?"
              value={form.notes}
              onChange={handleChange}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-emerald-400">
              Progress logged! Keep up the streak.
            </p>
          )}

          <Button type="submit" disabled={loading} className="gap-2 w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log Study Session
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
