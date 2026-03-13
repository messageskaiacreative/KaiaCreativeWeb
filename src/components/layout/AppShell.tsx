"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/layout/Workspace";
import Toast from "@/components/ui/Toast";

interface AppShellProps {
    initialUser: {
        id: string;
        email: string;
        name: string;
        tier: "free" | "premium";
    };
}

/**
 * AppShell — Client-side application shell
 *
 * Receives pre-validated user data from the server component.
 * Hydrates the Zustand store on mount.
 *
 * SINGLE-DEVICE SESSION:
 * - Listens to Supabase auth state changes in real-time
 * - If another device signs in (which calls signOut({ scope: "others" })),
 *   this device's session will be invalidated automatically
 * - The user is redirected to /auth/login with a session_terminated notice
 *
 * PERFORMANCE:
 * - No auth loading spinner (user is already validated server-side)
 * - Store hydration happens once on mount
 * - All child components read from Zustand (fast, no prop drilling)
 */
export default function AppShell({ initialUser }: AppShellProps) {
    const { setUser } = useAppStore();

    // Hydrate store with server-validated user data
    useEffect(() => {
        setUser(initialUser);
    }, [initialUser, setUser]);

    // ============================================================
    // SINGLE-DEVICE SESSION LISTENER
    // Monitors auth state changes. If the session is terminated
    // (because another device logged in), redirect to login page.
    // ============================================================
    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                // Session was terminated (likely by another device login)
                // Redirect to login with session_terminated notice
                window.location.href = "/auth/login?session_terminated=true";
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-hidden">
                    <Workspace />
                </main>
            </div>
            <Toast />
        </div>
    );
}
