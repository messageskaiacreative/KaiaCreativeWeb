import { create } from "zustand";

// ============================================================
// APPLICATION TRACKER STORE
// Client-only, localStorage-only, no server storage
// ============================================================

export interface TrackerRow {
    id: string; // generated client-side
    company_name: string;
    company_email: string;
    company_address: string;
    linkedin_status: string;
    cv_status: string;
    letter_status: string;
    position: string;
    city: string;
    date: string;
    status: string;
    notes: string;
}

export const LINKEDIN_STATUS_OPTIONS = [
    "Belum dikirim",
    "Sudah dikirim",
    "Belum buat",
    "Tidak perlu",
] as const;

export const CV_STATUS_OPTIONS = [
    "Belum dibuat",
    "Sudah dibuat",
    "Sudah dikirim",
] as const;

export const LETTER_STATUS_OPTIONS = [
    "Belum dibuat",
    "Sudah dibuat",
    "Sudah dikirim",
] as const;

export const APPLICATION_STATUS_OPTIONS = [
    "Pending",
    "On Progress",
    "Done",
    "Rejected",
] as const;

const STORAGE_KEY = "docgen_sheet_url";
const MAX_ROWS = 500;
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export const TRACKER_COLUMNS = [
    "company_name",
    "company_email",
    "company_address",
    "linkedin_status",
    "cv_status",
    "letter_status",
    "position",
    "city",
    "date",
    "status",
    "notes",
] as const;

function generateId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ",") {
                row.push(current.trim());
                current = "";
            } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
                row.push(current.trim());
                current = "";
                if (row.some((c) => c !== "")) rows.push(row);
                row = [];
                if (ch === "\r") i++;
            } else {
                current += ch;
            }
        }
    }
    // last row
    row.push(current.trim());
    if (row.some((c) => c !== "")) rows.push(row);

    return rows;
}

function csvRowsToTrackerRows(csvRows: string[][]): TrackerRow[] {
    if (csvRows.length < 2) return [];

    const header = csvRows[0].map((h) =>
        h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    );

    const colMap: Record<string, number> = {};
    TRACKER_COLUMNS.forEach((col) => {
        const idx = header.indexOf(col);
        if (idx !== -1) colMap[col] = idx;
    });

    return csvRows.slice(1).map((row) => {
        const get = (col: string) => {
            const idx = colMap[col];
            return idx !== undefined ? row[idx] ?? "" : "";
        };

        return {
            id: generateId(),
            company_name: get("company_name"),
            company_email: get("company_email"),
            company_address: get("company_address"),
            linkedin_status: get("linkedin_status"),
            cv_status: get("cv_status"),
            letter_status: get("letter_status"),
            position: get("position"),
            city: get("city"),
            date: get("date"),
            status: get("status"),
            notes: get("notes"),
        };
    });
}

