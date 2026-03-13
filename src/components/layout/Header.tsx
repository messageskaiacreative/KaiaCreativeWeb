"use client";

import { useAppStore } from "@/store/app-store";
import { logoutAction } from "@/app/auth/actions";
import {
    FileText,
    Shield,
    LogOut,
    Crown,
    User,
    ChevronDown,
    Loader2,
} from "lucide-react";
import { useState, useRef, useEffect, useTransition } from "react";

export default function Header() {
    const { user } = useAppStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleLogout() {
        setDropdownOpen(false);
        startTransition(async () => {
            await logoutAction();
        });
    }

    return (
        <header
            id="main-header"
            className="h-14 flex items-center justify-between px-5"
            style={{ backgroundColor: '#ababab', borderBottom: '1px solid #9e9e9e' }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-slate-800 flex items-center justify-center rounded-sm">
                    <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black tracking-wide uppercase">
                        <span className="text-maroon">KAIA</span> <span className="text-white">CREATIVE</span>
                    </span>
                    <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">
                        STUDIO
                    </span>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {user ? (
                    <>
                        {/* Tier indicator (read-only, managed by admin) */}
                        {user.tier === "premium" ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/10 border border-amber-600/20 rounded-sm">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                    Premium
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/30 border border-slate-600/30 rounded-sm">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Free Plan
                                </span>
                            </div>
                        )}

                        {/* User dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                id="user-menu-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-slate-800 transition-colors duration-150"
                            >
                                <div className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-sm flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate">
                                    {user.name}
                                </span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-sm shadow-lg z-50">
                                    <div className="px-3 py-2.5 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-700 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 rounded-sm transition-colors duration-150"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Shield className="w-3.5 h-3.5" />
                                            Account & Security
                                        </button>
                                        <button
                                            id="logout-btn"
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-sm transition-colors duration-150"
                                            onClick={handleLogout}
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <LogOut className="w-3.5 h-3.5" />
                                            )}
                                            {isPending ? "Signing Out..." : "Sign Out"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Loading...</span>
                    </div>
                )}
            </div>
        </header>
    );
}
