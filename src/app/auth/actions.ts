"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Actions for Authentication
 *
 * LOGIN: OTP-only (no password-based login)
 * 
 * SECURITY:
 * - signOut with 'global' scope terminates ALL sessions (single-device enforcement)
 * - Rate limiting is handled by Supabase automatically
 * - PKCE flow is used by default (most secure)
 */

export interface AuthActionResult {
    error?: string;
    success?: boolean;
}

/**
 * Logout — Signs out the user globally
 * This terminates ALL sessions across all devices (single-device enforcement)
 */
export async function logoutAction(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "global" });
    revalidatePath("/", "layout");
    redirect("/auth/login");
}

export async function loginWithPasswordAction(
    email: string,
    password: string
): Promise<AuthActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("[Login Error]", error.message);
            return { error: "Invalid email or password" };
        }

        // Single-device enforcement: Sign out other sessions
        try {
            await supabase.auth.signOut({ scope: "others" });
        } catch (signOutError) {
            console.warn("[Session Cleanup Warning]", signOutError);
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (err) {
        console.error("[Login Exception]", err);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

export async function registerWithPasswordAction(
    email: string,
    password: string
): Promise<AuthActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    tier: "free",
                },
            },
        });

        if (error) {
            console.error("[Register Error]", error.message);

            if (error.message.includes("already registered")) {
                return { error: "This email is already registered." };
            }

            return { error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("[Register Exception]", err);
        return { error: "An unexpected error occurred. Please try again." };
    }
}
