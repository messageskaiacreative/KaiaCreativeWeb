import React, { useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, Link, AlignLeft, ListOrdered } from 'lucide-react';

const RichTextarea = ({ label, value, onChange, className = '', rows = 4, placeholder }) => {
    const textareaRef = useRef(null);

    const insertFormatting = (type, extra = null) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = value || '';
        const selectedText = currentValue.substring(start, end);

        let newText = currentValue;

        if (type === 'bold') {
            newText = currentValue.substring(0, start) + `**${selectedText || 'bold text'}**` + currentValue.substring(end);
        } else if (type === 'italic') {
            newText = currentValue.substring(0, start) + `*${selectedText || 'italic text'}*` + currentValue.substring(end);
        } else if (type === 'underline') {
            newText = currentValue.substring(0, start) + `<u>${selectedText || 'underlined text'}</u>` + currentValue.substring(end);
        } else if (type === 'strikethrough') {
            newText = currentValue.substring(0, start) + `~~${selectedText || 'strikethrough text'}~~` + currentValue.substring(end);
        } else if (type === 'list') {
            const prefix = '\n- ';
            newText = currentValue.substring(0, start) + prefix + (selectedText || 'List item') + currentValue.substring(end);
        } else if (type === 'ordered-list') {
            const prefix = '\n1. ';
            newText = currentValue.substring(0, start) + prefix + (selectedText || 'List item') + currentValue.substring(end);
        } else if (type === 'link') {
            const url = prompt("Enter URL:", "https://");
            if (url) {
                newText = currentValue.substring(0, start) + `[${selectedText || 'Link Text'}](${url})` + currentValue.substring(end);
            } else {
                return;
            }
        } else if (type === 'color') {
            const color = extra || prompt("Enter color (name or hex):", "red");
            if (color) {
                newText = currentValue.substring(0, start) + `<span style="color:${color}">${selectedText || 'colored text'}</span>` + currentValue.substring(end);
            } else {
                return;
            }
        }

        const event = {
            target: { value: newText }
        };
        onChange(event);

        setTimeout(() => {
            textarea.focus();
        }, 0);
    };

    return (
        <div className={`mb-3 ${className}`}>
            {label && (
                <label className="form-label">
                    {label}
                </label>
            )}
            <div className="border border-slate-200 rounded-sm shadow-sm overflow-hidden focus-within:border-navy-600 focus-within:ring-1 focus-within:ring-navy-600 transition-colors bg-white">
                {/* Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 px-2 py-1 flex flex-wrap gap-1">
                    <button type="button" onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bold">
                        <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Italic">
                        <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Underline">
                        <Underline className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('strikethrough')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Strikethrough">
                        <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-300 mx-1 self-center"></div>

                    <button type="button" onClick={() => insertFormatting('list')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bullet List">
                        <List className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('ordered-list')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Ordered List">
                        <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-300 mx-1 self-center"></div>

                    <button type="button" onClick={() => insertFormatting('link')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Link">
                        <Link className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('color', 'red')} className="p-1.5 hover:bg-slate-200 rounded text-red-600 font-bold transition-colors" title="Red Text">
                        A
                    </button>
                    <button type="button" onClick={() => insertFormatting('color', 'blue')} className="p-1.5 hover:bg-slate-200 rounded text-blue-600 font-bold transition-colors" title="Blue Text">
                        A
                    </button>
                </div>

                <textarea
                    ref={textareaRef}
                    className="w-full px-3 py-2 focus:outline-none block border-none resize-y min-h-[100px] text-[0.875rem] text-slate-700 placeholder:text-slate-300 font-sans"
                    rows={rows}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                />
            </div>
            <p className="mt-1-5 text-[11px] text-slate-400 font-medium">
                Supports Markdown & basic HTML styling.
            </p>
        </div>
    );
};

export default RichTextarea;