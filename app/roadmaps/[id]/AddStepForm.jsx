"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

/**
 * AddStepForm — Client Component embedded in the server-rendered roadmap page.
 * After adding, it hard-refreshes the page so the server re-fetches fresh data.
 */
export default function AddStepForm({ roadmapId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    estimatedHours: "",
  });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Step title is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add step");
      }

      setForm({ title: "", description: "", estimatedHours: "" });
      setOpen(false);
      // Refresh the server component data
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add a step
      </button>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-title">Step Title *</Label>
            <Input
              id="step-title"
              name="title"
              placeholder="e.g. Python Basics"
              value={form.title}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-desc">Description</Label>
            <Textarea
              id="step-desc"
              name="description"
              placeholder="What does this step cover?"
              value={form.description}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-hours">Estimated Hours</Label>
            <Input
              id="step-hours"
              name="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 10"
              value={form.estimatedHours}
              onChange={handleChange}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Step
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setOpen(false); setError(""); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
