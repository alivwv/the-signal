import { createClient } from "@/lib/supabase/server";
import { SidebarShell } from "./SidebarShell";

export async function Sidebar({
  courseSlug,
  activeLessonId,
  activeKey,
}: {
  courseSlug: string;
  activeLessonId?: string;
  activeKey: "course" | "lesson";
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  type Lesson = {
    id: string;
    position: number;
    title: string;
  };
  type Module = {
    id: string;
    position: number;
    title: string;
    lessons: Lesson[];
  };
  type CourseShape = { id: string; modules: Module[] };

  const [{ data: courseRaw }, { data: profile }] = await Promise.all([
    supabase
      .from("courses")
      .select(
        `id, modules(id, position, title,
           lessons(id, position, title))`
      )
      .eq("slug", courseSlug)
      .maybeSingle(),
    // Filter by id explicitly per the README Gotchas.
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
  ]);

  if (!courseRaw) return null;
  const isAdmin = profile?.role === "admin";

  const course = courseRaw as unknown as CourseShape;
  course.modules.sort((a, b) => a.position - b.position);
  for (const m of course.modules) {
    m.lessons.sort((a, b) => a.position - b.position);
  }

  // Find Scenario Lab + Glossary lessons by title (current convention).
  // Falls back to null if missing — sidebar omits the section.
  let scenarioLessonId: string | null = null;
  let glossaryLessonId: string | null = null;
  for (const m of course.modules) {
    for (const l of m.lessons) {
      if (l.title === "Scenario Lab") scenarioLessonId = l.id;
      else if (l.title === "Glossary") glossaryLessonId = l.id;
    }
  }

  // Determine which module owns the active lesson.
  let activeModuleId: string | null = null;
  let resolvedActiveKey:
    | "course"
    | "scenario"
    | "glossary"
    | "lesson"
    | null = activeKey;
  if (activeKey === "lesson" && activeLessonId) {
    if (activeLessonId === scenarioLessonId) resolvedActiveKey = "scenario";
    else if (activeLessonId === glossaryLessonId)
      resolvedActiveKey = "glossary";
    else {
      for (const m of course.modules) {
        if (m.lessons.some((l) => l.id === activeLessonId)) {
          activeModuleId = m.id;
          break;
        }
      }
    }
  }

  // Progress (filter by user_id explicitly; admin RLS would otherwise return all).
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id);
  const completedSet = new Set((progress ?? []).map((p) => p.lesson_id));

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalCount = allLessons.length;
  const doneCount = allLessons.filter((l) => completedSet.has(l.id)).length;
  const pct =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Filter the practice lessons out of the per-module nav items so they only
  // appear in the Practice section.
  const moduleNav = course.modules.map((m) => {
    const lessonsForNav = m.lessons.filter(
      (l) => l.id !== scenarioLessonId && l.id !== glossaryLessonId
    );
    return {
      id: m.id,
      position: m.position,
      title: m.title,
      firstLessonId: lessonsForNav[0]?.id ?? null,
      lessonCount: lessonsForNav.length,
    };
  });

  return (
    <SidebarShell
      courseSlug={courseSlug}
      modules={moduleNav}
      scenarioLessonId={scenarioLessonId}
      glossaryLessonId={glossaryLessonId}
      pct={pct}
      doneCount={doneCount}
      totalCount={totalCount}
      activeModuleId={activeModuleId}
      activeKey={resolvedActiveKey}
      isAdmin={isAdmin}
    />
  );
}
