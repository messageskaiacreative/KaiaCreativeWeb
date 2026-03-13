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

const OrganizationForm = () => {
    const { resumeData, updateResumeData } = useResume();
    const organizations = Array.isArray(resumeData?.organizations) ? resumeData.organizations : [];
    const [expandedIds, setExpandedIds] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAdd = () => {
        const newOrg = {
            id: generateId(),
            role: '',
            organization: '',
            startDate: '',
            endDate: '',
            city: '',
            description: ''
        };
        updateResumeData({ organizations: [newOrg, ...organizations] });
        setExpandedIds([newOrg.id, ...expandedIds]);
    };

    const handleRemove = (id) => {
        updateResumeData({ organizations: organizations.filter(org => org.id !== id) });
        setExpandedIds(expandedIds.filter(eid => eid !== id));
    };

    const handleChange = (id, field, value) => {
        const newOrgs = organizations.map(org =>
            org.id === id ? { ...org, [field]: value } : org
        );
        updateResumeData({ organizations: newOrgs });
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = organizations.findIndex((org) => org.id === active.id);
            const newIndex = organizations.findIndex((org) => org.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                updateResumeData({ organizations: arrayMove(organizations, oldIndex, newIndex) });
            }
        }
    };

    const validOrganizations = organizations.filter(org => org && org.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">Organizations</h3>
                <Button onClick={handleAdd} className="btn btn-secondary btn-sm rounded-sm font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Organization
                </Button>
            </div>
            <div className="space-y-4">
                {validOrganizations.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                        <p className="text-slate-500 text-sm">No organizations added yet.</p>
                    </div>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={validOrganizations.map(org => org.id)} strategy={verticalListSortingStrategy}>
                        {validOrganizations.map((org) => (
                            <SortableItem key={org.id} id={org.id} onToggleExpand={() => toggleExpand(org.id)}>
                                <div className="flex justify-between items-center w-full">
                                    <div className="font-medium text-slate-700">
                                        {org.role || '(Role)'} <span className="text-slate-400 font-normal">at {org.organization || '(Organization)'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" className="p-1 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleRemove(org.id); }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                        {expandedIds.includes(org.id) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                    </div>
                                </div>
                                {expandedIds.includes(org.id) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <Input label="Role" value={org.role || ''} onChange={(e) => handleChange(org.id, 'role', e.target.value)} />
                                        <Input label="Organization" value={org.organization || ''} onChange={(e) => handleChange(org.id, 'organization', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Start Date" type="month" value={org.startDate || ''} onChange={(e) => handleChange(org.id, 'startDate', e.target.value)} />
                                            <Input label="End Date" type="month" value={org.endDate || ''} onChange={(e) => handleChange(org.id, 'endDate', e.target.value)} />
                                        </div>
                                        <Input
                                            label="City"
                                            value={org.city || ''}
                                            onChange={(e) => handleChange(org.id, 'city', e.target.value)}
                                            list={`cities-org-${org.id}`}
                                        />
                                        <datalist id={`cities-org-${org.id}`}>
                                            {(INDONESIAN_CITIES || []).map((city) => (
                                                <option key={city} value={city} />
                                            ))}
                                        </datalist>
                                        <div className="md:col-span-2">
                                            <RichTextarea
                                                label="Description"
                                                value={org.description || ''}
                                                onChange={(e) => handleChange(org.id, 'description', e.target.value)}
                                                rows={4}
                                                placeholder="Describe your role and responsibilities..."
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
export default OrganizationForm;

