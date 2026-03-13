"use client";

import { useAppStore } from "@/store/app-store";
import { renderDocument } from "@/lib/templates";
import { useMemo } from "react";

export default function DocumentPreview() {
    const { currentPayload, getUserTier } = useAppStore();
    const userTier = getUserTier();
    const isFree = userTier === "free";

    const html = useMemo(() => {
        if (!currentPayload) return null;
        return renderDocument(currentPayload);
    }, [currentPayload]);

    if (!html) {
        return (
            <div className="paper">
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-sm flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-400 mb-1">
                        Document Preview
                    </p>
                    <p className="text-xs text-slate-300">
                        Fill in the form on the left to see a live preview
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="paper relative" id="document-preview">
            {isFree && (
                <div className="watermark-overlay">
                    <div className="watermark-text">KAIA CREATIVE FREE</div>
                </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
