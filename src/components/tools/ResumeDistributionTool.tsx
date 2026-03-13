"use client";

import React, { useState } from 'react';
import { Send, Copy, Check, Mail, Globe, FileText, Building2, Linkedin, Briefcase, Target, Zap, Search, X } from 'lucide-react';

const PLATFORMS = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077B5', desc: 'Kirim langsung via LinkedIn Easy Apply' },
    { id: 'jobstreet', name: 'JobStreet', icon: Briefcase, color: '#e60028', desc: 'Platform lowongan terbesar di Asia Tenggara' },
    { id: 'kalibrr', name: 'Kalibrr', icon: Target, color: '#4F46E5', desc: 'Smart job matching platform' },
    { id: 'glints', name: 'Glints', icon: Zap, color: '#FF6B2B', desc: 'Platform karir untuk fresh graduate & profesional' },
    { id: 'indeed', name: 'Indeed', icon: Search, color: '#003A9B', desc: 'Job search engine terbesar di dunia' },
    { id: 'email', name: 'Email Langsung', icon: Mail, color: '#6B7280', desc: 'Kirim resume langsung ke HR/recruiter' },
];

const CHECKLIST = [
    { id: 'photo', label: 'Foto profil professional (opsional)' },
    { id: 'format', label: 'Format PDF sudah siap (bukan DOC/DOCX)' },
    { id: 'size', label: 'Ukuran file < 2MB' },
    { id: 'filename', label: 'Nama file menggunakan format: NamaAnda_Resume.pdf' },
    { id: 'contact', label: 'Email dan nomor telepon aktif tercantum' },
    { id: 'linkedin_url', label: 'URL LinkedIn di-custom (linkedin.com/in/nama-anda)' },
    { id: 'ats', label: 'Resume sudah dioptimasi untuk ATS (no table/chart)' },
    { id: 'proofreading', label: 'Sudah proofreading & tidak ada typo' },
];

interface ApplicationData {
    id: number;
    company: string;
    role: string;
    platform: string;
    date: string;
    status: string;
}

