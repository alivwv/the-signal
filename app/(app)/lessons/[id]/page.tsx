import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignalHeader } from "@/components/SignalHeader";
import { Sidebar } from "@/components/Sidebar";
import { LessonBlocks, lessonHasQuiz } from "@/components/LessonBlocks";
import { markLessonComplete } from "../../actions";

type Block = { type: string; [key: string]: unknown };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user!;

  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      `id, position, title, body, estimated_minutes, module_id,
       modules!inner(id, position, title,
         courses!inner(id, slug, title))`
    )
    .eq("id", id)
    .maybeSingle();

  if (!lesson) notFound();

  // Supabase generates array types for FK joins even when one-to-one; coerce.
  type ModShape = {
    id: string;
    position: number;
    title: string;
    courses: { id: string; slug: string; title: string };
  };
  const mod = (lesson as unknown as { modules: ModShape }).modules;
  const course = mod.courses;

  // Sibling lessons across the whole course for prev/next nav.
  const { data: siblingsData } = await supabase
    .from("lessons")
    .select("id, position, modules!inner(position, course_id)")
    .eq("modules.course_id", course.id);

  type SiblingShape = {
    id: string;
    position: number;
    modules: { position: number };
  };
  const siblings = (siblingsData ?? []) as unknown as SiblingShape[];
  siblings.sort((a, b) => {
    const ma = a.modules.position;
    const mb = b.modules.position;
    if (ma !== mb) return ma - mb;
    return a.position - b.position;
  });
  const idx = siblings.findIndex((s) => s.id === id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const { data: progressRow } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("lesson_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const completed = Boolean(progressRow);

  const blocks = ((lesson.body as { blocks?: Block[] } | null)?.blocks ??
    []) as Block[];
  const hasQuiz = lessonHasQuiz(blocks);

  return (
    <div>
      <Sidebar
        courseSlug={course.slug}
        activeLessonId={id}
        activeKey="lesson"
      />
      <div className="lg:ml-[260px]">
        <SignalHeader userEmail={user.email ?? null} />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <nav className="text-xs text-txt3 mb-4 truncate">
            <Link href="/dashboard" className="hover:text-teal">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/courses/${course.slug}`}
              className="hover:text-teal"
            >
              {course.title}
            </Link>
            <span className="mx-2">/</span>
            <span>Module {String(mod.position).padStart(2, "0")}</span>
          </nav>

          <header className="mb-6">
            <div className="text-[10px] uppercase tracking-[2.5px] text-teal font-bold mb-1">
              Lesson {lesson.position}
            </div>
            <h2 className="font-[family-name:var(--font-plex-serif)] text-2xl font-medium leading-tight mb-2">
              {lesson.title as string}
            </h2>
            {lesson.estimated_minutes != null && (
              <div className="text-[10px] text-txt3 uppercase tracking-wider font-semibold">
                {lesson.estimated_minutes as number} min read
              </div>
            )}
          </header>

          <article className="bg-bg-card border border-border-l rounded-[var(--radius-lg)] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <LessonBlocks
              blocks={blocks}
              lessonId={id}
              courseSlug={course.slug}
            />

            {/* Lessons with a quiz auto-mark via the quiz's submit action.
                Lessons without a quiz keep the manual Mark Complete button. */}
            {!hasQuiz && (
              <div className="mt-6 pt-6 border-t border-border-l">
                <form action={markLessonComplete}>
                  <input type="hidden" name="lessonId" value={id} />
                  <input
                    type="hidden"
                    name="courseSlug"
                    value={course.slug}
                  />
                  <button
                    type="submit"
                    disabled={completed}
                    className={
                      completed
                        ? "bg-ok-l text-ok border border-[#C8E6C9] text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] cursor-default"
                        : "bg-teal text-white text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] hover:bg-teal-d transition-colors"
                    }
                  >
                    {completed ? "✓ Completed" : "Mark as complete"}
                  </button>
                </form>
              </div>
            )}
            {hasQuiz && completed && (
              <div className="mt-6 pt-6 border-t border-border-l">
                <span className="inline-block bg-ok-l text-ok border border-[#C8E6C9] text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)]">
                  ✓ Lesson completed
                </span>
              </div>
            )}
          </article>

          <nav className="flex items-center justify-between mt-6 text-xs">
            {prev ? (
              <Link
                href={`/lessons/${prev.id}`}
                className="text-txt2 hover:text-teal font-medium"
              >
                ← Previous lesson
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/lessons/${next.id}`}
                className="text-txt2 hover:text-teal font-medium"
              >
                Next lesson →
              </Link>
            ) : (
              <Link
                href={`/courses/${course.slug}`}
                className="text-txt2 hover:text-teal font-medium"
              >
                Back to course
              </Link>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
