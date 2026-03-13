"use client";

// ============================================================
// WATERMARK TOOL — Full-featured watermark editor
// ============================================================
// Features:
//   - Upload image → live preview with watermark overlay
//   - 5 watermark modes (single, pattern, center, texture, invisible)
//   - Full control panel (text, opacity, font, rotation, density, color)
//   - Opacity recommendation hints
//   - Export to PNG/JPEG with watermark baked in
//   - No lag: uses requestAnimationFrame + cached canvas layers
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useWatermarkStore } from "@/store/watermark-store";
import { renderWatermarkLayers, exportWithWatermark } from "@/lib/watermark/watermark-engine";
import { OPACITY_RECOMMENDATIONS } from "@/lib/watermark/watermark-types";
import type { WatermarkPosition, PatternStyle } from "@/lib/watermark/watermark-types";
import {
    validateImageFile,
    validateImageDimensions,
    isRateLimited,
    getRemainingActions,
    MAX_EXPORTS_PER_MINUTE,
    MAX_IMAGE_UPLOAD_MB,
    MAX_CANVAS_SIZE,
} from "@/lib/safety-limits";
import {
    Upload,
    Download,
    RotateCcw,
    Image as ImageIcon,
    Type,
    Layers,
    Shield,
    Eye,
    Fingerprint,
    Grid3X3,
    Target,
    AlertCircle,
    X,
    Info,
    Loader2,
} from "lucide-react";

// ============================================================
// CONSTANTS
// ============================================================
const POSITIONS: { value: WatermarkPosition; label: string }[] = [
    { value: "center", label: "Center" },
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "bottom-right", label: "Bottom Right" },
];

const PATTERN_STYLES: { value: PatternStyle; label: string }[] = [
    { value: "grid", label: "Grid" },
    { value: "diagonal", label: "Diagonal" },
    { value: "random", label: "Random" },
];

