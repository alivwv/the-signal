// Server-only by transitive import: this module imports @/lib/supabase/server
// which uses next/headers cookies() — that already prevents client bundling.
// Admin RLS lets these queries see all rows; the role check happens at the
// /admin layout level, so anything that reaches these calls is already an admin.
import { createClient } from "@/lib/supabase/server";

// -- KPI strip ---------------------------------------------------------------

export type KpiStats = {
  totalEnrolled: number;
  coursesPublished: number;
  avgCompletionPct: number;
  activeLast7Days: number;
};

export async function getKpiStats(): Promise<KpiStats> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [enrollsRes, coursesRes, lessonsRes, progressRes, recentPingsRes] =
    await Promise.all([
      supabase.from("enrollments").select("user_id, course_id"),
      supabase.from("courses").select("id, status"),
      supabase.from("lessons").select("id, modules!inner(course_id)"),
      supabase.from("lesson_progress").select("user_id, lesson_id"),
      supabase
        .from("activity_pings")
        .select("user_id")
        .gte("pinged_at", sevenDaysAgo),
    ]);

  const enrollments =
    (enrollsRes.data ?? []) as { user_id: string; course_id: string }[];
  const courses =
    (coursesRes.data ?? []) as { id: string; status: string }[];
  const lessons = (lessonsRes.data ?? []) as unknown as {
    id: string;
    modules: { course_id: string };
  }[];
  const progress =
    (progressRes.data ?? []) as { user_id: string; lesson_id: string }[];
  const recentPings = (recentPingsRes.data ?? []) as { user_id: string }[];

  const totalEnrolled = new Set(enrollments.map((e) => e.user_id)).size;
  const coursesPublished = courses.filter((c) => c.status === "published")
    .length;
  const activeLast7Days = new Set(recentPings.map((p) => p.user_id)).size;

  // Lessons-per-course + lesson→course lookup
  const lessonsByCourseId = new Map<string, Set<string>>();
  const lessonToCourse = new Map<string, string>();
  for (const l of lessons) {
    const cid = l.modules.course_id;
    lessonToCourse.set(l.id, cid);
    let set = lessonsByCourseId.get(cid);
    if (!set) {
      set = new Set();
      lessonsByCourseId.set(cid, set);
    }
    set.add(l.id);
  }

  // Completed lessons per (user, course)
  const completedKey = (uid: string, cid: string) => `${uid}|${cid}`;
  const completedCount = new Map<string, number>();
  for (const p of progress) {
    const cid = lessonToCourse.get(p.lesson_id);
    if (!cid) continue;
    const k = completedKey(p.user_id, cid);
    completedCount.set(k, (completedCount.get(k) ?? 0) + 1);
  }

  // Average completion pct across enrollments
  let pctSum = 0;
  let pctN = 0;
  for (const e of enrollments) {
    const total = lessonsByCourseId.get(e.course_id)?.size ?? 0;
    if (total === 0) continue;
    const done = completedCount.get(completedKey(e.user_id, e.course_id)) ?? 0;
    pctSum += (done / total) * 100;
    pctN += 1;
  }
  const avgCompletionPct = pctN === 0 ? 0 : Math.round(pctSum / pctN);

  return { totalEnrolled, coursesPublished, avgCompletionPct, activeLast7Days };
}

// -- Course completion table -------------------------------------------------

export type CompletionRow = {
  userId: string;
  fullName: string | null;
  email: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  done: number;
  total: number;
  pct: number;
  lastActiveAt: string | null;
  pingCount: number;
  screenTimeSeconds: number;
};

const PING_INTERVAL_SECONDS = 30;

