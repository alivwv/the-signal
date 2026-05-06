import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignalHeader } from "@/components/SignalHeader";
import {
  formatScreenTime,
  formatRelativeTime,
  initialsFor,
} from "@/lib/admin/format";
import {
  getEmployeeCourseDetail,
  type DrilldownLesson,
} from "@/lib/admin/analytics-queries";

export default async function EmployeeCourseDrilldown({
  params,
}: {
  params: Promise<{ userId: string; courseSlug: string }>;
}) {
  const { userId, courseSlug } = await params;
  const data = await getEmployeeCourseDetail(userId, courseSlug);
  if (!data) notFound();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user!;

  const overallPct =
    data.totalLessons === 0
      ? 0
      : Math.round((data.doneLessons / data.totalLessons) * 100);
  const displayName = data.user.fullName || data.user.email;

  return (
    <div>
      <SignalHeader userEmail={user.email ?? null} />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <nav className="text-xs text-txt3 mb-4">
          <Link href="/dashboard" className="hover:text-teal">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span>Employees</span>
          <span className="mx-2">/</span>
          <span className="truncate">
            {displayName} · {data.course.title}
          </span>
        </nav>

        <header className="mb-8 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-mint-p text-teal flex items-center justify-center text-base font-bold flex-shrink-0">
            {initialsFor(data.user.fullName, data.user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[2.5px] text-teal font-bold mb-1">
              Employee · Course
            </div>
            <h2 className="font-[family-name:var(--font-plex-serif)] text-2xl font-medium leading-tight">
              {displayName}
            </h2>
            <div className="text-sm text-txt2">{data.course.title}</div>
            {!data.enrolled && (
              <div className="mt-2 text-[11px] text-warn font-semibold uppercase tracking-wider">
                Not enrolled
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-[family-name:var(--font-plex-serif)] text-3xl text-teal font-medium leading-none">
              {overallPct}%
            </div>
            <div className="text-[10px] text-txt3 uppercase tracking-wider font-semibold mt-1">
              {data.doneLessons} / {data.totalLessons} lessons
            </div>
            <div className="text-[10px] text-txt3 mt-0.5">
              {formatScreenTime(data.totalScreenTimeSeconds)} on course
            </div>
          </div>
        </header>

        {data.totalPings === 0 && data.doneLessons === 0 ? (
          <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-6 text-center">
            <p className="text-sm text-txt2">
              This employee hasn&apos;t started this course yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {data.modules.map((m) => {
              const mPct =
                m.totalCount === 0
                  ? 0
                  : Math.round((m.doneCount / m.totalCount) * 100);
              return (
                <section
                  key={m.id}
                  className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)]"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-[family-name:var(--font-plex-serif)] text-lg font-medium">
                      Module {String(m.position).padStart(2, "0")} —{" "}
                      <span className="text-teal italic">{m.title}</span>
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-txt3 font-bold">
                      {m.doneCount} / {m.totalCount}
                    </span>
                  </div>
                  <div className="h-1 bg-bg-surface rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-lime"
                      style={{ width: `${mPct}%` }}
                    />
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {m.lessons.map((l) => (
                      <LessonRow key={l.id} lesson={l} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function LessonRow({ lesson: l }: { lesson: DrilldownLesson }) {
  const statusBadge =
    l.status === "completed" ? (
      <span className="text-[10px] font-bold uppercase tracking-wider text-ok bg-ok-l border border-[#C8E6C9] px-2 py-0.5 rounded">
        ✓ Completed
      </span>
    ) : l.status === "started" ? (
      <span className="text-[10px] font-bold uppercase tracking-wider text-warn bg-warn-l border border-[#F0E1A8] px-2 py-0.5 rounded">
        ⏱ Started
      </span>
    ) : (
      <span className="text-[10px] font-bold uppercase tracking-wider text-txt3 bg-bg-surface border border-border-l px-2 py-0.5 rounded">
        ○ Not started
      </span>
    );

  return (
    <li className="flex flex-wrap items-center gap-2 px-3 py-2.5 border border-border-l rounded-[var(--radius-sm)]">
      <div className="flex-1 min-w-[200px]">
        <div className="text-[13px] font-semibold">
          {l.position}. {l.title}
        </div>
        <div className="text-[11px] text-txt3 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
          {l.completedAt && (
            <span>
              Completed{" "}
              {new Date(l.completedAt).toISOString().slice(0, 10)}
            </span>
          )}
          {l.firstPingAt && (
            <span>First seen {formatRelativeTime(l.firstPingAt)}</span>
          )}
          {l.lastPingAt && l.lastPingAt !== l.firstPingAt && (
            <span>Last seen {formatRelativeTime(l.lastPingAt)}</span>
          )}
        </div>
      </div>

      {l.quizScore !== null && l.quizTotal !== null && (
        <span className="text-[11px] font-semibold text-teal whitespace-nowrap">
          Quiz: {l.quizScore}/{l.quizTotal} (
          {Math.round((l.quizScore / l.quizTotal) * 100)}%)
        </span>
      )}

      {l.pingCount > 0 && (
        <span className="text-[11px] text-txt2 whitespace-nowrap">
          {formatScreenTime(l.screenTimeSeconds)}
        </span>
      )}

      {statusBadge}
    </li>
  );
}
