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
export default function ProgressLogForm({ stepId, roadmapId, stepTitle }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ timeSpent: "", notes: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const hours = parseFloat(form.timeSpent);
    if (!form.timeSpent || isNaN(hours) || hours <= 0) {
      setError("Please enter a valid number of hours (e.g. 1.5).");
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
          timeSpent: hours,
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log progress");
      }

      setForm({ timeSpent: "", notes: "" });
      setSuccess(true);
      // Refresh server component to show updated progress
      router.refresh();
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
            <Label htmlFor="time-spent">
              Hours studied on &quot;{stepTitle}&quot; *
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="time-spent"
                name="timeSpent"
                type="number"
                min="0.1"
                step="0.25"
                placeholder="e.g. 1.5"
                value={form.timeSpent}
                onChange={handleChange}
                className="pl-9"
              />
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
