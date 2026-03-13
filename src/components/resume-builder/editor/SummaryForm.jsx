import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const SummaryForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const { summary, personalInfo } = resumeData || {};
    const [generating, setGenerating] = useState(false);

    const handleChange = (e) => {
        updateResumeData({ summary: e.target.value });
    };

    const handleAIGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            const jobTitle = personalInfo?.jobTitle || 'Professional';
            const suggestion = `Motivated ${jobTitle} with proven experience in delivering high-quality results. Skilled in problem-solving and collaboration, with a strong focus on efficiency and innovation. Committed to continuous learning and contributing to team success.`;
            updateResumeData({ summary: suggestion });
            setGenerating(false);
        }, 1000);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Professional Summary</h3>
                <button onClick={handleAIGenerate} disabled={generating} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {generating ? 'Generating...' : 'AI Suggest'}
                </button>
            </div>
            <p className="text-sm text-slate-500">Include 2-3 clear sentences about your overall experience.</p>
            <textarea
                className="form-input form-textarea min-h-[150px]"
                placeholder="e.g. Passionate Software Engineer with 5+ years of experience..."
                value={summary || ''}
                onChange={handleChange}
            />
        </div>
    );
};

export default SummaryForm;
