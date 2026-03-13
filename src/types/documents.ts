// ============================================================
// DOCUMENT TYPES & SHARED INTERFACES
// All-in-One Document Generation SaaS
// ============================================================

/** User subscription tier */
export type SubscriptionTier = "free" | "premium";

/** Available document types */
export type DocumentType =
    | "official-letter"
    | "cover-letter"
    | "pdf-from-text"
    | "invoice"
    | "contract"
    | "cv-from-file"
    | "resume-tailoring"
    | "resume-distribution"
    | "pdf-extractor"
    | "watermark-tool";

/** Document category metadata */
export interface DocumentCategory {
    id: DocumentType;
    label: string;
    description: string;
    icon: string;
    tier: SubscriptionTier;
}

/** All available document categories */
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
    {
        id: "official-letter",
        label: "Official Letter",
        description: "Generate formal letters, permission letters, and official correspondence",
        icon: "FileText",
        tier: "free",
    },
    {
        id: "cover-letter",
        label: "Cover Letter",
        description: "Create professional cover letters tailored to job applications",
        icon: "Mail",
        tier: "free",
    },
    {
        id: "pdf-from-text",
        label: "PDF from Text",
        description: "Convert raw text or markdown into a clean, formatted PDF",
        icon: "FileOutput",
        tier: "free",
    },
    {
        id: "invoice",
        label: "Invoice & Quotation",
        description: "Generate professional invoices and quotations for your business",
        icon: "Receipt",
        tier: "premium",
    },
    {
        id: "contract",
        label: "Contract & Agreement",
        description: "Build legally-formatted contracts and lease agreements",
        icon: "Scale",
        tier: "premium",
    },
    {
        id: "resume-tailoring",
        label: "Resume Tailoring",
        description: "Analyze and score your resume against job descriptions",
        icon: "Target",
        tier: "free",
    },
    {
        id: "cv-from-file",
        label: "CV from File",
        description: "Generate a professional CV from your TXT, Markdown, or JSON file",
        icon: "FileEdit",
        tier: "free",
    },
    {
        id: "resume-distribution",
        label: "Resume Distribution",
        description: "Manage and track resume sent to various platforms",
        icon: "Send",
        tier: "free",
    },
    {
        id: "pdf-extractor",
        label: "PDF Extractor",
        description: "Extract text and tables from PDF files into clean Markdown",
        icon: "FileOutput",
        tier: "free",
    },
    {
        id: "watermark-tool",
        label: "Watermark Studio",
        description: "Add anti-AI watermarks to protect your images",
        icon: "Shield",
        tier: "free",
    },
];

// ============================================================
// OFFICIAL LETTER PAYLOAD
// ============================================================
export interface OfficialLetterPayload {
    type: "official-letter";
    senderName: string;
    senderTitle: string;
    senderOrganization: string;
    senderAddress: string;
    senderPhone: string;
    senderEmail: string;
    recipientName: string;
    recipientTitle: string;
    recipientOrganization: string;
    recipientAddress: string;
    date: string;
    referenceNumber: string;
    subject: string;
    body: string;
    closingRemarks: string;
    template: "formal" | "government" | "corporate";
}

// ============================================================
// COVER LETTER PAYLOAD
// ============================================================
export interface CoverLetterPayload {
    type: "cover-letter";
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    applicantAddress: string;
    recipientName: string;
    recipientTitle: string;
    companyName: string;
    companyAddress: string;
    date: string;
    jobTitle: string;
    introduction: string;
    bodyParagraph1: string;
    bodyParagraph2: string;
    closing: string;
    template: "modern" | "classic" | "executive";
}

// ============================================================
// PDF FROM TEXT PAYLOAD
// ============================================================
export interface PdfFromTextPayload {
    type: "pdf-from-text";
    title: string;
    content: string;
    author: string;
    date: string;
    format: "plain" | "markdown";
    pageSize: "A4" | "Letter" | "Legal";
    fontSize: number;
    template: "minimal" | "document" | "report";
}

// ============================================================
// INVOICE PAYLOAD
// ============================================================
export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface InvoicePayload {
    type: "invoice";
    documentKind: "invoice" | "quotation";
    invoiceNumber: string;
    date: string;
    dueDate: string;
    fromName: string;
    fromAddress: string;
    fromEmail: string;
    fromPhone: string;
    toName: string;
    toAddress: string;
    toEmail: string;
    toPhone: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    currency: string;
    notes: string;
    paymentTerms: string;
    template: "clean" | "professional" | "corporate";
}

// ============================================================
// CONTRACT PAYLOAD
// ============================================================
export interface ContractClause {
    title: string;
    content: string;
}

export interface ContractPayload {
    type: "contract";
    contractType: "general" | "lease" | "service" | "nda";
    title: string;
    date: string;
    effectiveDate: string;
    expirationDate: string;
    partyOneName: string;
    partyOneTitle: string;
    partyOneAddress: string;
    partyTwoName: string;
    partyTwoTitle: string;
    partyTwoAddress: string;
    recitals: string;
    clauses: ContractClause[];
    governingLaw: string;
    disputeResolution: string;
    template: "standard" | "formal" | "executive";
}

// ============================================================
// UNION TYPE FOR ALL PAYLOADS
// ============================================================
export type DocumentPayload =
    | OfficialLetterPayload
    | CoverLetterPayload
    | PdfFromTextPayload
    | InvoicePayload
    | ContractPayload;

// ============================================================
// USER & AUTH TYPES
// ============================================================
export interface User {
    id: string;
    email: string;
    name: string;
    tier: SubscriptionTier;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// ============================================================
// TEMPLATE METADATA
// ============================================================
export interface TemplateOption {
    id: string;
    label: string;
    tier: SubscriptionTier;
    description: string;
}

export function getTemplatesForType(docType: DocumentType): TemplateOption[] {
    switch (docType) {
        case "official-letter":
            return [
                { id: "formal", label: "Formal", tier: "free", description: "Standard formal letter format" },
                { id: "government", label: "Government", tier: "premium", description: "Official government letterhead style" },
                { id: "corporate", label: "Corporate", tier: "premium", description: "Corporate branding letter style" },
            ];
        case "cover-letter":
            return [
                { id: "classic", label: "Classic", tier: "free", description: "Traditional cover letter format" },
                { id: "modern", label: "Modern", tier: "premium", description: "Contemporary sleek design" },
                { id: "executive", label: "Executive", tier: "premium", description: "Senior professional format" },
            ];
        case "pdf-from-text":
            return [
                { id: "minimal", label: "Minimal", tier: "free", description: "Clean, minimal text layout" },
                { id: "document", label: "Document", tier: "free", description: "Standard document format" },
                { id: "report", label: "Report", tier: "premium", description: "Professional report layout" },
            ];
        case "invoice":
            return [
                { id: "clean", label: "Clean", tier: "premium", description: "Simple clean invoice" },
                { id: "professional", label: "Professional", tier: "premium", description: "Detailed professional invoice" },
                { id: "corporate", label: "Corporate", tier: "premium", description: "Enterprise invoice format" },
            ];
        case "contract":
            return [
                { id: "standard", label: "Standard", tier: "premium", description: "Standard legal contract" },
                { id: "formal", label: "Formal", tier: "premium", description: "Formal legal document" },
                { id: "executive", label: "Executive", tier: "premium", description: "Executive agreement format" },
            ];
        default:
            return [];
    }
}
