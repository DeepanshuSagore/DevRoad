import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StreakCounter — visual streak badge.
 * A streak is broken when no study is logged for an entire calendar day.
 *
 * @param {number}  props.streak       - Number of consecutive study days
 * @param {boolean} props.todayStudied - Whether the user has studied today
 */
export default function StreakCounter({ streak = 0, todayStudied = false }) {
  const isActive = streak > 0 && todayStudied;
  const isAtRisk = streak > 0 && !todayStudied; // studied yesterday but not today yet

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border transition-colors",
        isActive
          ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
          : isAtRisk
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
          : "bg-muted border-border text-muted-foreground"
      )}
    >
      <Flame
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-orange-400" : isAtRisk ? "text-amber-400" : "text-muted-foreground"
        )}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-bold leading-none">{streak}</span>
        <span className="text-xs opacity-80">
          {streak === 1 ? "day streak" : "day streak"}
        </span>
      </div>
      {isAtRisk && (
        <span className="text-xs bg-amber-500/20 px-1.5 py-0.5 rounded-full">
          Study today!
        </span>
      )}
    </div>
  );
}
