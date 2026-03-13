import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '../ui/SortableItem';
import { INDONESIAN_CITIES } from '../../data/indonesianCities';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const EducationForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
    const [expandedIds, setExpandedIds] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAdd = () => {
        const newEdu = {
            id: generateId(),
            school: '',
            degree: '',
            startDate: '',
            endDate: '',
            city: '',
            description: ''
        };
        updateResumeData({ education: [newEdu, ...education] });
        setExpandedIds([newEdu.id, ...expandedIds]);
    };

    const handleRemove = (id) => {
        updateResumeData({ education: education.filter(edu => edu.id !== id) });
        setExpandedIds(expandedIds.filter(eid => eid !== id));
    };

    const handleChange = (id, field, value) => {
        const newEducation = education.map(edu =>
            edu.id === id ? { ...edu, [field]: value } : edu
        );
        updateResumeData({ education: newEducation });
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
            const oldIndex = education.findIndex((edu) => edu.id === active.id);
            const newIndex = education.findIndex((edu) => edu.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                updateResumeData({ education: arrayMove(education, oldIndex, newIndex) });
            }
        }
    };

    // Filter out items without valid IDs for SortableContext
    const validEducation = education.filter(edu => edu && edu.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Education</h3>
                <Button onClick={handleAdd} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Education
                </Button>
            </div>

            <div className="space-y-4">
                {validEducation.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                        <p className="text-slate-500 text-sm">No education history added yet.</p>
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={validEducation.map(edu => edu.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {validEducation.map((edu) => (
                            <SortableItem
                                key={edu.id}
                                id={edu.id}
                                onToggleExpand={() => toggleExpand(edu.id)}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-center w-full">
                                    <div className="font-medium text-slate-700">
                                        {edu.degree || '(Degree)'} <span className="text-slate-400 font-normal">at {edu.school || '(School)'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" className="p-1 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleRemove(edu.id); }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                        {expandedIds.includes(edu.id) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </div>
                                </div>

                                {/* Expanded Form */}
                                {expandedIds.includes(edu.id) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <Input
                                            label="School"
                                            value={edu.school || ''}
                                            onChange={(e) => handleChange(edu.id, 'school', e.target.value)}
                                        />
                                        <Input
                                            label="Degree"
                                            value={edu.degree || ''}
                                            onChange={(e) => handleChange(edu.id, 'degree', e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                label="Start Date"
                                                type="month"
                                                value={edu.startDate || ''}
                                                onChange={(e) => handleChange(edu.id, 'startDate', e.target.value)}
                                            />
                                            <Input
                                                label="End Date"
                                                type="month"
                                                value={edu.endDate || ''}
                                                onChange={(e) => handleChange(edu.id, 'endDate', e.target.value)}
                                            />
                                        </div>
                                        <Input
                                            label="City"
                                            value={edu.city || ''}
                                            onChange={(e) => handleChange(edu.id, 'city', e.target.value)}
                                            list={`cities-edu-${edu.id}`}
                                        />
                                        <datalist id={`cities-edu-${edu.id}`}>
                                            {(INDONESIAN_CITIES || []).map((city) => (
                                                <option key={city} value={city} />
                                            ))}
                                        </datalist>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="4"
                                                value={edu.description || ''}
                                                onChange={(e) => handleChange(edu.id, 'description', e.target.value)}
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
export default EducationForm;

