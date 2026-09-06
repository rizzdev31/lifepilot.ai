"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getProfileData() {
  try {
    const supabase = await createClient();

    const [{ data: { user } }, { data: { session } }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    if (!user) return null;

    // Ambil stats task
    const [totalResult, doneResult, inProgressResult] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "done"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "in_progress"),
    ]);

    const isCalendarConnected = !!session?.provider_token;

    return {
      id: user.id,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      avatar: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      createdAt: user.created_at,
      stats: {
        total: totalResult.count ?? 0,
        done: doneResult.count ?? 0,
        inProgress: inProgressResult.count ?? 0,
      },
      isCalendarConnected,
    };
  } catch {
    return null;
  }
}
