"use client";

import { useState, useTransition } from "react";
import { loginWithPasswordAction } from "@/app/auth/actions";
import {
    FileText,
    Shield,
    Mail,
    ArrowRight,
    AlertCircle,
    Loader2,
    KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthModal() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!email.trim() || !email.includes("@")) {
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
                router.push("/");
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
                    <h1 className="text-xl font-bold text-slate-800 mb-1">
                        Login via Modal
                    </h1>
                    <p className="text-xs text-slate-400">
                        Access your dashboard
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="auth-email" className="form-label">
                                Alamat Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input !pl-10"
                                    placeholder="nama@perusahaan.com"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="auth-password" className="form-label">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="auth-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input !pl-10"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-2.5 border border-red-200 bg-red-50 rounded-sm">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <p className="text-[11px] text-red-600 font-medium">{error}</p>
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
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3" />
                    <span>
                        Secure Connection.
                    </span>
                </div>
            </div>
        </div>
    );
}
