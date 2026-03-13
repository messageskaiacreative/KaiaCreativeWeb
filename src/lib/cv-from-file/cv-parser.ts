// ============================================================
// CV FILE PARSER — Parse TXT / Markdown / JSON into CVData
// ============================================================
// Supports:
//   - JSON (structured, direct mapping)
//   - TXT / Markdown (heuristic section detection)
// ============================================================

import type { CVData, CVExperienceItem, CVEducationItem, CVSkillItem, CVLanguageItem } from "./cv-types";
import { EMPTY_CV_DATA } from "./cv-types";

/**
 * Parse uploaded file content into CVData structure.
 */
export function parseFileToCV(content: string, fileType: string): CVData {
    const trimmed = content.trim();

    // JSON — direct structured mapping
    if (fileType === "json" || trimmed.startsWith("{")) {
        try {
            return parseJSON(trimmed);
        } catch {
            // fallback to text parsing
        }
    }

    // TXT / Markdown — heuristic parsing
    return parseText(trimmed);
}

// ============================================================
// JSON PARSER
// ============================================================
function parseJSON(content: string): CVData {
    const raw = JSON.parse(content);

    // Support direct CVData format
    if (raw.personalInfo) {
        return {
            personalInfo: { ...EMPTY_CV_DATA.personalInfo, ...raw.personalInfo },
            summary: raw.summary || "",
            experience: Array.isArray(raw.experience) ? raw.experience : [],
            education: Array.isArray(raw.education) ? raw.education : [],
            skills: Array.isArray(raw.skills) ? raw.skills.map((s: string | CVSkillItem) =>
                typeof s === "string" ? { name: s, level: "" } : s
            ) : [],
            languages: Array.isArray(raw.languages) ? raw.languages.map((l: string | CVLanguageItem) =>
                typeof l === "string" ? { language: l, level: "" } : l
            ) : [],
        };
    }

    // Support flat format
    return {
        personalInfo: {
            firstName: raw.firstName || raw.first_name || raw.name?.split(" ")[0] || "",
            lastName: raw.lastName || raw.last_name || raw.name?.split(" ").slice(1).join(" ") || "",
            jobTitle: raw.jobTitle || raw.job_title || raw.title || "",
            email: raw.email || "",
            phone: raw.phone || raw.telephone || "",
            city: raw.city || "",
            country: raw.country || "",
            address: raw.address || "",
            linkedin: raw.linkedin || "",
            website: raw.website || raw.portfolio || "",
        },
        summary: raw.summary || raw.profile || raw.about || "",
        experience: Array.isArray(raw.experience) ? raw.experience : [],
        education: Array.isArray(raw.education) ? raw.education : [],
        skills: Array.isArray(raw.skills) ? raw.skills.map((s: string | CVSkillItem) =>
            typeof s === "string" ? { name: s, level: "" } : s
        ) : [],
        languages: Array.isArray(raw.languages) ? raw.languages.map((l: string | CVLanguageItem) =>
            typeof l === "string" ? { language: l, level: "" } : l
        ) : [],
    };
}

// ============================================================
// TEXT / MARKDOWN PARSER — Heuristic section detection
// ============================================================
const SECTION_HEADERS: Record<string, string> = {
    // English
    "profile": "summary", "summary": "summary", "about": "summary", "about me": "summary", "objective": "summary",
    "experience": "experience", "work experience": "experience", "employment": "experience", "work history": "experience",
    "education": "education", "academic": "education", "qualifications": "education",
    "skills": "skills", "technical skills": "skills", "competencies": "skills", "abilities": "skills",
    "languages": "languages", "language": "languages",
    // Indonesian
    "profil": "summary", "ringkasan": "summary", "tentang saya": "summary",
    "pengalaman": "experience", "pengalaman kerja": "experience", "riwayat kerja": "experience",
    "pendidikan": "education", "riwayat pendidikan": "education",
    "keahlian": "skills", "kemampuan": "skills",
    "bahasa": "languages",
};

