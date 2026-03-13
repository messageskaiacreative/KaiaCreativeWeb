// ============================================================
// WATERMARK TYPES — Configuration & Interfaces
// ============================================================

export type WatermarkPosition =
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";

export type PatternStyle = "grid" | "diagonal" | "random";

export interface WatermarkConfig {
    // Toggle modes
    singleEnabled: boolean;
    patternEnabled: boolean;
    centerEnabled: boolean;
    textureEnabled: boolean;
    invisibleEnabled: boolean;

    // Text settings
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    opacity: number; // 0–100

    // Layout
    rotation: number; // degrees
    position: WatermarkPosition;
    patternStyle: PatternStyle;
    density: number; // 1–10, controls spacing
    spacing: number; // px between pattern items

    // Texture
    textureSize: number; // micro text size
    noiseDensity: number; // 1–10
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
    singleEnabled: false,
    patternEnabled: false,
    centerEnabled: false,
    textureEnabled: false,
    invisibleEnabled: false,

    text: "WATERMARK",
    fontFamily: "Inter, sans-serif",
    fontSize: 48,
    fontWeight: "bold",
    color: "#000000",
    opacity: 40,

    rotation: -30,
    position: "center",
    patternStyle: "diagonal",
    density: 5,
    spacing: 200,

    textureSize: 8,
    noiseDensity: 5,
};

export interface OpacityRecommendation {
    value: number;
    label: string;
    level: string;
}

export const OPACITY_RECOMMENDATIONS: OpacityRecommendation[] = [
    { value: 15, label: "15%", level: "Visible but easy to remove" },
    { value: 25, label: "25%", level: "Medium protection" },
    { value: 35, label: "35%", level: "Strong protection" },
    { value: 45, label: "45%", level: "Very strong" },
    { value: 50, label: "50%", level: "Recommended anti-AI level" },
    { value: 60, label: "60%+", level: "Very hard to remove" },
];
