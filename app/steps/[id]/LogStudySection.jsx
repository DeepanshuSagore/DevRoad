"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import ProgressLogForm from "./ProgressLogForm";

export default function LogStudySection({ stepId, roadmapId, stepTitle }) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Study Log
        </h2>
        <Button
          variant={open ? "secondary" : "default"}
          size="sm"
          className="gap-2"
          onClick={() => setOpen((o) => !o)}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Log
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {open && (
        <ProgressLogForm
          stepId={stepId}
          roadmapId={roadmapId}
          stepTitle={stepTitle}
          onSuccess={() => setOpen(false)}
        />
      )}
    </section>
  );
}
