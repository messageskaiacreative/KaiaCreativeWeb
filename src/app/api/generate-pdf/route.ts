import { NextRequest, NextResponse } from "next/server";
import { renderDocument } from "@/lib/templates";
import type { DocumentPayload, SubscriptionTier } from "@/types/documents";

/**
 * PDF Generation API
 * 
 * Receives a document payload, renders it to HTML, then converts to PDF.
 * For production, this would use Puppeteer/Playwright for headless conversion.
 * Currently returns an HTML-based printable document for download.
 * 
 * ZERO STORAGE: All processing is in-memory, nothing is persisted.
 */

function buildFullHtml(payload: DocumentPayload, tier: SubscriptionTier): string {
  const documentHtml = renderDocument(payload);
  const isFree = tier === "free";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.type} - KAIA CREATIVE</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 25mm;
      position: relative;
    }
    ${isFree ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: Inter, sans-serif;
      font-size: 72pt;
      font-weight: 800;
      color: rgba(30, 58, 138, 0.04);
      white-space: nowrap;
      pointer-events: none;
      z-index: 1000;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }` : ""}
  </style>
</head>
<body>
  ${isFree ? '<div class="watermark">KAIA CREATIVE FREE</div>' : ""}
  <div class="page">
    ${documentHtml}
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, tier } = body as {
      payload: DocumentPayload;
      tier: SubscriptionTier;
    };

    if (!payload || !payload.type) {
      return NextResponse.json(
        { error: "Invalid document payload" },
        { status: 400 }
      );
    }

    const html = buildFullHtml(payload, tier || "free");

    // Return as HTML file for now (browser print-to-PDF)
    // In production, use Puppeteer/Playwright for server-side PDF generation
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${payload.type}-${Date.now()}.html"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}
