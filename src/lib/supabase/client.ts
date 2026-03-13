import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase Browser Client (Client Components)
 *
 * Uses @supabase/ssr for proper cookie-based session management.
 * This client automatically handles:
 * - PKCE auth flow (most secure)
 * - Cookie-based session storage (not localStorage — XSS-safe)
 * - Automatic token refresh
 *
 * SECURITY: The anon key is safe to expose client-side.
 * Row Level Security (RLS) on Supabase enforces access control.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
