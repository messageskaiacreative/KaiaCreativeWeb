"use client";

export function FormGroup({
    label,
    htmlFor,
    required,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-3">
            <label htmlFor={htmlFor} className="form-label">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-0.5 text-[11px] text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}

export function FormRow({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function FormSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

export function FormDivider() {
    return <hr className="my-4 border-slate-100" />;
}
