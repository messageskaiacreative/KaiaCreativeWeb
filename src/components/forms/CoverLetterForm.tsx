"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { coverLetterSchema, type CoverLetterForm } from "@/lib/schemas";
import { FormGroup, FormRow, FormSection } from "@/components/ui/FormPrimitives";
import TemplateSelector from "@/components/ui/TemplateSelector";
import { getTemplatesForType } from "@/types/documents";
import { useAppStore } from "@/store/app-store";
import { useEffect } from "react";

export default function CoverLetterFormComponent() {
    const { setCurrentPayload } = useAppStore();
    const templates = getTemplatesForType("cover-letter");

    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CoverLetterForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(coverLetterSchema) as any,
        defaultValues: {
            type: "cover-letter",
            applicantName: "",
            applicantEmail: "",
            applicantPhone: "",
            applicantAddress: "",
            recipientName: "",
            recipientTitle: "",
            companyName: "",
            companyAddress: "",
            date: new Date().toISOString().split("T")[0],
            jobTitle: "",
            introduction: "",
            bodyParagraph1: "",
            bodyParagraph2: "",
            closing: "Thank you for your time and consideration.",
            template: "classic",
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
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                    Cover Letter
                </h2>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                    Create professional cover letters tailored to job applications
                </p>
            </div>

            <TemplateSelector
                templates={templates}
                selected={formData.template}
                onSelect={(id) => setValue("template", id as CoverLetterForm["template"])}
            />

            <FormSection title="Your Information">
                <FormGroup label="Full Name" htmlFor="applicantName" required error={errors.applicantName?.message}>
                    <input id="applicantName" className="form-input" placeholder="John Smith" {...register("applicantName")} />
                </FormGroup>
                <FormRow>
                    <FormGroup label="Email" htmlFor="applicantEmail" required error={errors.applicantEmail?.message}>
                        <input id="applicantEmail" className="form-input" placeholder="john@email.com" {...register("applicantEmail")} />
                    </FormGroup>
                    <FormGroup label="Phone" htmlFor="applicantPhone">
                        <input id="applicantPhone" className="form-input" placeholder="+1 (555) 000-0000" {...register("applicantPhone")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Address" htmlFor="applicantAddress">
                    <input id="applicantAddress" className="form-input" placeholder="123 Main St, City, ST 12345" {...register("applicantAddress")} />
                </FormGroup>
            </FormSection>

            <FormSection title="Company Information">
                <FormRow>
                    <FormGroup label="Hiring Manager" htmlFor="recipientName" required error={errors.recipientName?.message}>
                        <input id="recipientName" className="form-input" placeholder="Jane Doe" {...register("recipientName")} />
                    </FormGroup>
                    <FormGroup label="Manager Title" htmlFor="recipientTitle">
                        <input id="recipientTitle" className="form-input" placeholder="HR Director" {...register("recipientTitle")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Company Name" htmlFor="companyName" required error={errors.companyName?.message}>
                    <input id="companyName" className="form-input" placeholder="Acme Corporation" {...register("companyName")} />
                </FormGroup>
                <FormGroup label="Company Address" htmlFor="companyAddress">
                    <input id="companyAddress" className="form-input" placeholder="456 Corporate Blvd, City" {...register("companyAddress")} />
                </FormGroup>
            </FormSection>

            <FormSection title="Letter Content">
                <FormRow>
                    <FormGroup label="Date" htmlFor="date" required error={errors.date?.message}>
                        <input id="date" type="date" className="form-input" {...register("date")} />
                    </FormGroup>
                    <FormGroup label="Job Title" htmlFor="jobTitle" required error={errors.jobTitle?.message}>
                        <input id="jobTitle" className="form-input" placeholder="Software Engineer" {...register("jobTitle")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Introduction" htmlFor="introduction" required error={errors.introduction?.message}>
                    <textarea id="introduction" className="form-input form-textarea" rows={3} placeholder="I am writing to express my interest in the position of..." {...register("introduction")} />
                </FormGroup>
                <FormGroup label="Body Paragraph 1" htmlFor="bodyParagraph1" required error={errors.bodyParagraph1?.message}>
                    <textarea id="bodyParagraph1" className="form-input form-textarea" rows={4} placeholder="In my current role at..." {...register("bodyParagraph1")} />
                </FormGroup>
                <FormGroup label="Body Paragraph 2 (Optional)" htmlFor="bodyParagraph2">
                    <textarea id="bodyParagraph2" className="form-input form-textarea" rows={4} placeholder="Additionally, I bring..." {...register("bodyParagraph2")} />
                </FormGroup>
                <FormGroup label="Closing" htmlFor="closing">
                    <textarea id="closing" className="form-input form-textarea" rows={2} placeholder="Thank you for your time..." {...register("closing")} />
                </FormGroup>
            </FormSection>
        </div>
    );
}
