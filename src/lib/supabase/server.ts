import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Server Client (Server Components, API Routes, Server Actions)
 *
 * Creates a fresh Supabase client for each server request.
 * Uses cookie-based session management for security:
 * - Reads auth tokens from HTTP-only cookies
 * - Writes updated tokens back to cookies
 * - Ensures session is always fresh
 *
 * SECURITY NOTES:
 * - Tokens are stored in HTTP-only cookies (not accessible via JS)
 * - Each request gets its own client instance (no shared state)
 * - Automatic token refresh happens server-side
 */
export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    }
    if (!supabaseKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing sessions.
                }
            },
        },
    });
}
