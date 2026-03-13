import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const SortableItem = ({ id, children, handleRemove, expanded, onToggleExpand }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="border border-slate-200 rounded-sm bg-white overflow-hidden mb-3 shadow-sm transition-all hover:border-slate-300">
            <div className="flex items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <div {...attributes} {...listeners} className="p-3 cursor-move text-slate-400 hover:text-slate-600 border-r border-slate-200 flex items-center justify-center">
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-grow p-3 cursor-pointer text-sm font-medium text-slate-700" onClick={onToggleExpand}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SortableItem;