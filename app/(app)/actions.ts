"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markLessonComplete(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  if (!lessonId) return;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;

  await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: authData.user.id, lesson_id: lessonId },
      { onConflict: "user_id,lesson_id" }
    );

  revalidatePath(`/lessons/${lessonId}`);
  if (courseSlug) revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");
}

export async function submitQuizScore({
  lessonId,
  courseSlug,
  score,
  total,
}: {
  lessonId: string;
  courseSlug: string;
  score: number;
  total: number;
}) {
  if (!lessonId) return;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;

  await supabase.from("lesson_progress").upsert(
    {
      user_id: authData.user.id,
      lesson_id: lessonId,
      quiz_score: score,
      quiz_total: total,
    },
    { onConflict: "user_id,lesson_id" }
  );

  revalidatePath(`/lessons/${lessonId}`);
  if (courseSlug) revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");
}
