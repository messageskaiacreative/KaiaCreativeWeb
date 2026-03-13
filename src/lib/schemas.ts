import { z } from "zod";

// ============================================================
// ZOD VALIDATION SCHEMAS FOR ALL DOCUMENT TYPES
// ============================================================

const nonEmpty = (label: string) =>
    z.string().min(1, `${label} is required`);

// OFFICIAL LETTER
export const officialLetterSchema = z.object({
    type: z.literal("official-letter"),
    senderName: nonEmpty("Sender name"),
    senderTitle: z.string().default(""),
    senderOrganization: nonEmpty("Organization"),
    senderAddress: nonEmpty("Address"),
    senderPhone: z.string().default(""),
    senderEmail: z.string().email("Invalid email").or(z.literal("")),
    recipientName: nonEmpty("Recipient name"),
    recipientTitle: z.string().default(""),
    recipientOrganization: z.string().default(""),
    recipientAddress: nonEmpty("Recipient address"),
    date: nonEmpty("Date"),
    referenceNumber: z.string().default(""),
    subject: nonEmpty("Subject"),
    body: nonEmpty("Letter body"),
    closingRemarks: z.string().default("Respectfully,"),
    template: z.enum(["formal", "government", "corporate"]).default("formal"),
});

// COVER LETTER
export const coverLetterSchema = z.object({
    type: z.literal("cover-letter"),
    applicantName: nonEmpty("Your name"),
    applicantEmail: z.string().email("Invalid email"),
    applicantPhone: z.string().default(""),
    applicantAddress: z.string().default(""),
    recipientName: nonEmpty("Recipient name"),
    recipientTitle: z.string().default(""),
    companyName: nonEmpty("Company name"),
    companyAddress: z.string().default(""),
    date: nonEmpty("Date"),
    jobTitle: nonEmpty("Job title"),
    introduction: nonEmpty("Introduction paragraph"),
    bodyParagraph1: nonEmpty("Body paragraph 1"),
    bodyParagraph2: z.string().default(""),
    closing: z.string().default("Thank you for your time and consideration."),
    template: z.enum(["modern", "classic", "executive"]).default("classic"),
});

// PDF FROM TEXT
export const pdfFromTextSchema = z.object({
    type: z.literal("pdf-from-text"),
    title: nonEmpty("Document title"),
    content: nonEmpty("Content"),
    author: z.string().default(""),
    date: z.string().default(""),
    format: z.enum(["plain", "markdown"]).default("plain"),
    pageSize: z.enum(["A4", "Letter", "Legal"]).default("A4"),
    fontSize: z.number().min(8).max(24).default(12),
    template: z.enum(["minimal", "document", "report"]).default("minimal"),
});

// INVOICE LINE ITEM
const lineItemSchema = z.object({
    description: nonEmpty("Description"),
    quantity: z.number().min(1, "Min 1"),
    unitPrice: z.number().min(0, "Min 0"),
    total: z.number(),
});

// INVOICE
export const invoiceSchema = z.object({
    type: z.literal("invoice"),
    documentKind: z.enum(["invoice", "quotation"]).default("invoice"),
    invoiceNumber: nonEmpty("Invoice number"),
    date: nonEmpty("Date"),
    dueDate: nonEmpty("Due date"),
    fromName: nonEmpty("From name"),
    fromAddress: nonEmpty("From address"),
    fromEmail: z.string().email("Invalid email").or(z.literal("")),
    fromPhone: z.string().default(""),
    toName: nonEmpty("To name"),
    toAddress: nonEmpty("To address"),
    toEmail: z.string().email("Invalid email").or(z.literal("")),
    toPhone: z.string().default(""),
    lineItems: z.array(lineItemSchema).min(1, "At least 1 line item required"),
    subtotal: z.number(),
    taxRate: z.number().min(0).max(100).default(0),
    taxAmount: z.number().default(0),
    total: z.number(),
    currency: z.string().default("USD"),
    notes: z.string().default(""),
    paymentTerms: z.string().default("Net 30"),
    template: z.enum(["clean", "professional", "corporate"]).default("clean"),
});

// CONTRACT CLAUSE
const clauseSchema = z.object({
    title: nonEmpty("Clause title"),
    content: nonEmpty("Clause content"),
});

// CONTRACT
export const contractSchema = z.object({
    type: z.literal("contract"),
    contractType: z.enum(["general", "lease", "service", "nda"]).default("general"),
    title: nonEmpty("Contract title"),
    date: nonEmpty("Date"),
    effectiveDate: nonEmpty("Effective date"),
    expirationDate: z.string().default(""),
    partyOneName: nonEmpty("Party 1 name"),
    partyOneTitle: z.string().default(""),
    partyOneAddress: nonEmpty("Party 1 address"),
    partyTwoName: nonEmpty("Party 2 name"),
    partyTwoTitle: z.string().default(""),
    partyTwoAddress: nonEmpty("Party 2 address"),
    recitals: z.string().default(""),
    clauses: z.array(clauseSchema).min(1, "At least 1 clause required"),
    governingLaw: z.string().default(""),
    disputeResolution: z.string().default(""),
    template: z.enum(["standard", "formal", "executive"]).default("standard"),
});

export type OfficialLetterForm = z.output<typeof officialLetterSchema>;
export type CoverLetterForm = z.output<typeof coverLetterSchema>;
export type PdfFromTextForm = z.output<typeof pdfFromTextSchema>;
export type InvoiceForm = z.output<typeof invoiceSchema>;
export type ContractForm = z.output<typeof contractSchema>;

