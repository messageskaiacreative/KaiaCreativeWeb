import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '../ui/SortableItem';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const CertificationForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
    const [expandedIds, setExpandedIds] = useState([]);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleAdd = () => {
        const newCert = { id: generateId(), name: '', issuer: '', date: '', description: '' };
        updateResumeData({ certifications: [newCert, ...certifications] });
        setExpandedIds([newCert.id, ...expandedIds]);
    };

    const handleRemove = (id) => {
        updateResumeData({ certifications: certifications.filter(c => c.id !== id) });
        setExpandedIds(expandedIds.filter(eid => eid !== id));
    };

    const handleChange = (id, field, value) => {
        const newCerts = certifications.map(c => c.id === id ? { ...c, [field]: value } : c);
        updateResumeData({ certifications: newCerts });
    };

    const toggleExpand = (id) => setExpandedIds(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = certifications.findIndex((c) => c.id === active.id);
            const newIndex = certifications.findIndex((c) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                updateResumeData({ certifications: arrayMove(certifications, oldIndex, newIndex) });
            }
        }
    };

    const validCerts = certifications.filter(c => c && c.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Licenses & Certifications</h3>
                <Button onClick={handleAdd} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
            </div>
            <div className="space-y-4">
                {validCerts.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No certifications added.</p>}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={validCerts.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {validCerts.map((cert) => (
                            <SortableItem key={cert.id} id={cert.id} onToggleExpand={() => toggleExpand(cert.id)}>
                                <div className="flex justify-between items-center w-full">
                                    <div className="font-medium text-slate-700">{cert.name || '(Certification Name)'}</div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" className="p-1 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleRemove(cert.id); }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                        {expandedIds.includes(cert.id) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </div>
                                </div>
                                {expandedIds.includes(cert.id) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 gap-4 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <Input label="Certification Name" value={cert.name || ''} onChange={(e) => handleChange(cert.id, 'name', e.target.value)} />
                                        <Input label="Issuing Organization" value={cert.issuer || ''} onChange={(e) => handleChange(cert.id, 'issuer', e.target.value)} />
                                        <Input label="Date" type="month" value={cert.date || ''} onChange={(e) => handleChange(cert.id, 'date', e.target.value)} />
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" value={cert.description || ''} onChange={(e) => handleChange(cert.id, 'description', e.target.value)} />
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
export default CertificationForm;

