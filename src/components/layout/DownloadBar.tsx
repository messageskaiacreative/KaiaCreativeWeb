"use client";

import { useAppStore } from "@/store/app-store";
import { Download, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { isRateLimited, MAX_PDF_PER_MINUTE } from "@/lib/safety-limits";

export default function DownloadBar() {
    const { currentPayload, getUserTier, isDownloading, setIsDownloading, showToast } = useAppStore();
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const userTier = getUserTier();

    async function handleDownload() {
        if (!currentPayload) {
            showToast("Please fill in the form first", "error");
            return;
        }

        // Rate limit check (client-side, no Redis)
        if (isRateLimited("pdf-export", MAX_PDF_PER_MINUTE)) {
            showToast(`Rate limit: max ${MAX_PDF_PER_MINUTE} downloads per minute. Please wait.`, "error");
            return;
        }

        setIsDownloading(true);

        try {
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payload: currentPayload,
                    tier: userTier,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
                throw new Error(err.error || "Failed to generate PDF");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${currentPayload.type}-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast("PDF downloaded successfully", "success");
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : "Failed to generate PDF",
                "error"
            );
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                {userTier === "free" && (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-sm border border-slate-100">
                        Free tier — PDF includes watermark
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Mobile preview toggle */}
                <button
                    onClick={() => setShowMobilePreview(!showMobilePreview)}
                    className="btn btn-secondary btn-sm lg:hidden"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                </button>

                <button
                    id="download-btn"
                    onClick={handleDownload}
                    disabled={isDownloading || !currentPayload}
                    className="btn btn-primary btn-lg"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
