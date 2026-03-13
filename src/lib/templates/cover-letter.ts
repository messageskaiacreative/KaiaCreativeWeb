import type { CoverLetterPayload } from "@/types/documents";

export function renderCoverLetter(data: CoverLetterPayload): string {
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

    if (data.template === "modern") {
        return `
      <div style="font-family:Inter,sans-serif;color:#1e293b;line-height:1.65;font-size:10pt;">
        <div style="background:#1e3a8a;color:white;padding:24px 28px;margin:-25mm -25mm 28px -25mm;">
          <h1 style="font-size:20pt;font-weight:800;margin:0;letter-spacing:-0.02em;color:white;">
            ${data.applicantName || "Your Name"}
          </h1>
          <div style="display:flex;gap:16px;margin-top:8px;font-size:9pt;color:#bfdbfe;">
            ${data.applicantEmail ? `<span>${data.applicantEmail}</span>` : ""}
            ${data.applicantPhone ? `<span>|  ${data.applicantPhone}</span>` : ""}
          </div>
          ${data.applicantAddress ? `<p style="margin:4px 0 0 0;font-size:8.5pt;color:#93bbfd;">${data.applicantAddress}</p>` : ""}
        </div>
        <div style="font-size:9.5pt;color:#64748b;margin-bottom:20px;">
          ${formatDate(data.date)}
        </div>
        <div style="margin-bottom:20px;font-size:9.5pt;">
          <p style="margin:0;font-weight:600;color:#0f172a;">${data.recipientName || "Hiring Manager"}</p>
          ${data.recipientTitle ? `<p style="margin:0;color:#64748b;">${data.recipientTitle}</p>` : ""}
          <p style="margin:0;font-weight:500;">${data.companyName || "Company"}</p>
          ${data.companyAddress ? `<p style="margin:0;color:#64748b;">${data.companyAddress}</p>` : ""}
        </div>
        <p style="font-weight:600;font-size:10pt;margin:0 0 16px 0;">
          RE: Application for ${data.jobTitle || "Position"}
        </p>
        <div style="font-size:10pt;font-family:Georgia,serif;">
          <p style="margin:0 0 14px 0;text-align:justify;">${data.introduction || '<span style="color:#94a3b8;font-style:italic;">Introduction paragraph...</span>'}</p>
          <p style="margin:0 0 14px 0;text-align:justify;">${data.bodyParagraph1 || ""}</p>
          ${data.bodyParagraph2 ? `<p style="margin:0 0 14px 0;text-align:justify;">${data.bodyParagraph2}</p>` : ""}
          <p style="margin:0 0 14px 0;text-align:justify;">${data.closing || ""}</p>
        </div>
        <div style="margin-top:36px;">
          <p style="margin:0 0 28px 0;">Sincerely,</p>
          <p style="margin:0;font-weight:700;font-size:10.5pt;">${data.applicantName || "Your Name"}</p>
        </div>
      </div>
    `;
    }

    if (data.template === "executive") {
        return `
      <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.75;font-size:11pt;">
        <div style="text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #cbd5e1;">
          <h1 style="font-family:Inter,sans-serif;font-size:16pt;font-weight:700;margin:0;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">
            ${data.applicantName || "Your Name"}
          </h1>
          <div style="display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:9pt;color:#64748b;font-family:Inter,sans-serif;">
            ${data.applicantEmail ? `<span>${data.applicantEmail}</span>` : ""}
            ${data.applicantPhone ? `<span>${data.applicantPhone}</span>` : ""}
          </div>
          ${data.applicantAddress ? `<p style="margin:4px 0 0 0;font-size:8.5pt;color:#94a3b8;font-family:Inter,sans-serif;">${data.applicantAddress}</p>` : ""}
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
          <div style="font-size:10pt;">
            <p style="margin:0;font-weight:600;">${data.recipientName || "Hiring Manager"}</p>
            ${data.recipientTitle ? `<p style="margin:0;color:#64748b;font-size:9.5pt;">${data.recipientTitle}</p>` : ""}
            <p style="margin:0;">${data.companyName || "Company"}</p>
            ${data.companyAddress ? `<p style="margin:0;color:#64748b;font-size:9.5pt;">${data.companyAddress}</p>` : ""}
          </div>
          <div style="font-size:9.5pt;color:#64748b;">${formatDate(data.date)}</div>
        </div>
        <p style="font-weight:600;margin:0 0 20px 0;font-size:10.5pt;">
          Dear ${data.recipientName || "Hiring Manager"},
        </p>
        <p style="margin:0 0 14px 0;text-align:justify;">${data.introduction || '<span style="color:#94a3b8;font-style:italic;">Introduction...</span>'}</p>
        <p style="margin:0 0 14px 0;text-align:justify;">${data.bodyParagraph1 || ""}</p>
        ${data.bodyParagraph2 ? `<p style="margin:0 0 14px 0;text-align:justify;">${data.bodyParagraph2}</p>` : ""}
        <p style="margin:0 0 14px 0;text-align:justify;">${data.closing || ""}</p>
        <div style="margin-top:44px;">
          <p style="margin:0 0 32px 0;">With respect,</p>
          <div style="border-top:1px solid #334155;width:180px;padding-top:8px;">
            <p style="margin:0;font-weight:600;">${data.applicantName || "Your Name"}</p>
          </div>
        </div>
      </div>
    `;
    }

    // Default: classic
    return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.7;font-size:11pt;">
      <div style="margin-bottom:24px;font-size:10pt;">
        <p style="margin:0;font-weight:600;">${data.applicantName || "Your Name"}</p>
        ${data.applicantAddress ? `<p style="margin:0;color:#475569;font-size:9.5pt;">${data.applicantAddress}</p>` : ""}
        ${data.applicantEmail ? `<p style="margin:0;font-size:9pt;color:#64748b;">${data.applicantEmail}</p>` : ""}
        ${data.applicantPhone ? `<p style="margin:0;font-size:9pt;color:#64748b;">${data.applicantPhone}</p>` : ""}
      </div>
      <p style="font-size:10pt;color:#334155;margin:0 0 20px 0;">${formatDate(data.date)}</p>
      <div style="margin-bottom:20px;font-size:10pt;">
        <p style="margin:0;font-weight:600;">${data.recipientName || "Hiring Manager"}</p>
        ${data.recipientTitle ? `<p style="margin:0;color:#475569;">${data.recipientTitle}</p>` : ""}
        <p style="margin:0;">${data.companyName || "Company Name"}</p>
        ${data.companyAddress ? `<p style="margin:0;color:#475569;font-size:9.5pt;">${data.companyAddress}</p>` : ""}
      </div>
      <p style="font-weight:600;margin:0 0 16px 0;">
        Dear ${data.recipientName || "Hiring Manager"},
      </p>
      <p style="margin:0 0 14px 0;text-indent:2em;text-align:justify;">
        ${data.introduction || '<span style="color:#94a3b8;font-style:italic;">Introduction paragraph will appear here...</span>'}
      </p>
      <p style="margin:0 0 14px 0;text-indent:2em;text-align:justify;">${data.bodyParagraph1 || ""}</p>
      ${data.bodyParagraph2 ? `<p style="margin:0 0 14px 0;text-indent:2em;text-align:justify;">${data.bodyParagraph2}</p>` : ""}
      <p style="margin:0 0 14px 0;text-indent:2em;text-align:justify;">${data.closing || ""}</p>
      <div style="margin-top:40px;">
        <p style="margin:0 0 32px 0;">Sincerely,</p>
        <p style="margin:0;font-weight:600;">${data.applicantName || "Your Name"}</p>
      </div>
    </div>
  `;
}
