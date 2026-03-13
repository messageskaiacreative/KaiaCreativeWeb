"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import {
    Upload,
    FileText,
    Loader2,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// Types
// ============================================================
type ExtractionStatus = "idle" | "uploading" | "pending" | "processing" | "completed" | "failed";

interface ExtractionRecord {
    id: string;
    status: string;
    extracted_markdown: string | null;
    error_message: string | null;
    created_at: string;
}

// ============================================================
// PDF Extractor Tool Component
// ============================================================
export default function PdfExtractorTool() {
    const { showToast } = useAppStore();
    const supabase = createClient();

    // State
    const [status, setStatus] = useState<ExtractionStatus>("idle");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extractionId, setExtractionId] = useState<string | null>(null);
    const [markdown, setMarkdown] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ============================================================
    // Cleanup Realtime Subscription
    // ============================================================
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [supabase]);

    // ============================================================
    // Subscribe to Realtime Changes
    // ============================================================
    const subscribeToExtraction = useCallback(
        (id: string) => {
            // Clean up previous subscription
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }

            const channel = supabase
                .channel(`extraction-${id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "extractions",
                        filter: `id=eq.${id}`,
                    },
                    (payload) => {
                        const record = payload.new as ExtractionRecord;

                        if (record.status === "processing") {
                            setStatus("processing");
                        } else if (record.status === "completed") {
                            setStatus("completed");
                            setMarkdown(record.extracted_markdown || "");
                            showToast("PDF extracted successfully!", "success");

                            // Clean up subscription
                            supabase.removeChannel(channel);
                            channelRef.current = null;
                        } else if (record.status === "failed") {
                            setStatus("failed");
                            setErrorMessage(record.error_message || "Extraction failed");
                            showToast("Extraction failed", "error");

                            // Clean up subscription
                            supabase.removeChannel(channel);
                            channelRef.current = null;
                        }
                    }
                )
                .subscribe();

            channelRef.current = channel;
        },
        [supabase, showToast]
    );

    // ============================================================
    // File Validation
    // ============================================================
    const validateFile = (file: File): string | null => {
        if (file.type !== "application/pdf") {
            return "Only PDF files are accepted";
        }
        if (file.size > 20 * 1024 * 1024) {
            return "File size must be less than 20MB";
        }
        return null;
    };

    // ============================================================
    // Handle File Selection
    // ============================================================
    const handleFileSelect = (file: File) => {
        const error = validateFile(file);
        if (error) {
            showToast(error, "error");
            return;
        }
        setSelectedFile(file);
        setStatus("idle");
        setMarkdown("");
        setErrorMessage("");
        setExtractionId(null);
    };

    // ============================================================
    // Drag & Drop Handlers
    // ============================================================
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // ============================================================
    // Upload & Extract
    // ============================================================
    const handleUploadAndExtract = async () => {
        if (!selectedFile) return;

        try {
            setStatus("uploading");
            setUploadProgress(0);
            setErrorMessage("");

            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Please sign in to use this feature");
            }

            // Create unique file path: userId/timestamp-filename
            const timestamp = Date.now();
            const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const filePath = `${user.id}/${timestamp}-${safeName}`;

            setUploadProgress(20);

            // Upload directly to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, selectedFile, {
                    contentType: "application/pdf",
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            setUploadProgress(60);

            // Insert extraction record (triggers webhook to Python worker)
            const { data: extraction, error: insertError } = await supabase
                .from("extractions")
                .insert({
                    user_id: user.id,
                    file_path: filePath,
                    status: "pending",
                })
                .select("id")
                .single();

            if (insertError) {
                throw new Error(`Failed to create extraction: ${insertError.message}`);
            }

            setUploadProgress(80);

            // Subscribe to realtime updates
            setExtractionId(extraction.id);
            setStatus("pending");
            subscribeToExtraction(extraction.id);

            setUploadProgress(100);
        } catch (error) {
            setStatus("failed");
            const msg = error instanceof Error ? error.message : "Upload failed";
            setErrorMessage(msg);
            showToast(msg, "error");
        }
    };

    // ============================================================
    // Copy to Clipboard
    // ============================================================
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
            showToast("Copied to clipboard!", "success");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast("Failed to copy", "error");
        }
    };

    // ============================================================
    // Reset
    // ============================================================
    const handleReset = () => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setSelectedFile(null);
        setStatus("idle");
        setMarkdown("");
        setErrorMessage("");
        setExtractionId(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ============================================================
    // Status Display
    // ============================================================
    const getStatusDisplay = () => {
        switch (status) {
            case "uploading":
                return {
                    icon: <Loader2 className="w-5 h-5 animate-spin text-navy-800" />,
                    text: "Uploading PDF...",
                    color: "text-navy-800",
                };
            case "pending":
                return {
                    icon: <Loader2 className="w-5 h-5 animate-spin text-amber-500" />,
                    text: "Queued for processing...",
                    color: "text-amber-600",
                };
            case "processing":
                return {
                    icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
                    text: "Extracting text from PDF...",
                    color: "text-blue-600",
                };
            case "completed":
                return {
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                    text: "Extraction complete!",
                    color: "text-emerald-600",
                };
            case "failed":
                return {
                    icon: <XCircle className="w-5 h-5 text-red-500" />,
                    text: "Extraction failed",
                    color: "text-red-600",
                };
            default:
                return null;
        }
    };

    const statusDisplay = getStatusDisplay();
    const isProcessing = ["uploading", "pending", "processing"].includes(status);

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="h-full overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-[0.12em]">
                        PDF Text Extractor
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Upload a PDF to extract its content as clean Markdown text. Preserves tables,
                        lists, and reading order.
                    </p>
                </div>

                {/* Upload Zone */}
                <div
                    className={`
                        relative border-2 border-dashed rounded-sm p-8 text-center
                        transition-all duration-200 cursor-pointer
                        ${dragOver
                            ? "border-navy-800 bg-navy-50"
                            : selectedFile
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-25"
                        }
                        ${isProcessing ? "pointer-events-none opacity-60" : ""}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleInputChange}
                    />

                    {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="w-10 h-10 text-emerald-500" />
                            <p className="text-sm font-semibold text-slate-700">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-slate-400">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-slate-100 rounded-sm flex items-center justify-center">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-600">
                                    Drop your PDF here or click to browse
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    PDF only, max 20MB
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {status === "uploading" && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                            className="bg-navy-800 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                {/* Status Display */}
                {statusDisplay && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-sm">
                        {statusDisplay.icon}
                        <span className={`text-sm font-semibold ${statusDisplay.color}`}>
                            {statusDisplay.text}
                        </span>
                        {extractionId && (
                            <span className="text-[10px] text-slate-300 ml-auto font-mono">
                                ID: {extractionId.slice(0, 8)}
                            </span>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {status === "failed" && errorMessage && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">{errorMessage}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {selectedFile && status === "idle" && (
                        <button
                            onClick={handleUploadAndExtract}
                            className="btn btn-primary"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Extract Text
                        </button>
                    )}

                    {status === "failed" && selectedFile && (
                        <button
                            onClick={handleUploadAndExtract}
                            className="btn btn-primary"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Retry
                        </button>
                    )}

                    {(selectedFile || status !== "idle") && !isProcessing && (
                        <button onClick={handleReset} className="btn btn-secondary">
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>

                {/* Markdown Result */}
                {status === "completed" && markdown && (
                    <div className="bg-white border border-slate-200 rounded-sm">
                        {/* Result Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
                                    Extracted Markdown
                                </span>
                                <span className="text-[10px] text-slate-300 font-mono">
                                    ({markdown.length.toLocaleString()} chars)
                                </span>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="btn btn-ghost btn-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-emerald-600">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Markdown Content */}
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed break-words">
                                {markdown}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Info Footer */}
                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="font-medium uppercase tracking-wider">
                        Privacy First — Files are auto-deleted after 24 hours
                    </span>
                </div>
            </div>
        </div>
    );
}
