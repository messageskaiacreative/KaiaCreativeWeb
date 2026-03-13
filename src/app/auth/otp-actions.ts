"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * OTP Authentication Server Actions
 *
 * SECURITY:
 * - All validation is server-side (cannot be bypassed)
 * - Rate limiting handled by Supabase + application layer
 * - Anti-disposable email enforced at database trigger level
 * - PKCE flow used by default (most secure)
 * - Generic error messages to prevent user enumeration
 * - Single-device session: old sessions are terminated on new login
 */

// ============================================================
// Schemas
// ============================================================
const otpRequestSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .max(254, "Email too long")
        .transform((e) => e.toLowerCase().trim()),
});

const otpVerifySchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .transform((e) => e.toLowerCase().trim()),
    token: z
        .string()
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

// ============================================================
// Types
// ============================================================
export interface OtpActionResult {
    error?: string;
    success?: boolean;
    message?: string;
    cooldownSeconds?: number;
}

// ============================================================
// REQUEST OTP — Send magic code via email
// ============================================================
export async function requestOtpAction(
    email: string
): Promise<OtpActionResult> {
    // Server-side validation
    const parsed = otpRequestSchema.safeParse({ email });
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email: parsed.data.email,
            options: {
                // Create user if they don't exist (first-time sign in)
                shouldCreateUser: true,
                data: {
                    tier: "free",
                },
            },
        });

        if (error) {
            console.error("[OTP Request Error]", error.message);

            // Rate limit detection
            if (
                error.message.includes("rate") ||
                error.message.includes("too many") ||
                error.status === 429
            ) {
                return {
                    error: "Too many requests. Please wait before trying again.",
                    cooldownSeconds: 60,
                };
            }

            // Disposable email blocked at DB trigger level
            if (
                error.message.includes("disposable") ||
                error.message.includes("blocked")
            ) {
                return {
                    error: "Disposable email addresses are not allowed. Please use a permanent email.",
                };
            }

            // Generic error (prevent user enumeration)
            return {
                error: "Unable to send verification code. Please try again later.",
            };
        }

        return {
            success: true,
            message: "Verification code sent to your email.",
        };
    } catch (err) {
        console.error("[OTP Request Exception]", err);
        return {
            error: "An unexpected error occurred. Please try again.",
        };
    }
}

// ============================================================
// VERIFY OTP — Validate the 6-digit code
// Single-device enforcement: After successful verification,
// we sign out from all OTHER sessions (scope: "others").
// This ensures only the newest device has an active session.
// ============================================================
export async function verifyOtpAction(
    email: string,
    token: string
): Promise<OtpActionResult> {
    // Server-side validation
    const parsed = otpVerifySchema.safeParse({ email, token });
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.verifyOtp({
            email: parsed.data.email,
            token: parsed.data.token,
            type: "signup",
        });

        if (error) {
            console.error("[OTP Verify Error]", error.message);

            // Expired OTP
            if (
                error.message.includes("expired") ||
                error.message.includes("invalid")
            ) {
                return {
                    error: "Invalid or expired code. Please request a new one.",
                };
            }

            // Rate limit
            if (error.status === 429) {
                return {
                    error: "Too many attempts. Please wait before trying again.",
                    cooldownSeconds: 60,
                };
            }

            return {
                error: "Verification failed. Please check your code and try again.",
            };
        }

        if (!data.session) {
            return { error: "Verification succeeded but session was not created." };
        }

        // ============================================================
        // SINGLE-DEVICE ENFORCEMENT
        // Sign out all OTHER sessions — only this device stays active.
        // If the user was logged in on another device/browser, 
        // that session is now terminated.
        // ============================================================
        try {
            await supabase.auth.signOut({ scope: "others" });
        } catch (signOutError) {
            // Non-critical: log but don't fail the login
            console.warn("[Session Cleanup Warning]", signOutError);
        }

        return {
            success: true,
            message: "Email verified successfully!",
        };
    } catch (err) {
        console.error("[OTP Verify Exception]", err);
        return {
            error: "An unexpected error occurred. Please try again.",
        };
    }
}
