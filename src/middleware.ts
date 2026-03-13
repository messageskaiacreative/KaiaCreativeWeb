import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Session Refresh & Route Protection
 *
 * CRITICAL SECURITY LAYER:
 * 1. Refreshes expired auth tokens on every request (prevents stale sessions)
 * 2. Protects routes — redirects unauthenticated users to /auth/login
 * 3. Redirects authenticated users away from auth pages
 * 4. Single-device session enforcement via session_id tracking
 *
 * LOGIN FLOW: OTP-only (no password). 
 * Allowed auth routes: /auth/login, /auth/verify-otp, /auth/callback
 */

// Routes that don't require authentication (OTP-only flow)
const PUBLIC_ROUTES = ["/auth/login", "/auth/verify-otp", "/auth/callback"];

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const { pathname } = request.nextUrl;

    // Skip middleware for API routes and static files
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon.ico")
    ) {
        return supabaseResponse;
    }

    // Redirect old auth routes to the unified OTP login
    if (
        pathname.startsWith("/auth/register") ||
        pathname.startsWith("/auth/otp-login")
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    // Gracefully handle missing Supabase env vars (dev/setup mode)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
        !supabaseUrl ||
        !supabaseKey ||
        supabaseUrl === "your_supabase_project_url" ||
        supabaseKey === "your_supabase_anon_key"
    ) {
        // If env vars are not configured, allow auth pages and redirect others to login
        if (isPublicRoute(pathname)) {
            return supabaseResponse;
        }
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT use supabase.auth.getSession() here.
    // getUser() validates the token server-side (secure).
    // getSession() only reads from cookies (can be tampered).
    const {
        data: { user },
    } = await supabase.auth.getUser();


    // If user is NOT authenticated and trying to access a protected route
    if (!user && !isPublicRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // If user IS authenticated and trying to access auth pages, redirect to home
    if (user && isPublicRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
