"use client";

import { useState, useTransition, Suspense } from "react";
import { loginWithPasswordAction } from "@/app/auth/actions";
import {
    FileText,
    Shield,
    Mail,
    Loader2,
    AlertCircle,
    ArrowRight,
    KeyRound,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginFormContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackError = searchParams.get("error");
    const sessionTerminated = searchParams.get("session_terminated");
    const redirectUrl = searchParams.get("redirect") || "/";

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        if (!password) {
            setError("Please enter your password");
            return;
        }

        startTransition(async () => {
            const result = await loginWithPasswordAction(email, password);

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.success) {
                router.push(redirectUrl);
                router.refresh();
            }
        });
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 bg-navy-800 flex items-center justify-center rounded-sm">
                            <FileText
                                className="w-5 h-5 text-white"
                                strokeWidth={2.5}
                            />
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
                    <h1 className="text-xl font-bold text-slate-800 mb-1">
                        Login Account
                    </h1>
                    <p className="text-xs text-slate-400">
                        Enter your email and password to access your dashboard
                    </p>
                </div>

                {/* Session terminated notice */}
                {sessionTerminated && (
                    <div className="mb-4 p-3 border border-amber-200 bg-amber-50 rounded-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <p className="text-xs font-medium text-amber-700">
                            Sesi Anda telah berakhir karena akun ini sedang login di perangkat lain.
                            Hanya diizinkan 1 sesi aktif pada waktu yang sama.
                        </p>
                    </div>
                )}

                {/* Callback error */}
                {callbackError && (
                    <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs font-medium text-red-600">
                            Autentikasi gagal. Silakan coba lagi.
                        </p>
                    </div>
                )}

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="login-email" className="form-label">
                                Alamat Email{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    className="form-input !pl-10"
                                    placeholder="nama@perusahaan.com"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    disabled={isPending}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="login-password" className="form-label">
                                Password{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="login-password"
                                    name="password"
                                    type="password"
                                    className="form-input !pl-10"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    disabled={isPending}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-2.5 border border-red-200 bg-red-50 rounded-sm">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <p className="text-[11px] text-red-600 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending || !email || !password}
                            className="btn btn-primary w-full btn-lg"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="px-6 py-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">
                            Don't have an admin account?{" "}
                            <Link href="/auth/register" className="font-semibold text-navy-800 hover:text-navy-600 transition-colors">
                                Register Here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3" />
                    <span>
                        Secure Encrypted Connection. Hanya 1 sesi aktif per akun.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-navy-800 animate-spin" />
                </div>
            }
        >
            <LoginFormContent />
        </Suspense>
    );
}
