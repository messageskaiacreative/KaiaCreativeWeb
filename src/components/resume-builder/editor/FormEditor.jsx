import React, { useState } from 'react';
import PersonalDetailsForm from './PersonalDetailsForm';
import ExperienceForm from './ExperienceForm';
import EducationForm from './EducationForm';
import SkillsForm from './SkillsForm';
import SummaryForm from './SummaryForm';
import OrganizationForm from './OrganizationForm';
import LanguageForm from './LanguageForm';
import CourseForm from './CourseForm';
import ReferenceForm from './ReferenceForm';
import CertificationForm from './CertificationForm';
import { User, Briefcase, GraduationCap, PenTool, FileText, Award } from 'lucide-react';

const FormEditor = () => {
    const [activeSection, setActiveSection] = useState('personal');

    const sections = [
        { id: 'personal', label: 'Personal Details', icon: User, component: PersonalDetailsForm },
        { id: 'summary', label: 'Professional Summary', icon: FileText, component: SummaryForm },
        { id: 'experience', label: 'Employment History', icon: Briefcase, component: ExperienceForm },
        { id: 'education', label: 'Education', icon: GraduationCap, component: EducationForm },
        { id: 'skills', label: 'Skills', icon: PenTool, component: SkillsForm },
        { id: 'organizations', label: 'Organizations', icon: User, component: OrganizationForm },
        { id: 'languages', label: 'Languages', icon: FileText, component: LanguageForm },
        { id: 'courses', label: 'Courses', icon: GraduationCap, component: CourseForm },
        { id: 'certifications', label: 'Certifications', icon: Award, component: CertificationForm },
        { id: 'references', label: 'References', icon: User, component: ReferenceForm },
    ];

    const ActiveComponent = sections.find(s => s.id === activeSection)?.component || PersonalDetailsForm;

    return (
        <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 mb-4 border-b-2 border-slate-200 pb-2">
                CV Editor
            </h2>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-3 custom-scrollbar">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap ${isActive
                                ? 'bg-navy-800 text-white border-navy-800'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5 mr-1.5" />
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {/* Active Form Content */}
            <div className="animate-fadeIn">
                <ActiveComponent />
            </div>
        </div>
    );
};

export default FormEditor;