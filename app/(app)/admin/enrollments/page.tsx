import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignalHeader } from "@/components/SignalHeader";
import { EnrollmentClient } from "./EnrollmentClient";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user!;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .order("created_at");

  if (!courses || courses.length === 0) {
    return (
      <div>
        <SignalHeader userEmail={user.email ?? null} />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <Breadcrumb />
          <h2 className="font-[family-name:var(--font-plex-serif)] text-3xl font-medium leading-tight mb-4">
            Enrollments
          </h2>
          <p className="text-sm text-txt2">No courses exist yet.</p>
        </main>
      </div>
    );
  }

  const sp = await searchParams;
  const requestedCourseId = sp.courseId;
  const selectedCourseId =
    courses.find((c) => c.id === requestedCourseId)?.id ?? courses[0].id;

  // Ensure URL reflects the resolved course (so the dropdown round-trips cleanly).
  if (requestedCourseId && requestedCourseId !== selectedCourseId) {
    redirect(`/admin/enrollments?courseId=${selectedCourseId}`);
  }

  const [
    { data: profiles },
    { data: enrollments },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("role", { ascending: false })
      .order("email"),
    supabase
      .from("enrollments")
      .select("user_id")
      .eq("course_id", selectedCourseId),
    // Per-user progress count for the selected course (admin RLS returns all rows).
    // We just need counts, not user-scoped — admin's "see all" is correct here.
    supabase
      .from("lesson_progress")
      .select("user_id, lesson_id, lessons!inner(modules!inner(course_id))")
      .eq("lessons.modules.course_id", selectedCourseId),
  ]);

  const enrolledSet = new Set(
    (enrollments ?? []).map((e) => e.user_id as string)
  );

  // Tally progress per user for the selected course.
  const progressByUser = new Map<string, number>();
  for (const row of progress ?? []) {
    const uid = (row as { user_id: string }).user_id;
    progressByUser.set(uid, (progressByUser.get(uid) ?? 0) + 1);
  }

  type Person = {
    id: string;
    email: string;
    full_name: string | null;
    role: "employee" | "admin";
    progressCount: number;
  };

  const enrolledPeople: Person[] = [];
  const notEnrolledPeople: Person[] = [];

  for (const p of profiles ?? []) {
    const person: Person = {
      id: p.id as string,
      email: p.email as string,
      full_name: (p.full_name as string | null) ?? null,
      role: p.role as "employee" | "admin",
      progressCount: progressByUser.get(p.id as string) ?? 0,
    };
    if (enrolledSet.has(person.id)) enrolledPeople.push(person);
    else notEnrolledPeople.push(person);
  }

  return (
    <div>
      <SignalHeader userEmail={user.email ?? null} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb />
        <header className="mb-6">
          <div className="text-[10px] uppercase tracking-[2.5px] text-teal font-bold mb-1">
            Operations
          </div>
          <h2 className="font-[family-name:var(--font-plex-serif)] text-3xl font-medium leading-tight">
            Manage <em className="text-teal">enrollments</em>
          </h2>
          <p className="text-sm text-txt2 mt-1 max-w-prose">
            Pick a course, then move people between &ldquo;Not enrolled&rdquo; and
            &ldquo;Enrolled&rdquo;.
          </p>
        </header>

        <EnrollmentClient
          courses={courses.map((c) => ({
            id: c.id as string,
            title: c.title as string,
          }))}
          selectedCourseId={selectedCourseId}
          enrolled={enrolledPeople}
          notEnrolled={notEnrolledPeople}
        />
      </main>
    </div>
  );
}

function Breadcrumb() {
  return (
    <nav className="text-xs text-txt3 mb-4">
      <Link href="/dashboard" className="hover:text-teal">
        Dashboard
      </Link>
      <span className="mx-2">/</span>
      <span>Enrollments</span>
    </nav>
  );
}
