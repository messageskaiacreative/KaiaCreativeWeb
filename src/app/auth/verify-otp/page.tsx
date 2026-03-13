"use client";

import { useState, useRef, useEffect, useCallback, useTransition, Suspense } from "react";
import { verifyOtpAction, requestOtpAction } from "@/app/auth/otp-actions";
import {
    FileText,
    Shield,
    KeyRound,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ============================================================
// OTP Input Component — Secure 6-digit array
// ============================================================
interface OtpInputProps {
    length: number;
    value: string[];
    onChange: (value: string[]) => void;
    onComplete: (code: string) => void;
    disabled: boolean;
}

function OtpInput({ length, value, onChange, onComplete, disabled }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (!disabled && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [disabled]);

    const handleChange = (index: number, digit: string) => {
        // Only allow single numeric digit
        if (digit && !/^\d$/.test(digit)) return;

        const newValue = [...value];
        newValue[index] = digit;
        onChange(newValue);

        // Auto-advance to next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are entered
        if (digit && index === length - 1) {
            const code = newValue.join("");
            if (code.length === length && /^\d+$/.test(code)) {
                onComplete(code);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace: clear current and move to previous
        if (e.key === "Backspace") {
            e.preventDefault();
            const newValue = [...value];

            if (value[index]) {
                // Clear current
                newValue[index] = "";
                onChange(newValue);
            } else if (index > 0) {
                // Move to previous and clear it
                newValue[index - 1] = "";
                onChange(newValue);
                inputRefs.current[index - 1]?.focus();
            }
        }

        // Arrow keys navigation
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle paste — efficiently distribute digits across inputs
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").trim();

        // Extract only digits
        const digits = pastedData.replace(/\D/g, "").slice(0, length);
        if (!digits) return;

        const newValue = [...value];
        for (let i = 0; i < length; i++) {
            newValue[i] = digits[i] || "";
        }
        onChange(newValue);

        // Focus last filled input or next empty
        const lastIndex = Math.min(digits.length, length) - 1;
        if (lastIndex >= 0) {
            inputRefs.current[lastIndex]?.focus();
        }

        // Auto-submit if all digits pasted
        if (digits.length >= length) {
            const code = newValue.join("");
            if (code.length === length) {
                onComplete(code);
            }
        }
    };

    return (
        <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste}>
            {Array.from({ length }, (_, index) => (
                <div key={index} className="relative">
                    {/* Separator dash after 3rd digit */}
                    {index === 3 && (
                        <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-slate-300 rounded-full" />
                    )}
                    <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value[index] || ""}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={disabled}
                        aria-label={`Digit ${index + 1} of ${length}`}
                        autoComplete="one-time-code"
                        className={`
                            w-12 h-14 text-center text-xl font-bold
                            border-2 rounded-sm outline-none
                            transition-all duration-150
                            ${disabled
                                ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                : value[index]
                                    ? "border-navy-800 bg-navy-50/30 text-slate-900"
                                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-navy-800 focus:ring-2 focus:ring-navy-800/10"
                            }
                        `}
                    />
                </div>
            ))}
        </div>
    );
}

// ============================================================
// OTP Verify Page Content
// ============================================================
function VerifyOtpContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") || "";

    // State
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [resendCooldown, setResendCooldown] = useState(60); // Initial 60s cooldown
    const [isResending, setIsResending] = useState(false);
    const hasSubmittedRef = useRef(false);

    // Redirect if no email
    useEffect(() => {
        if (!email) {
            router.replace("/auth/login");
        }
    }, [email, router]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // ============================================================
    // Verify OTP (auto-triggered or manual)
    // ============================================================
    const handleVerify = useCallback(
        (code: string) => {
            // Prevent double submission
            if (hasSubmittedRef.current || isPending) return;
            hasSubmittedRef.current = true;

            setError("");

            startTransition(async () => {
                const result = await verifyOtpAction(email, code);

                if (result.error) {
                    setError(result.error);
                    hasSubmittedRef.current = false;

                    // Clear OTP inputs on error
                    setOtpValues(Array(6).fill(""));
                    return;
                }

                if (result.success) {
                    setSuccess(true);
                    // Redirect to main app after brief success display
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 1000);
                }
            });
        },
        [email, isPending, startTransition]
    );

    // ============================================================
    // Resend OTP
    // ============================================================
    async function handleResend() {
        if (resendCooldown > 0 || isResending) return;

        setIsResending(true);
        setError("");

        const result = await requestOtpAction(email);

        if (result.error) {
            setError(result.error);
            if (result.cooldownSeconds) {
                setResendCooldown(result.cooldownSeconds);
            }
        } else {
            setResendCooldown(60);
            setOtpValues(Array(6).fill(""));
            hasSubmittedRef.current = false;
        }

        setIsResending(false);
    }

    // Mask email for display: j***n@company.com
    const maskedEmail = email
        ? email.replace(/^(.{1})(.*)(@.*)$/, (_, first, middle, domain) => {
            return first + "*".repeat(Math.min(middle.length, 4)) + domain;
        })
        : "";

    if (!email) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back link */}
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6 font-medium"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to email
                </Link>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 bg-navy-800 flex items-center justify-center rounded-sm">
                            <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-wide text-navy-950 uppercase">
                                KAIA CREATIVE
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase ml-1.5">
                                STUDIO
                            </span>
                        </div>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">
                        Complete Registration
                    </h1>
                    <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                        Enter the OTP code sent to your email to complete your registration.
                        This OTP is valid only for account sign-up and cannot be used for login.
                    </p>
                    <p className="text-xs text-slate-400">
                        We sent a 6-digit code to{" "}
                        <span className="font-semibold text-slate-600">{maskedEmail}</span>
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-navy-800" />
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Verify Code
                            </h2>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            The code expires in 5 minutes
                        </p>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Success State */}
                        {success ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-emerald-700">
                                        Email Verified!
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Redirecting to dashboard...
                                    </p>
                                </div>
                                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* OTP Input Array */}
                                <OtpInput
                                    length={6}
                                    value={otpValues}
                                    onChange={setOtpValues}
                                    onComplete={handleVerify}
                                    disabled={isPending}
                                />

                                {/* Processing indicator */}
                                {isPending && (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 text-navy-800 animate-spin" />
                                        <span className="text-xs font-semibold text-navy-800">
                                            Verifying...
                                        </span>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2 p-2.5 border border-red-200 bg-red-50 rounded-sm">
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                        <p className="text-[11px] text-red-600 font-medium">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* Manual submit button (fallback) */}
                                <button
                                    onClick={() => {
                                        const code = otpValues.join("");
                                        if (code.length === 6) handleVerify(code);
                                    }}
                                    disabled={
                                        isPending ||
                                        otpValues.join("").length !== 6
                                    }
                                    className="btn btn-primary w-full btn-lg"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="w-4 h-4" />
                                            Verify Code
                                        </>
                                    )}
                                </button>

                                {/* Resend section */}
                                <div className="flex items-center justify-center">
                                    {resendCooldown > 0 ? (
                                        <p className="text-[11px] text-slate-400">
                                            Resend available in{" "}
                                            <span className="font-bold text-slate-600 tabular-nums">
                                                {resendCooldown}s
                                            </span>
                                        </p>
                                    ) : (
                                        <button
                                            onClick={handleResend}
                                            disabled={isResending}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800 hover:text-navy-950 transition-colors disabled:text-slate-300"
                                        >
                                            {isResending ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-3 h-3" />
                                            )}
                                            {isResending
                                                ? "Sending..."
                                                : "Resend Code"}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3" />
                    <span>
                        Never share your verification code with anyone.
                    </span>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Page Export with Suspense Boundary
// ============================================================
export default function VerifyOtpPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-navy-800 animate-spin" />
                </div>
            }
        >
            <VerifyOtpContent />
        </Suspense>
    );
}
