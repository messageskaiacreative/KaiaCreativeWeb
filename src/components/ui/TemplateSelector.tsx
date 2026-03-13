"use client";

import { useAppStore } from "@/store/app-store";
import type { TemplateOption } from "@/types/documents";
import { Lock, Check } from "lucide-react";

interface TemplateSelectorProps {
    templates: TemplateOption[];
    selected: string;
    onSelect: (id: string) => void;
}

export default function TemplateSelector({
    templates,
    selected,
    onSelect,
}: TemplateSelectorProps) {
    const userTier = useAppStore((s) => s.getUserTier());

    return (
        <div className="mb-4">
            <label className="form-label">Template</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
                {templates.map((tpl) => {
                    const isLocked = tpl.tier === "premium" && userTier === "free";
                    const isSelected = selected === tpl.id;

                    return (
                        <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                                if (isLocked) {
                                    useAppStore
                                        .getState()
                                        .showToast("Upgrade to Premium for this template", "error");
                                    return;
                                }
                                onSelect(tpl.id);
                            }}
                            className={`relative flex flex-col items-center gap-1 p-2.5 border rounded-sm text-center transition-all duration-150 ${isSelected
                                    ? "border-navy-600 bg-navy-50"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            title={tpl.description}
                        >
                            {isSelected && (
                                <div className="absolute top-1 right-1">
                                    <Check className="w-3 h-3 text-navy-600" />
                                </div>
                            )}
                            {isLocked && (
                                <Lock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                            )}
                            <span
                                className={`text-[11px] font-semibold ${isSelected ? "text-navy-800" : "text-slate-600"
                                    }`}
                            >
                                {tpl.label}
                            </span>
                            {tpl.tier === "premium" && (
                                <span className="tier-badge tier-badge-premium text-[8px]">
                                    Pro
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
