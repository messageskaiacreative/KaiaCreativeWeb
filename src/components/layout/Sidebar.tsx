"use client";

import { useAppStore } from "@/store/app-store";
import { DOCUMENT_CATEGORIES } from "@/types/documents";
import type { DocumentType } from "@/types/documents";
import {
    FileText,
    Mail,
    FileOutput,
    Receipt,
    Scale,
    Lock,
    Target,
    Send,
    FileEdit,
    Shield,
} from "lucide-react";
import { useMemo } from "react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    FileText,
    Mail,
    FileOutput,
    Receipt,
    Scale,
    Target,
    Send,
    FileEdit,
    Shield,
};

export default function Sidebar() {
    const { activeDocumentType, setActiveDocumentType, getUserTier } =
        useAppStore();
    const userTier = getUserTier();

    const categories = useMemo(() => DOCUMENT_CATEGORIES, []);

    function handleSelect(docType: DocumentType, tier: string) {
        if (tier === "premium" && userTier === "free") {
            useAppStore
                .getState()
                .showToast("Upgrade to Premium to access this feature", "error");
            return;
        }
        setActiveDocumentType(docType);
    }

    return (
        <aside
            id="sidebar"
            className="w-[220px] bg-white border-r border-slate-200 flex flex-col h-full"
        >
            {/* Section header */}
            <div className="px-4 pt-4 pb-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Document Types
                </h2>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 pb-4 space-y-0.5">
                {categories.map((cat) => {
                    const Icon = ICON_MAP[cat.icon] || FileText;
                    const isActive = activeDocumentType === cat.id;
                    const isLocked = cat.tier === "premium" && userTier === "free";

                    return (
                        <button
                            key={cat.id}
                            id={`nav-${cat.id}`}
                            onClick={() => handleSelect(cat.id, cat.tier)}
                            className={`sidebar-nav-item w-full text-left ${isActive ? "active" : ""
                                } ${isLocked ? "locked" : ""}`}
                            title={cat.description}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{cat.label}</span>
                            {isLocked && (
                                <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            )}
                            {cat.tier === "premium" && !isLocked && (
                                <span className="tier-badge tier-badge-premium">Pro</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer info */}
            <div className="px-4 py-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Privacy First
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    Zero storage. Documents are generated in-memory and never saved.
                </p>
            </div>
        </aside>
    );
}
