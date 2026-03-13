"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractSchema, type ContractForm } from "@/lib/schemas";
import { FormGroup, FormRow, FormSection } from "@/components/ui/FormPrimitives";
import TemplateSelector from "@/components/ui/TemplateSelector";
import { getTemplatesForType } from "@/types/documents";
import { useAppStore } from "@/store/app-store";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ContractFormComponent() {
    const { setCurrentPayload } = useAppStore();
    const templates = getTemplatesForType("contract");

    const {
        register,
        watch,
        setValue,
        control,
        formState: { errors },
    } = useForm<ContractForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(contractSchema) as any,
        defaultValues: {
            type: "contract",
            contractType: "general",
            title: "",
            date: new Date().toISOString().split("T")[0],
            effectiveDate: "",
            expirationDate: "",
            partyOneName: "",
            partyOneTitle: "",
            partyOneAddress: "",
            partyTwoName: "",
            partyTwoTitle: "",
            partyTwoAddress: "",
            recitals: "",
            clauses: [{ title: "", content: "" }],
            governingLaw: "",
            disputeResolution: "",
            template: "standard",
        },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "clauses",
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
                    Contract & Agreement
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Build legally-formatted contracts and lease agreements
                </p>
            </div>

            <TemplateSelector
                templates={templates}
                selected={formData.template}
                onSelect={(id) => setValue("template", id as ContractForm["template"])}
            />

            <FormSection title="Contract Details">
                <FormGroup label="Contract Title" htmlFor="title" required error={errors.title?.message}>
                    <input id="title" className="form-input" placeholder="Service Agreement" {...register("title")} />
                </FormGroup>
                <FormRow>
                    <FormGroup label="Contract Type" htmlFor="contractType">
                        <select id="contractType" className="form-input form-select" {...register("contractType")}>
                            <option value="general">General Contract</option>
                            <option value="lease">Lease Agreement</option>
                            <option value="service">Service Agreement</option>
                            <option value="nda">Non-Disclosure (NDA)</option>
                        </select>
                    </FormGroup>
                    <FormGroup label="Date" htmlFor="date" required error={errors.date?.message}>
                        <input id="date" type="date" className="form-input" {...register("date")} />
                    </FormGroup>
                </FormRow>
                <FormRow>
                    <FormGroup label="Effective Date" htmlFor="effectiveDate" required error={errors.effectiveDate?.message}>
                        <input id="effectiveDate" type="date" className="form-input" {...register("effectiveDate")} />
                    </FormGroup>
                    <FormGroup label="Expiration Date" htmlFor="expirationDate">
                        <input id="expirationDate" type="date" className="form-input" {...register("expirationDate")} />
                    </FormGroup>
                </FormRow>
            </FormSection>

            <FormSection title="Party One (First Party)">
                <FormRow>
                    <FormGroup label="Name" htmlFor="partyOneName" required error={errors.partyOneName?.message}>
                        <input id="partyOneName" className="form-input" placeholder="Company A / Individual Name" {...register("partyOneName")} />
                    </FormGroup>
                    <FormGroup label="Title" htmlFor="partyOneTitle">
                        <input id="partyOneTitle" className="form-input" placeholder="CEO / Individual" {...register("partyOneTitle")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Address" htmlFor="partyOneAddress" required error={errors.partyOneAddress?.message}>
                    <textarea id="partyOneAddress" className="form-input form-textarea" rows={2} placeholder="Full legal address" {...register("partyOneAddress")} />
                </FormGroup>
            </FormSection>

            <FormSection title="Party Two (Second Party)">
                <FormRow>
                    <FormGroup label="Name" htmlFor="partyTwoName" required error={errors.partyTwoName?.message}>
                        <input id="partyTwoName" className="form-input" placeholder="Company B / Individual Name" {...register("partyTwoName")} />
                    </FormGroup>
                    <FormGroup label="Title" htmlFor="partyTwoTitle">
                        <input id="partyTwoTitle" className="form-input" placeholder="CTO / Individual" {...register("partyTwoTitle")} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Address" htmlFor="partyTwoAddress" required error={errors.partyTwoAddress?.message}>
                    <textarea id="partyTwoAddress" className="form-input form-textarea" rows={2} placeholder="Full legal address" {...register("partyTwoAddress")} />
                </FormGroup>
            </FormSection>

            <FormSection title="Recitals / Preamble">
                <FormGroup label="Recitals" htmlFor="recitals">
                    <textarea id="recitals" className="form-input form-textarea" rows={4} placeholder="WHEREAS, the parties wish to enter into an agreement..." {...register("recitals")} />
                </FormGroup>
            </FormSection>

            <FormSection title="Clauses / Articles">
                {errors.clauses && typeof errors.clauses.message === "string" && (
                    <p className="text-[11px] text-red-500 mb-2">{errors.clauses.message}</p>
                )}
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-3 border border-slate-100 bg-slate-25 rounded-sm">
                            <FormGroup label={`Article ${index + 1} Title`} error={errors.clauses?.[index]?.title?.message}>
                                <input className="form-input" placeholder={`Article ${index + 1}: Scope of Work`} {...register(`clauses.${index}.title`)} />
                            </FormGroup>
                            <FormGroup label="Content" error={errors.clauses?.[index]?.content?.message}>
                                <textarea className="form-input form-textarea" rows={4} placeholder="The terms and conditions of this clause..." {...register(`clauses.${index}.content`)} />
                            </FormGroup>
                            {fields.length > 1 && (
                                <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 mt-1">
                                    <Trash2 className="w-3 h-3" /> Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => append({ title: "", content: "" })} className="btn btn-secondary btn-sm mt-2 w-full">
                    <Plus className="w-3.5 h-3.5" /> Add Clause
                </button>
            </FormSection>

            <FormSection title="Legal Provisions">
                <FormGroup label="Governing Law" htmlFor="governingLaw">
                    <input id="governingLaw" className="form-input" placeholder="State of California, United States" {...register("governingLaw")} />
                </FormGroup>
                <FormGroup label="Dispute Resolution" htmlFor="disputeResolution">
                    <textarea id="disputeResolution" className="form-input form-textarea" rows={3} placeholder="Any disputes shall be resolved through arbitration..." {...register("disputeResolution")} />
                </FormGroup>
            </FormSection>
        </div>
    );
}
