import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

/**
 * Main Page — Server Component
 *
 * SECURITY: This page is protected by middleware.
 * We fetch the user server-side using getUser() (validates with Supabase Auth server).
 * The user data is then passed to the client-side AppShell.
 *
 * TIER SOURCE OF TRUTH: The `profiles` table is the source of truth for the user's
 * subscription tier. Admin changes to tier happen in the profiles table + user_metadata.
 * We check profiles first, then fall back to user_metadata.
 *
 * PERFORMANCE: Server-side user fetch means no client-side loading state
 * for auth — the page renders immediately with user data.
 */
export default async function Home() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect("/auth/login");
    }

    // Fetch the profile for the authoritative tier value
    let tier: "free" | "premium" = "free";

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    if (profile?.tier === "premium" || profile?.tier === "free") {
      tier = profile.tier;
    } else {
      // Fallback to user_metadata if profile doesn't exist yet
      tier = (user.user_metadata?.tier as "free" | "premium") ?? "free";
    }

    // Extract user info for the client
    const userInfo = {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string) ?? user.email ?? "User",
      tier,
    };

    return <AppShell initialUser={userInfo} />;
  } catch (error) {
    console.error("Home page server error:", error);
    redirect("/auth/login");
  }
}
