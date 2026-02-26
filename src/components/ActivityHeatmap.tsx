"use client";

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Build a map of date -> count
  const countMap = new Map(data.map((d) => [d.date, d.count]));
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // Generate last 90 days
  const days: string[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  // Arrange into weeks (columns) with day-of-week rows
  // Start from the first day's weekday
  const firstDate = new Date(days[0]);
  const startDow = firstDate.getDay(); // 0 = Sunday

  const CELL = 11;
  const GAP = 2;
  const TOTAL = CELL + GAP;

  // Calculate grid: 7 rows (Sun-Sat), ~13 columns
  const cells: Array<{ x: number; y: number; date: string; count: number }> = [];
  let col = 0;
  let row = startDow;
  for (const day of days) {
    cells.push({
      x: col * TOTAL,
      y: row * TOTAL,
      date: day,
      count: countMap.get(day) || 0,
    });
    row++;
    if (row >= 7) {
      row = 0;
      col++;
    }
  }

  const width = (col + 1) * TOTAL;
  const height = 7 * TOTAL;

  function getOpacity(count: number): number {
    if (count === 0) return 0;
    // Scale from 0.25 to 1.0
    return 0.25 + 0.75 * (count / maxCount);
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: "110px" }}>
        {cells.map((cell) => (
          <rect
            key={cell.date}
            x={cell.x}
            y={cell.y}
            width={CELL}
            height={CELL}
            rx={2}
            fill={cell.count > 0 ? "var(--accent)" : "var(--border)"}
            opacity={cell.count > 0 ? getOpacity(cell.count) : 0.3}
          >
            <title>{cell.date}: {cell.count} problems</title>
          </rect>
        ))}
      </svg>
      <div className="flex items-center justify-end gap-1.5 mt-1.5">
        <span className="text-[10px] text-[var(--muted)]">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((opacity, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{
              backgroundColor: i === 0 ? "var(--border)" : "var(--accent)",
              opacity: i === 0 ? 0.3 : opacity,
            }}
          />
        ))}
        <span className="text-[10px] text-[var(--muted)]">More</span>
      </div>
    </div>
  );
}
