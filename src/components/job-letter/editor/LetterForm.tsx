"use client";

import React from 'react';
import { useLetterStore } from '@/store/letter-store';
import { Settings, AlignLeft, User, Building2, AlignJustify } from 'lucide-react';

const FONTS = ['Times New Roman', 'Arial', 'Calibri', 'Helvetica', 'Georgia', 'Verdana'];
const TEMPLATES = [
    { id: 'formal', label: 'Formal Letter' },
    { id: 'handwritten-style', label: 'Handwritten Style' },
    { id: 'pt-application', label: 'PT Application' },
    { id: 'english-cover', label: 'English Cover Letter' },
    { id: 'general', label: 'General Application' },
    { id: 'classic-formal', label: 'Classic Formal' },
    { id: 'modern-letter', label: 'Modern Letter' },
    { id: 'executive-letter', label: 'Executive Letter' }
];

export default function LetterForm() {
    const { 
        template, setTemplate, 
        font, fontSize, setFont,
        margin, setMargin,
        spacing, setSpacing,
        language, setLanguage,
        content, updateContent
    } = useLetterStore();

    const handleMarginChange = (key: keyof typeof margin, value: string) => {
        let val = parseInt(value, 10);
        if (isNaN(val)) val = 10;
        if (val < 10) val = 10;
        if (val > 30) val = 30;
        setMargin({ [key]: val });
    };

    return (
        <div className="space-y-8">
            {/* Tool Panel */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800">Document Settings</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Template</label>
                        <select 
                            value={template} 
                            onChange={(e) => setTemplate(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        >
                            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Language</label>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        >
                            <option value="id">Indonesian</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Font Family</label>
                        <select 
                            value={font} 
                            onChange={(e) => setFont(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        >
                            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Font Size (pt)</label>
                        <input 
                            type="number" 
                            min="8" max="18"
                            value={fontSize}
                            onChange={(e) => setFont(font, parseInt(e.target.value) || 12)}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-600">Margins (mm) [10-30]</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['top', 'bottom', 'left', 'right'].map((m) => (
                            <div key={m}>
                                <div className="text-[10px] text-slate-400 capitalize mb-1">{m}</div>
                                <input 
                                    type="number" 
                                    min="10" max="30"
                                    value={margin[m as keyof typeof margin]}
                                    onChange={(e) => handleMarginChange(m as keyof typeof margin, e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-1.5 border px-2 object-center text-center"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Line Spacing</label>
                        <select 
                            value={spacing.lineSpacing} 
                            onChange={(e) => setSpacing({ lineSpacing: parseFloat(e.target.value) })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        >
                            <option value="1">1.0 (Single)</option>
                            <option value="1.15">1.15</option>
                            <option value="1.5">1.5 (1 1/2)</option>
                            <option value="2">2.0 (Double)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Paragraph Spacing (px)</label>
                        <input 
                            type="number" 
                            min="0" max="40"
                            value={spacing.paragraphSpacing}
                            onChange={(e) => setSpacing({ paragraphSpacing: parseInt(e.target.value) || 0 })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                </div>
            </div>

            {/* Content Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <AlignLeft className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800">Sender & Date</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                        <input 
                            type="text" 
                            value={content.city || ''}
                            onChange={(e) => updateContent({ city: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                        <input 
                            type="text" 
                            value={content.date || ''}
                            onChange={(e) => updateContent({ date: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sender Name</label>
                        <input 
                            type="text" 
                            value={content.signatureName || ''}
                            onChange={(e) => updateContent({ signatureName: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                        <input 
                            type="text" 
                            value={content.phone || ''}
                            onChange={(e) => updateContent({ phone: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={content.email || ''}
                            onChange={(e) => updateContent({ email: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mt-8">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800">Recipient Details</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Recipient Name / Title</label>
                        <input 
                            type="text" 
                            value={content.recipientName || ''}
                            placeholder="e.g. HR Manager / Yth. Bapak/Ibu"
                            onChange={(e) => updateContent({ recipientName: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                        <input 
                            type="text" 
                            value={content.companyName || ''}
                            onChange={(e) => updateContent({ companyName: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Target Position</label>
                        <input 
                            type="text" 
                            value={content.position || ''}
                            placeholder="Used in some templates"
                            onChange={(e) => updateContent({ position: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company Address</label>
                        <textarea 
                            value={content.companyAddress || ''}
                            rows={3}
                            onChange={(e) => updateContent({ companyAddress: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3 resize-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mt-8">
                    <AlignJustify className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800">Letter Body</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Greeting</label>
                        <input 
                            type="text" 
                            value={content.openingGreeting || ''}
                            onChange={(e) => updateContent({ openingGreeting: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Main Body Text</label>
                        <textarea 
                            value={content.bodyText || ''}
                            rows={12}
                            onChange={(e) => updateContent({ bodyText: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3 resize-y min-h-[150px]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Custom Extra Paragraph (Optional)</label>
                        <textarea 
                            value={content.customParagraph || ''}
                            rows={4}
                            onChange={(e) => updateContent({ customParagraph: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3 resize-y"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Text</label>
                        <input 
                            type="text" 
                            value={content.closingText || ''}
                            onChange={(e) => updateContent({ closingText: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Attachments List</label>
                        <textarea 
                            value={content.attachmentsList || ''}
                            rows={4}
                            onChange={(e) => updateContent({ attachmentsList: e.target.value })}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 py-2 border px-3 resize-y"
                            placeholder="1. CV\n2. KTP\n3. Ijazah"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
