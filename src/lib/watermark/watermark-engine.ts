// ============================================================
// WATERMARK ENGINE — High-Performance Canvas Rendering
// ============================================================
// Architecture:
//   - Uses OffscreenCanvas for watermark layer (separate from image)
//   - Each mode renders onto its own cached bitmap
//   - Final composite merges image + all watermark layers
//   - requestAnimationFrame for smooth preview updates
//   - No full canvas re-render on config change
// ============================================================

import type { WatermarkConfig } from "./watermark-types";

// ============================================================
// LAYER CACHE — Avoid re-rendering unchanged layers
// ============================================================
const layerCache = new Map<string, ImageBitmap | HTMLCanvasElement>();

function getCacheKey(mode: string, config: WatermarkConfig, w: number, h: number): string {
    const relevant: Record<string, unknown> = {
        mode,
        text: config.text,
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        fontWeight: config.fontWeight,
        color: config.color,
        opacity: config.opacity,
        rotation: config.rotation,
        position: config.position,
        patternStyle: config.patternStyle,
        density: config.density,
        spacing: config.spacing,
        textureSize: config.textureSize,
        noiseDensity: config.noiseDensity,
        w,
        h,
    };
    return JSON.stringify(relevant);
}

export function clearWatermarkCache() {
    layerCache.clear();
}

// ============================================================
// HELPER: Create an offscreen canvas (fallback to regular)
// ============================================================
function createLayerCanvas(w: number, h: number): CanvasRenderingContext2D {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    return ctx;
}

