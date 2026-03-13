"use client";

import { useState, useTransition, Suspense } from "react";
import { registerWithPasswordAction } from "@/app/auth/actions";
import {
    FileText,
    Shield,
    Mail,
    Loader2,
    AlertCircle,
    ArrowRight,
    KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function RegisterFormContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        startTransition(async () => {
            const result = await registerWithPasswordAction(email, password);

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.success) {
                // Navigate to OTP verify page with email as query param
                router.push(
                    `/auth/verify-otp?email=${encodeURIComponent(email)}`
                );
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
                        Register Admin Account
                    </h1>
                    <p className="text-xs text-slate-400">
                        Create a new email and password for the admin account.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="register-email" className="form-label">
                                Alamat Email{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="register-email"
                                    name="email"
                                    type="email"
                                    className="form-input !pl-10"
                                    placeholder="admin@gmail.com"
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
                            <label htmlFor="register-password" className="form-label">
                                Password{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="register-password"
                                    name="password"
                                    type="password"
                                    className="form-input !pl-10"
                                    placeholder="Admin123"
                                    autoComplete="new-password"
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
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="w-4 h-4" />
                                    Register Account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="px-6 py-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="font-semibold text-navy-800 hover:text-navy-600 transition-colors">
                                Login Here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3" />
                    <span>
                        Make sure the email and password are correct to complete setup.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-navy-800 animate-spin" />
                </div>
            }
        >
            <RegisterFormContent />
        </Suspense>
    );
}
