"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");

  return { supabase, adminId: authData.user.id };
}

export async function enrollUsers(courseId: string, userIds: string[]) {
  if (!courseId || userIds.length === 0) return;
  const { supabase, adminId } = await assertAdmin();

  // Conflicts on (user_id, course_id) silently ignored — re-enrolling is a no-op.
  await supabase.from("enrollments").upsert(
    userIds.map((uid) => ({
      user_id: uid,
      course_id: courseId,
      enrolled_by: adminId,
    })),
    { onConflict: "user_id,course_id", ignoreDuplicates: true }
  );

  revalidatePath("/admin/enrollments");
}

export async function unenrollUsers(courseId: string, userIds: string[]) {
  if (!courseId || userIds.length === 0) return;
  const { supabase } = await assertAdmin();

  // Note: we delete the enrollment row only. lesson_progress rows are retained
  // (orphaned but harmless) so re-enrollment preserves history.
  await supabase
    .from("enrollments")
    .delete()
    .eq("course_id", courseId)
    .in("user_id", userIds);

  revalidatePath("/admin/enrollments");
}