function trackerRowsToCSV(rows: TrackerRow[]): string {
    const header = TRACKER_COLUMNS.join(",");
    const body = rows.map((r) =>
        TRACKER_COLUMNS.map((col) => {
            const val = r[col];
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(",")
    );
    return [header, ...body].join("\n");
}

export function validateSheetUrl(url: string): string | null {
    if (!url.trim()) return "Sheet link cannot be empty";
    if (!url.includes("docs.google.com"))
        return "Link must be from docs.google.com";
    if (!url.includes("export?format=csv") && !url.includes("export?gid=") && !url.includes("pub?output=csv"))
        return "Link must contain export?format=csv - use the CSV export URL";
    return null;
}

interface TrackerState {
    // Data
    rows: TrackerRow[];
    selectedRowId: string | null;
    hasUnsavedChanges: boolean;

    // Sheet URL
    sheetUrl: string;
    savedUrl: string; // what's in localStorage
    urlInputDirty: boolean;

    // UI
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;

    // Actions
    setSheetUrl: (url: string) => void;
    saveUrl: () => string | null; // returns error or null
    loadFromStorage: () => void;
    clearUrl: () => void;
    fetchSheet: () => Promise<void>;
    selectRow: (id: string | null) => void;
    updateRow: (id: string, updates: Partial<TrackerRow>) => void;
    addRow: () => void;
    deleteRow: (id: string) => void;
    exportCSV: () => string;
    getTemplateCSV: () => string;
    clearError: () => void;
    clearSuccess: () => void;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
    rows: [],
    selectedRowId: null,
    hasUnsavedChanges: false,

    sheetUrl: "",
    savedUrl: "",
    urlInputDirty: false,

    isLoading: false,
    error: null,
    successMessage: null,

    setSheetUrl: (url) =>
        set((s) => ({
            sheetUrl: url,
            urlInputDirty: url !== s.savedUrl,
        })),

    saveUrl: () => {
        const { sheetUrl } = get();
        const err = validateSheetUrl(sheetUrl);
        if (err) {
            set({ error: err });
            return err;
        }
        try {
            localStorage.setItem(STORAGE_KEY, sheetUrl);
            set({ savedUrl: sheetUrl, urlInputDirty: false, error: null, successMessage: "Sheet link saved to this browser" });
            return null;
        } catch {
            set({ error: "Failed to save to localStorage" });
            return "Failed to save to localStorage";
        }
    },

    loadFromStorage: () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                set({ sheetUrl: stored, savedUrl: stored, urlInputDirty: false });
            }
        } catch {
            // ignore
        }
    },

    clearUrl: () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
        set({
            sheetUrl: "",
            savedUrl: "",
            urlInputDirty: false,
            rows: [],
            selectedRowId: null,
            hasUnsavedChanges: false,
            successMessage: "Sheet link cleared",
        });
    },

    fetchSheet: async () => {
        const { sheetUrl } = get();
        const err = validateSheetUrl(sheetUrl);
        if (err) {
            set({ error: err });
            return;
        }

        set({ isLoading: true, error: null, successMessage: null });

        try {
            const res = await fetch(sheetUrl);
            if (!res.ok) {
                if (res.status === 403 || res.status === 401) {
                    throw new Error(
                        "Sheet is private or not shared. Make the sheet public or use a shareable link."
                    );
                }
                throw new Error(`Failed to fetch sheet (HTTP ${res.status})`);
            }

            const text = await res.text();

            // Size check
            if (new Blob([text]).size > MAX_SIZE_BYTES) {
                throw new Error(
                    "CSV file exceeds 1 MB limit. Please use a smaller sheet."
                );
            }

            const parsed = parseCSV(text);
            const trackerRows = csvRowsToTrackerRows(parsed);

            if (trackerRows.length > MAX_ROWS) {
                set({
                    error: `Sheet has ${trackerRows.length} rows. Maximum is ${MAX_ROWS}. Only the first ${MAX_ROWS} rows will be loaded.`,
                    rows: trackerRows.slice(0, MAX_ROWS),
                    isLoading: false,
                    hasUnsavedChanges: false,
                    selectedRowId: null,
                });
                return;
            }

            set({
                rows: trackerRows,
                isLoading: false,
                error: null,
                hasUnsavedChanges: false,
                selectedRowId: null,
                successMessage: `Loaded ${trackerRows.length} rows from Google Sheet`,
            });
        } catch (e: unknown) {
            const msg =
                e instanceof Error ? e.message : "Failed to load sheet. Check the link and try again.";
            set({ error: msg, isLoading: false });
        }
    },

    selectRow: (id) => set({ selectedRowId: id }),

    updateRow: (id, updates) =>
        set((s) => ({
            rows: s.rows.map((r) => (r.id === id ? { ...r, ...updates } : r)),
            hasUnsavedChanges: true,
        })),

    addRow: () => {
        const newRow: TrackerRow = {
            id: generateId(),
            company_name: "",
            company_email: "",
            company_address: "",
            linkedin_status: "Belum dikirim",
            cv_status: "Belum dibuat",
            letter_status: "Belum dibuat",
            position: "",
            city: "",
            date: new Date().toISOString().slice(0, 10),
            status: "Pending",
            notes: "",
        };
        set((s) => ({
            rows: [newRow, ...s.rows],
            selectedRowId: newRow.id,
            hasUnsavedChanges: true,
        }));
    },

    deleteRow: (id) =>
        set((s) => ({
            rows: s.rows.filter((r) => r.id !== id),
            selectedRowId: s.selectedRowId === id ? null : s.selectedRowId,
            hasUnsavedChanges: true,
        })),

    exportCSV: () => {
        return trackerRowsToCSV(get().rows);
    },

    getTemplateCSV: () => {
        const exampleRows: Partial<TrackerRow>[] = [
            {
                company_name: "PT Contoh Indonesia",
                company_email: "hr@contoh.id",
                company_address: "Jl. Contoh No. 1, Jakarta",
                linkedin_status: "Sudah dikirim",
                cv_status: "Sudah dibuat",
                letter_status: "Sudah dibuat",
                position: "Frontend Developer",
                city: "Jakarta",
                date: "2026-03-01",
                status: "On Progress",
                notes: "Menunggu interview",
            },
            {
                company_name: "Example Corp",
                company_email: "jobs@example.com",
                company_address: "123 Main St, Bandung",
                linkedin_status: "Belum dikirim",
                cv_status: "Belum dibuat",
                letter_status: "Belum dibuat",
                position: "UI Designer",
                city: "Bandung",
                date: "2026-03-05",
                status: "Pending",
                notes: "",
            },
            {
                company_name: "Startup ABC",
                company_email: "career@abc.io",
                company_address: "Jl. Tech Park, Surabaya",
                linkedin_status: "Tidak perlu",
                cv_status: "Sudah dikirim",
                letter_status: "Sudah dikirim",
                position: "Fullstack Engineer",
                city: "Surabaya",
                date: "2026-02-20",
                status: "Done",
                notes: "Diterima!",
            },
            {
                company_name: "Perusahaan Lama",
                company_email: "info@lama.co",
                company_address: "Jl. Lama, Yogyakarta",
                linkedin_status: "Sudah dikirim",
                cv_status: "Sudah dikirim",
                letter_status: "Sudah dikirim",
                position: "Backend Developer",
                city: "Yogyakarta",
                date: "2026-01-15",
                status: "Rejected",
                notes: "Tidak lolos technical test",
            },
        ];

        const header = TRACKER_COLUMNS.join(",");
        const body = exampleRows.map((row) =>
            TRACKER_COLUMNS.map((col) => {
                const val = (row as Record<string, string>)[col] ?? "";
                if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(",")
        );
        return [header, ...body].join("\n");
    },

    clearError: () => set({ error: null }),
    clearSuccess: () => set({ successMessage: null }),
}));