function detectSection(line: string): string | null {
    const clean = line.replace(/^#+\s*/, "").replace(/[:\-—_*#]/g, "").trim().toLowerCase();
    return SECTION_HEADERS[clean] || null;
}

function parseText(content: string): CVData {
    const lines = content.split("\n").map((l) => l.trimEnd());
    const cv: CVData = JSON.parse(JSON.stringify(EMPTY_CV_DATA));

    let currentSection = "header";
    const sectionLines: Record<string, string[]> = {
        header: [],
        summary: [],
        experience: [],
        education: [],
        skills: [],
        languages: [],
    };

    // Phase 1: Split into sections
    for (const line of lines) {
        const detected = detectSection(line);
        if (detected) {
            currentSection = detected;
            continue;
        }
        if (line.trim() === "") {
            sectionLines[currentSection]?.push("");
            continue;
        }
        if (sectionLines[currentSection]) {
            sectionLines[currentSection].push(line);
        }
    }

    // Phase 2: Parse header (first lines before any section)
    const headerLines = sectionLines.header.filter((l) => l.trim());
    if (headerLines.length > 0) {
        const nameParts = headerLines[0].replace(/^#+\s*/, "").trim().split(/\s+/);
        cv.personalInfo.firstName = nameParts[0] || "";
        cv.personalInfo.lastName = nameParts.slice(1).join(" ") || "";
    }
    if (headerLines.length > 1) {
        cv.personalInfo.jobTitle = headerLines[1].replace(/^#+\s*/, "").trim();
    }
    // Extract email/phone from header
    for (const hl of headerLines) {
        const emailMatch = hl.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        if (emailMatch) cv.personalInfo.email = emailMatch[0];
        const phoneMatch = hl.match(/[\+]?[\d\s\-().]{7,}/);
        if (phoneMatch) cv.personalInfo.phone = phoneMatch[0].trim();
        if (hl.includes("linkedin.com")) cv.personalInfo.linkedin = hl.trim();
    }

    // Phase 3: Parse summary
    cv.summary = sectionLines.summary.filter((l) => l.trim()).join(" ");

    // Phase 4: Parse experience
    cv.experience = parseExperienceBlock(sectionLines.experience);

    // Phase 5: Parse education
    cv.education = parseEducationBlock(sectionLines.education);

    // Phase 6: Parse skills
    cv.skills = sectionLines.skills
        .filter((l) => l.trim())
        .flatMap((l) => l.split(/[,;|•·]/).map((s) => s.trim()).filter(Boolean))
        .map((s) => ({ name: s.replace(/^[-*]\s*/, ""), level: "" }));

    // Phase 7: Parse languages
    cv.languages = sectionLines.languages
        .filter((l) => l.trim())
        .map((l) => {
            const parts = l.replace(/^[-*•]\s*/, "").split(/[-–—:]/);
            return {
                language: parts[0]?.trim() || l.trim(),
                level: parts[1]?.trim() || "",
            };
        });

    return cv;
}

function parseExperienceBlock(lines: string[]): CVExperienceItem[] {
    const items: CVExperienceItem[] = [];
    let current: Partial<CVExperienceItem> | null = null;
    const descLines: string[] = [];

    const flushCurrent = () => {
        if (current?.jobTitle) {
            items.push({
                jobTitle: current.jobTitle || "",
                employer: current.employer || "",
                city: current.city || "",
                startDate: current.startDate || "",
                endDate: current.endDate || "",
                description: descLines.join("\n").trim(),
            });
        }
        descLines.length = 0;
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect date patterns like "2020 - 2023", "Jan 2020 – Present"
        const dateMatch = trimmed.match(/(\d{4}|\w+\s+\d{4})\s*[-–—]\s*(\d{4}|\w+\s+\d{4}|present|sekarang|current)/i);

        if (dateMatch && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
            flushCurrent();
            current = {
                startDate: dateMatch[1],
                endDate: dateMatch[2],
                jobTitle: trimmed.replace(dateMatch[0], "").replace(/^[,\s|]+/, "").trim() || "",
            };
        } else if (current && !current.employer && trimmed.length < 80 && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
            if (!current.jobTitle) {
                current.jobTitle = trimmed;
            } else if (!current.employer) {
                current.employer = trimmed;
            }
        } else if (current) {
            descLines.push(trimmed);
        }
    }
    flushCurrent();
    return items;
}

function parseEducationBlock(lines: string[]): CVEducationItem[] {
    const items: CVEducationItem[] = [];
    let current: Partial<CVEducationItem> | null = null;
    const descLines: string[] = [];

    const flushCurrent = () => {
        if (current?.degree || current?.school) {
            items.push({
                degree: current.degree || "",
                school: current.school || "",
                city: current.city || "",
                startDate: current.startDate || "",
                endDate: current.endDate || "",
                description: descLines.join("\n").trim(),
            });
        }
        descLines.length = 0;
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const dateMatch = trimmed.match(/(\d{4}|\w+\s+\d{4})\s*[-–—]\s*(\d{4}|\w+\s+\d{4}|present|sekarang|current)/i);

        if (dateMatch && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
            flushCurrent();
            current = {
                startDate: dateMatch[1],
                endDate: dateMatch[2],
                degree: trimmed.replace(dateMatch[0], "").replace(/^[,\s|]+/, "").trim() || "",
            };
        } else if (current && !current.school && trimmed.length < 80 && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
            if (!current.degree) {
                current.degree = trimmed;
            } else if (!current.school) {
                current.school = trimmed;
            }
        } else if (current) {
            descLines.push(trimmed);
        }
    }
    flushCurrent();
    return items;
}
