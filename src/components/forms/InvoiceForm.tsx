"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, type InvoiceForm } from "@/lib/schemas";
import { FormGroup, FormRow, FormSection } from "@/components/ui/FormPrimitives";
import TemplateSelector from "@/components/ui/TemplateSelector";
import { getTemplatesForType } from "@/types/documents";
import { useAppStore } from "@/store/app-store";
import { useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function InvoiceFormComponent() {
    const { setCurrentPayload } = useAppStore();
    const templates = getTemplatesForType("invoice");

    const {
        register,
        watch,
        setValue,
        control,
        formState: { errors },
    } = useForm<InvoiceForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            type: "invoice",
            documentKind: "invoice",
            invoiceNumber: "INV-001",
            date: new Date().toISOString().split("T")[0],
            dueDate: "",
            fromName: "",
            fromAddress: "",
            fromEmail: "",
            fromPhone: "",
            toName: "",
            toAddress: "",
            toEmail: "",
            toPhone: "",
            lineItems: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            subtotal: 0,
            taxRate: 0,
            taxAmount: 0,
            total: 0,
            currency: "USD",
            notes: "",
            paymentTerms: "Net 30",
            template: "clean",
        },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "lineItems",
    });

    const formData = watch();

    // Auto-calculate totals
    const recalculate = useCallback(() => {
        const items = formData.lineItems || [];
        let subtotal = 0;
        items.forEach((item, i) => {
            const total = (item.quantity || 0) * (item.unitPrice || 0);
            if (item.total !== total) {
                setValue(`lineItems.${i}.total`, total);
            }
            subtotal += total;
        });
        const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
        const grandTotal = subtotal + taxAmount;
        if (formData.subtotal !== subtotal) setValue("subtotal", subtotal);
        if (formData.taxAmount !== taxAmount) setValue("taxAmount", taxAmount);
        if (formData.total !== grandTotal) setValue("total", grandTotal);
    }, [formData.lineItems, formData.taxRate, formData.subtotal, formData.taxAmount, formData.total, setValue]);

    useEffect(() => {
        recalculate();
    }, [recalculate]);

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
                    Invoice & Quotation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Generate professional invoices and quotations
                </p>
            </div>

            <TemplateSelector
                templates={templates}
                selected={formData.template}
                onSelect={(id) => setValue("template", id as InvoiceForm["template"])}
            />

            <FormSection title="Document Type">
                <FormRow>
                    <FormGroup label="Type" htmlFor="documentKind">
                        <select id="documentKind" className="form-input form-select" {...register("documentKind")}>
                            <option value="invoice">Invoice</option>
                            <option value="quotation">Quotation</option>
                        </select>
                    </FormGroup>
                    <FormGroup label="Number" htmlFor="invoiceNumber" required error={errors.invoiceNumber?.message}>
                        <input id="invoiceNumber" className="form-input" placeholder="INV-001" {...register("invoiceNumber")} />
                    </FormGroup>
                </FormRow>
                <FormRow>
                    <FormGroup label="Date" htmlFor="date" required error={errors.date?.message}>
                        <input id="date" type="date" className="form-input" {...register("date")} />
                    </FormGroup>
                    <FormGroup label="Due Date" htmlFor="dueDate" required error={errors.dueDate?.message}>
                        <input id="dueDate" type="date" className="form-input" {...register("dueDate")} />
                    </FormGroup>
                </FormRow>
                <FormRow>
                    <FormGroup label="Currency" htmlFor="currency">
                        <select id="currency" className="form-input form-select" {...register("currency")}>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="IDR">IDR (Rp)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </FormGroup>
                    <FormGroup label="Payment Terms" htmlFor="paymentTerms">
                        <input id="paymentTerms" className="form-input" placeholder="Net 30" {...register("paymentTerms")} />
                    </FormGroup>
                </FormRow>
            </FormSection>

            <FormSection title="From (Your Business)">
                <FormGroup label="Business Name" htmlFor="fromName" required error={errors.fromName?.message}>
                    <input id="fromName" className="form-input" placeholder="Your Business Name" {...register("fromName")} />
                </FormGroup>
                <FormGroup label="Address" htmlFor="fromAddress" required error={errors.fromAddress?.message}>
                    <textarea id="fromAddress" className="form-input form-textarea" rows={2} placeholder="123 Business St, City" {...register("fromAddress")} />
                </FormGroup>
                <FormRow>
                    <FormGroup label="Email" htmlFor="fromEmail" error={errors.fromEmail?.message}>
                        <input id="fromEmail" className="form-input" placeholder="billing@company.com" {...register("fromEmail")} />
                    </FormGroup>
                    <FormGroup label="Phone" htmlFor="fromPhone">
                        <input id="fromPhone" className="form-input" placeholder="+1 555 0000" {...register("fromPhone")} />
                    </FormGroup>
                </FormRow>
            </FormSection>

            <FormSection title="To (Client)">
                <FormGroup label="Client Name" htmlFor="toName" required error={errors.toName?.message}>
                    <input id="toName" className="form-input" placeholder="Client Business Name" {...register("toName")} />
                </FormGroup>
                <FormGroup label="Address" htmlFor="toAddress" required error={errors.toAddress?.message}>
                    <textarea id="toAddress" className="form-input form-textarea" rows={2} placeholder="456 Client Ave, City" {...register("toAddress")} />
                </FormGroup>
                <FormRow>
                    <FormGroup label="Email" htmlFor="toEmail" error={errors.toEmail?.message}>
                        <input id="toEmail" className="form-input" placeholder="client@email.com" {...register("toEmail")} />
                    </FormGroup>
                    <FormGroup label="Phone" htmlFor="toPhone">
                        <input id="toPhone" className="form-input" placeholder="+1 555 1111" {...register("toPhone")} />
                    </FormGroup>
                </FormRow>
            </FormSection>

            <FormSection title="Line Items">
                {errors.lineItems && typeof errors.lineItems.message === "string" && (
                    <p className="text-[11px] text-red-500 mb-2">{errors.lineItems.message}</p>
                )}
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="p-3 border border-slate-100 bg-slate-25 rounded-sm"
                        >
                            <FormGroup label={`Item ${index + 1} Description`}>
                                <input className="form-input" placeholder="Service description" {...register(`lineItems.${index}.description`)} />
                            </FormGroup>
                            <div className="grid grid-cols-3 gap-2">
                                <FormGroup label="Qty">
                                    <input type="number" min={1} className="form-input" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
                                </FormGroup>
                                <FormGroup label="Unit Price">
                                    <input type="number" min={0} step={0.01} className="form-input" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                                </FormGroup>
                                <FormGroup label="Total">
                                    <input type="number" className="form-input bg-slate-50" readOnly value={((formData.lineItems?.[index]?.quantity || 0) * (formData.lineItems?.[index]?.unitPrice || 0)).toFixed(2)} />
                                </FormGroup>
                            </div>
                            {fields.length > 1 && (
                                <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 mt-1">
                                    <Trash2 className="w-3 h-3" /> Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0 })} className="btn btn-secondary btn-sm mt-2 w-full">
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
            </FormSection>

            <FormSection title="Totals & Notes">
                <FormRow>
                    <FormGroup label="Tax Rate (%)">
                        <input type="number" min={0} max={100} step={0.1} className="form-input" {...register("taxRate", { valueAsNumber: true })} />
                    </FormGroup>
                    <FormGroup label="Grand Total">
                        <input className="form-input bg-slate-50 font-semibold" readOnly value={`${formData.currency} ${(formData.total || 0).toFixed(2)}`} />
                    </FormGroup>
                </FormRow>
                <FormGroup label="Notes" htmlFor="notes">
                    <textarea id="notes" className="form-input form-textarea" rows={3} placeholder="Additional notes or instructions..." {...register("notes")} />
                </FormGroup>
            </FormSection>
        </div>
    );
}