export async function getCourseCompletionRows(): Promise<CompletionRow[]> {
  const supabase = await createClient();

  const [enrollsRes, profilesRes, coursesRes, lessonsRes, progressRes, pingsRes] =
    await Promise.all([
      supabase.from("enrollments").select("user_id, course_id"),
      supabase.from("profiles").select("id, email, full_name"),
      supabase.from("courses").select("id, slug, title"),
      supabase.from("lessons").select("id, modules!inner(course_id)"),
      supabase.from("lesson_progress").select("user_id, lesson_id"),
      supabase
        .from("activity_pings")
        .select("user_id, course_id, pinged_at"),
    ]);

  const enrollments =
    (enrollsRes.data ?? []) as { user_id: string; course_id: string }[];
  const profiles = (profilesRes.data ?? []) as {
    id: string;
    email: string;
    full_name: string | null;
  }[];
  const courses = (coursesRes.data ?? []) as {
    id: string;
    slug: string;
    title: string;
  }[];
  const lessons = (lessonsRes.data ?? []) as unknown as {
    id: string;
    modules: { course_id: string };
  }[];
  const progress =
    (progressRes.data ?? []) as { user_id: string; lesson_id: string }[];
  const pings = (pingsRes.data ?? []) as {
    user_id: string;
    course_id: string | null;
    pinged_at: string;
  }[];

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const lessonsByCourseId = new Map<string, Set<string>>();
  const lessonToCourse = new Map<string, string>();
  for (const l of lessons) {
    const cid = l.modules.course_id;
    lessonToCourse.set(l.id, cid);
    let s = lessonsByCourseId.get(cid);
    if (!s) {
      s = new Set();
      lessonsByCourseId.set(cid, s);
    }
    s.add(l.id);
  }

  const completedKey = (uid: string, cid: string) => `${uid}|${cid}`;
  const completedCount = new Map<string, number>();
  for (const p of progress) {
    const cid = lessonToCourse.get(p.lesson_id);
    if (!cid) continue;
    const k = completedKey(p.user_id, cid);
    completedCount.set(k, (completedCount.get(k) ?? 0) + 1);
  }

  // Per-(user, course) ping aggregates
  const pingAgg = new Map<
    string,
    { count: number; lastAt: string | null }
  >();
  for (const p of pings) {
    if (!p.course_id) continue;
    const k = completedKey(p.user_id, p.course_id);
    const cur = pingAgg.get(k);
    if (!cur) {
      pingAgg.set(k, { count: 1, lastAt: p.pinged_at });
    } else {
      cur.count += 1;
      if (cur.lastAt === null || p.pinged_at > cur.lastAt) {
        cur.lastAt = p.pinged_at;
      }
    }
  }

  const rows: CompletionRow[] = [];
  for (const e of enrollments) {
    const profile = profileById.get(e.user_id);
    const course = courseById.get(e.course_id);
    if (!profile || !course) continue;
    const total = lessonsByCourseId.get(e.course_id)?.size ?? 0;
    const done = completedCount.get(completedKey(e.user_id, e.course_id)) ?? 0;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const agg = pingAgg.get(completedKey(e.user_id, e.course_id));
    rows.push({
      userId: e.user_id,
      fullName: profile.full_name,
      email: profile.email,
      courseId: e.course_id,
      courseSlug: course.slug,
      courseTitle: course.title,
      done,
      total,
      pct,
      lastActiveAt: agg?.lastAt ?? null,
      pingCount: agg?.count ?? 0,
      screenTimeSeconds: (agg?.count ?? 0) * PING_INTERVAL_SECONDS,
    });
  }

  rows.sort((a, b) => b.pct - a.pct);
  return rows;
}

// -- Active hours heatmap ----------------------------------------------------

export type HeatmapCell = {
  dayOfWeek: number; // 0=Sun..6=Sat (UTC)
  hourOfDay: number; // 0..23 (UTC)
  pings: number;
};

