import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth error from provider
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription ?? error)}`, requestUrl.origin)
    );
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore in Server Component context
            }
          },
        },
      }
    );

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    // Sync user profile to our users table
    if (data.user) {
      const { id, email, user_metadata } = data.user;

      // Detect first-time user before upsert
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      const isNewUser = !existingUser;

      await supabase.from("users").upsert(
        {
          id,
          email: email!,
          name: user_metadata?.full_name ?? user_metadata?.name ?? email,
          avatar: user_metadata?.avatar_url ?? user_metadata?.picture,
          google_id: user_metadata?.provider_id ?? user_metadata?.sub,
        },
        { onConflict: "id", ignoreDuplicates: false }
      );

      if (isNewUser) {
        return NextResponse.redirect(new URL("/welcome", requestUrl.origin));
      }
    }
  }

  // Redirect to dashboard (or the originally requested page)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
