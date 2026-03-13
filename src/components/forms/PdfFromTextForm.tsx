"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pdfFromTextSchema, type PdfFromTextForm } from "@/lib/schemas";
import { FormGroup, FormRow, FormSection } from "@/components/ui/FormPrimitives";
import TemplateSelector from "@/components/ui/TemplateSelector";
import { getTemplatesForType } from "@/types/documents";
import { useAppStore } from "@/store/app-store";
import { useEffect } from "react";

export default function PdfFromTextFormComponent() {
    const { setCurrentPayload } = useAppStore();
    const templates = getTemplatesForType("pdf-from-text");

    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PdfFromTextForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(pdfFromTextSchema) as any,
        defaultValues: {
            type: "pdf-from-text",
            title: "",
            content: "",
            author: "",
            date: new Date().toISOString().split("T")[0],
            format: "plain",
            pageSize: "A4",
            fontSize: 12,
            template: "minimal",
        },
        mode: "onChange",
    });

    const formData = watch();

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPayload(formData);
        }, 100);
        return () => clearTimeout(timer);
    }, [formData, setCurrentPayload]);

    return (
        <div className="p-5">
            <div className="mb-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    PDF from Text
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Convert raw text or markdown into a clean, formatted PDF document
                </p>
            </div>

            <TemplateSelector
                templates={templates}
                selected={formData.template}
                onSelect={(id) => setValue("template", id as PdfFromTextForm["template"])}
            />

            <FormSection title="Document Settings">
                <FormGroup label="Title" htmlFor="title" required error={errors.title?.message}>
                    <input id="title" className="form-input" placeholder="My Document" {...register("title")} />
                </FormGroup>
                <FormRow>
                    <FormGroup label="Author" htmlFor="author">
                        <input id="author" className="form-input" placeholder="Author name" {...register("author")} />
                    </FormGroup>
                    <FormGroup label="Date" htmlFor="date">
                        <input id="date" type="date" className="form-input" {...register("date")} />
                    </FormGroup>
                </FormRow>
                <FormRow>
                    <FormGroup label="Text Format" htmlFor="format">
                        <select id="format" className="form-input form-select" {...register("format")}>
                            <option value="plain">Plain Text</option>
                            <option value="markdown">Markdown</option>
                        </select>
                    </FormGroup>
                    <FormGroup label="Page Size" htmlFor="pageSize">
                        <select id="pageSize" className="form-input form-select" {...register("pageSize")}>
                            <option value="A4">A4</option>
                            <option value="Letter">Letter</option>
                            <option value="Legal">Legal</option>
                        </select>
                    </FormGroup>
                </FormRow>
                <FormGroup label="Font Size" htmlFor="fontSize">
                    <input id="fontSize" type="number" min={8} max={24} className="form-input" {...register("fontSize", { valueAsNumber: true })} />
                </FormGroup>
            </FormSection>

            <FormSection title="Content">
                <FormGroup label="Document Content" htmlFor="content" required error={errors.content?.message}>
                    <textarea
                        id="content"
                        className="form-input form-textarea font-mono text-sm"
                        rows={16}
                        placeholder={formData.format === "markdown"
                            ? "# Heading\n\nYour markdown content here...\n\n## Subheading\n\n- List item 1\n- List item 2"
                            : "Enter your text content here...\n\nParagraphs are separated by blank lines."
                        }
                        {...register("content")}
                    />
                </FormGroup>
            </FormSection>
        </div>
    );
}
