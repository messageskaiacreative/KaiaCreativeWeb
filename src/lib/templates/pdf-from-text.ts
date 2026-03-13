import type { PdfFromTextPayload } from "@/types/documents";

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function simpleMarkdown(text: string): string {
    let html = escapeHtml(text);
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-family:Inter,sans-serif;font-size:12pt;font-weight:600;color:#334155;margin:18px 0 8px 0;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-family:Inter,sans-serif;font-size:14pt;font-weight:600;color:#1e293b;margin:22px 0 10px 0;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-family:Inter,sans-serif;font-size:18pt;font-weight:700;color:#0f172a;margin:24px 0 12px 0;">$1</h1>');
    // Bold, italic
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Code
    html = html.replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:2px;font-family:JetBrains Mono,monospace;font-size:0.9em;">$1</code>');
    // Lists
    html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;">$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;list-style-type:decimal;">$2</li>');
    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">');
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p style="margin:0 0 12px 0;">');
    html = `<p style="margin:0 0 12px 0;">${html}</p>`;
    return html;
}

export function renderPdfFromText(data: PdfFromTextPayload): string {
    const fontSize = data.fontSize || 12;
    const content = data.format === "markdown"
        ? simpleMarkdown(data.content || "")
        : (data.content || "").split("\n").map((line) =>
            `<p style="margin:0 0 8px 0;">${escapeHtml(line) || "&nbsp;"}</p>`
        ).join("");

    if (data.template === "report") {
        return `
      <div style="font-family:Inter,sans-serif;color:#1e293b;line-height:1.7;font-size:${fontSize}pt;">
        <div style="text-align:center;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #1e3a8a;">
          <h1 style="font-size:20pt;font-weight:800;color:#1e3a8a;margin:0;letter-spacing:-0.01em;">
            ${data.title || "Untitled Document"}
          </h1>
          <div style="display:flex;justify-content:center;gap:24px;margin-top:10px;font-size:9pt;color:#64748b;">
            ${data.author ? `<span>Author: ${data.author}</span>` : ""}
            ${data.date ? `<span>Date: ${data.date}</span>` : ""}
          </div>
        </div>
        <div style="font-family:Georgia,serif;">
          ${content || '<p style="color:#94a3b8;font-style:italic;">Document content will appear here...</p>'}
        </div>
        <div style="margin-top:60px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:8pt;color:#94a3b8;text-align:center;">
          ${data.title || "Document"} ${data.author ? `— ${data.author}` : ""} ${data.date ? `— ${data.date}` : ""}
        </div>
      </div>
    `;
    }

    if (data.template === "document") {
        return `
      <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.7;font-size:${fontSize}pt;">
        <div style="margin-bottom:28px;">
          <h1 style="font-family:Inter,sans-serif;font-size:16pt;font-weight:700;color:#0f172a;margin:0 0 8px 0;">
            ${data.title || "Untitled"}
          </h1>
          <div style="font-size:9pt;color:#64748b;font-family:Inter,sans-serif;">
            ${[data.author, data.date].filter(Boolean).join(" — ")}
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0 0 0;">
        </div>
        <div>
          ${content || '<p style="color:#94a3b8;font-style:italic;">Content will appear here...</p>'}
        </div>
      </div>
    `;
    }

    // Minimal
    return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.8;font-size:${fontSize}pt;">
      ${data.title ? `<h1 style="font-family:Inter,sans-serif;font-size:14pt;font-weight:600;color:#334155;margin:0 0 20px 0;">${data.title}</h1>` : ""}
      <div>
        ${content || '<p style="color:#94a3b8;font-style:italic;">Start typing content in the form...</p>'}
      </div>
    </div>
  `;
}
