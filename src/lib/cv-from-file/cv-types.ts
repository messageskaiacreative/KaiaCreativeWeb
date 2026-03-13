// ============================================================
// CV FROM FILE — Types & Layout Constants
// ============================================================
// Single source of truth for CV data structure and layout rules.
// Used by both preview (HTML) and PDF export (@react-pdf).
// ============================================================

// ---- CV Data Structure ----
export interface CVPersonalInfo {
    firstName: string;
    lastName: string;
    jobTitle: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    address: string;
    linkedin: string;
    website: string;
}

export interface CVExperienceItem {
    jobTitle: string;
    employer: string;
    city: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface CVEducationItem {
    degree: string;
    school: string;
    city: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface CVSkillItem {
    name: string;
    level: string;
}

export interface CVLanguageItem {
    language: string;
    level: string;
}

export interface CVData {
    personalInfo: CVPersonalInfo;
    summary: string;
    experience: CVExperienceItem[];
    education: CVEducationItem[];
    skills: CVSkillItem[];
    languages: CVLanguageItem[];
}

export const EMPTY_CV_DATA: CVData = {
    personalInfo: {
        firstName: "", lastName: "", jobTitle: "", email: "", phone: "",
        city: "", country: "", address: "", linkedin: "", website: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
};

// ---- STRICT LAYOUT CONSTANTS (Single Source of Truth) ----
// These values are used IDENTICALLY by preview (HTML) and PDF export.
// Changing here changes both. No mismatch possible.
export const CV_LAYOUT = {
    // A4 dimensions
    pageWidth: "210mm",
    pageHeight: "297mm",
    pageWidthPx: 794,   // 210mm at 96dpi
    pageHeightPx: 1123, // 297mm at 96dpi

    // Margins (mm)
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 25,
    marginRight: 25,

    // Margins as CSS
    marginTopCss: "20mm",
    marginBottomCss: "20mm",
    marginLeftCss: "25mm",
    marginRightCss: "25mm",
    padding: "20mm 25mm",

    // Typography
    fontFamily: '"Times New Roman", Times, serif',
    nameSize: 22,       // px
    jobTitleSize: 16,   // px
    sectionTitleSize: 12, // px
    bodySize: 12,       // px
    contactSize: 11,    // px

    // Spacing (px)
    headerBottomMargin: 12,
    sectionSpacing: 8,
    sectionTitleBottomMargin: 4,
    itemSpacing: 6,
    lineHeight: 1.45,
    dividerWidth: 1,

    // Column widths
    dateLabelWidth: 140, // px — left column for dates
} as const;

// ---- Section order (fixed) ----
export const CV_SECTION_ORDER = [
    "summary",
    "experience",
    "education",
    "skills",
    "languages",
] as const;
