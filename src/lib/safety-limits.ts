// ============================================================
// SAFETY LIMITS — Central config for all client-side limits
// ============================================================
// Architecture: Simple, low-cost. No Redis, no worker.
// All limits enforced in-browser for max 20 users.
// ============================================================

// ---- Canvas / Image Limits ----
export const MAX_CANVAS_SIZE = 8192;   // px (max dimension)
export const MAX_IMAGE_UPLOAD_MB = 5;  // MB
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;

// ---- PDF / DOC Limits ----
export const MAX_PDF_PAGES = 10;

// ---- Watermark Limits ----
export const MAX_WATERMARK_LAYERS = 5; // already 5 modes max

// ---- Rate Limits (per minute) ----
export const MAX_EXPORTS_PER_MINUTE = 10;
export const MAX_WATERMARKS_PER_MINUTE = 10;
export const MAX_PDF_PER_MINUTE = 10;

// ============================================================
// CLIENT-SIDE RATE LIMITER — Simple in-memory, no Redis
// ============================================================
// Uses a sliding window of timestamps per action key.
// Resets automatically. Safe for 20 users (runs per-browser).
// ============================================================

const actionTimestamps: Map<string, number[]> = new Map();

/**
 * Check if an action is rate-limited.
 * @param actionKey  Unique key for the action (e.g. "export", "watermark", "pdf")
 * @param maxPerMinute  Max allowed actions per 60 seconds
 * @returns `true` if blocked (rate-limited), `false` if allowed
 */
export function isRateLimited(actionKey: string, maxPerMinute: number): boolean {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute

    let timestamps = actionTimestamps.get(actionKey) || [];

    // Remove timestamps older than 1 minute
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxPerMinute) {
        actionTimestamps.set(actionKey, timestamps);
        return true; // BLOCKED
    }

    // Allow and record
    timestamps.push(now);
    actionTimestamps.set(actionKey, timestamps);
    return false; // ALLOWED
}

/**
 * Get remaining actions before rate-limit kicks in.
 */
export function getRemainingActions(actionKey: string, maxPerMinute: number): number {
    const now = Date.now();
    const timestamps = (actionTimestamps.get(actionKey) || []).filter(
        (t) => now - t < 60_000
    );
    return Math.max(0, maxPerMinute - timestamps.length);
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate image file before processing.
 * Returns error message string or null if valid.
 */
export function validateImageFile(file: File): string | null {
    if (!file.type.startsWith("image/")) {
        return "File must be an image (JPG, PNG, WebP, etc.)";
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        return `Image too large. Maximum size is ${MAX_IMAGE_UPLOAD_MB}MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
}

/**
 * Validate image dimensions after loading.
 * Returns error message string or null if valid.
 */
export function validateImageDimensions(width: number, height: number): string | null {
    if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
        return `Image dimensions too large. Maximum is ${MAX_CANVAS_SIZE}×${MAX_CANVAS_SIZE}px (your image: ${width}×${height}px)`;
    }
    if (width <= 0 || height <= 0) {
        return "Invalid image dimensions";
    }
    return null;
}
