"use client";

// ============================================================
// CV LAYOUT — Single Source of Truth for Preview AND Export
// ============================================================
// CRITICAL: This component defines the CV layout ONCE.
// It is used by:
//   1. HTML preview (rendered inside a scaled div)
//   2. PDF export (captured via html2canvas → jsPDF)
//
// Because both use the EXACT same React component tree and
// the EXACT same CSS/inline styles, preview ≡ PDF guaranteed.
// ============================================================

import type { CVData } from "@/lib/cv-from-file/cv-types";
import { CV_LAYOUT } from "@/lib/cv-from-file/cv-types";

interface CVLayoutProps {
    data: CVData;
}

const L = CV_LAYOUT;

function formatDate(d: string): string {
    if (!d) return "";
    const match = d.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        const date = new Date(Number(match[1]), Number(match[2]) - 1);
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return d;
}

export default function CVLayout({ data }: CVLayoutProps) {
    const { personalInfo: p, summary, experience, education, skills, languages } = data;

    const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
    const contactParts = [p.email, p.phone, [p.city, p.country].filter(Boolean).join(", "), p.linkedin, p.website].filter(Boolean);

    // ---- Shared inline styles (used by print/export too) ----
    const pageStyle: React.CSSProperties = {
        width: L.pageWidth,
        minHeight: L.pageHeight,
        padding: L.padding,
        fontFamily: L.fontFamily,
        fontSize: `${L.bodySize}px`,
        lineHeight: L.lineHeight,
        color: "#000",
        backgroundColor: "#fff",
        boxSizing: "border-box",
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: `${L.sectionSpacing}px`,
        paddingBottom: `${L.sectionSpacing / 2}px`,
        borderBottom: `${L.dividerWidth}px solid rgba(0,0,0,0.5)`,
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: `${L.sectionTitleSize}px`,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: `${L.sectionTitleBottomMargin}px`,
        color: "#000",
    };

    const tableStyle: React.CSSProperties = {
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
    };

    const dateCellStyle: React.CSSProperties = {
        width: `${L.dateLabelWidth}px`,
        verticalAlign: "top",
        paddingRight: "16px",
        fontSize: `${L.bodySize}px`,
        fontWeight: 500,
        color: "#000",
    };

    const contentCellStyle: React.CSSProperties = {
        verticalAlign: "top",
    };

    const isEmpty = !fullName && !summary && experience.length === 0 && education.length === 0;
    if (isEmpty) return null;

    return (
        <div id="cv-layout-root" style={pageStyle}>
            {/* ======== HEADER ======== */}
            <header style={{
                textAlign: "center",
                marginBottom: `${L.headerBottomMargin}px`,
                paddingBottom: `${L.headerBottomMargin / 2}px`,
                borderBottom: `${L.dividerWidth}px solid rgba(0,0,0,0.5)`,
            }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                    {fullName && (
                        <h1 style={{ fontSize: `${L.nameSize}px`, fontWeight: 400, margin: 0, letterSpacing: "0.02em" }}>
                            {fullName}
                        </h1>
                    )}
                    {p.jobTitle && (
                        <span style={{ fontSize: `${L.jobTitleSize}px`, color: "#555", fontWeight: 400 }}>
                            | {p.jobTitle}
                        </span>
                    )}
                </div>
                {contactParts.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", fontSize: `${L.contactSize}px`, color: "#000" }}>
                        {contactParts.map((info, i) => (
                            <span key={i}>
                                {String(info).trim()}{i < contactParts.length - 1 && ","}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {/* ======== SUMMARY / PROFILE ======== */}
            {summary && (
                <section style={sectionStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            <tr>
                                <td style={{ ...dateCellStyle, paddingBottom: "4px" }}>
                                    <h2 style={sectionTitleStyle}>PROFILE</h2>
                                </td>
                                <td style={contentCellStyle}>
                                    <div style={{ fontSize: `${L.bodySize}px`, textAlign: "justify" }}>{summary}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            )}

            {/* ======== EXPERIENCE ======== */}
            {experience.length > 0 && (
                <section style={sectionStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            <tr>
                                <td style={{ ...dateCellStyle, paddingBottom: "4px" }}>
                                    <h2 style={sectionTitleStyle}>EXPERIENCE</h2>
                                </td>
                                <td />
                            </tr>
                            {experience.map((exp, i) => (
                                <tr key={i}>
                                    <td style={{ ...dateCellStyle, paddingBottom: `${L.itemSpacing}px` }}>
                                        {formatDate(exp.startDate)} — {exp.endDate ? formatDate(exp.endDate) : "Present"}
                                    </td>
                                    <td style={{ ...contentCellStyle, paddingBottom: `${L.itemSpacing}px` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                                            <strong style={{ fontSize: `${L.bodySize + 2}px` }}>{exp.jobTitle}</strong>
                                            {exp.city && <span style={{ fontSize: `${L.bodySize}px` }}>{exp.city}</span>}
                                        </div>
                                        {exp.employer && <div style={{ fontSize: `${L.bodySize}px`, marginBottom: "2px" }}>{exp.employer}</div>}
                                        {exp.description && (
                                            <div style={{ fontSize: `${L.bodySize}px`, textAlign: "justify", whiteSpace: "pre-wrap" }}>
                                                {exp.description}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* ======== EDUCATION ======== */}
            {education.length > 0 && (
                <section style={sectionStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            <tr>
                                <td style={{ ...dateCellStyle, paddingBottom: "4px" }}>
                                    <h2 style={sectionTitleStyle}>EDUCATION</h2>
                                </td>
                                <td />
                            </tr>
                            {education.map((edu, i) => (
                                <tr key={i}>
                                    <td style={{ ...dateCellStyle, paddingBottom: `${L.itemSpacing}px` }}>
                                        {formatDate(edu.startDate)} — {edu.endDate ? formatDate(edu.endDate) : "Present"}
                                    </td>
                                    <td style={{ ...contentCellStyle, paddingBottom: `${L.itemSpacing}px` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                                            <strong style={{ fontSize: `${L.bodySize + 2}px` }}>{edu.degree}</strong>
                                            {edu.city && <span style={{ fontSize: `${L.bodySize}px` }}>{edu.city}</span>}
                                        </div>
                                        {edu.school && <div style={{ fontSize: `${L.bodySize}px`, marginBottom: "2px" }}>{edu.school}</div>}
                                        {edu.description && (
                                            <div style={{ fontSize: `${L.bodySize}px`, textAlign: "justify", whiteSpace: "pre-wrap" }}>
                                                {edu.description}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* ======== SKILLS ======== */}
            {skills.length > 0 && (
                <section style={sectionStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            <tr>
                                <td style={{ ...dateCellStyle, paddingBottom: "4px" }}>
                                    <h2 style={sectionTitleStyle}>SKILLS</h2>
                                </td>
                                <td style={contentCellStyle}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                                        {skills.map((s, i) => (
                                            <div key={i} style={{ fontSize: `${L.bodySize}px` }}>
                                                <strong>{s.name}</strong>
                                                {s.level && <span style={{ marginLeft: "4px" }}>({s.level})</span>}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            )}

            {/* ======== LANGUAGES ======== */}
            {languages.length > 0 && (
                <section style={sectionStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            <tr>
                                <td style={{ ...dateCellStyle, paddingBottom: "4px" }}>
                                    <h2 style={sectionTitleStyle}>LANGUAGES</h2>
                                </td>
                                <td style={contentCellStyle}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                                        {languages.map((l, i) => (
                                            <div key={i} style={{ fontSize: `${L.bodySize}px`, display: "flex", justifyContent: "space-between" }}>
                                                <strong>{l.language}</strong>
                                                {l.level && <span>{l.level}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}
