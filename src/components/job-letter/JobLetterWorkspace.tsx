"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLetterStore } from '@/store/letter-store';
import LetterForm from './editor/LetterForm';
import LetterLayout from './preview/LetterLayout';
import { Download, Trash2, Save, ChevronDown, FileText, FileType } from 'lucide-react';

export default function JobLetterWorkspace() {
    const { content, resetTemplate } = useLetterStore();
    const [editorWidth, setEditorWidth] = useState(45); // percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [saveIndicator, setSaveIndicator] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleDownloadPDF = () => {
        setShowDownloadMenu(false);
        window.print();
    };

    const handleDownloadWord = () => {
        setShowDownloadMenu(false);
        
        // Use React Dom Server to render exactly the same if possible
        // But since we are on client, we can grab the HTML from the DOM
        const letterNode = document.getElementById('letter-content-wrapper');
        if (!letterNode) return;

        const bodyHtml = letterNode.innerHTML;
        const font = useLetterStore.getState().font;
        const pageMargin = '0cm'; // Margins are controlled by padding in the container itself
        
        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>Job Application Letter</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page { size: A4; margin: 0; mso-header-margin: 0cm; mso-footer-margin: 0cm; mso-page-top-margin: 0cm; mso-page-margin-top: 0cm; }
        html, body { height: 100%; min-height: 100%; font-family: '${font}', 'Inter', 'Times New Roman', serif; margin: 0; padding: 0; color: #000; }
        p, div { margin: 0; padding: 0; }
    </style>
</head>
<body>
    ${bodyHtml}
</body>
</html>`;

        const blob = new Blob(['\\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Application_Letter.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Topbar/Toolbar */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-20 print:hidden shrink-0">
                <div className="flex items-center gap-3">
                    <div className="text-lg font-black text-slate-900 tracking-wide">
                        Job Application Letter Generator
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={resetTemplate}
                        className="btn btn-secondary text-rose-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 border-slate-200">
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear All
                    </button>

                    <div className="relative" ref={downloadMenuRef}>
                        <div className="flex">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-l-lg text-white font-semibold transition-colors"
                                style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Download PDF</span>
                                <span className="sm:hidden">PDF</span>
                            </button>
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="flex items-center px-2 py-1.5 rounded-r-lg text-white font-semibold transition-colors border-l border-white/30"
                                style={{ background: 'linear-gradient(135deg, #334155, #475569)' }}>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">Download PDF</div>
                                        <div className="text-xs text-slate-400">Exact layout match</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleDownloadWord}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FileType className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">Download Word</div>
                                        <div className="text-xs text-slate-400">Editable .doc file</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
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
                        <LetterForm />
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
                    id="letter-preview-panel"
                >
                    <div className="w-fit mx-auto p-6 print:p-0" id="letter-content-wrapper">
                        <LetterLayout />
                    </div>
                </div>
            </div>

            {/* Print CSS specific to Letter layout */}
            <style>{`
                @media print {
                    #sidebar, header.app-header { display: none !important; }
                    main, .split-pane-container { padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important;}
                    body * { visibility: hidden; }
                    html, body, #root, #__next { height: auto !important; overflow: visible !important; }
                    
                    #letter-preview-panel, #letter-preview-panel * { visibility: visible !important; }
                    
                    #letter-preview-panel {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 99999 !important;
                    }
                    
                    @page { size: A4; margin: 0; }
                    
                    .letter-paper {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        transform: none !important;
                        margin: 0 !important;
                        page-break-after: auto;
                    }
                    
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
}
