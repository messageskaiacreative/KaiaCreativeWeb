import type { InvoicePayload } from "@/types/documents";

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", IDR: "Rp", JPY: "¥",
};

function fmt(amount: number, currency: string): string {
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
}

function buildRows(items: InvoicePayload["lineItems"], currency: string) {
    return items.map((item, i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:9.5pt;">${i + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:9.5pt;">${item.description || "—"}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:9.5pt;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:9.5pt;text-align:right;">${fmt(item.unitPrice, currency)}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:9.5pt;text-align:right;font-weight:500;">${fmt(item.quantity * item.unitPrice, currency)}</td>
    </tr>
  `).join("");
}

function buildTHead() {
    return `<thead><tr>
    <th style="padding:8px;text-align:left;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #334155;color:#64748b;width:36px;">#</th>
    <th style="padding:8px;text-align:left;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #334155;color:#64748b;">Description</th>
    <th style="padding:8px;text-align:center;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #334155;color:#64748b;width:50px;">Qty</th>
    <th style="padding:8px;text-align:right;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #334155;color:#64748b;width:80px;">Price</th>
    <th style="padding:8px;text-align:right;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #334155;color:#64748b;width:90px;">Total</th>
  </tr></thead>`;
}

function buildTotals(data: InvoicePayload) {
    return `<div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="width:200px;font-size:9.5pt;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#64748b;">Subtotal</span><span>${fmt(data.subtotal || 0, data.currency)}</span></div>
      ${data.taxRate ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#64748b;">Tax (${data.taxRate}%)</span><span>${fmt(data.taxAmount || 0, data.currency)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:12pt;border-top:2px solid #1e3a8a;margin-top:4px;color:#1e3a8a;"><span>Total</span><span>${fmt(data.total || 0, data.currency)}</span></div>
    </div>
  </div>`;
}

export function renderInvoice(data: InvoicePayload): string {
    const label = data.documentKind === "quotation" ? "QUOTATION" : "INVOICE";
    const rows = buildRows(data.lineItems || [], data.currency);

    return `
    <div style="font-family:Inter,sans-serif;color:#1e293b;line-height:1.5;">
      <div style="display:flex;justify-content:space-between;margin-bottom:28px;">
        <h1 style="font-size:24pt;font-weight:800;color:#1e3a8a;margin:0;">${label}</h1>
        <div style="text-align:right;font-size:9pt;color:#64748b;">
          <p style="margin:0;font-weight:600;color:#334155;"># ${data.invoiceNumber || "—"}</p>
          <p style="margin:2px 0 0 0;">Date: ${fmtDate(data.date)}</p>
          <p style="margin:0;">Due: ${fmtDate(data.dueDate)}</p>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:24px;font-size:9pt;">
        <div>
          <p style="margin:0;font-size:8pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">From</p>
          <p style="margin:0;font-weight:600;">${data.fromName || ""}</p>
          <p style="margin:2px 0;color:#64748b;white-space:pre-line;">${data.fromAddress || ""}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:8pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">To</p>
          <p style="margin:0;font-weight:600;">${data.toName || ""}</p>
          <p style="margin:2px 0;color:#64748b;white-space:pre-line;">${data.toAddress || ""}</p>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;">${buildTHead()}<tbody>${rows}</tbody></table>
      ${buildTotals(data)}
      ${data.paymentTerms ? `<p style="margin-top:20px;font-size:8.5pt;color:#64748b;"><strong>Payment Terms:</strong> ${data.paymentTerms}</p>` : ""}
      ${data.notes ? `<p style="font-size:8.5pt;color:#64748b;">${data.notes}</p>` : ""}
    </div>
  `;
}
