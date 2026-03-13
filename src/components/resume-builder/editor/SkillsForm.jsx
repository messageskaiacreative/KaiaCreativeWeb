import React from 'react';
import { useResume } from '../../context/ResumeContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, X } from 'lucide-react';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const SkillsForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const skills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];

    const handleAdd = () => {
        const newSkill = {
            id: generateId(),
            name: '',
            level: 'Expert'
        };
        updateResumeData({ skills: [...skills, newSkill] });
    };

    const handleRemove = (id) => {
        updateResumeData({ skills: skills.filter(s => s.id !== id) });
    };

    const handleChange = (id, field, value) => {
        const newSkills = skills.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        );
        updateResumeData({ skills: newSkills });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Skills</h3>
                <Button onClick={handleAdd} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Skill
                </Button>
            </div>
            <div className="space-y-3">
                {skills.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                        <p className="text-slate-500 text-sm">Add skills to highlight your expertise.</p>
                    </div>
                )}
                {skills.filter(s => s && s.id).map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2 animate-fadeIn">
                        <div className="flex-grow">
                            <Input
                                placeholder="Skill (e.g. React.js)"
                                value={skill.name || ''}
                                onChange={(e) => handleChange(skill.id, 'name', e.target.value)}
                                className="mb-0"
                            />
                        </div>
                        <div className="w-1/3">
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                value={skill.level || 'Expert'}
                                onChange={(e) => handleChange(skill.id, 'level', e.target.value)}
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                        <Button variant="ghost" onClick={() => handleRemove(skill.id)} className="text-slate-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default SkillsForm;

