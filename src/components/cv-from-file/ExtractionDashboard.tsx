"use client";

import React, { useState, useEffect } from "react";
import { useExtraction, Extraction } from "@/lib/cv-from-file/use-extraction";
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileText, Wand2 } from "lucide-react";
import { parseFileToCV } from "@/lib/cv-from-file/cv-parser";

interface ExtractionDashboardProps {
  onSuccess: (cvData: any) => void;
}

export const ExtractionDashboard: React.FC<ExtractionDashboardProps> = ({ onSuccess }) => {
  const { startExtraction, subscribeToExtraction, loading: uploadLoading } = useExtraction();
  const [currentExtraction, setCurrentExtraction] = useState<Extraction | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Monitor extraction progress
  useEffect(() => {
    if (!currentExtraction || currentExtraction.status === "completed" || currentExtraction.status === "failed") return;

    const unsubscribe = subscribeToExtraction(currentExtraction.id, (updated) => {
      setCurrentExtraction(updated);

      if (updated.status === "completed" && updated.extracted_markdown) {
        // Parse the markdown once completed
        const cvData = parseFileToCV(updated.extracted_markdown, "markdown");
        setTimeout(() => onSuccess(cvData), 1500); // Small delay for visual satisfaction
      }
    });

    return () => unsubscribe();
  }, [currentExtraction?.id, currentExtraction?.status, onSuccess, subscribeToExtraction]);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    const result = await startExtraction(file);
    if (result) setCurrentExtraction(result);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {!currentExtraction ? (
        // --- Upload State ---
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`
            relative group flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300
            ${dragActive ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" : "border-slate-300 hover:border-indigo-400 bg-white shadow-sm"}
          `}
        >
          <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <FileUp className="w-10 h-10 text-indigo-600" />
          </div>
          
          <h3 className="mt-6 text-xl font-semibold text-slate-800">Transform your PDF to CV</h3>
          <p className="mt-2 text-slate-500 text-center max-w-sm">
            Upload your existing PDF. Our AI will extract the content and map it to our premium templates.
          </p>

          <label className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
            Select PDF File
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf" 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
            />
          </label>
          
          <p className="mt-4 text-xs text-slate-400">Max size 20MB • PDF only</p>
        </div>
      ) : (
        // --- Progress/Result State ---
        <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-xl shadow-indigo-50 relative overflow-hidden">
          {/* Background Highlight */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 -mr-8 -mt-8" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-50 rounded-xl">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {currentExtraction.file_path.split("/").pop()?.split("-").slice(1).join("-")}
                </h4>
                <p className="text-sm text-slate-500">Extraction Process</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between">
                <Step 
                  label="Upload" 
                  status="completed" 
                />
                <div className="flex-1 h-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full bg-indigo-500 transition-all duration-1000 ${currentExtraction.status !== 'pending' ? 'w-full' : 'w-1/3'}`} />
                </div>
                <Step 
                  label="Conversion" 
                  status={currentExtraction.status === 'pending' ? 'active' : currentExtraction.status === 'processing' ? 'loading' : currentExtraction.status === 'failed' ? 'error' : 'completed'} 
                />
                <div className="flex-1 h-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full bg-indigo-500 transition-all duration-1000 ${currentExtraction.status === 'completed' ? 'w-full' : 'w-0'}`} />
                </div>
                <Step 
                  label="Mapping" 
                  status={currentExtraction.status === 'completed' ? 'active' : 'idle'} 
                />
              </div>

              {/* Status Message */}
              <div className="p-6 bg-slate-50 rounded-2xl flex items-center justify-center min-h-[120px]">
                {currentExtraction.status === "pending" && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-slate-600 font-medium animate-pulse">Waiting for worker...</p>
                  </div>
                )}
                
                {currentExtraction.status === "processing" && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-6 h-6 text-indigo-500" />
                      <p className="text-slate-800 font-semibold">AI is analyzing your PDF</p>
                    </div>
                    <p className="text-xs text-slate-500 max-w-xs">Using Docling to extract structured text & tables. This usually takes 5-15 seconds.</p>
                  </div>
                )}

                {currentExtraction.status === "completed" && (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <p className="text-emerald-700 font-bold">Extraction Successful!</p>
                    <p className="text-sm text-slate-500">Redirecting to editor...</p>
                  </div>
                )}

                {currentExtraction.status === "failed" && (
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <p className="text-rose-700 font-bold">Oops! Something went wrong</p>
                    <p className="text-xs text-rose-500 text-center max-w-sm">{currentExtraction.error_message}</p>
                    <button 
                      onClick={() => setCurrentExtraction(null)}
                      className="mt-2 text-sm text-indigo-600 font-medium hover:underline"
                    >
                      Try again with another file
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Step = ({ label, status }: { label: string, status: 'idle' | 'active' | 'loading' | 'completed' | 'error' }) => {
  const icons = {
    idle: <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />,
    active: <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />,
    loading: <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />,
    completed: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-5 flex items-center justify-center">
        {icons[status]}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${status === 'idle' ? 'text-slate-300' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
  )
}
