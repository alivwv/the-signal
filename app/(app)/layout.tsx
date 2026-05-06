import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeartbeatTracker } from "@/components/HeartbeatTracker";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <>
      <HeartbeatTracker />
      {children}
    </>
  );
}
