"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import {
    useTrackerStore,
    TRACKER_COLUMNS,
    LINKEDIN_STATUS_OPTIONS,
    CV_STATUS_OPTIONS,
    LETTER_STATUS_OPTIONS,
    APPLICATION_STATUS_OPTIONS,
} from "@/store/tracker-store";
import type { TrackerRow } from "@/store/tracker-store";
import {
    Link2,
    Save,
    RefreshCw,
    Trash2,
    Download,
    Plus,
    AlertCircle,
    CheckCircle2,
    Info,
    X,
    Loader2,
    FileSpreadsheet,
    ClipboardList,
} from "lucide-react";

// ============================================================
// COLUMN DISPLAY CONFIG
// ============================================================
const COLUMN_LABELS: Record<string, string> = {
    company_name: "Company",
    company_email: "Email",
    company_address: "Address",
    linkedin_status: "LinkedIn",
    cv_status: "CV",
    letter_status: "Letter",
    position: "Position",
    city: "City",
    date: "Date",
    status: "Status",
    notes: "Notes",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    Done: { bg: "rgba(22, 163, 74, 0.1)", text: "#15803d", dot: "#16a34a" },
    Pending: { bg: "rgba(234, 179, 8, 0.1)", text: "#a16207", dot: "#eab308" },
    Rejected: { bg: "rgba(220, 38, 38, 0.1)", text: "#b91c1c", dot: "#dc2626" },
    "On Progress": { bg: "rgba(37, 99, 235, 0.1)", text: "#1d4ed8", dot: "#2563eb" },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ApplicationTracker() {
    const store = useTrackerStore();
    const [showInfo, setShowInfo] = useState(true);
    const formRef = useRef<HTMLDivElement>(null);

    // Load from localStorage on mount
    useEffect(() => {
        store.loadFromStorage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // beforeunload warning
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (store.urlInputDirty || store.hasUnsavedChanges) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [store.urlInputDirty, store.hasUnsavedChanges]);

    // Auto-clear messages
    useEffect(() => {
        if (store.successMessage) {
            const t = setTimeout(() => store.clearSuccess(), 4000);
            return () => clearTimeout(t);
        }
    }, [store.successMessage, store]);

    useEffect(() => {
        if (store.error) {
            const t = setTimeout(() => store.clearError(), 8000);
            return () => clearTimeout(t);
        }
    }, [store.error, store]);

    const handleSave = useCallback(() => {
        store.saveUrl();
    }, [store]);

    const handleLoad = useCallback(() => {
        store.fetchSheet();
    }, [store]);

    const handleReload = useCallback(() => {
        store.fetchSheet();
    }, [store]);

    const handleClear = useCallback(() => {
        store.clearUrl();
    }, [store]);

    const handleDownloadTemplate = useCallback(() => {
        const csv = store.getTemplateCSV();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "application_tracker_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    }, [store]);

    const handleExportCSV = useCallback(() => {
        const csv = store.exportCSV();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "application_tracker_updated.csv";
        a.click();
        URL.revokeObjectURL(url);
    }, [store]);

    const selectedRow = store.rows.find((r) => r.id === store.selectedRowId) ?? null;

    return (
        <div className="h-full flex overflow-hidden" style={{ background: "var(--color-slate-50)" }}>
            {/* LEFT PANEL — Form + Controls */}
            <div
                ref={formRef}
                className="flex flex-col h-full border-r"
                style={{
                    width: "420px",
                    minWidth: "380px",
                    borderColor: "var(--color-slate-200)",
                    background: "white",
                }}
            >
                <div className="flex-1 overflow-y-auto">
                    {/* Header */}
                    <div
                        className="px-5 pt-5 pb-4"
                        style={{ borderBottom: "1px solid var(--color-slate-100)" }}
                    >
                        <div className="flex items-center gap-2.5 mb-1">
                            <div
                                className="flex items-center justify-center w-8 h-8 rounded"
                                style={{
                                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                                }}
                            >
                                <ClipboardList className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-sm font-bold"
                                    style={{ color: "var(--color-slate-800)" }}
                                >
                                    Application Tracker
                                </h1>
                                <p
                                    className="text-xs"
                                    style={{ color: "var(--color-slate-400)" }}
                                >
                                    Monitor your job applications via Google Sheet
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    {showInfo && (
                        <div
                            className="mx-4 mt-4 p-3 rounded text-xs relative"
                            style={{
                                background: "rgba(37, 99, 235, 0.05)",
                                border: "1px solid rgba(37, 99, 235, 0.15)",
                                color: "var(--color-slate-600)",
                            }}
                        >
                            <button
                                onClick={() => setShowInfo(false)}
                                className="absolute top-2 right-2 p-0.5 rounded hover:bg-white/60"
                                style={{ color: "var(--color-slate-400)" }}
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <div className="flex items-center gap-1.5 mb-1.5 font-semibold" style={{ color: "#2563eb" }}>
                                <Info className="w-3.5 h-3.5" />
                                How it works
                            </div>
                            <p className="leading-relaxed mb-2">
                                This app uses your own Google Sheet as storage.
                            </p>
                            <ol className="space-y-0.5 ml-3 mb-3" style={{ listStyle: "decimal" }}>
                                <li>Download the template file.</li>
                                <li>Upload the file to your Google Sheet.</li>
                                <li>Make sure the sheet can be accessed using a link.</li>
                                <li>Copy the CSV export link from Google Sheet.</li>
                                <li>Paste the link into the Sheet Link field.</li>
                                <li>Click Load Sheet to display your data.</li>
                            </ol>
                            <p className="leading-relaxed mb-2">
                                Each row represents one company.
                                You can update the sheet at any time and reload it in the app.
                            </p>
                            <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(37, 99, 235, 0.1)" }}>
                                <div className="font-semibold mb-1" style={{ color: "#2563eb" }}>
                                    Important notes
                                </div>
                                <ul className="space-y-0.5 ml-3" style={{ listStyle: "disc" }}>
                                    <li>The link is stored only in this browser.</li>
                                    <li>If you change device, you must enter the link again.</li>
                                    <li>If you clear browser data, the link will be lost.</li>
                                    <li>Each user should use their own sheet file.</li>
                                    <li>The sheet must be public or accessible by link.</li>
                                    <li>Do not change the column names in the template.</li>
                                    <li>If the format is changed, the app may not be able to read the data.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Sheet URL Input */}
                    <div className="px-4 pt-4 pb-3">
                        <label className="form-label">Google Sheet CSV Link</label>
                        <div className="flex gap-1.5 mt-1">
                            <div className="relative flex-1">
                                <Link2
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                    style={{ color: "var(--color-slate-400)" }}
                                />
                                <input
                                    id="tracker-sheet-url"
                                    type="url"
                                    className="form-input pl-8"
                                    style={{ fontSize: "0.8rem" }}
                                    placeholder="https://docs.google.com/.../export?format=csv"
                                    value={store.sheetUrl}
                                    onChange={(e) => store.setSheetUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Buttons row */}
                        <div className="flex gap-1.5 mt-2">
                            <button
                                id="tracker-btn-save"
                                className="btn btn-primary btn-sm"
                                onClick={handleSave}
                                disabled={!store.sheetUrl.trim()}
                            >
                                <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                                id="tracker-btn-load"
                                className="btn btn-secondary btn-sm"
                                onClick={handleLoad}
                                disabled={store.isLoading || !store.sheetUrl.trim()}
                            >
                                {store.isLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="w-3 h-3" />
                                )}
                                Load
                            </button>
                            <button
                                id="tracker-btn-reload"
                                className="btn btn-secondary btn-sm"
                                onClick={handleReload}
                                disabled={store.isLoading || !store.savedUrl}
                            >
                                <RefreshCw className="w-3 h-3" /> Reload
                            </button>
                            <button
                                id="tracker-btn-clear"
                                className="btn btn-ghost btn-sm"
                                onClick={handleClear}
                                style={{ color: "var(--color-error)" }}
                            >
                                <Trash2 className="w-3 h-3" /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {store.error && (
                        <div
                            className="mx-4 mb-2 p-2.5 rounded flex items-start gap-2 text-xs"
                            style={{
                                background: "rgba(220, 38, 38, 0.07)",
                                border: "1px solid rgba(220, 38, 38, 0.2)",
                                color: "#b91c1c",
                            }}
                        >
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>{store.error}</span>
                        </div>
                    )}
                    {store.successMessage && (
                        <div
                            className="mx-4 mb-2 p-2.5 rounded flex items-start gap-2 text-xs"
                            style={{
                                background: "rgba(22, 163, 74, 0.07)",
                                border: "1px solid rgba(22, 163, 74, 0.2)",
                                color: "#15803d",
                            }}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>{store.successMessage}</span>
                        </div>
                    )}

                    {/* Divider */}
                    <div
                        className="mx-4 my-2"
                        style={{ borderTop: "1px solid var(--color-slate-100)" }}
                    />

                    {/* Edit Form for selected row */}
                    {selectedRow ? (
                        <RowEditForm row={selectedRow} />
                    ) : (
                        <div className="px-4 pt-2 pb-4">
                            <div className="text-center py-8 text-xs" style={{ color: "var(--color-slate-400)" }}>
                                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                {store.rows.length > 0
                                    ? "Select a row from the table to edit"
                                    : "Load a sheet or add a row to get started"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div
                    className="px-4 py-3 flex flex-wrap gap-1.5"
                    style={{
                        borderTop: "1px solid var(--color-slate-200)",
                        background: "var(--color-slate-50)",
                    }}
                >
                    <button
                        id="tracker-btn-add"
                        className="btn btn-success btn-sm"
                        onClick={() => store.addRow()}
                    >
                        <Plus className="w-3 h-3" /> Add Row
                    </button>
                    <button
                        id="tracker-btn-export"
                        className="btn btn-primary btn-sm"
                        onClick={handleExportCSV}
                        disabled={store.rows.length === 0}
                    >
                        <Download className="w-3 h-3" /> Export CSV
                    </button>
                    <button
                        id="tracker-btn-template"
                        className="btn btn-secondary btn-sm"
                        onClick={handleDownloadTemplate}
                    >
                        <Download className="w-3 h-3" /> Template
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL — Table */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--color-slate-75)" }}>
                <TrackerHeader rowCount={store.rows.length} hasUnsaved={store.hasUnsavedChanges} />
                {store.isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2563eb" }} />
                            <span className="text-xs font-medium" style={{ color: "var(--color-slate-500)" }}>
                                Loading sheet data...
                            </span>
                        </div>
                    </div>
                ) : store.rows.length === 0 ? (
                    <EmptyState />
                ) : (
                    <TrackerTable
                        rows={store.rows}
                        selectedRowId={store.selectedRowId}
                        onSelectRow={(id) => store.selectRow(id)}
                        onDeleteRow={(id) => store.deleteRow(id)}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================
// TRACKER HEADER
// ============================================================
function TrackerHeader({ rowCount, hasUnsaved }: { rowCount: number; hasUnsaved: boolean }) {
    return (
        <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
                borderBottom: "1px solid var(--color-slate-200)",
                background: "white",
            }}
        >
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: rowCount > 0 ? "#16a34a" : "var(--color-slate-300)" }} />
                <span
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: "var(--color-slate-400)" }}
                >
                    Data Table
                </span>
                {rowCount > 0 && (
                    <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                            background: "var(--color-slate-100)",
                            color: "var(--color-slate-500)",
                        }}
                    >
                        {rowCount} rows
                    </span>
                )}
                {hasUnsaved && (
                    <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                            background: "rgba(234, 179, 8, 0.15)",
                            color: "#a16207",
                        }}
                    >
                        Unsaved changes
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium" style={{ color: "var(--color-slate-300)" }}>
                Max 500 rows · 1 MB
            </span>
        </div>
    );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState() {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto px-6">
                <div
                    className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(124,58,237,0.1) 100%)",
                    }}
                >
                    <FileSpreadsheet className="w-7 h-7" style={{ color: "#2563eb" }} />
                </div>
                <h3
                    className="text-sm font-bold mb-1.5"
                    style={{ color: "var(--color-slate-700)" }}
                >
                    No Data Loaded
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--color-slate-400)" }}>
                    Paste your Google Sheet CSV link in the left panel and click{" "}
                    <strong>Load</strong> to fetch data, or click <strong>Add Row</strong> to start fresh.
                </p>
                <div
                    className="text-xs p-3 rounded"
                    style={{
                        background: "rgba(37,99,235,0.05)",
                        border: "1px solid rgba(37,99,235,0.1)",
                        color: "var(--color-slate-500)",
                    }}
                >
                    <strong>Tip:</strong> Download the <em>Template CSV</em> to set up your Google Sheet with the correct columns.
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TRACKER TABLE
// ============================================================
function TrackerTable({
    rows,
    selectedRowId,
    onSelectRow,
    onDeleteRow,
}: {
    rows: TrackerRow[];
    selectedRowId: string | null;
    onSelectRow: (id: string) => void;
    onDeleteRow: (id: string) => void;
}) {
    return (
        <div className="flex-1 overflow-auto p-4">
            <div
                className="rounded overflow-hidden"
                style={{
                    border: "1px solid var(--color-slate-200)",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
            >
                <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "var(--color-slate-50)" }}>
                            <th
                                className="px-2 py-2.5 text-left font-bold uppercase tracking-wider"
                                style={{
                                    color: "var(--color-slate-400)",
                                    fontSize: "0.625rem",
                                    borderBottom: "2px solid var(--color-slate-200)",
                                    width: "30px",
                                }}
                            >
                                #
                            </th>
                            {TRACKER_COLUMNS.map((col) => (
                                <th
                                    key={col}
                                    className="px-2 py-2.5 text-left font-bold uppercase tracking-wider"
                                    style={{
                                        color: "var(--color-slate-400)",
                                        fontSize: "0.625rem",
                                        borderBottom: "2px solid var(--color-slate-200)",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {COLUMN_LABELS[col] || col}
                                </th>
                            ))}
                            <th
                                className="px-2 py-2.5"
                                style={{
                                    borderBottom: "2px solid var(--color-slate-200)",
                                    width: "36px",
                                }}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const isSelected = row.id === selectedRowId;
                            const sc = STATUS_COLORS[row.status];
                            return (
                                <tr
                                    key={row.id}
                                    onClick={() => onSelectRow(row.id)}
                                    className="group"
                                    style={{
                                        cursor: "pointer",
                                        background: isSelected
                                            ? "rgba(37,99,235,0.06)"
                                            : sc
                                                ? sc.bg
                                                : idx % 2 === 1
                                                    ? "var(--color-slate-50)"
                                                    : "white",
                                        borderBottom: "1px solid var(--color-slate-100)",
                                        borderLeft: isSelected ? "3px solid #2563eb" : "3px solid transparent",
                                        transition: "background 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.04)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            (e.currentTarget as HTMLElement).style.background = sc
                                                ? sc.bg
                                                : idx % 2 === 1
                                                    ? "var(--color-slate-50)"
                                                    : "white";
                                        }
                                    }}
                                >
                                    <td
                                        className="px-2 py-2 font-medium"
                                        style={{ color: "var(--color-slate-400)", fontSize: "0.65rem" }}
                                    >
                                        {idx + 1}
                                    </td>
                                    {TRACKER_COLUMNS.map((col) => {
                                        const val = row[col];
                                        const isStatus = col === "status";
                                        const isStatusCol = ["linkedin_status", "cv_status", "letter_status"].includes(col);

                                        return (
                                            <td
                                                key={col}
                                                className="px-2 py-2"
                                                style={{
                                                    color: isStatus && sc ? sc.text : "var(--color-slate-700)",
                                                    fontWeight: isStatus ? 600 : col === "company_name" ? 500 : 400,
                                                    maxWidth: col === "notes" ? "180px" : col === "company_address" ? "150px" : "130px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {isStatus && sc ? (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold"
                                                        style={{
                                                            background: sc.bg,
                                                            color: sc.text,
                                                            fontSize: "0.65rem",
                                                        }}
                                                    >
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ background: sc.dot }}
                                                        />
                                                        {val}
                                                    </span>
                                                ) : isStatusCol ? (
                                                    <span
                                                        className="inline-block px-1.5 py-0.5 rounded font-medium"
                                                        style={{
                                                            background: "var(--color-slate-75)",
                                                            color: "var(--color-slate-600)",
                                                            fontSize: "0.65rem",
                                                        }}
                                                    >
                                                        {val || "—"}
                                                    </span>
                                                ) : (
                                                    val || <span style={{ color: "var(--color-slate-300)" }}>—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-1 py-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteRow(row.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                                            style={{ color: "var(--color-error)" }}
                                            title="Delete row"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================================
// ROW EDIT FORM
// ============================================================
function RowEditForm({ row }: { row: TrackerRow }) {
    const updateRow = useTrackerStore((s) => s.updateRow);

    const fieldSetter = (field: keyof TrackerRow) => (val: string) => {
        updateRow(row.id, { [field]: val });
    };

    return (
        <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: "rgba(37,99,235,0.1)" }}
                >
                    <FileSpreadsheet className="w-3 h-3" style={{ color: "#2563eb" }} />
                </div>
                <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-slate-500)" }}
                >
                    Edit Row
                </span>
            </div>

            <FormField label="Company Name" value={row.company_name} onChange={fieldSetter("company_name")} />
            <FormField label="Email" value={row.company_email} onChange={fieldSetter("company_email")} type="email" />
            <FormField label="Address" value={row.company_address} onChange={fieldSetter("company_address")} multiline />
            <FormField label="Position" value={row.position} onChange={fieldSetter("position")} />
            <FormField label="City" value={row.city} onChange={fieldSetter("city")} />
            <FormField label="Date" value={row.date} onChange={fieldSetter("date")} type="date" />

            <FormSelect
                label="LinkedIn Status"
                value={row.linkedin_status}
                onChange={fieldSetter("linkedin_status")}
                options={[...LINKEDIN_STATUS_OPTIONS]}
            />
            <FormSelect
                label="CV Status"
                value={row.cv_status}
                onChange={fieldSetter("cv_status")}
                options={[...CV_STATUS_OPTIONS]}
            />
            <FormSelect
                label="Letter Status"
                value={row.letter_status}
                onChange={fieldSetter("letter_status")}
                options={[...LETTER_STATUS_OPTIONS]}
            />
            <FormSelect
                label="Status"
                value={row.status}
                onChange={fieldSetter("status")}
                options={[...APPLICATION_STATUS_OPTIONS]}
            />

            <FormField label="Notes" value={row.notes} onChange={fieldSetter("notes")} multiline />
        </div>
    );
}

// ============================================================
// FORM PRIMITIVES
// ============================================================
function FormField({
    label,
    value,
    onChange,
    type = "text",
    multiline = false,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    type?: string;
    multiline?: boolean;
}) {
    return (
        <div>
            <label className="form-label">{label}</label>
            {multiline ? (
                <textarea
                    className="form-input form-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={2}
                />
            ) : (
                <input
                    type={type}
                    className="form-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    );
}

function FormSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
}) {
    return (
        <div>
            <label className="form-label">{label}</label>
            <div className="relative">
                <select
                    className="form-input form-select"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">- Select -</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
