import { create } from "zustand";
import type { DocumentType, SubscriptionTier, DocumentPayload } from "@/types/documents";

// ============================================================
// APP STORE — Global state (Auth is handled by Supabase)
// Tier management is handled by Admin Panel (not client-side)
// ============================================================

interface UserInfo {
    id: string;
    email: string;
    name: string;
    tier: SubscriptionTier;
}

interface AppState {
    // User info (set from Supabase session)
    user: UserInfo | null;

    // Active document
    activeDocumentType: DocumentType;
    currentPayload: DocumentPayload | null;

    // UI state
    isSidebarOpen: boolean;
    isDownloading: boolean;
    previewKey: number;

    // Toast
    toast: { message: string; type: "success" | "error" | "info" } | null;

    // Actions
    setUser: (user: UserInfo | null) => void;
    setActiveDocumentType: (type: DocumentType) => void;
    setCurrentPayload: (payload: DocumentPayload | null) => void;
    toggleSidebar: () => void;
    setIsDownloading: (val: boolean) => void;
    incrementPreviewKey: () => void;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    clearToast: () => void;
    getUserTier: () => SubscriptionTier;
}

export const useAppStore = create<AppState>((set, get) => ({
    user: null,

    activeDocumentType: "resume-builder",
    currentPayload: null,

    isSidebarOpen: true,
    isDownloading: false,
    previewKey: 0,

    toast: null,

    setUser: (user) => set({ user }),

    setActiveDocumentType: (type) =>
        set({ activeDocumentType: type, currentPayload: null }),

    setCurrentPayload: (payload) =>
        set({ currentPayload: payload, previewKey: get().previewKey + 1 }),

    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

    setIsDownloading: (val) => set({ isDownloading: val }),

    incrementPreviewKey: () =>
        set((s) => ({ previewKey: s.previewKey + 1 })),

    showToast: (message, type = "info") => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 4000);
    },

    clearToast: () => set({ toast: null }),

    getUserTier: () => {
        const user = get().user;
        return user?.tier ?? "free";
    },
}));
