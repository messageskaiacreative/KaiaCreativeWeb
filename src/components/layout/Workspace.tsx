"use client";

import { useAppStore } from "@/store/app-store";
import dynamic from "next/dynamic";
import DocumentPreview from "@/components/preview/DocumentPreview";
import DownloadBar from "@/components/layout/DownloadBar";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const OfficialLetterForm = dynamic(() => import("@/components/forms/OfficialLetterForm"), {
    loading: () => <LoadingSkeleton />,
});
const CoverLetterForm = dynamic(() => import("@/components/forms/CoverLetterForm"), {
    loading: () => <LoadingSkeleton />,
});
const PdfFromTextForm = dynamic(() => import("@/components/forms/PdfFromTextForm"), {
    loading: () => <LoadingSkeleton />,
});
const InvoiceForm = dynamic(() => import("@/components/forms/InvoiceForm"), {
    loading: () => <LoadingSkeleton />,
});
const ContractForm = dynamic(() => import("@/components/forms/ContractForm"), {
    loading: () => <LoadingSkeleton />,
});
const ResumeTailoringTool = dynamic(() => import("@/components/tools/ResumeTailoringTool"), {
    loading: () => <LoadingSkeleton />,
});
const ResumeDistributionTool = dynamic(() => import("@/components/tools/ResumeDistributionTool"), {
    loading: () => <LoadingSkeleton />,
});
const CVFromFileTool = dynamic(() => import("@/components/tools/CVFromFileTool"), {
    loading: () => <LoadingSkeleton />,
    ssr: false,
});
const PdfExtractorTool = dynamic(() => import("@/components/tools/PdfExtractorTool"), {
    loading: () => <LoadingSkeleton />,
});
const WatermarkTool = dynamic(() => import("@/components/tools/WatermarkTool"), {
    loading: () => <LoadingSkeleton />,
    ssr: false,
});

function getFormComponent(docType: string) {
    switch (docType) {
        case "official-letter":
            return <OfficialLetterForm />;
        case "cover-letter":
            return <CoverLetterForm />;
        case "pdf-from-text":
            return <PdfFromTextForm />;
        case "invoice":
            return <InvoiceForm />;
        case "contract":
            return <ContractForm />;
        default:
            return <OfficialLetterForm />;
    }
}

export default function Workspace() {
    const { activeDocumentType } = useAppStore();

    if (activeDocumentType === "resume-tailoring") {
        return <ResumeTailoringTool />;
    }

    if (activeDocumentType === "resume-distribution") {
        return <ResumeDistributionTool />;
    }

    if (activeDocumentType === "cv-from-file") {
        return <CVFromFileTool />;
    }

    if (activeDocumentType === "pdf-extractor") {
        return <PdfExtractorTool />;
    }

    if (activeDocumentType === "watermark-tool") {
        return <WatermarkTool />;
    }

    return (
        <div className="split-pane-container">
            {/* LEFT: Form Pane */}
            <div className="form-pane flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<LoadingSkeleton />}>
                        {getFormComponent(activeDocumentType)}
                    </Suspense>
                </div>
                <DownloadBar />
            </div>

            {/* RIGHT: Preview Pane */}
            <div className="preview-pane">
                <div className="mb-3 flex items-center justify-between w-full max-w-[210mm]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            Live Preview
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">
                        A4 (210 × 297 mm)
                    </span>
                </div>
                <DocumentPreview />
            </div>
        </div>
    );
}
