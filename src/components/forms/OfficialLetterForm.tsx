"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { officialLetterSchema, type OfficialLetterForm } from "@/lib/schemas";
import { FormGroup, FormRow, FormSection } from "@/components/ui/FormPrimitives";
import TemplateSelector from "@/components/ui/TemplateSelector";
import { getTemplatesForType } from "@/types/documents";
import { useAppStore } from "@/store/app-store";
import { useEffect } from "react";

export default function OfficialLetterFormComponent() {
    const { setCurrentPayload } = useAppStore();
    const templates = getTemplatesForType("official-letter");

    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm<OfficialLetterForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(officialLetterSchema) as any,
        defaultValues: {
            type: "official-letter",
            senderName: "",
            senderTitle: "",
            senderOrganization: "",
            senderAddress: "",
            senderPhone: "",
            senderEmail: "",
            recipientName: "",
            recipientTitle: "",
            recipientOrganization: "",
            recipientAddress: "",
            date: new Date().toISOString().split("T")[0],
            referenceNumber: "",
            subject: "",
            body: "",
            closingRemarks: "Respectfully,",
            template: "formal",
        },
        mode: "onChange",
    });

    const formData = watch();

    // Live preview update
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
                    Official Letter
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Generate formal letters, permission letters, and official correspondence
                </p>
            </div>

            <TemplateSelector
                templates={templates}
                selected={formData.template}
                onSelect={(id) => setValue("template", id as OfficialLetterForm["template"])}
            />

            <FormSection title="Sender Information">
                <FormRow>
                    <FormGroup label="Full Name" htmlFor="senderName" required error={errors.senderName?.message}>
                        <input id="senderName" className="form-input" placeholder="John Smith" {...register("senderName")} />
                    </FormGroup>
                    <FormGroup label="Title / Position" htmlFor="senderTitle">
                        <input id="senderTitle" className="form-input" placeholder="Director" {...register("senderTitle")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Organization" htmlFor="senderOrganization" required error={errors.senderOrganization?.message}>
                    <input id="senderOrganization" className="form-input" placeholder="Acme Corporation" {...register("senderOrganization")} />
                </FormGroup>
                <FormGroup label="Address" htmlFor="senderAddress" required error={errors.senderAddress?.message}>
                    <textarea id="senderAddress" className="form-input form-textarea" rows={2} placeholder="123 Business Ave, Suite 100, City, ST 12345" {...register("senderAddress")} />
                </FormGroup>
                <FormRow>
                    <FormGroup label="Phone" htmlFor="senderPhone">
                        <input id="senderPhone" className="form-input" placeholder="+1 (555) 000-0000" {...register("senderPhone")} />
                    </FormGroup>
                    <FormGroup label="Email" htmlFor="senderEmail" error={errors.senderEmail?.message}>
                        <input id="senderEmail" className="form-input" placeholder="john@acme.com" {...register("senderEmail")} />
                    </FormGroup>
                </FormRow>
            </FormSection>

            <FormSection title="Recipient Information">
                <FormRow>
                    <FormGroup label="Full Name" htmlFor="recipientName" required error={errors.recipientName?.message}>
                        <input id="recipientName" className="form-input" placeholder="Jane Doe" {...register("recipientName")} />
                    </FormGroup>
                    <FormGroup label="Title / Position" htmlFor="recipientTitle">
                        <input id="recipientTitle" className="form-input" placeholder="HR Manager" {...register("recipientTitle")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Organization" htmlFor="recipientOrganization">
                    <input id="recipientOrganization" className="form-input" placeholder="Target Inc." {...register("recipientOrganization")} />
                </FormGroup>
                <FormGroup label="Address" htmlFor="recipientAddress" required error={errors.recipientAddress?.message}>
                    <textarea id="recipientAddress" className="form-input form-textarea" rows={2} placeholder="456 Corporate Blvd, City, ST 67890" {...register("recipientAddress")} />
                </FormGroup>
            </FormSection>

            <FormSection title="Letter Details">
                <FormRow>
                    <FormGroup label="Date" htmlFor="date" required error={errors.date?.message}>
                        <input id="date" type="date" className="form-input" {...register("date")} />
                    </FormGroup>
                    <FormGroup label="Reference No." htmlFor="referenceNumber">
                        <input id="referenceNumber" className="form-input" placeholder="REF-2024-001" {...register("referenceNumber")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Subject" htmlFor="subject" required error={errors.subject?.message}>
                    <input id="subject" className="form-input" placeholder="RE: Request for Permission" {...register("subject")} />
                </FormGroup>
                <FormGroup label="Letter Body" htmlFor="body" required error={errors.body?.message}>
                    <textarea id="body" className="form-input form-textarea" rows={8} placeholder="Dear Sir/Madam,&#10;&#10;I am writing to..." {...register("body")} />
                </FormGroup>
                <FormGroup label="Closing Remarks" htmlFor="closingRemarks">
                    <input id="closingRemarks" className="form-input" placeholder="Respectfully," {...register("closingRemarks")} />
                </FormGroup>
            </FormSection>
        </div>
    );
}
