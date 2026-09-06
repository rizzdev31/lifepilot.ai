"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      // Request Google Calendar scope for Day 6
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar",
      ].join(" "),
    },
  });

  if (error) {
    console.error("signInWithGoogle error:", error.message);
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}