export async function getActiveHoursHeatmap(): Promise<HeatmapCell[]> {
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("activity_pings")
    .select("pinged_at")
    .gte("pinged_at", cutoff);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { pinged_at: string }[]) {
    const d = new Date(row.pinged_at);
    const dow = d.getUTCDay();
    const hod = d.getUTCHours();
    const k = `${dow}|${hod}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  for (const [k, pings] of counts) {
    const [dow, hod] = k.split("|").map(Number);
    cells.push({ dayOfWeek: dow, hourOfDay: hod, pings });
  }
  return cells;
}

// -- Recently active employees -----------------------------------------------

export type RecentItem = {
  userId: string;
  fullName: string | null;
  email: string;
  pingedAt: string;
  routeLabel: string | null;
  courseSlug: string | null;
  lessonId: string | null;
};

export async function getRecentlyActive(): Promise<RecentItem[]> {
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: pings } = await supabase
    .from("activity_pings")
    .select("user_id, pinged_at, course_id, lesson_id")
    .gte("pinged_at", cutoff)
    .order("pinged_at", { ascending: false });

  // Dedupe by user_id, keeping the most recent (pings already ordered desc)
  const byUser = new Map<
    string,
    { user_id: string; pinged_at: string; course_id: string | null; lesson_id: string | null }
  >();
  for (const p of (pings ?? []) as {
    user_id: string;
    pinged_at: string;
    course_id: string | null;
    lesson_id: string | null;
  }[]) {
    if (!byUser.has(p.user_id)) byUser.set(p.user_id, p);
  }

  const top = Array.from(byUser.values()).slice(0, 10);
  if (top.length === 0) return [];

  const userIds = top.map((t) => t.user_id);
  const courseIds = Array.from(
    new Set(top.map((t) => t.course_id).filter((x): x is string => x !== null))
  );
  const lessonIds = Array.from(
    new Set(top.map((t) => t.lesson_id).filter((x): x is string => x !== null))
  );

  const [profilesRes, coursesRes, lessonsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds),
    courseIds.length > 0
      ? supabase
          .from("courses")
          .select("id, slug, title")
          .in("id", courseIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
    lessonIds.length > 0
      ? supabase.from("lessons").select("id, title").in("id", lessonIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const profileById = new Map(
    (
      (profilesRes.data ?? []) as {
        id: string;
        full_name: string | null;
        email: string;
      }[]
    ).map((p) => [p.id, p])
  );
  const courseById = new Map(
    (
      (coursesRes.data ?? []) as { id: string; slug: string; title: string }[]
    ).map((c) => [c.id, c])
  );
  const lessonById = new Map(
    (
      (lessonsRes.data ?? []) as { id: string; title: string }[]
    ).map((l) => [l.id, l])
  );

  return top.map((p) => {
    const profile = profileById.get(p.user_id);
    let routeLabel: string | null = null;
    let courseSlug: string | null = null;
    if (p.lesson_id && lessonById.has(p.lesson_id)) {
      routeLabel = lessonById.get(p.lesson_id)!.title;
    }
    if (p.course_id && courseById.has(p.course_id)) {
      courseSlug = courseById.get(p.course_id)!.slug;
      if (!routeLabel) routeLabel = courseById.get(p.course_id)!.title;
    }
    return {
      userId: p.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? "",
      pingedAt: p.pinged_at,
      routeLabel,
      courseSlug,
      lessonId: p.lesson_id,
    };
  });
}

// -- Drill-down --------------------------------------------------------------

export type DrilldownLesson = {
  id: string;
  position: number;
  title: string;
  status: "completed" | "started" | "not-started";
  completedAt: string | null;
  quizScore: number | null;
  quizTotal: number | null;
  pingCount: number;
  screenTimeSeconds: number;
  firstPingAt: string | null;
  lastPingAt: string | null;
};

export type DrilldownModule = {
  id: string;
  position: number;
  title: string;
  lessons: DrilldownLesson[];
  doneCount: number;
  totalCount: number;
};

export type DrilldownData = {
  user: { id: string; email: string; fullName: string | null };
  course: { id: string; slug: string; title: string };
  modules: DrilldownModule[];
  totalLessons: number;
  doneLessons: number;
  totalPings: number;
  totalScreenTimeSeconds: number;
  enrolled: boolean;
};

export async function getEmployeeCourseDetail(
  userId: string,
  courseSlug: string
): Promise<DrilldownData | null> {
  const supabase = await createClient();

  const [profileRes, courseRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("courses")
      .select(
        `id, slug, title,
         modules(id, position, title,
           lessons(id, position, title))`
      )
      .eq("slug", courseSlug)
      .maybeSingle(),
  ]);

  const profile = profileRes.data as
    | { id: string; email: string; full_name: string | null }
    | null;
  if (!profile) return null;
  if (!courseRes.data) return null;

  type CourseShape = {
    id: string;
    slug: string;
    title: string;
    modules: {
      id: string;
      position: number;
      title: string;
      lessons: { id: string; position: number; title: string }[];
    }[];
  };
  const c = courseRes.data as unknown as CourseShape;
  c.modules.sort((a, b) => a.position - b.position);
  for (const m of c.modules) {
    m.lessons.sort((a, b) => a.position - b.position);
  }

  const allLessonIds = c.modules.flatMap((m) => m.lessons.map((l) => l.id));

  const [enrollmentRes, progressRes, pingsRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", c.id)
      .maybeSingle(),
    allLessonIds.length > 0
      ? supabase
          .from("lesson_progress")
          .select("lesson_id, completed_at, quiz_score, quiz_total")
          .eq("user_id", userId)
          .in("lesson_id", allLessonIds)
      : Promise.resolve({
          data: [] as {
            lesson_id: string;
            completed_at: string;
            quiz_score: number | null;
            quiz_total: number | null;
          }[],
        }),
    supabase
      .from("activity_pings")
      .select("lesson_id, pinged_at")
      .eq("user_id", userId)
      .eq("course_id", c.id),
  ]);

  const progressByLesson = new Map(
    (
      (progressRes.data ?? []) as {
        lesson_id: string;
        completed_at: string;
        quiz_score: number | null;
        quiz_total: number | null;
      }[]
    ).map((p) => [p.lesson_id, p])
  );

  const pingsByLesson = new Map<
    string,
    { count: number; first: string; last: string }
  >();
  let totalPings = 0;
  for (const p of (pingsRes.data ?? []) as {
    lesson_id: string | null;
    pinged_at: string;
  }[]) {
    totalPings += 1;
    if (!p.lesson_id) continue;
    const cur = pingsByLesson.get(p.lesson_id);
    if (!cur) {
      pingsByLesson.set(p.lesson_id, {
        count: 1,
        first: p.pinged_at,
        last: p.pinged_at,
      });
    } else {
      cur.count += 1;
      if (p.pinged_at < cur.first) cur.first = p.pinged_at;
      if (p.pinged_at > cur.last) cur.last = p.pinged_at;
    }
  }

  const modules: DrilldownModule[] = c.modules.map((m) => {
    const lessons: DrilldownLesson[] = m.lessons.map((l) => {
      const prog = progressByLesson.get(l.id);
      const pings = pingsByLesson.get(l.id);
      const status: DrilldownLesson["status"] = prog
        ? "completed"
        : pings
          ? "started"
          : "not-started";
      return {
        id: l.id,
        position: l.position,
        title: l.title,
        status,
        completedAt: prog?.completed_at ?? null,
        quizScore: prog?.quiz_score ?? null,
        quizTotal: prog?.quiz_total ?? null,
        pingCount: pings?.count ?? 0,
        screenTimeSeconds: (pings?.count ?? 0) * PING_INTERVAL_SECONDS,
        firstPingAt: pings?.first ?? null,
        lastPingAt: pings?.last ?? null,
      };
    });
    return {
      id: m.id,
      position: m.position,
      title: m.title,
      lessons,
      doneCount: lessons.filter((l) => l.status === "completed").length,
      totalCount: lessons.length,
    };
  });

  return {
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
    },
    course: { id: c.id, slug: c.slug, title: c.title },
    modules,
    totalLessons: allLessonIds.length,
    doneLessons: modules.reduce((s, m) => s + m.doneCount, 0),
    totalPings,
    totalScreenTimeSeconds: totalPings * PING_INTERVAL_SECONDS,
    enrolled: Boolean(enrollmentRes.data),
  };
}

// Formatters live in ./format so client components can use them without
// dragging the server-only Supabase client into the bundle.
