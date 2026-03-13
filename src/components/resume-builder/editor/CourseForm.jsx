import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '../ui/SortableItem';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const CourseForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const courses = Array.isArray(resumeData?.courses) ? resumeData.courses : [];
    const [expandedIds, setExpandedIds] = useState([]);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleAdd = () => {
        const newCourse = { id: generateId(), name: '', institution: '', startDate: '', endDate: '' };
        updateResumeData({ courses: [newCourse, ...courses] });
        setExpandedIds([newCourse.id, ...expandedIds]);
    };

    const handleRemove = (id) => {
        updateResumeData({ courses: courses.filter(c => c.id !== id) });
        setExpandedIds(expandedIds.filter(eid => eid !== id));
    };

    const handleChange = (id, field, value) => {
        const newCourses = courses.map(c => c.id === id ? { ...c, [field]: value } : c);
        updateResumeData({ courses: newCourses });
    };

    const toggleExpand = (id) => setExpandedIds(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = courses.findIndex((c) => c.id === active.id);
            const newIndex = courses.findIndex((c) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                updateResumeData({ courses: arrayMove(courses, oldIndex, newIndex) });
            }
        }
    };

    const validCourses = courses.filter(c => c && c.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Courses & Certificates</h3>
                <Button onClick={handleAdd} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Course
                </Button>
            </div>
            <div className="space-y-4">
                {validCourses.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No courses added.</p>}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={validCourses.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {validCourses.map((course) => (
                            <SortableItem key={course.id} id={course.id} onToggleExpand={() => toggleExpand(course.id)}>
                                <div className="flex justify-between items-center w-full">
                                    <div className="font-medium text-slate-700">{course.name || '(Course Name)'}</div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" className="p-1 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleRemove(course.id); }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                        {expandedIds.includes(course.id) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </div>
                                </div>
                                {expandedIds.includes(course.id) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 gap-4 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <Input label="Course Name" value={course.name || ''} onChange={(e) => handleChange(course.id, 'name', e.target.value)} />
                                        <Input label="Institution" value={course.institution || ''} onChange={(e) => handleChange(course.id, 'institution', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Start Date" type="month" value={course.startDate || ''} onChange={(e) => handleChange(course.id, 'startDate', e.target.value)} />
                                            <Input label="End Date" type="month" value={course.endDate || ''} onChange={(e) => handleChange(course.id, 'endDate', e.target.value)} />
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
export default CourseForm;

