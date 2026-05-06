import Link from "next/link";
import type {
  KpiStats,
  CompletionRow,
  HeatmapCell,
  RecentItem,
} from "@/lib/admin/analytics-queries";
import { KpiStrip } from "@/components/admin/KpiStrip";
import { CourseCompletionTable } from "@/components/admin/CourseCompletionTable";
import { ActiveHoursHeatmap } from "@/components/admin/ActiveHoursHeatmap";
import { RecentlyActiveList } from "@/components/admin/RecentlyActiveList";

export function AdminOperations({
  kpi,
  completionRows,
  heatmap,
  recentlyActive,
}: {
  kpi: KpiStats;
  completionRows: CompletionRow[];
  heatmap: HeatmapCell[];
  recentlyActive: RecentItem[];
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-[family-name:var(--font-plex-serif)] text-2xl font-medium leading-tight">
          <em className="text-teal">Operations</em>
        </h2>
        <span className="text-[10px] uppercase tracking-[2px] text-txt3 font-bold">
          Admin
        </span>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-3 mb-3">
        <Link
          href="/admin/enrollments"
          className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,.08)] hover:-translate-y-0.5 transition-all block"
        >
          <div className="h-1 -mx-5 -mt-5 mb-4 bg-lime rounded-t-[var(--radius-lg)]" />
          <div className="text-[10px] uppercase tracking-[2px] text-teal font-bold mb-1">
            Enrollments
          </div>
          <h3 className="font-[family-name:var(--font-plex-serif)] text-[17px] font-medium leading-tight mb-2">
            Manage enrollments
          </h3>
          <p className="text-xs text-txt2 leading-relaxed">
            Assign or remove employees per course.
          </p>
        </Link>

        <KpiStrip stats={kpi} />
      </div>

      <div className="flex flex-col gap-3">
        <CourseCompletionTable rows={completionRows} />
        <ActiveHoursHeatmap cells={heatmap} />
        <RecentlyActiveList items={recentlyActive} />
      </div>
    </section>
  );
}
