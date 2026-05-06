import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = { courseSlug?: string; lessonId?: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return new NextResponse(null, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  let courseId: string | null = null;
  let lessonId: string | null = null;

  if (body.lessonId) {
    lessonId = body.lessonId;
    const { data: lesson } = await supabase
      .from("lessons")
      .select("module_id, modules!inner(course_id)")
      .eq("id", lessonId)
      .maybeSingle();
    if (lesson) {
      const m = (lesson as unknown as { modules: { course_id: string } })
        .modules;
      courseId = m.course_id;
    }
  } else if (body.courseSlug) {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", body.courseSlug)
      .maybeSingle();
    courseId = course?.id ?? null;
  } else {
    return new NextResponse(null, { status: 400 });
  }

  await supabase.from("activity_pings").insert({
    user_id: authData.user.id,
    course_id: courseId,
    lesson_id: lessonId,
  });

  return new NextResponse(null, { status: 204 });
}
