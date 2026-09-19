"use client";

import { useMemo } from "react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  dates: Date[];
}

export function ActivityHeatmap({ dates }: ActivityHeatmapProps) {
  const days = 140; // 20 weeks * 7 days
  
  const calendar = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);
    
    const activityMap = new Map<string, number>();
    dates.forEach(d => {
      if (!(d instanceof Date) || isNaN(d.getTime())) return;
      const key = format(d, "yyyy-MM-dd");
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    });

    const grid = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(today, days - 1 - i);
      const key = format(date, "yyyy-MM-dd");
      grid.push({
        date,
        count: activityMap.get(key) || 0
      });
    }
    return grid;
  }, [dates]);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-1 min-w-max">
        {Array.from({ length: Math.ceil(days / 7) }).map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-1">
            {calendar.slice(colIndex * 7, (colIndex + 1) * 7).map((day, i) => (
              <div
                key={day.date.toISOString()}
                title={`${day.count} sessions on ${format(day.date, "MMM d, yyyy")}`}
                className={cn(
                  "w-3 h-3 md:w-4 md:h-4 rounded-sm transition-colors",
                  day.count === 0 ? "bg-surface-elevated" :
                  day.count === 1 ? "bg-primary/40" :
                  day.count === 2 ? "bg-primary/70" :
                  "bg-primary"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
