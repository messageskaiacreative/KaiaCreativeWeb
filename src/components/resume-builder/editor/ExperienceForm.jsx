import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import Input from '../ui/Input';
import RichTextarea from '../ui/RichTextarea';
import Button from '../ui/Button';
import { Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '../ui/SortableItem';
import { INDONESIAN_CITIES } from '../../data/indonesianCities';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const ExperienceForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
    const [expandedIds, setExpandedIds] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAdd = () => {
        const newExp = {
            id: generateId(),
            jobTitle: '',
            employer: '',
            startDate: '',
            endDate: '',
            city: '',
            description: ''
        };
        updateResumeData({ experience: [newExp, ...experience] });
        setExpandedIds([newExp.id, ...expandedIds]);
    };

    const handleRemove = (id) => {
        updateResumeData({ experience: experience.filter(exp => exp.id !== id) });
        setExpandedIds(expandedIds.filter(eid => eid !== id));
    };

    const handleChange = (id, field, value) => {
        const newExperience = experience.map(exp =>
            exp.id === id ? { ...exp, [field]: value } : exp
        );
        updateResumeData({ experience: newExperience });
    };

    const toggleExpand = (id) => {
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(eid => eid !== id));
        } else {
            setExpandedIds([...expandedIds, id]);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = experience.findIndex((exp) => exp.id === active.id);
            const newIndex = experience.findIndex((exp) => exp.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                updateResumeData({ experience: arrayMove(experience, oldIndex, newIndex) });
            }
        }
    };

    // Filter out items without valid IDs for SortableContext
    const validExperience = experience.filter(exp => exp && exp.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Employment History</h3>
                <Button onClick={handleAdd} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Employment
                </Button>
            </div>

            <div className="space-y-4">
                {validExperience.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                        <p className="text-slate-500 text-sm">No employment history added yet.</p>
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={validExperience.map(exp => exp.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {validExperience.map((exp) => (
                            <SortableItem
                                key={exp.id}
                                id={exp.id}
                                onToggleExpand={() => toggleExpand(exp.id)}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-center w-full">
                                    <div className="font-medium text-slate-700">
                                        {exp.jobTitle || '(Not specified)'} <span className="text-slate-400 font-normal">at {exp.employer || '(Not specified)'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" className="p-1 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleRemove(exp.id); }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                        {expandedIds.includes(exp.id) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </div>
                                </div>

                                {/* Expanded Form */}
                                {expandedIds.includes(exp.id) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <Input
                                            label="Job Title"
                                            value={exp.jobTitle || ''}
                                            onChange={(e) => handleChange(exp.id, 'jobTitle', e.target.value)}
                                        />
                                        <Input
                                            label="Employer"
                                            value={exp.employer || ''}
                                            onChange={(e) => handleChange(exp.id, 'employer', e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                label="Start Date"
                                                type="month"
                                                value={exp.startDate || ''}
                                                onChange={(e) => handleChange(exp.id, 'startDate', e.target.value)}
                                            />
                                            <Input
                                                label="End Date"
                                                type="month"
                                                value={exp.endDate || ''}
                                                onChange={(e) => handleChange(exp.id, 'endDate', e.target.value)}
                                            />
                                        </div>
                                        <Input
                                            label="City"
                                            value={exp.city || ''}
                                            onChange={(e) => handleChange(exp.id, 'city', e.target.value)}
                                            list={`cities-${exp.id}`}
                                        />
                                        <datalist id={`cities-${exp.id}`}>
                                            {(INDONESIAN_CITIES || []).map((city) => (
                                                <option key={city} value={city} />
                                            ))}
                                        </datalist>
                                        <div className="md:col-span-2">
                                            <RichTextarea
                                                label="Description"
                                                value={exp.description || ''}
                                                onChange={(e) => handleChange(exp.id, 'description', e.target.value)}
                                                rows={4}
                                                placeholder="Describe your role and achievements..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
export default ExperienceForm;

