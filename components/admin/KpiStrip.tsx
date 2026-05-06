import type { KpiStats } from "@/lib/admin/analytics-queries";

export function KpiStrip({ stats }: { stats: KpiStats }) {
  const items: { label: string; value: string }[] = [
    { label: "Total enrolled", value: String(stats.totalEnrolled) },
    { label: "Courses published", value: String(stats.coursesPublished) },
    { label: "Avg completion", value: `${stats.avgCompletionPct}%` },
    { label: "Active 7d", value: String(stats.activeLast7Days) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]"
        >
          <div className="text-[9px] uppercase tracking-[1.5px] text-txt3 font-bold mb-1">
            {it.label}
          </div>
          <div className="font-[family-name:var(--font-plex-serif)] text-[28px] leading-none text-teal font-medium">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