const FONT_FAMILIES = [
    "Inter, sans-serif",
    "Arial, sans-serif",
    "Georgia, serif",
    "Courier New, monospace",
    "Verdana, sans-serif",
    "Times New Roman, serif",
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function WatermarkTool() {
    const {
        config,
        imageFile,
        imageUrl,
        setConfig,
        resetConfig,
        toggleMode,
        setText,
        setOpacity,
        setFontSize,
        setRotation,
        setDensity,
        setColor,
        setPosition,
        setPatternStyle,
        setFontFamily,
        setImageFile,
        clearImage,
    } = useWatermarkStore();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const rafRef = useRef<number>(0);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-clear error after 5 seconds
    useEffect(() => {
        if (errorMsg) {
            const t = setTimeout(() => setErrorMsg(null), 5000);
            return () => clearTimeout(t);
        }
    }, [errorMsg]);

    // ============================================================
    // Load image into memory
    // ============================================================
    useEffect(() => {
        if (!imageUrl) {
            imageRef.current = null;
            return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Validate dimensions before accepting
            const dimError = validateImageDimensions(img.naturalWidth, img.naturalHeight);
            if (dimError) {
                setErrorMsg(dimError);
                clearImage();
                return;
            }
            imageRef.current = img;
            drawPreview();
        };
        img.onerror = () => {
            setErrorMsg("Failed to load image. The file may be corrupted.");
            clearImage();
        };
        img.src = imageUrl;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    // ============================================================
    // Draw Preview — requestAnimationFrame for smooth updates
    // ============================================================
    const drawPreview = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            const img = imageRef.current;
            if (!canvas || !img) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Scale to fit preview while maintaining aspect ratio
            const maxW = canvas.parentElement?.clientWidth || 800;
            const maxH = 600;
            const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
            const w = Math.round(img.naturalWidth * scale);
            const h = Math.round(img.naturalHeight * scale);

            canvas.width = w;
            canvas.height = h;

            // Clear and draw image
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            // Draw watermark layers on top
            const anyEnabled =
                config.singleEnabled ||
                config.patternEnabled ||
                config.centerEnabled ||
                config.textureEnabled ||
                config.invisibleEnabled;

            if (anyEnabled) {
                const wmCanvas = renderWatermarkLayers(config, w, h);
                ctx.drawImage(wmCanvas, 0, 0);
            }
        });
    }, [config]);

    // Re-draw when config changes
    useEffect(() => {
        drawPreview();
    }, [config, drawPreview]);

    // ============================================================
    // File upload handler
    // ============================================================
    function processFile(file: File) {
        const fileError = validateImageFile(file);
        if (fileError) {
            setErrorMsg(fileError);
            return;
        }
        setErrorMsg(null);
        setImageFile(file);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }

    // ============================================================
    // Export handler
    // ============================================================
    async function handleExport() {
        if (!imageRef.current) return;

        // Rate limit check
        if (isRateLimited("watermark-export", MAX_EXPORTS_PER_MINUTE)) {
            const remaining = getRemainingActions("watermark-export", MAX_EXPORTS_PER_MINUTE);
            setErrorMsg(`Export rate limit reached (${MAX_EXPORTS_PER_MINUTE}/min). Please wait a moment. Remaining: ${remaining}`);
            return;
        }

        setIsExporting(true);
        setErrorMsg(null);

        try {
            const blob = await exportWithWatermark(imageRef.current, config, exportFormat);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `watermarked-${Date.now()}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            setErrorMsg(err instanceof Error ? err.message : "Export failed unexpectedly.");
        }

        setIsExporting(false);
    }

    // ============================================================
    // Opacity recommendation hint
    // ============================================================
    function getOpacityHint(val: number): string {
        if (val <= 15) return "Visible but easy to remove";
        if (val <= 25) return "Medium protection";
        if (val <= 35) return "Strong protection";
        if (val <= 45) return "Very strong";
        if (val <= 55) return "Recommended anti-AI level";
        return "Very hard to remove but visible";
    }

    const anyModeEnabled =
        config.singleEnabled ||
        config.patternEnabled ||
        config.centerEnabled ||
        config.textureEnabled ||
        config.invisibleEnabled;

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="flex flex-col lg:flex-row h-full gap-0">
            {/* ============================== */}
            {/* LEFT: Settings Panel */}
            {/* ============================== */}
            <div className="w-full lg:w-[380px] flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-navy-800 rounded-sm flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    Watermark Studio
                                </h2>
                                <p className="text-[10px] text-slate-400">Anti-AI protection system</p>
                            </div>
                        </div>
                        <button
                            onClick={resetConfig}
                            className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-2">
                        <label className="form-label">Upload Image</label>
                        {!imageUrl ? (
                            <div
                                className="border-2 border-dashed border-slate-200 rounded-sm p-8 text-center cursor-pointer hover:border-navy-400 hover:bg-navy-50/30 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-slate-500">
                                    Drop image here or click to upload
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    JPG, PNG • Max {MAX_IMAGE_UPLOAD_MB}MB • Max {MAX_CANVAS_SIZE}px
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                                <ImageIcon className="w-4 h-4 text-navy-800 flex-shrink-0" />
                                <span className="text-xs font-medium text-slate-700 truncate flex-1">
                                    {imageFile?.name || "Image loaded"}
                                </span>
                                <button
                                    onClick={() => { clearImage(); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

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

                    {/* ============================== */}
                    {/* Watermark Modes */}
                    {/* ============================== */}
                    <div className="space-y-2">
                        <label className="form-label flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Protection Layers
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {[
                                { key: "singleEnabled" as const, label: "Single Watermark", icon: Type, desc: "One positioned text overlay" },
                                { key: "patternEnabled" as const, label: "Pattern Watermark", icon: Grid3X3, desc: "Repeating text grid/diagonal" },
                                { key: "centerEnabled" as const, label: "Center Protection", icon: Target, desc: "Large center text coverage" },
                                { key: "textureEnabled" as const, label: "Texture / Noise", icon: Fingerprint, desc: "Micro text + noise blend" },
                                { key: "invisibleEnabled" as const, label: "Invisible Layer", icon: Eye, desc: "Hidden pixel-level watermark" },
                            ].map(({ key, label, icon: Icon, desc }) => (
                                <button
                                    key={key}
                                    onClick={() => toggleMode(key)}
                                    className={`flex items-center gap-3 p-2.5 rounded-sm border text-left transition-all ${config[key]
                                        ? "border-navy-300 bg-navy-50/50 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                        }`}
                                >
                                    <div className={`w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 ${config[key] ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-400"
                                        }`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-xs font-semibold block ${config[key] ? "text-navy-800" : "text-slate-600"
                                            }`}>
                                            {label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block truncate">{desc}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${config[key]
                                        ? "border-navy-800 bg-navy-800"
                                        : "border-slate-300"
                                        }`}>
                                        {config[key] && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ============================== */}
                    {/* Text Settings */}
                    {/* ============================== */}
                    {anyModeEnabled && (
                        <>
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <label className="form-label">Watermark Text</label>
                                <input
                                    type="text"
                                    value={config.text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter watermark text"
                                />
                            </div>

                            {/* Font Family */}
                            <div className="space-y-1.5">
                                <label className="form-label">Font Family</label>
                                <select
                                    value={config.fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="form-input"
                                >
                                    {FONT_FAMILIES.map((f) => (
                                        <option key={f} value={f}>{f.split(",")[0]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Color */}
                            <div className="space-y-1.5">
                                <label className="form-label">Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={config.color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-8 h-8 border border-slate-200 rounded-sm cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-500 font-mono">{config.color}</span>
                                </div>
                            </div>

                            {/* Opacity */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="form-label mb-0">Opacity</label>
                                    <span className="text-xs font-bold text-navy-800 tabular-nums">{config.opacity}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={100}
                                    value={config.opacity}
                                    onChange={(e) => setOpacity(Number(e.target.value))}
                                    className="w-full accent-navy-800"
                                />
                                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    {getOpacityHint(config.opacity)}
                                </p>
                                {/* Recommendation markers */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {OPACITY_RECOMMENDATIONS.map((r) => (
                                        <button
                                            key={r.value}
                                            onClick={() => setOpacity(r.value)}
                                            className={`text-[9px] px-1.5 py-0.5 rounded-sm border transition-all ${config.opacity === r.value
                                                ? "bg-navy-800 text-white border-navy-800"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-navy-300"
                                                }`}
                                            title={r.level}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="form-label mb-0">Font Size</label>
                                    <span className="text-xs font-bold text-slate-600 tabular-nums">{config.fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={8}
                                    max={200}
                                    value={config.fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full accent-navy-800"
                                />
                            </div>

                            {/* Rotation */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="form-label mb-0">Rotation</label>
                                    <span className="text-xs font-bold text-slate-600 tabular-nums">{config.rotation}°</span>
                                </div>
                                <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    value={config.rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="w-full accent-navy-800"
                                />
                            </div>

                            {/* Position (for single mode) */}
                            {config.singleEnabled && (
                                <div className="space-y-1.5">
                                    <label className="form-label">Position</label>
                                    <select
                                        value={config.position}
                                        onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
                                        className="form-input"
                                    >
                                        {POSITIONS.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Pattern Style */}
                            {config.patternEnabled && (
                                <div className="space-y-1.5">
                                    <label className="form-label">Pattern Style</label>
                                    <div className="flex gap-1.5">
                                        {PATTERN_STYLES.map((p) => (
                                            <button
                                                key={p.value}
                                                onClick={() => setPatternStyle(p.value)}
                                                className={`flex-1 text-xs py-1.5 rounded-sm border font-semibold transition-all ${config.patternStyle === p.value
                                                    ? "bg-navy-800 text-white border-navy-800"
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-navy-300"
                                                    }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Density */}
                            {(config.patternEnabled || config.textureEnabled || config.invisibleEnabled) && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="form-label mb-0">Density</label>
                                        <span className="text-xs font-bold text-slate-600 tabular-nums">{config.density}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        value={config.density}
                                        onChange={(e) => setDensity(Number(e.target.value))}
                                        className="w-full accent-navy-800"
                                    />
                                </div>
                            )}

                            {/* Recommendation box */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-semibold text-amber-700">AI Protection Tip</p>
                                        <p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">
                                            Enable multiple layers (Pattern + Center + Texture) with 40–50% opacity for strongest protection against AI removal tools.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================== */}
                    {/* Export Settings */}
                    {/* ============================== */}
                    {imageUrl && anyModeEnabled && (
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                            <label className="form-label">Export Format</label>
                            <div className="flex gap-1.5">
                                {(["png", "jpeg"] as const).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setExportFormat(fmt)}
                                        className={`flex-1 text-xs py-1.5 rounded-sm border font-semibold uppercase transition-all ${exportFormat === fmt
                                            ? "bg-navy-800 text-white border-navy-800"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-navy-300"
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={isExporting || !imageUrl}
                                className="btn btn-primary w-full btn-lg"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download Watermarked Image
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================== */}
            {/* RIGHT: Live Preview Canvas */}
            {/* ============================== */}
            <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-6 overflow-auto min-h-[400px]">
                {/* Preview header */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        Live Preview
                    </span>
                    {anyModeEnabled && (
                        <span className="text-[10px] font-semibold text-navy-800 bg-navy-50 border border-navy-200 px-1.5 py-0.5 rounded-sm">
                            {[
                                config.singleEnabled && "Single",
                                config.patternEnabled && "Pattern",
                                config.centerEnabled && "Center",
                                config.textureEnabled && "Texture",
                                config.invisibleEnabled && "Invisible",
                            ]
                                .filter(Boolean)
                                .join(" + ")}
                        </span>
                    )}
                </div>

                {imageUrl ? (
                    <div className="bg-white shadow-lg border border-slate-200 rounded-sm p-1 max-w-full">
                        <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto block"
                            style={{ imageRendering: "auto" }}
                        />
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">No image loaded</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Upload an image to see the watermark preview
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary mt-4"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Image
                        </button>
                    </div>
                )}

                {/* Info bar */}
                {imageUrl && imageRef.current && (
                    <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400">
                        <span>
                            Original: {imageRef.current.naturalWidth} × {imageRef.current.naturalHeight}px
                        </span>
                        <span>
                            File: {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + " MB" : "—"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
