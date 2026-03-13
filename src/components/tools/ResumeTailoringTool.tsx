"use client";

import React, { useState } from 'react';
import { Target, Sparkles, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
    tech: ['agile', 'scrum', 'leadership', 'collaboration', 'problem-solving', 'analytical', 'communication', 'innovation', 'cloud', 'api', 'ci/cd', 'data-driven'],
    finance: ['financial analysis', 'budgeting', 'forecasting', 'risk management', 'compliance', 'reporting', 'stakeholder management', 'strategic planning'],
    marketing: ['brand management', 'seo', 'content strategy', 'campaign management', 'analytics', 'roi', 'crm', 'social media', 'lead generation'],
    hr: ['talent acquisition', 'employee engagement', 'performance management', 'hris', 'onboarding', 'training & development', 'organizational development'],
    engineering: ['project management', 'technical design', 'cross-functional', 'quality assurance', 'process improvement', 'lean', 'six sigma'],
};

interface Suggestion {
    type: 'success' | 'warning' | 'error';
    title: string;
    desc: string;
}

interface AnalysisResult {
    score: number;
    missingInResume: string[];
    alreadyPresent: string[];
    foundInJD: string[];
    suggestions: Suggestion[];
}

export default function ResumeTailoringTool() {
    const [resumeData, setResumeData] = useState('');
    const [jobDesc, setJobDesc] = useState('');
    const [industry, setIndustry] = useState('tech');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedTip, setExpandedTip] = useState<number | null>(null);

    const analyzeJobDesc = () => {
        setLoading(true);
        setTimeout(() => {
            const industryKws = KEYWORDS_BY_INDUSTRY[industry] || KEYWORDS_BY_INDUSTRY.tech;

            // Find keywords present in job desc but maybe missing from resume
            const resumeText = resumeData.toLowerCase();
            const foundInJD = industryKws.filter(kw => jobDesc.toLowerCase().includes(kw));
            const missingInResume = foundInJD.filter(kw => !resumeText.includes(kw));
            const alreadyPresent = foundInJD.filter(kw => resumeText.includes(kw));

            // Generate synthetic score based on textual matching
            const score = Math.min(100, Math.round(
                (alreadyPresent.length / Math.max(foundInJD.length, 1)) * 60 +
                (resumeText.length > 500 ? 20 : 0) +
                (resumeText.length > 1000 ? 20 : 0)
            ));

            // Generate suggestions
            const suggestions: Suggestion[] = [];
            if (resumeText.length < 300) {
                suggestions.push({
                    type: 'warning',
                    title: 'Resume Terlalu Singkat',
                    desc: 'Resume Anda terlihat sangat pendek. Pastikan Anda sudah menambahkan summary, pengalaman, dan skill yang relevan.'
                });
            }
            if (missingInResume.length > 0) {
                suggestions.push({
                    type: 'error',
                    title: 'Keyword Penting Belum Ada di Resume',
                    desc: `Kata-kata kunci berikut ada di job description tapi belum terdeteksi di resume Anda: ${missingInResume.slice(0, 5).join(', ')}. Pertimbangkan untuk menambahkannya secara natural.`
                });
            }
            if (alreadyPresent.length > 0) {
                suggestions.push({
                    type: 'success',
                    title: 'Keyword yang Sudah Cocok',
                    desc: `Bagus! Keyword ini sudah ada di resume Anda: ${alreadyPresent.slice(0, 5).join(', ')}.`
                });
            }

            setResult({ score, missingInResume, alreadyPresent, foundInJD, suggestions });
            setLoading(false);
        }, 1500);
    };

    const scoreColor = result
        ? result.score >= 75 ? '#16a34a' : result.score >= 50 ? '#d97706' : '#dc2626'
        : '#6b7280';

    const scoreLabel = result
        ? result.score >= 75 ? 'Great Match!' : result.score >= 50 ? 'Moderate Match' : 'Low Match'
        : '';

    return (
        <div className="min-h-full w-full bg-slate-50 overflow-y-auto">
            {/* Hero */}
            <div className="bg-white px-8 py-8 border-b border-slate-200">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-3 text-slate-900">
                        <div className="p-2 rounded-sm bg-navy-50">
                            <Target className="w-5 h-5 text-navy-800" />
                        </div>
                        <h1 className="text-xl font-bold uppercase tracking-wide text-navy-950">Resume Tailoring</h1>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                        Analisis kecocokan resume Anda dengan deskripsi pekerjaan. Dapatkan skor ATS dan saran keyword yang harus ditambahkan untuk meningkatkan peluang lolos seleksi.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
                {/* Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-navy-50 text-navy-800 border border-navy-100 rounded-sm text-xs font-bold">1</span>
                            Content Resume
                        </h2>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Paste Content Resume Anda <span className="text-red-500">*</span></label>
                        <textarea
                            value={resumeData}
                            onChange={e => setResumeData(e.target.value)}
                            placeholder="Paste teks seluruh resume Anda di sini..."
                            rows={10}
                            className="w-full form-input resize-none font-mono text-xs"
                        />
                        <div className="text-xs text-slate-400 mt-1">{resumeData.length} karakter</div>
                    </div>

                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-navy-50 text-navy-800 border border-navy-100 rounded-sm text-xs font-bold">2</span>
                            Target Pekerjaan
                        </h2>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Industri / Bidang Pekerjaan</label>
                            <select
                                value={industry}
                                onChange={e => setIndustry(e.target.value)}
                                className="w-full form-input form-select text-slate-700"
                            >
                                <option value="tech">Technology / IT</option>
                                <option value="finance">Finance / Accounting</option>
                                <option value="marketing">Marketing / Digital</option>
                                <option value="hr">Human Resources</option>
                                <option value="engineering">Engineering</option>
                            </select>
                        </div>
                        <div className="mb-2 flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                Paste Job Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={jobDesc}
                                onChange={e => setJobDesc(e.target.value)}
                                placeholder="Paste deskripsi pekerjaan di sini..."
                                rows={6}
                                className="w-full form-input resize-none text-xs"
                            />
                            <div className="text-xs text-slate-400 mt-1">{jobDesc.length} karakter</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-2 mb-8">
                    <button
                        onClick={analyzeJobDesc}
                        disabled={!jobDesc.trim() || !resumeData.trim() || loading}
                        className="py-3 px-8 rounded-sm font-bold uppercase tracking-wider text-xs text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:bg-slate-800 bg-slate-700 shadow-sm"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                                Menganalisis...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Analisis Resume Sekarang
                            </>
                        )}
                    </button>
                </div>

                {/* Result Section */}
                {result && (
                    <div className="space-y-6">
                        {/* Score Card */}
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative w-28 h-28 flex-shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="8"
                                        strokeDasharray={`${result.score * 2.51} 251`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{result.score}</span>
                                    <span className="text-xs text-slate-400">/ 100</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">Tingkat Kecocokan</div>
                                <div className="text-3xl font-bold mb-2" style={{ color: scoreColor }}>{scoreLabel}</div>
                                <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
                                    <span className="font-bold text-slate-800">{result.alreadyPresent.length}</span> dari <span className="font-bold text-slate-800">{result.foundInJD.length}</span> keyword kunci sudah ada di resume Anda.
                                    {result.missingInResume.length > 0 && ` Ada ${result.missingInResume.length} keyword yang disarankan untuk ditambahkan agar lebih ATS-friendly.`}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Suggestions */}
                            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    Saran Perbaikan
                                </h2>
                                <div className="space-y-3">
                                    {result.suggestions.map((tip, i) => {
                                        const colors = {
                                            success: { bg: '#f8fafc', border: '#cbd5e1', icon: '✅', text: '#334155' },
                                            warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠️', text: '#92400e' },
                                            error: { bg: '#fef2f2', border: '#fecaca', icon: '❌', text: '#991b1b' },
                                        };
                                        const c = colors[tip.type] || colors.warning;
                                        return (
                                            <div key={i} className="rounded-sm p-4 cursor-pointer transition-colors"
                                                style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
                                                onClick={() => setExpandedTip(expandedTip === i ? null : i)}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-semibold text-sm flex items-start gap-2" style={{ color: c.text }}>
                                                        <span className="mt-0.5">{c.icon}</span> <span>{tip.title}</span>
                                                    </span>
                                                    {expandedTip === i ? <ChevronUp className="w-4 h-4 shrink-0 ml-2" style={{ color: c.text }} /> : <ChevronDown className="w-4 h-4 shrink-0 ml-2" style={{ color: c.text }} />}
                                                </div>
                                                {expandedTip === i && (
                                                    <p className="text-sm mt-3 border-t pt-3" style={{ color: c.text, borderColor: c.border }}>{tip.desc}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Missing Keywords */}
                            {result.missingInResume.length > 0 && (
                                <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6">
                                    <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-red-500" />
                                        Keyword Yang Harus Ditambahkan
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missingInResume.map((kw, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-sm">
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium"><span className="text-amber-600 font-bold mr-1">💡 TIP:</span> Tambahkan keyword ini secara natural di bagian summary, experience, atau skills pada resume Anda. Hindari keyword stuffing secara massal tanpa konteks.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
