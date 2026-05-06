import type { HeatmapCell } from "@/lib/admin/analytics-queries";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function ActiveHoursHeatmap({ cells }: { cells: HeatmapCell[] }) {
  // Build a 7×24 grid keyed by "dow-hod"
  const counts = new Map<string, number>();
  let max = 0;
  for (const c of cells) {
    counts.set(`${c.dayOfWeek}-${c.hourOfDay}`, c.pings);
    if (c.pings > max) max = c.pings;
  }
  const totalPings = cells.reduce((s, c) => s + c.pings, 0);

  return (
    <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold">Active hours</h3>
        <span className="text-[10px] uppercase tracking-wider text-txt3 font-bold">
          Last 30 days · UTC
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <table className="border-separate border-spacing-[2px] mx-auto">
          <thead>
            <tr>
              <th className="w-8" />
              {Array.from({ length: 24 }, (_, h) => (
                <th
                  key={h}
                  className="text-[9px] text-txt3 font-medium px-0.5"
                >
                  {h % 3 === 0 ? h.toString().padStart(2, "0") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dow) => (
              <tr key={dow}>
                <td className="text-[10px] text-txt3 font-semibold pr-2 text-right">
                  {day}
                </td>
                {Array.from({ length: 24 }, (_, hod) => {
                  const n = counts.get(`${dow}-${hod}`) ?? 0;
                  const intensity = max === 0 ? 0 : n / max;
                  // Use lime with variable opacity; below a threshold show grey.
                  const bg =
                    n === 0
                      ? "var(--color-border-l)"
                      : `rgba(203, 255, 8, ${0.15 + intensity * 0.85})`;
                  return (
                    <td
                      key={hod}
                      className="w-3.5 h-3.5 rounded-[2px]"
                      style={{ background: bg }}
                      title={`${FULL_DAYS[dow]} ${String(hod).padStart(2, "0")}:00 — ${n} ping${n === 1 ? "" : "s"}`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {totalPings === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-bg-card/90 px-4 py-2 rounded-[var(--radius-sm)] text-xs text-txt3 italic border border-border-l">
              No activity in the last 30 days
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 text-[9px] text-txt3 uppercase tracking-wider font-semibold">
        <span>Less</span>
        <div className="flex gap-[2px]">
          {[0.15, 0.4, 0.65, 0.9, 1].map((v) => (
            <div
              key={v}
              className="w-3 h-3 rounded-[2px]"
              style={{ background: `rgba(203, 255, 8, ${v})` }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
