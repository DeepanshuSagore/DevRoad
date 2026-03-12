"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RoadmapCard from "@/components/RoadmapCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Map } from "lucide-react";

/**
 * Roadmaps page — Client Component so we can handle:
 * - Live search/filter without server round-trips
 * - Optimistic deletion (remove from list immediately)
 */
export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/roadmaps")
      .then((r) => r.json())
      .then(setRoadmaps)
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(id) {
    setRoadmaps((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = roadmaps.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roadmaps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roadmaps.length} roadmap{roadmaps.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/roadmaps/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Roadmap
          </Button>
        </Link>
      </div>

      {/* Search */}
      {roadmaps.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roadmaps..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : roadmaps.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No roadmaps matching &quot;{query}&quot;
        </p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 rounded-xl border border-border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <Map className="h-10 w-10 text-muted-foreground mb-4" />
      <p className="font-medium text-foreground">No roadmaps yet</p>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Create a roadmap to start tracking your learning journey.
      </p>
      <Link href="/roadmaps/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Roadmap
        </Button>
      </Link>
    </div>
  );
}
