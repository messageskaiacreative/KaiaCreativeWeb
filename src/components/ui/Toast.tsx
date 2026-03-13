"use client";

import { useAppStore } from "@/store/app-store";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export default function Toast() {
    const { toast, clearToast } = useAppStore();

    if (!toast) return null;

    const iconMap = {
        success: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        error: <AlertCircle className="w-4 h-4 text-red-600" />,
        info: <Info className="w-4 h-4 text-blue-600" />,
    };

    const borderMap = {
        success: "border-l-emerald-600",
        error: "border-l-red-600",
        info: "border-l-blue-600",
    };

    return (
        <div
            id="toast"
            className={`toast border-l-[3px] ${borderMap[toast.type]}`}
            role="alert"
        >
            {iconMap[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={clearToast}
                className="p-0.5 hover:bg-slate-100 rounded-sm transition-colors"
            >
                <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
        </div>
    );
}