export default function ResumeDistributionTool() {
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [trackingData, setTrackingData] = useState<ApplicationData[]>([]);
    const [showAddApplication, setShowAddApplication] = useState(false);

    // Application Info (since we don't use ResumeBuilder context)
    const [applicantName, setApplicantName] = useState('');
    const [applicantTitle, setApplicantTitle] = useState('');
    const [applicantEmail, setApplicantEmail] = useState('');
    const [applicantPhone, setApplicantPhone] = useState('');

    const [newApp, setNewApp] = useState({ company: '', role: '', platform: '', date: '', status: 'Applied' });
    const [copied, setCopied] = useState(false);

    const toggleCheck = (id: string) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
    const togglePlatform = (id: string) => setSelectedPlatforms(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );

    const checkedCount = Object.values(checklist).filter(Boolean).length;

    const addApplication = () => {
        if (!newApp.company || !newApp.role) return;
        setTrackingData(prev => [...prev, { ...newApp, id: Date.now() }]);
        setNewApp({ company: '', role: '', platform: '', date: '', status: 'Applied' });
        setShowAddApplication(false);
    };

    const emailSubject = `Lamaran: ${applicantTitle || 'Posisi yang Tersedia'} – ${applicantName || 'Nama Anda'}`;
    const emailBody = `Kepada Yth. Tim Rekrutmen,

Nama saya ${applicantName || '[Nama Anda]'}, dan saya sangat tertarik untuk bergabung di perusahaan Anda sebagai ${applicantTitle || '[Posisi yang Dilamar]'}.

Terlampir saya kirimkan resume saya untuk pertimbangan Anda. Saya percaya pengalaman dan kemampuan saya dapat memberikan kontribusi yang berarti bagi tim Anda.

Terima kasih atas waktu dan perhatian Bapak/Ibu. Saya berharap dapat berdiskusi lebih lanjut.

Hormat saya,
${applicantName || '[Nama Anda]'}
${applicantEmail || '[Email Anda]'}
${applicantPhone || '[Nomor Telepon]'}`;

    const copyEmail = () => {
        navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusColors: Record<string, string> = {
        Applied: '#64748b', Interview: '#475569', Offer: '#0f172a', Rejected: '#94a3b8', Pending: '#cbd5e1'
    };

    return (
        <div className="min-h-full w-full bg-slate-50 overflow-y-auto">
            {/* Hero */}
            <div className="bg-white px-8 py-8 border-b border-slate-200">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-3 text-slate-900">
                        <div className="p-2 rounded-sm bg-navy-50">
                            <Send className="w-6 h-6 text-navy-800" />
                        </div>
                        <h1 className="text-xl font-bold uppercase tracking-wide text-navy-950">Resume Distribution</h1>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                        Kelola proses pengiriman resume ke berbagai platform lowongan kerja. Hubungkan info pelamar, siapkan email otomatis, dan lacak aplikasi kerja Anda dengan rapi.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Applicant Profile Form - Needed to customize the Email Template */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-navy-50 text-navy-800 border border-navy-100 rounded-sm text-xs font-bold">1</span>
                            Data Pelamar
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Lengkap</label>
                                <input value={applicantName} onChange={e => setApplicantName(e.target.value)} placeholder="Contoh: Aldi Firmansyah" className="w-full form-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Posisi Lamaran</label>
                                <input value={applicantTitle} onChange={e => setApplicantTitle(e.target.value)} placeholder="Contoh: Frontend Developer" className="w-full form-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</label>
                                <input value={applicantEmail} onChange={e => setApplicantEmail(e.target.value)} placeholder="Contoh: aldi@email.com" className="w-full form-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Telepon</label>
                                <input value={applicantPhone} onChange={e => setApplicantPhone(e.target.value)} placeholder="Contoh: 0812345678" className="w-full form-input" />
                            </div>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 flex items-center gap-2">
                                <span className="w-5 h-5 flex items-center justify-center bg-navy-50 text-navy-800 border border-navy-100 rounded-sm text-xs font-bold">2</span>
                                Checklist
                            </h2>
                            <span className="text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider"
                                style={{ backgroundColor: checkedCount === CHECKLIST.length ? '#f1f5f9' : '#f8fafc', color: checkedCount === CHECKLIST.length ? '#1e293b' : '#64748b', border: checkedCount === CHECKLIST.length ? '1px solid #cbd5e1' : '1px solid transparent' }}>
                                {checkedCount}/{CHECKLIST.length} SIAP
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 mb-5 overflow-hidden rounded-none border border-slate-200">
                            <div className="h-full transition-all duration-500 bg-navy-800"
                                style={{ width: `${(checkedCount / CHECKLIST.length) * 100}%` }} />
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {CHECKLIST.map(item => (
                                <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 mt-0.5 rounded-sm border flex items-center justify-center transition-all flex-shrink-0 ${checklist[item.id] ? 'bg-navy-800 border-navy-800' : 'border-slate-300 group-hover:border-navy-400 bg-slate-50'}`}
                                        onClick={() => toggleCheck(item.id)}>
                                        {checklist[item.id] && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-sm leading-snug ${checklist[item.id] ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Platform Cards & Timeline/Tracker */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Platform */}
                    <div className="lg:col-span-1 bg-white rounded-sm border border-slate-200 shadow-sm p-6">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 mb-2 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-slate-500" />
                            Platform Target
                        </h2>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Pilih tempat Anda ingin melamar kerja.</p>
                        <div className="space-y-3">
                            {PLATFORMS.map(p => (
                                <div key={p.id}
                                    onClick={() => togglePlatform(p.id)}
                                    className={`rounded-sm p-3 cursor-pointer border transition-all flex items-center gap-3 ${selectedPlatforms.includes(p.id) ? 'border-navy-800 bg-navy-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                    <div className="bg-slate-50 w-10 h-10 rounded-sm border border-slate-200 flex items-center justify-center shrink-0">
                                        <p.icon className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 leading-none mb-1">{p.name}</div>
                                        {selectedPlatforms.includes(p.id) ? (
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-navy-800">Dipilih</div>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 leading-tight">{p.desc}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        {/* Application Tracker */}
                        <div className="bg-white flex-1 rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-slate-500" />
                                    Lacak Lamaran
                                </h2>
                                <button onClick={() => setShowAddApplication(!showAddApplication)}
                                    className="btn btn-primary btn-sm rounded-sm">
                                    + Tambah
                                </button>
                            </div>

                            {showAddApplication && (
                                <div className="bg-slate-50 rounded-sm p-4 mb-4 border border-slate-200 relative">
                                    <button onClick={() => setShowAddApplication(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Form Lamaran Baru</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input placeholder="Nama Perusahaan *" value={newApp.company} onChange={e => setNewApp(p => ({ ...p, company: e.target.value }))}
                                            className="form-input" />
                                        <input placeholder="Posisi yang Dilamar *" value={newApp.role} onChange={e => setNewApp(p => ({ ...p, role: e.target.value }))}
                                            className="form-input" />
                                        <select value={newApp.platform} onChange={e => setNewApp(p => ({ ...p, platform: e.target.value }))}
                                            className="form-input form-select text-slate-700">
                                            <option value="">Pilih Platform (Opsional)</option>
                                            {PLATFORMS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select>
                                        <input type="date" value={newApp.date} onChange={e => setNewApp(p => ({ ...p, date: e.target.value }))}
                                            className="form-input text-slate-700" />
                                        <select value={newApp.status} onChange={e => setNewApp(p => ({ ...p, status: e.target.value }))}
                                            className="col-span-2 form-input form-select font-medium">
                                            {Object.keys(statusColors).map(s => <option key={s} value={s}>{s} Status Phase</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={addApplication} className="btn btn-primary w-full justify-center">Simpan Lamaran Track</button>
                                    </div>
                                </div>
                            )}

                            {trackingData.length === 0 ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center flex-1 border border-dashed border-slate-300 rounded-sm bg-slate-50">
                                    <div className="w-16 h-16 bg-slate-100 rounded-sm flex items-center justify-center mb-3">
                                        <FileText className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600">Belum ada catatan lamaran.</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">Klik "+ Tambah" untuk mencatat.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto max-h-[300px] flex-1 custom-scrollbar pr-2">
                                    {trackingData.map((app, i) => (
                                        <div key={app.id} className="flex items-center gap-4 bg-white border border-slate-200 shadow-sm rounded-sm px-4 py-3 group hover:border-slate-300 transition-colors">
                                            <div className="text-xs font-bold text-slate-400 w-4 text-center">{i + 1}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm text-slate-800 leading-tight">{app.company}</div>
                                                <div className="text-[11px] font-medium text-slate-500 mt-0.5">{app.role} {app.platform ? `· via ${app.platform}` : ''} {app.date ? `· ${app.date}` : ''}</div>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-sm"
                                                style={{ backgroundColor: `${statusColors[app.status]}15`, color: statusColors[app.status] }}>
                                                {app.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Email Template */}
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 opacity-50" />
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-slate-500" />
                                    Email Template
                                </h2>
                                <button onClick={copyEmail}
                                    className={`btn btn-sm rounded-sm ${copied ? 'btn-primary bg-emerald-600 border-emerald-600 text-white' : 'btn-secondary text-slate-700'}`}>
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Disalin' : 'Copy Email'}
                                </button>
                            </div>
                            <div className="bg-slate-50/80 rounded-sm p-5 text-sm text-slate-700 font-mono leading-relaxed border border-slate-200">
                                <div className="mb-3 text-xs font-sans font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Subject</span>
                                    {emailSubject}
                                </div>
                                <div className="border-t border-slate-200 pt-3 whitespace-pre-line text-[13px] text-slate-600">{emailBody}</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}


