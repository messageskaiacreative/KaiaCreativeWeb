import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth Callback Route
 *
 * Handles the OAuth/email confirmation callback.
 * Supabase redirects here after email verification.
 * Exchanges the auth code for a session (PKCE flow).
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
        try {
            const supabase = await createClient();
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } catch (e) {
            console.error("[Callback Exchange Error]", e);
        }
    }

    // If no code or error, redirect to login with error
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
}
