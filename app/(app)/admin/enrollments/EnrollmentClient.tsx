"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollUsers, unenrollUsers } from "./actions";

type Person = {
  id: string;
  email: string;
  full_name: string | null;
  role: "employee" | "admin";
  progressCount: number;
};

type CourseOption = { id: string; title: string };

export function EnrollmentClient({
  courses,
  selectedCourseId,
  enrolled,
  notEnrolled,
}: {
  courses: CourseOption[];
  selectedCourseId: string;
  enrolled: Person[];
  notEnrolled: Person[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enrollPicks, setEnrollPicks] = useState<Set<string>>(new Set());
  const [removePicks, setRemovePicks] = useState<Set<string>>(new Set());

  function toggleEnroll(id: string) {
    setEnrollPicks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleRemove(id: string) {
    setRemovePicks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function changeCourse(courseId: string) {
    setEnrollPicks(new Set());
    setRemovePicks(new Set());
    router.push(`/admin/enrollments?courseId=${courseId}`);
  }

  function handleEnroll() {
    const ids = Array.from(enrollPicks);
    if (ids.length === 0) return;
    startTransition(async () => {
      await enrollUsers(selectedCourseId, ids);
      setEnrollPicks(new Set());
      router.refresh();
    });
  }

  function handleRemove() {
    const ids = Array.from(removePicks);
    if (ids.length === 0) return;
    const withProgress = enrolled.filter(
      (p) => removePicks.has(p.id) && p.progressCount > 0
    );
    if (withProgress.length > 0) {
      const names = withProgress
        .map((p) => p.full_name || p.email)
        .join(", ");
      const ok = window.confirm(
        `${withProgress.length} of the selected users have lesson progress in this course (${names}). Their progress rows will be retained, but they'll lose visibility into the course. Continue?`
      );
      if (!ok) return;
    }
    startTransition(async () => {
      await unenrollUsers(selectedCourseId, ids);
      setRemovePicks(new Set());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <label
          htmlFor="course-select"
          className="text-xs font-semibold text-txt2"
        >
          Course
        </label>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={(e) => changeCourse(e.target.value)}
          className="border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm bg-bg-card min-w-[260px]"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Column
          title="Not enrolled"
          subtitle={`${notEnrolled.length} ${notEnrolled.length === 1 ? "person" : "people"}`}
          people={notEnrolled}
          picks={enrollPicks}
          onToggle={toggleEnroll}
          showProgress={false}
          actionLabel={`Enroll selected (${enrollPicks.size}) →`}
          actionDisabled={enrollPicks.size === 0 || pending}
          onAction={handleEnroll}
          actionVariant="primary"
        />
        <Column
          title="Enrolled"
          subtitle={`${enrolled.length} ${enrolled.length === 1 ? "person" : "people"}`}
          people={enrolled}
          picks={removePicks}
          onToggle={toggleRemove}
          showProgress={true}
          actionLabel={`← Remove selected (${removePicks.size})`}
          actionDisabled={removePicks.size === 0 || pending}
          onAction={handleRemove}
          actionVariant="danger"
        />
      </div>

      {pending && (
        <div className="text-xs text-txt3 italic">Saving…</div>
      )}
    </div>
  );
}

function Column({
  title,
  subtitle,
  people,
  picks,
  onToggle,
  showProgress,
  actionLabel,
  actionDisabled,
  onAction,
  actionVariant,
}: {
  title: string;
  subtitle: string;
  people: Person[];
  picks: Set<string>;
  onToggle: (id: string) => void;
  showProgress: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
  actionVariant: "primary" | "danger";
}) {
  return (
    <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-[10px] uppercase tracking-wider text-txt3 font-bold">
          {subtitle}
        </span>
      </div>

      {people.length === 0 ? (
        <div className="text-xs text-txt3 italic py-6 text-center">
          No one here.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto">
          {people.map((p) => {
            const checked = picks.has(p.id);
            return (
              <li key={p.id}>
                <label className="flex items-center gap-2.5 px-3 py-2 border border-border-l rounded-[var(--radius-sm)] hover:bg-bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(p.id)}
                    className="accent-teal"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">
                      {p.full_name || p.email}
                    </div>
                    {p.full_name && (
                      <div className="text-[11px] text-txt3 truncate">
                        {p.email}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                      p.role === "admin"
                        ? "bg-deep text-lime"
                        : "bg-mint-p text-teal"
                    }`}
                  >
                    {p.role}
                  </span>
                  {showProgress && p.progressCount > 0 && (
                    <span className="text-[10px] text-txt3 font-semibold whitespace-nowrap">
                      {p.progressCount} done
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className={
          actionVariant === "primary"
            ? "bg-teal text-white text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] hover:bg-teal-d transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            : "bg-bg-surface text-txt2 text-xs font-semibold border border-border px-4 py-2 rounded-[var(--radius-sm)] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        }
      >
        {actionLabel}
      </button>
    </div>
  );
}
