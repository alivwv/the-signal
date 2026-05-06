import Link from "next/link";
import { formatRelativeTime, initialsFor } from "@/lib/admin/format";
import type { RecentItem } from "@/lib/admin/analytics-queries";

export function RecentlyActiveList({ items }: { items: RecentItem[] }) {
  return (
    <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold">Recently active</h3>
        <span className="text-[10px] uppercase tracking-wider text-txt3 font-bold">
          Last 7 days · top 10
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-txt3 italic py-4">No activity yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => {
            const name = item.fullName || item.email;
            const drilldown = item.courseSlug
              ? `/admin/employees/${item.userId}/courses/${item.courseSlug}`
              : null;
            return (
              <li
                key={`${item.userId}|${item.pingedAt}`}
                className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-bg-surface"
              >
                <div className="w-8 h-8 rounded-full bg-mint-p text-teal flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {initialsFor(item.fullName, item.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {name}
                  </div>
                  <div className="text-[11px] text-txt3 truncate">
                    {item.routeLabel ?? "—"}
                  </div>
                </div>
                <div className="text-[11px] text-txt3 whitespace-nowrap">
                  {formatRelativeTime(item.pingedAt)}
                </div>
                {drilldown && (
                  <Link
                    href={drilldown}
                    className="text-[11px] text-teal hover:underline whitespace-nowrap"
                  >
                    →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
