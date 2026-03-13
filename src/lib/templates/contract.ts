import type { ContractPayload } from "@/types/documents";

function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return d; }
}

export function renderContract(data: ContractPayload): string {
    const clauses = (data.clauses || []).map((c, i) => `
    <div style="margin-bottom:20px;">
      <h3 style="font-family:Inter,sans-serif;font-size:10.5pt;font-weight:700;color:#0f172a;margin:0 0 6px 0;">
        Article ${i + 1}: ${c.title || "Untitled"}
      </h3>
      <p style="margin:0;text-align:justify;font-size:10pt;">${c.content || ""}</p>
    </div>
  `).join("");

    return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.7;font-size:10.5pt;">
      <div style="text-align:center;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1e3a8a;">
        <h1 style="font-family:Inter,sans-serif;font-size:16pt;font-weight:800;color:#1e3a8a;margin:0;text-transform:uppercase;letter-spacing:0.06em;">
          ${data.title || "CONTRACT AGREEMENT"}
        </h1>
        <p style="font-family:Inter,sans-serif;font-size:9pt;color:#64748b;margin:6px 0 0 0;">
          ${data.contractType ? data.contractType.charAt(0).toUpperCase() + data.contractType.slice(1) + " Agreement" : "Agreement"}
        </p>
      </div>

      <div style="display:flex;justify-content:center;gap:32px;margin-bottom:20px;font-size:9pt;font-family:Inter,sans-serif;color:#64748b;">
        <span><strong>Date:</strong> ${fmtDate(data.date)}</span>
        <span><strong>Effective:</strong> ${fmtDate(data.effectiveDate)}</span>
        ${data.expirationDate ? `<span><strong>Expires:</strong> ${fmtDate(data.expirationDate)}</span>` : ""}
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:24px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;">
        <div style="font-size:9pt;">
          <p style="margin:0;font-size:8pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.1em;font-family:Inter,sans-serif;">Party One</p>
          <p style="margin:4px 0 0 0;font-weight:600;">${data.partyOneName || "—"}</p>
          ${data.partyOneTitle ? `<p style="margin:0;color:#64748b;">${data.partyOneTitle}</p>` : ""}
          <p style="margin:0;color:#64748b;font-size:8.5pt;">${data.partyOneAddress || ""}</p>
        </div>
        <div style="text-align:right;font-size:9pt;">
          <p style="margin:0;font-size:8pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.1em;font-family:Inter,sans-serif;">Party Two</p>
          <p style="margin:4px 0 0 0;font-weight:600;">${data.partyTwoName || "—"}</p>
          ${data.partyTwoTitle ? `<p style="margin:0;color:#64748b;">${data.partyTwoTitle}</p>` : ""}
          <p style="margin:0;color:#64748b;font-size:8.5pt;">${data.partyTwoAddress || ""}</p>
        </div>
      </div>

      ${data.recitals ? `
        <div style="margin-bottom:24px;">
          <h2 style="font-family:Inter,sans-serif;font-size:10pt;font-weight:700;color:#334155;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.06em;">Recitals</h2>
          <p style="margin:0;text-align:justify;font-style:italic;color:#334155;">${data.recitals}</p>
        </div>
      ` : ""}

      <div style="margin-bottom:24px;">
        <h2 style="font-family:Inter,sans-serif;font-size:10pt;font-weight:700;color:#334155;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.06em;">Terms and Conditions</h2>
        ${clauses || '<p style="color:#94a3b8;font-style:italic;">Add clauses in the form...</p>'}
      </div>

      ${data.governingLaw ? `
        <div style="margin-bottom:16px;">
          <h3 style="font-family:Inter,sans-serif;font-size:10pt;font-weight:700;color:#0f172a;margin:0 0 6px 0;">Governing Law</h3>
          <p style="margin:0;font-size:10pt;">${data.governingLaw}</p>
        </div>
      ` : ""}

      ${data.disputeResolution ? `
        <div style="margin-bottom:20px;">
          <h3 style="font-family:Inter,sans-serif;font-size:10pt;font-weight:700;color:#0f172a;margin:0 0 6px 0;">Dispute Resolution</h3>
          <p style="margin:0;font-size:10pt;">${data.disputeResolution}</p>
        </div>
      ` : ""}

      <div style="margin-top:48px;display:flex;justify-content:space-between;">
        <div style="width:45%;">
          <p style="font-family:Inter,sans-serif;font-size:8pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.1em;margin:0 0 32px 0;">Party One Signature</p>
          <div style="border-top:1px solid #334155;padding-top:8px;">
            <p style="margin:0;font-weight:600;font-size:10pt;">${data.partyOneName || "—"}</p>
            ${data.partyOneTitle ? `<p style="margin:0;font-size:8.5pt;color:#64748b;">${data.partyOneTitle}</p>` : ""}
            <p style="margin:4px 0 0 0;font-size:8.5pt;color:#94a3b8;">Date: _______________</p>
          </div>
        </div>
        <div style="width:45%;">
          <p style="font-family:Inter,sans-serif;font-size:8pt;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.1em;margin:0 0 32px 0;">Party Two Signature</p>
          <div style="border-top:1px solid #334155;padding-top:8px;">
            <p style="margin:0;font-weight:600;font-size:10pt;">${data.partyTwoName || "—"}</p>
            ${data.partyTwoTitle ? `<p style="margin:0;font-size:8.5pt;color:#64748b;">${data.partyTwoTitle}</p>` : ""}
            <p style="margin:4px 0 0 0;font-size:8.5pt;color:#94a3b8;">Date: _______________</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
