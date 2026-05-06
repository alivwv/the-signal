import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignalHeader } from "@/components/SignalHeader";
import { Sidebar } from "@/components/Sidebar";

type Lesson = {
  id: string;
  position: number;
  title: string;
  estimated_minutes: number | null;
};
type Module = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  lessons: Lesson[];
};
type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  modules: Module[];
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user!;

  const { data: course } = await supabase
    .from("courses")
    .select(
      `id, slug, title, description,
       modules(id, position, title, description,
         lessons(id, position, title, estimated_minutes))`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();

  const typedCourse = course as unknown as Course;
  typedCourse.modules.sort((a, b) => a.position - b.position);
  for (const m of typedCourse.modules) {
    m.lessons.sort((a, b) => a.position - b.position);
  }

  // Filter by user_id explicitly: admin RLS would otherwise return all users'
  // progress rows. See supabase/README.md "Gotchas".
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id);
  const completedSet = new Set((progress ?? []).map((p) => p.lesson_id));

  const allLessons = typedCourse.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => completedSet.has(l.id)).length;
  const pct =
    totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  return (
    <div>
      <Sidebar courseSlug={slug} activeKey="course" />
      <div className="lg:ml-[260px]">
        <SignalHeader userEmail={user.email ?? null} />
        <main className="max-w-3xl mx-auto px-6 py-10">
        <nav className="text-xs text-txt3 mb-4">
          <Link href="/dashboard" className="hover:text-teal">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span>{typedCourse.title}</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] uppercase tracking-[2.5px] text-teal font-bold mb-1">
            Course
          </div>
          <h2 className="font-[family-name:var(--font-plex-serif)] text-3xl font-medium leading-tight mb-2">
            {typedCourse.title}
          </h2>
          {typedCourse.description && (
            <p className="text-sm text-txt2 max-w-prose">
              {typedCourse.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold text-txt3">
            <span>
              {doneLessons} / {totalLessons} lessons
            </span>
            <div className="flex-1 max-w-[180px] h-1 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-lime transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span>{pct}%</span>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {typedCourse.modules.map((m) => (
            <section key={m.id}>
              <h3 className="font-[family-name:var(--font-plex-serif)] text-lg font-medium mb-1">
                Module {String(m.position).padStart(2, "0")} —{" "}
                <span className="text-teal italic">{m.title}</span>
              </h3>
              {m.description && (
                <p className="text-xs text-txt2 mb-3">{m.description}</p>
              )}
              <ul className="flex flex-col gap-1.5">
                {m.lessons.map((l) => {
                  const done = completedSet.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/lessons/${l.id}`}
                        className="flex items-center gap-3 px-3.5 py-3 bg-bg-card border border-border-l rounded-[var(--radius-sm)] hover:border-border transition-colors"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                            done
                              ? "bg-ok-l text-ok"
                              : "bg-mint-p text-teal"
                          }`}
                        >
                          {done ? "✓" : l.position}
                        </div>
                        <span className="text-[13px] font-semibold flex-1">
                          {l.title}
                        </span>
                        {l.estimated_minutes != null && (
                          <span className="text-[10px] text-txt3 font-medium">
                            {l.estimated_minutes} min
                          </span>
                        )}
                        <span className="text-xs text-txt3">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        </main>
      </div>
    </div>
  );
}
