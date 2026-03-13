import type { OfficialLetterPayload } from "@/types/documents";

export function renderOfficialLetter(data: OfficialLetterPayload): string {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    const bodyParagraphs = (data.body || "")
        .split("\n")
        .filter((p) => p.trim())
        .map((p) => `<p style="margin:0 0 12px 0;text-align:justify;">${p}</p>`)
        .join("");

    if (data.template === "government") {
        return `
      <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.7;font-size:11pt;">
        <div style="text-align:center;border-bottom:3px double #1e3a8a;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="font-family:Inter,sans-serif;font-size:15pt;font-weight:800;color:#1e3a8a;margin:0;letter-spacing:0.05em;text-transform:uppercase;">
            ${data.senderOrganization || "ORGANIZATION NAME"}
          </h1>
          ${data.senderAddress ? `<p style="font-size:9pt;color:#475569;margin:4px 0 0 0;">${data.senderAddress}</p>` : ""}
          ${data.senderPhone || data.senderEmail ? `<p style="font-size:9pt;color:#475569;margin:2px 0 0 0;">${[data.senderPhone, data.senderEmail].filter(Boolean).join(" | ")}</p>` : ""}
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          ${data.referenceNumber ? `<div style="font-size:9pt;color:#475569;">Ref: ${data.referenceNumber}</div>` : "<div></div>"}
          <div style="font-size:10pt;color:#334155;">${formatDate(data.date)}</div>
        </div>
        <div style="margin-bottom:20px;font-size:10pt;">
          <p style="margin:0;font-weight:600;">${data.recipientName || "Recipient Name"}</p>
          ${data.recipientTitle ? `<p style="margin:0;color:#475569;">${data.recipientTitle}</p>` : ""}
          ${data.recipientOrganization ? `<p style="margin:0;">${data.recipientOrganization}</p>` : ""}
          <p style="margin:0;color:#475569;">${data.recipientAddress || ""}</p>
        </div>
        <div style="background:#f0f4ff;border-left:3px solid #1e3a8a;padding:8px 14px;margin-bottom:20px;">
          <p style="margin:0;font-weight:700;font-family:Inter,sans-serif;font-size:10pt;color:#1e3a8a;">
            RE: ${data.subject || "Subject"}
          </p>
        </div>
        <div style="font-size:10.5pt;">
          ${bodyParagraphs || '<p style="color:#94a3b8;font-style:italic;">Letter content will appear here...</p>'}
        </div>
        <div style="margin-top:40px;font-size:10pt;">
          <p style="margin:0 0 36px 0;">${data.closingRemarks || "Respectfully,"}</p>
          <div style="border-top:1px solid #1e293b;width:200px;padding-top:8px;">
            <p style="margin:0;font-weight:700;">${data.senderName || "Sender Name"}</p>
            ${data.senderTitle ? `<p style="margin:0;color:#475569;font-size:9pt;">${data.senderTitle}</p>` : ""}
          </div>
        </div>
      </div>
    `;
    }

    if (data.template === "corporate") {
        return `
      <div style="font-family:Inter,sans-serif;color:#1e293b;line-height:1.65;font-size:10pt;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #1e3a8a;">
          <div>
            <h1 style="font-size:18pt;font-weight:800;color:#1e3a8a;margin:0;letter-spacing:-0.02em;">
              ${data.senderOrganization || "Organization"}
            </h1>
            ${data.senderAddress ? `<p style="font-size:8.5pt;color:#64748b;margin:4px 0 0 0;">${data.senderAddress}</p>` : ""}
          </div>
          <div style="text-align:right;font-size:8.5pt;color:#64748b;">
            ${data.senderPhone ? `<p style="margin:0;">${data.senderPhone}</p>` : ""}
            ${data.senderEmail ? `<p style="margin:0;">${data.senderEmail}</p>` : ""}
            <p style="margin:4px 0 0 0;font-weight:600;color:#334155;">${formatDate(data.date)}</p>
          </div>
        </div>
        ${data.referenceNumber ? `<p style="font-size:8.5pt;color:#64748b;margin:0 0 16px 0;">Ref: ${data.referenceNumber}</p>` : ""}
        <div style="margin-bottom:24px;font-size:9.5pt;">
          <p style="margin:0;font-weight:600;">${data.recipientName || "Recipient"}</p>
          ${data.recipientTitle ? `<p style="margin:0;color:#64748b;">${data.recipientTitle}</p>` : ""}
          ${data.recipientOrganization ? `<p style="margin:0;">${data.recipientOrganization}</p>` : ""}
          <p style="margin:0;color:#64748b;">${data.recipientAddress || ""}</p>
        </div>
        <p style="font-weight:700;font-size:10.5pt;margin:0 0 16px 0;color:#0f172a;">
          Subject: ${data.subject || "—"}
        </p>
        <div style="font-size:10pt;font-family:Georgia,serif;">
          ${bodyParagraphs || '<p style="color:#94a3b8;font-style:italic;">Letter content will appear here...</p>'}
        </div>
        <div style="margin-top:48px;">
          <p style="margin:0 0 32px 0;">${data.closingRemarks || "Respectfully,"}</p>
          <p style="margin:0;font-weight:700;font-size:10pt;">${data.senderName || "Name"}</p>
          ${data.senderTitle ? `<p style="margin:0;font-size:9pt;color:#64748b;">${data.senderTitle}</p>` : ""}
          <p style="margin:0;font-size:9pt;color:#64748b;">${data.senderOrganization || ""}</p>
        </div>
      </div>
    `;
    }

    // Default: formal
    return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.7;font-size:11pt;">
      <div style="text-align:right;margin-bottom:8px;font-size:10pt;color:#334155;">
        ${formatDate(data.date)}
      </div>
      <div style="margin-bottom:24px;font-size:10pt;">
        <p style="margin:0;font-weight:600;">${data.senderName || "Sender Name"}</p>
        ${data.senderTitle ? `<p style="margin:0;color:#475569;">${data.senderTitle}</p>` : ""}
        <p style="margin:0;">${data.senderOrganization || ""}</p>
        <p style="margin:0;color:#475569;font-size:9.5pt;white-space:pre-line;">${data.senderAddress || ""}</p>
        ${data.senderPhone ? `<p style="margin:0;font-size:9pt;color:#64748b;">${data.senderPhone}</p>` : ""}
        ${data.senderEmail ? `<p style="margin:0;font-size:9pt;color:#64748b;">${data.senderEmail}</p>` : ""}
      </div>
      ${data.referenceNumber ? `<p style="font-size:9pt;color:#64748b;margin:0 0 16px 0;">Ref: ${data.referenceNumber}</p>` : ""}
      <div style="margin-bottom:20px;font-size:10pt;">
        <p style="margin:0;font-weight:600;">${data.recipientName || "Recipient Name"}</p>
        ${data.recipientTitle ? `<p style="margin:0;color:#475569;">${data.recipientTitle}</p>` : ""}
        ${data.recipientOrganization ? `<p style="margin:0;">${data.recipientOrganization}</p>` : ""}
        <p style="margin:0;color:#475569;font-size:9.5pt;white-space:pre-line;">${data.recipientAddress || ""}</p>
      </div>
      <p style="font-weight:700;margin:0 0 20px 0;font-size:10.5pt;text-decoration:underline;">
        RE: ${data.subject || "Subject"}
      </p>
      <div style="font-size:10.5pt;">
        ${bodyParagraphs || '<p style="color:#94a3b8;font-style:italic;">Letter content will appear here...</p>'}
      </div>
      <div style="margin-top:40px;font-size:10pt;">
        <p style="margin:0 0 36px 0;">${data.closingRemarks || "Respectfully,"}</p>
        <p style="margin:0;font-weight:700;">${data.senderName || "Sender Name"}</p>
        ${data.senderTitle ? `<p style="margin:0;color:#475569;font-size:9pt;">${data.senderTitle}</p>` : ""}
        <p style="margin:0;color:#475569;font-size:9pt;">${data.senderOrganization || ""}</p>
      </div>
    </div>
  `;
}
