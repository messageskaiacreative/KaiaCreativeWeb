import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAIACREATIVESTUDIO",
  description:
    "Generate professional documents instantly. Official letters, cover letters, invoices, contracts, and more. Enterprise-grade, zero-storage, privacy-first.",
  keywords: [
    "document generator",
    "PDF generator",
    "invoice generator",
    "cover letter",
    "contract generator",
    "enterprise documents",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-700 antialiased">{children}</body>
    </html>
  );
}
