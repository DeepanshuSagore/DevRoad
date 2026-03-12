"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditRoadmapPage({ params }) {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "" });

  // Resolve params (Next.js 15 async params)
  useEffect(() => {
    params.then?.((p) => setId(p.id)) || setId(params.id);
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/roadmaps/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({ title: data.title || "", description: data.description || "" });
      })
      .finally(() => setFetching(false));
  }, [id]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/roadmaps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      router.push(`/roadmaps/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="h-64 rounded-xl bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href={`/roadmaps/${id}`}>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Roadmap</CardTitle>
          <CardDescription>Update your roadmap details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1 gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Link href={`/roadmaps/${id}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
