import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignalHeader } from "@/components/SignalHeader";
import { AdminOperations } from "@/components/AdminOperations";
import {
  getKpiStats,
  getCourseCompletionRows,
  getActiveHoursHeatmap,
  getRecentlyActive,
} from "@/lib/admin/analytics-queries";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user!;

  const [{ data: courses }, { data: progress }, { data: profile }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          `id, slug, title, description, status,
           modules(id, lessons(id))`
        )
        .order("created_at"),
      // Filter by user_id explicitly: admin RLS would otherwise return all users'
      // progress rows. See supabase/README.md "Gotchas".
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id),
      // Same gotcha for profiles — admins see all rows; filter explicitly.
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

  const isAdmin = profile?.role === "admin";

  // Run all analytics queries in parallel — only if admin.
  const adminData = isAdmin
    ? await Promise.all([
        getKpiStats(),
        getCourseCompletionRows(),
        getActiveHoursHeatmap(),
        getRecentlyActive(),
      ])
    : null;

  const completedSet = new Set(
    (progress ?? []).map((p) => p.lesson_id as string)
  );

  return (
    <div>
      <SignalHeader userEmail={user.email ?? null} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {isAdmin && adminData && (
          <>
            <AdminOperations
              kpi={adminData[0]}
              completionRows={adminData[1]}
              heatmap={adminData[2]}
              recentlyActive={adminData[3]}
            />
            <hr className="border-border-l mb-10" />
          </>
        )}

        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[2.5px] text-teal font-bold mb-1">
            Dashboard
          </div>
          <h2 className="font-[family-name:var(--font-plex-serif)] text-3xl font-medium leading-tight">
            Your <em className="text-teal">courses</em>
          </h2>
        </div>

        {!courses || courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {courses.map((course) => {
              const lessonIds = (course.modules ?? []).flatMap((m) =>
                (m.lessons ?? []).map((l) => l.id as string)
              );
              const total = lessonIds.length;
              const done = lessonIds.filter((id) =>
                completedSet.has(id)
              ).length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <CourseCard
                  key={course.id as string}
                  slug={course.slug as string}
                  title={course.title as string}
                  description={(course.description as string) ?? ""}
                  total={total}
                  done={done}
                  pct={pct}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function CourseCard({
  slug,
  title,
  description,
  total,
  done,
  pct,
}: {
  slug: string;
  title: string;
  description: string;
  total: number;
  done: number;
  pct: number;
}) {
  return (
    <Link
      href={`/courses/${slug}`}
      className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,.08)] hover:-translate-y-0.5 transition-all block"
    >
      <div className="h-1 -mx-5 -mt-5 mb-4 bg-teal rounded-t-[var(--radius-lg)]" />
      <h3 className="font-[family-name:var(--font-plex-serif)] text-[17px] font-medium leading-tight mb-2">
        {title}
      </h3>
      <p className="text-xs text-txt2 leading-relaxed mb-4 line-clamp-3">
        {description}
      </p>
      <div className="flex items-center justify-between text-[10px] text-txt3 uppercase tracking-wider font-semibold mb-1.5">
        <span>
          {done} / {total} lessons
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-lime transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-8 text-center">
      <p className="text-sm text-txt2">
        You haven&apos;t been assigned any courses yet.
      </p>
      <p className="text-xs text-txt3 mt-2">
        Once an admin enrolls you, your courses will appear here.
      </p>
    </div>
  );
}
