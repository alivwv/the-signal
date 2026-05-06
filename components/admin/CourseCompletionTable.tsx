"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { CompletionRow } from "@/lib/admin/analytics-queries";
import { formatRelativeTime, formatScreenTime } from "@/lib/admin/format";

type SortKey = "person" | "course" | "progress" | "lastActive" | "screenTime";
type SortDir = "asc" | "desc";

export function CourseCompletionTable({ rows }: { rows: CompletionRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("progress");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "person":
          return (
            ((a.fullName || a.email).localeCompare(b.fullName || b.email)) *
            dir
          );
        case "course":
          return a.courseTitle.localeCompare(b.courseTitle) * dir;
        case "progress":
          return (a.pct - b.pct) * dir;
        case "lastActive": {
          const av = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
          const bv = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
          return (av - bv) * dir;
        }
        case "screenTime":
          return (a.screenTimeSeconds - b.screenTimeSeconds) * dir;
      }
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function clickHeader(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "person" || key === "course" ? "asc" : "desc");
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyShell>
        <p className="text-sm text-txt2">No enrollments yet.</p>
        <p className="text-xs text-txt3 mt-1">
          Use{" "}
          <Link
            href="/admin/enrollments"
            className="text-teal underline hover:no-underline"
          >
            Manage enrollments
          </Link>{" "}
          to assign courses.
        </p>
      </EmptyShell>
    );
  }

  return (
    <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="px-4 py-3 border-b border-border-l flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Course completion</h3>
        <span className="text-[10px] uppercase tracking-wider text-txt3 font-bold">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-txt3 font-bold border-b border-border-l">
              <Th onClick={() => clickHeader("person")} active={sortKey === "person"} dir={sortDir}>
                Employee
              </Th>
              <Th onClick={() => clickHeader("course")} active={sortKey === "course"} dir={sortDir}>
                Course
              </Th>
              <Th onClick={() => clickHeader("progress")} active={sortKey === "progress"} dir={sortDir}>
                Progress
              </Th>
              <Th onClick={() => clickHeader("lastActive")} active={sortKey === "lastActive"} dir={sortDir}>
                Last active
              </Th>
              <Th onClick={() => clickHeader("screenTime")} active={sortKey === "screenTime"} dir={sortDir}>
                Screen time
              </Th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={`${r.userId}|${r.courseId}`}
                className="border-b border-border-l last:border-b-0 hover:bg-bg-surface transition-colors"
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium text-char">
                    {r.fullName || r.email}
                  </div>
                  {r.fullName && (
                    <div className="text-[11px] text-txt3">{r.email}</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-txt2">{r.courseTitle}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="h-1 flex-1 bg-bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lime"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-txt2 whitespace-nowrap">
                      {r.done}/{r.total} · {r.pct}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-txt2 whitespace-nowrap">
                  {r.lastActiveAt ? formatRelativeTime(r.lastActiveAt) : "—"}
                </td>
                <td className="px-3 py-2.5 text-txt2 whitespace-nowrap">
                  {r.pingCount > 0
                    ? formatScreenTime(r.screenTimeSeconds)
                    : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/employees/${r.userId}/courses/${r.courseSlug}`}
                    className="text-xs text-teal hover:underline whitespace-nowrap"
                  >
                    Drill in →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <th className="px-3 py-2 font-bold">
      <button
        type="button"
        onClick={onClick}
        className={`uppercase tracking-wider text-[10px] font-bold ${active ? "text-teal" : "text-txt3"} hover:text-teal`}
      >
        {children}
        {active && <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

function EmptyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <h3 className="text-sm font-semibold mb-2">Course completion</h3>
      {children}
    </div>
  );
}
