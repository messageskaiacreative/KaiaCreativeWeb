"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeProvider, useResume } from '../context/ResumeContext';
import FormEditor from './editor/FormEditor';
import ResumePreview from './preview/ResumePreview';
import { Download, Trash2, Save } from 'lucide-react';

const ResumeBuilderContent = () => {
    const { resumeData, loading, resetResume } = useResume();
    const [editorWidth, setEditorWidth] = useState(45); // percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [saveIndicator, setSaveIndicator] = useState(false);

    // Show save indicator when data changes
    useEffect(() => {
        if (resumeData && !loading) {
            setSaveIndicator(true);
            const timer = setTimeout(() => setSaveIndicator(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [resumeData, loading]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setEditorWidth(Math.max(20, Math.min(70, newWidth)));
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-slate-500">Loading CV Builder...</div>
            </div>
        </div>
    );

    if (!resumeData) return <div className="p-10 text-center">Initializing...</div>;

    const handleDownload = () => { window.print(); };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Topbar/Toolbar */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-20 print:hidden shrink-0">
                <div className="flex items-center gap-3">
                    <div className="text-lg font-black text-slate-900 tracking-wide">
                        {resumeData.personalInfo?.firstName
                            ? `${resumeData.personalInfo.firstName}'s CV`
                            : 'My CV'}
                    </div>
                    {saveIndicator && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
                            <Save className="w-3 h-3" />
                            Saved
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={resetResume}
                        className="btn btn-secondary text-rose-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 border-slate-200">
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear All
                    </button>
                    <button
                        onClick={handleDownload}
                        className="btn btn-primary shadow-sm">
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                    </button>
                </div>
            </header>

            {/* Split Pane Area */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
                {/* Form Editor */}
                <div
                    className="overflow-y-auto bg-white border-r border-slate-200 shadow-inner z-0 shrink-0 print:hidden custom-scrollbar"
                    style={{ width: `${editorWidth}%` }}
                >
                    <div className="p-6">
                        <FormEditor />
                    </div>
                </div>

                {/* Drag Handle */}
                <div
                    className="w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-all flex items-center justify-center z-10 print:hidden shrink-0 group"
                    onMouseDown={handleMouseDown}
                    style={{ backgroundColor: isDragging ? '#6366f1' : undefined }}
                >
                    <div className="flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-0.5 h-1 bg-slate-500 rounded-full" />
                        <div className="w-0.5 h-1 bg-slate-500 rounded-full" />
                        <div className="w-0.5 h-1 bg-slate-500 rounded-full" />
                    </div>
                </div>

                {/* Preview Panel */}
                <div
                    className="bg-slate-100 overflow-y-auto overflow-x-auto flex-1 min-w-0 print:overflow-visible custom-scrollbar"
                    id="resume-preview-panel"
                >
                    <div className="w-fit mx-auto p-6 print:p-0">
                        <ResumePreview />
                    </div>
                </div>
            </div>

            {/* Print CSS specific to resume builder */}
            <style>{`
                @media print {
                    /* Hide Sidebar and Header of AppShell via targeting ids/classes */
                    #sidebar, header.app-header { display: none !important; }
                    /* Make main content stretch */
                    main, .split-pane-container { padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important;}
                    
                    /* Everything behaves */
                    body * { visibility: hidden; }
                    html, body, #root, #__next { height: auto !important; overflow: visible !important; }
                    
                    #resume-preview-panel, #resume-preview-panel * { visibility: visible !important; }
                    
                    #resume-preview-panel {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 99999 !important;
                    }
                    
                    @page { size: A4; margin: 15mm 0; }
                    
                    .resume-paper {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        transform: none !important;
                        margin: 0 !important;
                        page-break-after: auto;
                    }
                    
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    div, section, p, li, article, .flex { page-break-inside: auto !important; break-inside: auto !important; }
                    h1, h2, h3, h4, h5, h6 { page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: avoid !important; break-after: avoid !important; }
                }
            `}</style>
        </div>
    );
};

export default function ResumeBuilderWorkspace() {
    return (
        <ResumeProvider>
            <ResumeBuilderContent />
        </ResumeProvider>
    );
}
