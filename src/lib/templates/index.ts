import type { DocumentPayload } from "@/types/documents";
import { renderOfficialLetter } from "./official-letter";
import { renderCoverLetter } from "./cover-letter";
import { renderPdfFromText } from "./pdf-from-text";
import { renderInvoice } from "./invoice";
import { renderContract } from "./contract";

export function renderDocument(payload: DocumentPayload): string {
    switch (payload.type) {
        case "official-letter":
            return renderOfficialLetter(payload);
        case "cover-letter":
            return renderCoverLetter(payload);
        case "pdf-from-text":
            return renderPdfFromText(payload);
        case "invoice":
            return renderInvoice(payload);
        case "contract":
            return renderContract(payload);
        default:
            return '<p style="color:#94a3b8;">Select a document type to begin.</p>';
    }
}