// ============================================================
// MODE 1: Single Text Watermark
// ============================================================
function renderSingleWatermark(
    ctx: CanvasRenderingContext2D,
    config: WatermarkConfig,
    w: number,
    h: number
) {
    const { text, fontFamily, fontSize, fontWeight, color, opacity, rotation, position } = config;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let x = w / 2;
    let y = h / 2;

    switch (position) {
        case "top-left": x = w * 0.15; y = h * 0.1; break;
        case "top-right": x = w * 0.85; y = h * 0.1; break;
        case "top-center": x = w * 0.5; y = h * 0.1; break;
        case "bottom-left": x = w * 0.15; y = h * 0.9; break;
        case "bottom-right": x = w * 0.85; y = h * 0.9; break;
        case "bottom-center": x = w * 0.5; y = h * 0.9; break;
        case "center":
        default: x = w / 2; y = h / 2; break;
    }

    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

// ============================================================
// MODE 2: Pattern Watermark (grid / diagonal / random repeat)
// ============================================================
function renderPatternWatermark(
    ctx: CanvasRenderingContext2D,
    config: WatermarkConfig,
    w: number,
    h: number
) {
    const { text, fontFamily, fontSize, fontWeight, color, opacity, rotation, patternStyle, density } = config;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.font = `${fontWeight} ${Math.max(12, fontSize * 0.6)}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Spacing based on density (1=sparse, 10=dense)
    const gap = Math.max(60, 400 - density * 35);

    if (patternStyle === "grid") {
        for (let y = -h * 0.3; y < h * 1.3; y += gap) {
            for (let x = -w * 0.3; x < w * 1.3; x += gap) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.fillText(text, 0, 0);
                ctx.restore();
            }
        }
    } else if (patternStyle === "diagonal") {
        const diag = Math.sqrt(w * w + h * h);
        const count = Math.ceil(diag / gap);
        for (let i = -count; i < count * 2; i++) {
            for (let j = -count; j < count * 2; j++) {
                const x = i * gap;
                const y = j * gap;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.fillText(text, 0, 0);
                ctx.restore();
            }
        }
    } else {
        // Random
        const seed = text.length * 1337;
        const totalMarks = Math.floor(density * density * 2);
        for (let i = 0; i < totalMarks; i++) {
            const pseudoRand = (Math.sin(seed + i * 9973) * 10000) % 1;
            const pseudoRand2 = (Math.cos(seed + i * 7919) * 10000) % 1;
            const x = Math.abs(pseudoRand) * w;
            const y = Math.abs(pseudoRand2) * h;
            const r = rotation + (Math.sin(i) * 20);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((r * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
    }

    ctx.restore();
}

// ============================================================
// MODE 3: Center Protection Watermark
// ============================================================
function renderCenterWatermark(
    ctx: CanvasRenderingContext2D,
    config: WatermarkConfig,
    w: number,
    h: number
) {
    const { text, fontFamily, fontWeight, color, opacity, rotation } = config;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = opacity / 100;

    const bigSize = Math.min(w, h) * 0.12;
    ctx.font = `${fontWeight} ${bigSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);

    // Additional smaller text around center
    const smallSize = bigSize * 0.35;
    ctx.font = `${fontWeight} ${smallSize}px ${fontFamily}`;
    const offsets = [
        { dx: 0, dy: -bigSize * 0.9 },
        { dx: 0, dy: bigSize * 0.9 },
        { dx: -bigSize * 1.5, dy: 0 },
        { dx: bigSize * 1.5, dy: 0 },
    ];
    for (const o of offsets) {
        ctx.fillText(text, o.dx, o.dy);
    }

    ctx.restore();
}

// ============================================================
// MODE 4: Texture / Noise Watermark
// ============================================================
function renderTextureWatermark(
    ctx: CanvasRenderingContext2D,
    config: WatermarkConfig,
    w: number,
    h: number
) {
    const { text, fontFamily, color, opacity, noiseDensity, textureSize } = config;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = (opacity * 0.4) / 100; // Texture is more subtle

    // Micro text layer
    const microSize = Math.max(6, textureSize);
    ctx.font = `400 ${microSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const gap = Math.max(15, 120 - noiseDensity * 10);
    for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap * 3) {
            ctx.fillText(text, x, y);
        }
    }

    // Add noise dots for texture
    const noiseCount = noiseDensity * 500;
    ctx.globalAlpha = (opacity * 0.15) / 100;
    for (let i = 0; i < noiseCount; i++) {
        const nx = (Math.sin(i * 12345.6789) * 10000) % 1;
        const ny = (Math.cos(i * 98765.4321) * 10000) % 1;
        const px = Math.abs(nx) * w;
        const py = Math.abs(ny) * h;
        ctx.fillRect(px, py, 1, 1);
    }

    ctx.restore();
}

// ============================================================
// MODE 5: Invisible Watermark Layer
// ============================================================
function renderInvisibleWatermark(
    ctx: CanvasRenderingContext2D,
    config: WatermarkConfig,
    w: number,
    h: number
) {
    const { text, fontFamily, color, density } = config;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.03; // Very low — barely visible
    ctx.globalCompositeOperation = "multiply";

    const size = 10;
    ctx.font = `400 ${size}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const gap = Math.max(12, 80 - density * 6);
    for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap * 4) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(((y * 0.1) * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
    }

    ctx.restore();
}

// ============================================================
// COMPOSITE — Render all enabled layers onto a final canvas
// ============================================================
export function renderWatermarkLayers(
    config: WatermarkConfig,
    w: number,
    h: number
): HTMLCanvasElement {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = w;
    finalCanvas.height = h;
    const finalCtx = finalCanvas.getContext("2d")!;

    const modes: { key: string; enabled: boolean; render: typeof renderSingleWatermark }[] = [
        { key: "single", enabled: config.singleEnabled, render: renderSingleWatermark },
        { key: "pattern", enabled: config.patternEnabled, render: renderPatternWatermark },
        { key: "center", enabled: config.centerEnabled, render: renderCenterWatermark },
        { key: "texture", enabled: config.textureEnabled, render: renderTextureWatermark },
        { key: "invisible", enabled: config.invisibleEnabled, render: renderInvisibleWatermark },
    ];

    for (const mode of modes) {
        if (!mode.enabled) continue;

        const cacheKey = getCacheKey(mode.key, config, w, h);
        let cached = layerCache.get(cacheKey);

        if (!cached) {
            const layerCtx = createLayerCanvas(w, h);
            mode.render(layerCtx, config, w, h);
            cached = layerCtx.canvas;
            layerCache.set(cacheKey, cached);

            // Limit cache size
            if (layerCache.size > 20) {
                const firstKey = layerCache.keys().next().value;
                if (firstKey) layerCache.delete(firstKey);
            }
        }

        finalCtx.drawImage(cached as HTMLCanvasElement, 0, 0);
    }

    return finalCanvas;
}

// ============================================================
// EXPORT — Merge image + watermark into final exportable canvas
// ============================================================
export async function exportWithWatermark(
    imageSource: HTMLImageElement | HTMLCanvasElement | string,
    config: WatermarkConfig,
    format: "png" | "jpeg" = "png",
    quality: number = 0.92
): Promise<Blob> {
    // Load image if string URL
    let img: HTMLImageElement | HTMLCanvasElement;
    if (typeof imageSource === "string") {
        img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = imageSource;
        });
    } else {
        img = imageSource;
    }

    const w = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
    const h = img instanceof HTMLImageElement ? img.naturalHeight : img.height;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext("2d")!;

    // Draw original image
    ctx.drawImage(img, 0, 0, w, h);

    // Draw watermark layers on top
    const anyEnabled =
        config.singleEnabled ||
        config.patternEnabled ||
        config.centerEnabled ||
        config.textureEnabled ||
        config.invisibleEnabled;

    if (anyEnabled) {
        const watermarkCanvas = renderWatermarkLayers(config, w, h);
        ctx.drawImage(watermarkCanvas, 0, 0);
    }

    return new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Failed to export canvas to blob"));
            },
            `image/${format}`,
            quality
        );
    });
}
