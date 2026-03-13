import { create } from 'zustand';

export interface LetterMargin {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface LetterSpacing {
    lineSpacing: number;
    paragraphSpacing: number;
}

export interface LetterContent {
    city?: string;
    date?: string;
    companyName?: string;
    companyAddress?: string;
    position?: string;
    recipientName?: string;
    openingGreeting?: string;
    bodyText?: string;
    closingText?: string;
    signatureName?: string;
    attachmentsList?: string;
    phone?: string;
    email?: string;
    customParagraph?: string;
}

export interface LetterState {
    template: string;
    font: string;
    fontSize: number;
    margin: LetterMargin;
    spacing: LetterSpacing;
    language: 'id' | 'en';
    content: LetterContent;
    
    // Actions
    setTemplate: (template: string) => void;
    setFont: (font: string, fontSize?: number) => void;
    setMargin: (margin: Partial<LetterMargin>) => void;
    setSpacing: (spacing: Partial<LetterSpacing>) => void;
    setLanguage: (lang: 'id' | 'en') => void;
    updateContent: (content: Partial<LetterContent>) => void;
    resetTemplate: () => void;
}

const defaultContent: LetterContent = {
    city: "Jakarta",
    date: "1 Juni 2024",
    companyName: "PT Application Tech",
    companyAddress: "Jl. Sudirman No. 1\\nJakarta Pusat",
    position: "Software Engineer",
    recipientName: "HR Manager",
    openingGreeting: "Dengan Hormat,",
    bodyText: "Berkaitan dengan informasi lowongan pekerjaan...",
    closingText: "Hormat saya,",
    signatureName: "Nama Anda",
    phone: "+62 812 3456 7890",
    email: "email@example.com"
};

const defaultState = {
    template: 'formal',
    font: 'Times New Roman',
    fontSize: 12,
    margin: { top: 25, bottom: 25, left: 25, right: 25 },
    spacing: { lineSpacing: 1.5, paragraphSpacing: 12 },
    language: 'id' as const,
    content: defaultContent,
};

export const useLetterStore = create<LetterState>((set) => ({
    ...defaultState,
    setTemplate: (template) => set({ template }),
    setFont: (font, fontSize) => set((state) => ({ font, fontSize: fontSize || state.fontSize })),
    setMargin: (marginUpdate) => set((state) => ({ margin: { ...state.margin, ...marginUpdate } })),
    setSpacing: (spacingUpdate) => set((state) => ({ spacing: { ...state.spacing, ...spacingUpdate } })),
    setLanguage: (language) => set({ language }),
    updateContent: (contentUpdate) => set((state) => ({ content: { ...state.content, ...contentUpdate } })),
    resetTemplate: () => set(defaultState),
}));
