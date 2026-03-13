"use client";

// ============================================================
// CV FROM FILE TOOL — Upload file → Parse → Preview → Export PDF
// ============================================================
// Uses CVLayout (single source) for both preview and export.
// Export uses html2canvas → jsPDF to capture the exact same
// layout rendered in preview. Zero mismatch guaranteed.
// ============================================================

import { useCallback, useRef, useState } from "react";
import CVLayout from "@/components/cv-from-file/CVLayout";
import { parseFileToCV } from "@/lib/cv-from-file/cv-parser";
import { EMPTY_CV_DATA, CV_LAYOUT } from "@/lib/cv-from-file/cv-types";
import type { CVData } from "@/lib/cv-from-file/cv-types";
import { isRateLimited, MAX_PDF_PER_MINUTE } from "@/lib/safety-limits";
import {
    Upload,
    Download,
    RotateCcw,
    FileText,
    Loader2,
    AlertCircle,
    X,
    FileCode,
    FileJson,
    Eye,
} from "lucide-react";

const ACCEPTED_TYPES = [".txt", ".md", ".json", ".text", ".markdown"];

export default function CVFromFileTool() {
    const [cvData, setCvData] = useState<CVData | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const layoutRef = useRef<HTMLDivElement>(null);

    // ============================================================
    // File Upload
    // ============================================================
    const handleFileUpload = useCallback(async (file: File) => {
        setErrorMsg(null);

        // Validate file size (max 1MB for text files)
        if (file.size > 1024 * 1024) {
            setErrorMsg("File too large. Maximum 1MB for text files.");
            return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (!["txt", "md", "json", "text", "markdown"].includes(ext)) {
            setErrorMsg("Unsupported file type. Use TXT, Markdown (.md), or JSON.");
            return;
        }

        try {
            const content = await file.text();
            const parsed = parseFileToCV(content, ext);
            setCvData(parsed);
            setFileName(file.name);
        } catch (err) {
            console.error("Parse error:", err);
            setErrorMsg("Failed to parse file. Check format and try again.");
        }
    }, []);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    }

    function handleReset() {
        setCvData(null);
        setFileName("");
        setErrorMsg(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    // ============================================================
    // PDF Export — Uses html2canvas + jspdf on the EXACT same layout
    // ============================================================
    async function handleExportPDF() {
        if (!cvData || !layoutRef.current) return;

        if (isRateLimited("cv-pdf-export", MAX_PDF_PER_MINUTE)) {
            setErrorMsg(`Rate limit: max ${MAX_PDF_PER_MINUTE} exports per minute.`);
            return;
        }

        setIsExporting(true);
        setErrorMsg(null);

        try {
            const html2canvas = (await import("html2canvas")).default;
            const jsPDF = (await import("jspdf")).default;

            const element = layoutRef.current;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                width: CV_LAYOUT.pageWidthPx,
                windowWidth: CV_LAYOUT.pageWidthPx,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pdfW = 210;
            const pdfH = 297;
            pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

            pdf.save(`CV-${cvData.personalInfo.firstName || "document"}-${Date.now()}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            setErrorMsg("PDF export failed. Please try again.");
        }

        setIsExporting(false);
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="flex flex-col lg:flex-row h-full gap-0">
            {/* ============================== */}
            {/* LEFT: Upload & Controls */}
            {/* ============================== */}
            <div className="w-full lg:w-[380px] flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-navy-800 rounded-sm flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    CV from File
                                </h2>
                                <p className="text-[10px] text-slate-400">Upload → Preview → Export PDF</p>
                            </div>
                        </div>
                        {cvData && (
                            <button
                                onClick={handleReset}
                                className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        )}
                    </div>

                    {/* Upload Area */}
                    {!cvData ? (
                        <div
                            className="border-2 border-dashed border-slate-200 rounded-sm p-8 text-center cursor-pointer hover:border-navy-400 hover:bg-navy-50/30 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-slate-500">
                                Drop your CV file here or click to upload
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Supports TXT, Markdown (.md), JSON
                            </p>
                            <div className="flex justify-center gap-2 mt-3">
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm border border-slate-200 flex items-center gap-1">
                                    <FileCode className="w-3 h-3" /> .txt
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm border border-slate-200 flex items-center gap-1">
                                    <FileCode className="w-3 h-3" /> .md
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm border border-slate-200 flex items-center gap-1">
                                    <FileJson className="w-3 h-3" /> .json
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm">
                                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="text-xs font-medium text-emerald-700 truncate flex-1">
                                    {fileName}
                                </span>
                                <button onClick={handleReset} className="text-emerald-400 hover:text-red-500 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Parsed Data Summary */}
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1.5">
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parsed Data</h3>
                                {[
                                    { label: "Name", val: [cvData.personalInfo.firstName, cvData.personalInfo.lastName].filter(Boolean).join(" ") },
                                    { label: "Job Title", val: cvData.personalInfo.jobTitle },
                                    { label: "Email", val: cvData.personalInfo.email },
                                    { label: "Summary", val: cvData.summary ? `${cvData.summary.substring(0, 50)}...` : "" },
                                    { label: "Experience", val: `${cvData.experience.length} items` },
                                    { label: "Education", val: `${cvData.education.length} items` },
                                    { label: "Skills", val: `${cvData.skills.length} items` },
                                    { label: "Languages", val: `${cvData.languages.length} items` },
                                ].map((row) => (
                                    <div key={row.label} className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">{row.label}</span>
                                        <span className="text-slate-700 font-medium truncate max-w-[180px]">{row.val || "—"}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Layout Info */}
                            <div className="p-2.5 bg-navy-50 border border-navy-200 rounded-sm">
                                <div className="flex items-start gap-2">
                                    <Eye className="w-3.5 h-3.5 text-navy-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-semibold text-navy-700">Strict Layout Mode</p>
                                        <p className="text-[10px] text-navy-500 mt-0.5">
                                            A4 • 20mm margins • Fixed spacing • Preview = PDF
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="btn btn-primary w-full btn-lg"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-red-600 leading-relaxed">{errorMsg}</p>
                            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Upload Another */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        onChange={handleInputChange}
                        className="hidden"
                    />

                    {/* JSON Format Guide */}
                    {!cvData && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">JSON Format Guide</h3>
                            <pre className="text-[9px] text-slate-600 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                                {`{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "jobTitle": "Software Engineer",
    "email": "john@email.com",
    "phone": "+62 812 345 6789"
  },
  "summary": "Experienced developer...",
  "experience": [{
    "jobTitle": "Senior Dev",
    "employer": "Company",
    "startDate": "2020-01",
    "endDate": "Present",
    "description": "Led team..."
  }],
  "education": [{
    "degree": "S.Kom",
    "school": "University",
    "startDate": "2016",
    "endDate": "2020"
  }],
  "skills": ["React", "Node.js"],
  "languages": ["English", "Indonesian"]
}`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================== */}
            {/* RIGHT: Live Preview (Same layout as PDF) */}
            {/* ============================== */}
            <div className="flex-1 bg-slate-100 flex flex-col items-center p-6 overflow-auto min-h-[400px]">
                {/* Preview header */}
                <div className="mb-3 flex items-center justify-between w-full max-w-[210mm]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            Preview (= PDF Output)
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">
                        A4 (210 × 297 mm)
                    </span>
                </div>

                {cvData ? (
                    <div
                        ref={layoutRef}
                        className="bg-white shadow-lg border border-slate-200"
                        style={{ width: "210mm" }}
                    >
                        <CVLayout data={cvData} />
                    </div>
                ) : (
                    <div className="text-center mt-20">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">No CV loaded</p>
                        <p className="text-xs text-slate-400 mt-1">Upload a TXT, Markdown, or JSON file to generate your CV</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary mt-4"
                        >
                            <Upload className="w-4 h-4" />
                            Upload File
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
