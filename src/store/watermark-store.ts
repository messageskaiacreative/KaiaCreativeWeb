// ============================================================
// WATERMARK STORE — Zustand state for watermark configuration
// ============================================================

import { create } from "zustand";
import type { WatermarkConfig, WatermarkPosition, PatternStyle } from "@/lib/watermark/watermark-types";
import { DEFAULT_WATERMARK_CONFIG } from "@/lib/watermark/watermark-types";
import { clearWatermarkCache } from "@/lib/watermark/watermark-engine";

interface WatermarkState {
    config: WatermarkConfig;
    // The user-loaded image
    imageFile: File | null;
    imageUrl: string | null;

    // Actions
    setConfig: (partial: Partial<WatermarkConfig>) => void;
    resetConfig: () => void;
    toggleMode: (mode: keyof Pick<WatermarkConfig, "singleEnabled" | "patternEnabled" | "centerEnabled" | "textureEnabled" | "invisibleEnabled">) => void;
    setText: (text: string) => void;
    setOpacity: (opacity: number) => void;
    setFontSize: (size: number) => void;
    setRotation: (deg: number) => void;
    setDensity: (density: number) => void;
    setColor: (color: string) => void;
    setPosition: (pos: WatermarkPosition) => void;
    setPatternStyle: (style: PatternStyle) => void;
    setFontFamily: (family: string) => void;
    setImageFile: (file: File | null) => void;
    clearImage: () => void;
}

export const useWatermarkStore = create<WatermarkState>((set, get) => ({
    config: { ...DEFAULT_WATERMARK_CONFIG },
    imageFile: null,
    imageUrl: null,

    setConfig: (partial) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, ...partial } }));
    },

    resetConfig: () => {
        clearWatermarkCache();
        set({ config: { ...DEFAULT_WATERMARK_CONFIG } });
    },

    toggleMode: (mode) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, [mode]: !s.config[mode] } }));
    },

    setText: (text) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, text } }));
    },

    setOpacity: (opacity) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, opacity } }));
    },

    setFontSize: (fontSize) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, fontSize } }));
    },

    setRotation: (rotation) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, rotation } }));
    },

    setDensity: (density) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, density } }));
    },

    setColor: (color) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, color } }));
    },

    setPosition: (position) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, position } }));
    },

    setPatternStyle: (patternStyle) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, patternStyle } }));
    },

    setFontFamily: (fontFamily) => {
        clearWatermarkCache();
        set((s) => ({ config: { ...s.config, fontFamily } }));
    },

    setImageFile: (file) => {
        const prev = get().imageUrl;
        if (prev) URL.revokeObjectURL(prev);
        if (file) {
            const url = URL.createObjectURL(file);
            set({ imageFile: file, imageUrl: url });
        } else {
            set({ imageFile: null, imageUrl: null });
        }
    },

    clearImage: () => {
        const prev = get().imageUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({ imageFile: null, imageUrl: null });
    },
}));
