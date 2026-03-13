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
import CustomSectionForm from './CustomSectionForm';
import { useResume } from '../../context/ResumeContext';
import { User, Briefcase, GraduationCap, PenTool, FileText, Award, Plus, FolderPlus, X } from 'lucide-react';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const FormEditor = () => {
    const { resumeData, updateResumeData } = useResume();
    const customSections = Array.isArray(resumeData?.customSections) ? resumeData.customSections : [];

    const [activeSection, setActiveSection] = useState('personal');
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionType, setNewSectionType] = useState('experience_like');
    const [newSectionName, setNewSectionName] = useState('My Custom Section');

    const coreSections = [
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

    const dynamicSections = customSections.map(cs => ({
        id: cs.id,
        label: cs.name || 'Custom Section',
        icon: FolderPlus,
        custom: true
    }));

    const handleAddCustomSection = (e) => {
        e.preventDefault();
        const newSection = {
            id: 'custom-' + generateId(),
            name: newSectionName,
            type: newSectionType,
            items: [],
            description: ''
        };
        const newCustomSections = [...customSections, newSection];
        // Add id to sectionOrder
        const updatedSectionOrder = [...(resumeData.sectionOrder || [])];
        if (!updatedSectionOrder.includes(newSection.id)) {
            updatedSectionOrder.push(newSection.id);
        }

        updateResumeData({
            customSections: newCustomSections,
            sectionOrder: updatedSectionOrder
        });

        setActiveSection(newSection.id);
        setShowAddSection(false);
        setNewSectionName('My Custom Section');
    };

    const renderActiveComponent = () => {
        const coreSection = coreSections.find(s => s.id === activeSection);
        if (coreSection) {
            const ActiveComponent = coreSection.component;
            return <ActiveComponent />;
        }

        const customSection = dynamicSections.find(s => s.id === activeSection);
        if (customSection) {
            return <CustomSectionForm sectionId={customSection.id} />;
        }

        return <PersonalDetailsForm />;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 mb-4 border-b-2 border-slate-200 pb-2">
                CV Editor
            </h2>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-3 custom-scrollbar">
                {coreSections.map((section) => {
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

                {dynamicSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap ${activeSection === section.id
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'bg-white text-slate-800 border-purple-300 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-400'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                            {section.label}
                        </button>
                    );
                })}

                <div className="relative">
                    <button
                        onClick={() => setShowAddSection(!showAddSection)}
                        className="flex items-center px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap text-blue-600 border border-dashed border-blue-300 hover:bg-blue-50"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Section
                    </button>

                    {showAddSection && (
                        <div className="absolute top-12 right-0 bg-white border border-slate-200 shadow-xl rounded-lg p-4 w-[320px] z-50">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-slate-800">New Custom Section</h3>
                                <button onClick={() => setShowAddSection(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleAddCustomSection} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1">Section Name</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1">Layout Type</label>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded hover:bg-slate-50 border border-slate-100">
                                            <input type="radio" className="mt-1" name="sectionType" value="experience_like" checked={newSectionType === 'experience_like'} onChange={(e) => setNewSectionType(e.target.value)} />
                                            <div>
                                                <div className="font-medium text-slate-800">Experience / Education</div>
                                                <div className="text-xs text-slate-500">Includes Title, Subtitle, Date, City, and Description</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded hover:bg-slate-50 border border-slate-100">
                                            <input type="radio" className="mt-1" name="sectionType" value="skill_like" checked={newSectionType === 'skill_like'} onChange={(e) => setNewSectionType(e.target.value)} />
                                            <div>
                                                <div className="font-medium text-slate-800">Simple List / Skills</div>
                                                <div className="text-xs text-slate-500">Includes Name and supplementary text</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded hover:bg-slate-50 border border-slate-100">
                                            <input type="radio" className="mt-1" name="sectionType" value="paragraph_like" checked={newSectionType === 'paragraph_like'} onChange={(e) => setNewSectionType(e.target.value)} />
                                            <div>
                                                <div className="font-medium text-slate-800">Rich Text Paragraph</div>
                                                <div className="text-xs text-slate-500">Single rich text editor for a freeform paragraph</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-navy-700 hover:bg-navy-800 text-white rounded py-2 text-sm font-medium transition-colors">
                                    Create Section
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Form Content */}
            <div className="animate-fadeIn">
                {renderActiveComponent()}
            </div>
        </div>
    );
};

export default FormEditor;