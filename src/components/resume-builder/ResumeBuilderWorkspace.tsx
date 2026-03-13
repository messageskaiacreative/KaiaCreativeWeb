"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeProvider, useResume } from '../context/ResumeContext';
import FormEditor from './editor/FormEditor';
import ResumePreview from './preview/ResumePreview';
import { Download, Trash2, Save, ChevronDown, FileText, FileType } from 'lucide-react';

const ResumeBuilderContent = () => {
    const { resumeData, loading, resetResume } = useResume();
    const [editorWidth, setEditorWidth] = useState(45); // percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [saveIndicator, setSaveIndicator] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show save indicator when data changes
    useEffect(() => {
        if (resumeData && !loading) {
            setSaveIndicator(true);
            const timer = setTimeout(() => setSaveIndicator(false), 1500);

            // Set document title so PDF print dialog uses the correct filename
            document.title = resumeData.personalInfo?.firstName
                ? `${resumeData.personalInfo.firstName} Resume`
                : 'Resume';

            return () => clearTimeout(timer);
        }
    }, [resumeData, loading]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setEditorWidth(Math.max(20, Math.min(70, newWidth)));
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-slate-500">Loading CV Builder...</div>
            </div>
        </div>
    );

    if (!resumeData) return <div className="p-10 text-center">Initializing...</div>;

    const handleDownloadPDF = () => {
        setShowDownloadMenu(false);
        window.print();
    };

    const handleDownloadWord = () => {
        setShowDownloadMenu(false);

        const d = resumeData;
        const tpl = d.template || 'professional';
        const pi = d.personalInfo || {};
        const font = d.font || 'Times New Roman';
        const color = d.themeColor || '#1a1a2e';
        const txtColor = d.textColor || '#000000';
        const textAlign = d.textAlign || 'left';
        const fileName = pi.firstName ? `${pi.firstName}_Resume` : 'Resume';

        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const renderDesc = (text: string, forceJustify = false) => {
            if (!text) return '';
            let html = esc(text);
            html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
            const lines = html.split('\n');
            let result = '';
            let inList = false;
            lines.forEach(line => {
                const trimmed = line.trim();
                const align = forceJustify ? 'justify' : textAlign;
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    if (!inList) { result += '<ul style="margin:0;padding-left:20px;">'; inList = true; }
                    result += `<li style="font-size:10pt;color:${txtColor};text-align:${align};margin:0;padding:0;">${trimmed.substring(2)}</li>`;
                } else {
                    if (inList) { result += '</ul>'; inList = false; }
                    if (trimmed) result += `<p style="margin:0;text-align:${align};color:${txtColor};font-size:10pt;">${trimmed}</p>`;
                }
            });
            if (inList) result += '</ul>';
            return result;
        };

        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const m = dateStr.match(/^(\d{4})-(\d{2})$/);
            if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return dateStr;
        };

        const getDateRange = (start: string, end: string) => `${formatDate(start)} — ${end ? formatDate(end) : 'Present'}`;

        const sectionOrder = d.sectionOrder || ['education', 'experience', 'organizations', 'certifications', 'languages', 'skills', 'courses', 'references'];

        let body = '';

        const getContactHtml = (_colorCode: string, fontColor: string) => {
            const parts = [pi.email, pi.phone, [pi.city, pi.country].filter(Boolean).join(', '), pi.linkedin, pi.website].filter(Boolean);
            return parts.length > 0 ? `<p style="font-size:10pt;color:${fontColor};margin:0;">${parts.map((c: string) => esc(String(c).trim())).join(' | ')}</p>` : '';
        };

        if (tpl === 'professional' || tpl === 'minimal') {
            const isProf = tpl === 'professional';
            const isMin = tpl === 'minimal';

            if (isMin) {
                body += `<div style="margin-bottom:20px;">`;
                body += `<h1 style="font-size:28pt;margin:0;font-weight:normal;color:#111;">${esc(pi.firstName)} <b>${esc(pi.lastName)}</b></h1>`;
                if (pi.jobTitle) body += `<p style="font-size:12pt;color:${color};text-transform:uppercase;letter-spacing:2px;margin:2px 0;">${esc(pi.jobTitle)}</p>`;
                body += getContactHtml(color, '#555');
                body += `</div>`;
            } else {
                body += `<div style="text-align:center;margin-bottom:0;">`;
                const fullName = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
                if (fullName) body += `<h1 style="font-size:22pt;margin:0;font-weight:normal;">${esc(fullName)}${pi.jobTitle ? ` <span style="color:#555;">| ${esc(pi.jobTitle)}</span>` : ''}</h1>`;
                body += getContactHtml(color, '#333');
                body += `</div>`;
                if (isProf) body += `<hr style="border:1px solid #000;margin:0;">`;
            }

            const renderTitle = (title: string) => {
                if (isMin) return `<div style="margin:10px 0 5px 0;"><h2 style="font-size:10pt;text-transform:uppercase;letter-spacing:3px;color:${color};margin:0;">${esc(title)}</h2><hr style="border:0;border-bottom:1px solid ${color};opacity:0.3;margin:2px 0;width:100%;"/></div>`;
                if (isProf) return `<div style="width:140px;font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#000;margin:0;">${esc(title)}</div>`;
                return `<h2 style="font-size:12pt;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid ${color};padding-bottom:3px;margin:12px 0 6px 0;color:${color};">${esc(title)}</h2>`;
            };

            const wrapSectionProf = (title: string, content: string, noWrapList = false) => {
                if (!content) return '';
                if (isProf) {
                    if (noWrapList) {
                        return `<table width="100%" style="border-collapse:collapse;margin:0;">
                        <tr><td style="width:140px;vertical-align:top;padding:0;">${renderTitle(title)}</td><td></td></tr>
                        ${content}
                        </table>
                        <hr style="border:0; border-top:1px solid #000; margin:0;" />`;
                    }
                    return `<table width="100%" style="border-collapse:collapse;margin:0;">
                        <tr><td style="width:140px;vertical-align:top;padding:0;">${renderTitle(title)}</td>
                        <td style="vertical-align:top;padding:0;">${content}</td></tr></table>
                        <hr style="border:0; border-top:1px solid #000; margin:0;" />`;
                }
                return renderTitle(title) + `<div style="margin-bottom:12px;">${content}</div>`;
            };

            let sectionsHtml = '';

            if (d.summary) {
                sectionsHtml += wrapSectionProf('Profile', `<div style="font-size:10pt;color:${txtColor};text-align:${textAlign};">${renderDesc(d.summary)}</div>`);
            }

            const buildExpList = (items: any[], isEdu = false) => {
                let h = '';
                if (!isProf) h += '<table width="100%" style="border-collapse:collapse;">';
                items.forEach((item: any) => {
                    const title = item?.title || item?.jobTitle || item?.position || item?.degree || item?.name || item?.role || '';
                    const sub = item?.employer || item?.school || item?.company || item?.subtitle || item?.institution || item?.organization || '';
                    const dateStr = item?.date || getDateRange(item?.startDate, item?.endDate);

                    if (isMin) {
                        h += `<tr><td style="vertical-align:top;padding:0 0 10px 0;">`;
                        h += `<table width="100%" style="border-collapse:collapse;">`;
                        if (dateStr) h += `<tr><td colspan="2" style="font-size:9pt;color:#777;padding-bottom:4px;">${esc(dateStr)}</td></tr>`;
                        h += `<tr><td style="font-weight:bold;font-size:10pt;color:#111;">${esc(title)}</td><td style="text-align:right;font-size:9pt;color:#777;">${esc(item?.city || '')}</td></tr>`;
                        h += `</table>`;
                        if (sub) h += `<div style="font-size:9pt;color:${color};margin-bottom:4px;">${esc(sub)}</div>`;
                        if (item?.description) h += `<div style="font-size:10pt;">${renderDesc(item.description, true)}</div>`;
                        h += `</td></tr>`;
                    } else if (isProf) {
                        h += `<tr><td style="width:140px;vertical-align:top;padding:0 15px 0 0;font-size:10pt;color:#000;">${esc(dateStr)}</td>`;
                        h += `<td style="vertical-align:top;padding:0;">`;
                        h += `<table width="100%" style="border-collapse:collapse;margin:0;"><tr><td style="font-weight:bold;font-size:11pt;color:#000;padding:0;margin:0;">${esc(title)}</td><td style="text-align:right;font-size:9pt;color:#000;padding:0;margin:0;">${esc(item?.city || '')}</td></tr></table>`;
                        if (sub) h += `<div style="font-size:10pt;color:#000;margin:0;">${esc(sub)}</div>`;
                        if (item?.description) h += `<div style="font-size:10pt;margin:0;">${renderDesc(item.description, true)}</div>`;
                        h += `</td></tr>`;
                    } else {
                        h += `<tr><td style="vertical-align:top;padding:0 0 10px 0;">`;
                        h += `<table width="100%" style="border-collapse:collapse;">`;
                        if (dateStr) h += `<tr><td colspan="2" style="font-size:9pt;color:#555;padding-bottom:4px;">${esc(dateStr)}</td></tr>`;
                        h += `<tr><td style="font-weight:bold;font-size:11pt;color:#111;">${esc(title)}</td><td style="text-align:right;font-size:9pt;color:#555;">${esc(item?.city || '')}</td></tr>`;
                        h += `</table>`;
                        if (sub) h += `<div style="font-size:10pt;font-weight:bold;color:${color};margin-bottom:4px;">${esc(sub)}</div>`;
                        if (item?.description) h += `<div style="font-size:10pt;">${renderDesc(item.description, true)}</div>`;
                        h += `</td></tr>`;
                    }
                });
                if (!isProf) h += '</table>';
                return h;
            };

            const buildGrid = (items: any[], labelKey: string, valKey: string) => {
                let h = `<table width="100%" style="border-collapse:collapse;"><tr>`;
                items.forEach((item: any, i: number) => {
                    if (i > 0 && i % 2 === 0) h += `</tr><tr>`;
                    h += `<td width="50%" style="vertical-align:top;padding:0;font-size:10pt;color:${txtColor};"><b>${esc(item[labelKey] || '')}</b> <span style="color:#666;font-size:9pt;">${esc(item[valKey] || '')}</span></td>`;
                });
                h += `</tr></table>`;
                return h;
            };

            sectionOrder.forEach((key: string) => {
                if (key === 'experience' && d.experience?.length > 0) sectionsHtml += wrapSectionProf('Experience', buildExpList(d.experience), true);
                else if (key === 'education' && d.education?.length > 0) sectionsHtml += wrapSectionProf('Education', buildExpList(d.education, true), true);
                else if (key === 'skills' && d.skills?.length > 0) sectionsHtml += wrapSectionProf('Skills', buildGrid(d.skills, 'name', 'level'));
                else if (key === 'languages' && d.languages?.length > 0) sectionsHtml += wrapSectionProf('Languages', buildGrid(d.languages, 'language', 'level'));
                else if (key === 'organizations' && d.organizations?.length > 0) sectionsHtml += wrapSectionProf('Organizations', buildExpList(d.organizations), true);
                else if (key === 'certifications' && d.certifications?.length > 0) {
                    let h = '';
                    if (isProf) {
                        d.certifications.forEach((c: any) => {
                            h += `<tr><td style="width:140px;vertical-align:top;padding:0 15px 0 0;font-size:10pt;color:#000;">${esc(formatDate(c.date))}</td>
                            <td style="vertical-align:top;padding:0;"><div style="font-weight:bold;font-size:11pt;color:#000;margin:0;">${esc(c.name)}</div><div style="font-size:10pt;color:#000;margin:0;">${esc(c.issuer)}</div></td></tr>`;
                        });
                        sectionsHtml += wrapSectionProf('Certifications', h, true);
                    } else {
                        d.certifications.forEach((c: any) => { h += `<div style="margin-bottom:6px;"><div style="font-weight:bold;font-size:10pt;">${esc(c.name)}</div><div style="font-size:9pt;color:#555;">${esc(c.issuer)} · ${esc(formatDate(c.date))}</div></div>` });
                        sectionsHtml += wrapSectionProf('Certifications', h);
                    }
                }
                else if (key === 'courses' && d.courses?.length > 0) sectionsHtml += wrapSectionProf('Courses', buildExpList(d.courses), true);
                else if (key === 'references' && d.references?.length > 0) {
                    let h = `<table width="100%" style="border-collapse:collapse;"><tr>`;
                    d.references.forEach((r: any, i: number) => {
                        if (i > 0 && i % 2 === 0) h += `</tr><tr>`;
                        h += `<td width="50%" style="padding:4px 0;font-size:10pt;vertical-align:top;"><b>${esc(r.name)}</b><br/><span style="color:#555;">${esc(r.company)}<br/>${esc(r.email)} | ${esc(r.phone)}</span></td>`;
                    });
                    h += `</tr></table>`;
                    sectionsHtml += wrapSectionProf('References', h);
                } else {
                    const cs = (d.customSections || []).find((s: any) => s.id === key);
                    if (cs) {
                        if (cs.type === 'paragraph_like' && cs.description) sectionsHtml += wrapSectionProf(cs.name, `<div style="font-size:10pt;">${renderDesc(cs.description)}</div>`);
                        else if (cs.type === 'skill_like' && cs.items?.length > 0) sectionsHtml += wrapSectionProf(cs.name, buildGrid(cs.items, 'name', 'level'));
                        else if (cs.type === 'experience_like' && cs.items?.length > 0) sectionsHtml += wrapSectionProf(cs.name, buildExpList(cs.items), true);
                    }
                }
            });

            body += sectionsHtml;

        } else if (tpl === 'modern') {
            body += `<table width="100%" style="border-collapse:collapse;margin-bottom:20px;border-bottom:2px solid ${color};padding-bottom:20px;">`;
            body += `<tr>`;
            if (d.showPhoto !== false && pi.photoUrl) {
                const photoRadius = d.photoShape === 'square' ? '4px' : '50%';
                body += `<td width="80" style="vertical-align:top;"><img src="${pi.photoUrl}" width="64" height="64" style="border-radius:${photoRadius};border:none;"></td>`;
            }
            body += `<td style="vertical-align:top;">`;
            body += `<h1 style="font-size:26pt;margin:0;font-weight:bold;color:${txtColor};">${esc(pi.firstName)} <span style="color:${color};">${esc(pi.lastName)}</span></h1>`;
            if (pi.jobTitle) body += `<p style="font-size:14pt;font-weight:bold;color:#555;margin:4px 0;">${esc(pi.jobTitle)}</p>`;
            body += `</td></tr>`;
            body += `<tr><td colspan="2" style="padding-top:10px;">${getContactHtml('#555', '#555')}</td></tr>`;
            body += `</table>`;

            body += `<table width="100%" style="border-collapse:collapse;"><tr>`;
            body += `<td width="65%" style="vertical-align:top;padding-right:20px;">`;

            const mainTitle = (t: string) => `<h2 style="font-size:12pt;text-transform:uppercase;letter-spacing:1px;color:${color};border-bottom:2px solid ${color};padding-bottom:2px;margin:15px 0 10px 0;display:inline-block;">${esc(t)}</h2>`;

            const buildMainList = (items: any[]) => {
                let h = '<table width="100%" style="border-collapse:collapse;">';
                items.forEach((item: any) => {
                    const title = item?.title || item?.jobTitle || item?.position || item?.degree || item?.name || item?.role || '';
                    const sub = item?.employer || item?.school || item?.company || item?.subtitle || item?.institution || item?.organization || '';
                    const dateStr = item?.date || getDateRange(item?.startDate, item?.endDate);
                    h += `<tr>`;
                    h += `<td width="28%" style="vertical-align:top;padding-right:15px;padding-bottom:12px;"><div style="font-size:9pt;font-weight:bold;color:#555;">${esc(dateStr)}</div></td>`;
                    h += `<td width="72%" style="vertical-align:top;padding-bottom:12px;">`;
                    h += `<table width="100%" style="border-collapse:collapse;">`;
                    h += `<tr><td style="font-weight:bold;font-size:11pt;color:${txtColor};padding-bottom:2px;">${esc(title)}</td><td style="text-align:right;font-size:9pt;color:#555;">${esc(item?.city || '')}</td></tr>`;
                    h += `</table>`;
                    if (sub) h += `<div style="font-size:10pt;font-weight:bold;color:#444;margin-bottom:4px;">${esc(sub)}</div>`;
                    if (item?.description) h += `<div style="font-size:10pt;">${renderDesc(item.description, true)}</div>`;
                    h += `</td></tr>`;
                });
                h += '</table>';
                return h;
            };

            if (d.summary) {
                body += mainTitle('Profile');
                body += `<div style="font-size:10pt;color:#333;margin-bottom:15px;">${renderDesc(d.summary)}</div>`;
            }

            sectionOrder.forEach((key: string) => {
                if (key === 'experience' && d.experience?.length > 0) body += mainTitle('Employment History') + buildMainList(d.experience);
                else if (key === 'education' && d.education?.length > 0) body += mainTitle('Education') + buildMainList(d.education);
                else if (key === 'organizations' && d.organizations?.length > 0) body += mainTitle('Organizations') + buildMainList(d.organizations);
                else if (key === 'custom' && d.customSections?.length > 0) {
                    d.customSections.forEach((cs: any) => {
                        if (cs.type === 'paragraph_like' && cs.description) body += mainTitle(cs.name) + `<div style="font-size:10pt;margin-bottom:10px;">${renderDesc(cs.description)}</div>`;
                        else if (cs.type === 'experience_like' && cs.items?.length > 0) body += mainTitle(cs.name) + buildMainList(cs.items);
                    });
                }
            });

            body += `</td>`;
            body += `<td width="35%" style="vertical-align:top;padding-left:15px;">`;

            const sideTitle = (t: string) => `<h2 style="font-size:12pt;text-transform:uppercase;letter-spacing:1px;color:${color};margin:15px 0 10px 0;">${esc(t)}</h2>`;

            if (pi.linkedin || pi.website) {
                body += sideTitle('Links');
                if (pi.linkedin) body += `<p style="font-size:10pt;margin:2px 0;">LinkedIn: ${esc(pi.linkedin)}</p>`;
                if (pi.website) body += `<p style="font-size:10pt;margin:2px 0;">Website: ${esc(pi.website)}</p>`;
            }
            if (d.skills?.length > 0) {
                body += sideTitle('Skills');
                d.skills.forEach((sk: any) => { body += `<p style="font-size:10pt;margin:4px 0;"><b>${esc(sk.name)}</b> <span style="font-size:8pt;color:#666;">${esc(sk.level || '')}</span></p>` });
            }
            if (d.languages?.length > 0) {
                body += sideTitle('Languages');
                d.languages.forEach((l: any) => { body += `<p style="font-size:10pt;margin:4px 0;"><b>${esc(l.language)}</b> <span style="font-size:8pt;color:#666;">${esc(l.level || '')}</span></p>` });
            }
            if (d.certifications?.length > 0) {
                body += sideTitle('Certifications');
                d.certifications.forEach((c: any) => { body += `<p style="font-size:9pt;margin:6px 0;"><b>${esc(c.name)}</b><br/><span style="color:#555;">${esc(c.issuer)} · ${esc(formatDate(c.date))}</span></p>` });
            }
            if (d.courses?.length > 0) {
                body += sideTitle('Courses');
                d.courses.forEach((c: any) => { body += `<p style="font-size:9pt;margin:6px 0;"><b>${esc(c.name)}</b><br/><span style="color:#555;">${esc(c.institution)}</p>` });
            }
            if (d.references?.length > 0) {
                body += sideTitle('References');
                d.references.forEach((r: any) => { body += `<p style="font-size:9pt;margin:6px 0;"><b>${esc(r.name)}</b><br/><span style="color:#555;">${esc(r.company)}<br/>${esc(r.email)}</span></p>` });
            }

            body += `</td></tr></table>`;

        } else {
            // Two Column Templates: Executive, Creative, Tech
            const isExec = tpl === 'executive';
            const isTech = tpl === 'tech';
            const sidebarBg = isExec ? '#f9fafb' : isTech ? '#0D1121' : color;
            const sidebarTxt = isExec ? '#111' : '#fff';
            const sidebarSec = isExec ? color : 'rgba(255,255,255,0.7)';

            body += `<table width="100%" height="100%" style="border-collapse:collapse;margin:0;padding:0;height:100%;min-height:29.7cm;">`;

            if (isExec) {
                body += `<tr><td colspan="2" style="background-color:${color};padding:25px 30px;color:#fff;">`;
                body += `<h1 style="font-size:24pt;margin:0;color:#fff;font-weight:bold;">${esc(pi.firstName)} ${esc(pi.lastName)}</h1>`;
                if (pi.jobTitle) body += `<p style="font-size:11pt;color:#fff;opacity:0.8;text-transform:uppercase;letter-spacing:2px;margin:4px 0 10px 0;">${esc(pi.jobTitle)}</p>`;
                body += `<hr style="border:0;border-bottom:1px solid rgba(255,255,255,0.2);margin-bottom:10px;"/>`;
                body += getContactHtml('#fff', '#fff');
                body += `</td></tr>`;
            }

            body += `<tr>`;

            const renderSidebarContent = () => {
                let s = '';
                if (!isExec) {
                    s += `<div style="margin-bottom:20px;">`;
                    s += `<h1 style="font-size:18pt;margin:0;color:${sidebarTxt};font-weight:bold;">${esc(pi.firstName)}<br/>${esc(pi.lastName)}</h1>`;
                    if (pi.jobTitle) s += `<p style="font-size:9pt;color:${sidebarSec};text-transform:uppercase;letter-spacing:1px;margin:4px 0;">${esc(pi.jobTitle)}</p>`;
                    s += `</div>`;
                    s += `<div style="margin-bottom:20px;font-size:9pt;color:${sidebarTxt};">`;
                    const parts = [pi.email, pi.phone, [pi.city, pi.country].filter(Boolean).join(', '), pi.website].filter(Boolean);
                    parts.forEach((p: string) => { s += `<div style="margin-bottom:4px;">${esc(p)}</div>`; });
                    s += `</div>`;
                }
                const sideTitleFn = (t: string) => `<h2 style="font-size:10pt;text-transform:uppercase;letter-spacing:1px;color:${isExec ? color : '#fff'};border-bottom:1px solid ${isExec ? '#ddd' : 'rgba(255,255,255,0.3)'};padding-bottom:3px;margin:15px 0 8px 0;">${esc(t)}</h2>`;

                if (d.skills?.length > 0) {
                    s += sideTitleFn('Skills');
                    d.skills.forEach((sk: any) => { s += `<div style="font-size:9pt;color:${sidebarTxt};margin-bottom:3px;"><b>${esc(sk.name)}</b> <span style="font-size:8pt;opacity:0.8;">${esc(sk.level || '')}</span></div>` });
                }
                if (d.languages?.length > 0) {
                    s += sideTitleFn('Languages');
                    d.languages.forEach((l: any) => { s += `<div style="font-size:9pt;color:${sidebarTxt};margin-bottom:3px;"><b>${esc(l.language)}</b> <span style="font-size:8pt;opacity:0.8;">${esc(l.level || '')}</span></div>` });
                }
                if (d.certifications?.length > 0) {
                    s += sideTitleFn('Certifications');
                    d.certifications.forEach((c: any) => { s += `<div style="font-size:9pt;color:${sidebarTxt};margin-bottom:4px;"><b>${esc(c.name)}</b><br/><span style="font-size:8pt;opacity:0.8;">${esc(c.issuer)} · ${esc(formatDate(c.date))}</span></div>` });
                }
                if (d.references?.length > 0) {
                    s += sideTitleFn('References');
                    d.references.forEach((r: any) => { s += `<div style="font-size:9pt;color:${sidebarTxt};margin-bottom:4px;"><b>${esc(r.name)}</b><br/><span style="font-size:8pt;opacity:0.8;">${esc(r.company)}<br/>${esc(r.email)}</span></div>` });
                }
                return s;
            };

            const sidebarHtml = `<td width="30%" height="100%" style="vertical-align:top;background-color:${sidebarBg};padding:20px;height:100%;">${renderSidebarContent()}</td>`;

            if (!isExec) body += sidebarHtml;

            body += `<td width="70%" height="100%" style="vertical-align:top;padding:20px;background-color:#fff;height:100%;">`;

            const mainTitleFn = (t: string) => {
                if (isTech) return `<table width="100%" style="border-collapse:collapse;margin:15px 0 10px 0;"><tr><td style="width:15px;color:${color};font-weight:bold;font-family:monospace;">//</td><td><h2 style="font-size:11pt;text-transform:uppercase;letter-spacing:1px;color:${color};margin:0;font-family:monospace;">${esc(t)}</h2></td></tr><tr><td colspan="2"><hr style="border:0;border-bottom:1px solid ${color};opacity:0.3;margin:5px 0;width:100%;"/></td></tr></table>`;
                if (isExec) return `<h2 style="font-size:11pt;text-transform:uppercase;letter-spacing:2px;color:${color};border-bottom:1px solid ${color};padding-bottom:2px;margin:15px 0 10px 0;">${esc(t)}</h2>`;
                return `<h2 style="font-size:11pt;text-transform:uppercase;letter-spacing:1px;color:${color};margin:15px 0 10px 0;"><span style="display:inline-block;width:4px;height:12px;background-color:${color};margin-right:6px;"></span>${esc(t)}</h2>`;
            };

            const buildMainExp = (items: any[]) => {
                let h = '';
                items.forEach((item: any) => {
                    const title = item?.title || item?.jobTitle || item?.position || item?.degree || item?.name || item?.role || '';
                    const sub = item?.employer || item?.school || item?.company || item?.subtitle || item?.institution || item?.organization || '';
                    const dateStr = item?.date || getDateRange(item?.startDate, item?.endDate);
                    h += `<div style="margin-bottom:12px;">`;
                    h += `<table width="100%" style="border-collapse:collapse;">`;
                    if (dateStr) h += `<tr><td colspan="2" style="font-size:9pt;color:#555;padding-bottom:4px;">${esc(dateStr)}</td></tr>`;
                    h += `<tr><td style="font-weight:bold;font-size:11pt;color:#111;">${esc(title)}</td><td style="text-align:right;font-size:9pt;color:#555;">${esc(item?.city || '')}</td></tr>`;
                    h += `</table>`;
                    if (sub) h += `<div style="font-size:10pt;color:${color};font-weight:bold;margin-bottom:4px;">${esc(sub)}</div>`;
                    if (item?.description) h += `<div style="font-size:10pt;margin-top:4px;">${renderDesc(item.description, true)}</div>`;
                    h += `</div>`;
                });
                return h;
            };

            if (d.summary) {
                body += mainTitleFn('Profile');
                body += `<div style="font-size:10pt;color:${txtColor};text-align:${textAlign};">${renderDesc(d.summary)}</div>`;
            }

            sectionOrder.forEach((key: string) => {
                if (key === 'experience' && d.experience?.length > 0) body += mainTitleFn('Experience') + buildMainExp(d.experience);
                else if (key === 'education' && d.education?.length > 0) body += mainTitleFn('Education') + buildMainExp(d.education);
                else if (key === 'organizations' && d.organizations?.length > 0) body += mainTitleFn('Organizations') + buildMainExp(d.organizations);
                else if (key === 'courses' && d.courses?.length > 0) body += mainTitleFn('Courses') + buildMainExp(d.courses);
                else {
                    const cs = (d.customSections || []).find((s: any) => s.id === key);
                    if (cs) {
                        if (cs.type === 'paragraph_like' && cs.description) body += mainTitleFn(cs.name) + `<div style="font-size:10pt;">${renderDesc(cs.description)}</div>`;
                        else if (cs.type === 'experience_like' && cs.items?.length > 0) body += mainTitleFn(cs.name) + buildMainExp(cs.items);
                        else if (cs.type === 'skill_like' && cs.items?.length > 0 && isExec) {
                            body += mainTitleFn(cs.name);
                            cs.items.forEach((sk: any) => { body += `<span style="font-size:9pt;margin-right:10px;"><b>${esc(sk.name)}</b> ${esc(sk.level || '')}</span>` });
                        }
                    }
                }
            });

            body += `</td>`;
            if (isExec) body += sidebarHtml;
            body += `</tr></table>`;
        }

        // --- BUILD WORD DOCUMENT ---
        let pageMargin = '0cm';
        if (tpl === 'professional' || tpl === 'modern') pageMargin = '0cm 1.5cm 0cm 1.5cm';
        else if (tpl === 'minimal') pageMargin = '0.5cm 1.5cm 0.5cm 1.5cm';

        const extraPageStyle = 'mso-header-margin: 0cm; mso-footer-margin: 0cm; mso-page-top-margin: 0cm; mso-page-margin-top: 0cm;';

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>${esc(fileName)}</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page { size: A4; margin: ${pageMargin}; ${extraPageStyle} }
        html, body { height: 100%; min-height: 100%; font-family: '${font}', 'Inter', 'Times New Roman', serif; margin: 0; padding: 0; color: #000; }
        p { margin: 0; padding: 0; display: inline-block; width: 100%; }
        ul { margin: 0; padding-left: 20px; }
        li { font-size: 10pt; margin: 0; padding: 0; }
        table { border: none; margin: 0; padding: 0; }
        td { vertical-align: top; padding: 0; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    ${body}
</body>
</html>`;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Topbar/Toolbar */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-20 print:hidden shrink-0">
                <div className="flex items-center gap-3">
                    <div className="text-lg font-black text-slate-900 tracking-wide">
                        {resumeData.personalInfo?.firstName
                            ? `${resumeData.personalInfo.firstName}'s CV`
                            : 'My CV'}
                    </div>
                    {saveIndicator && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
                            <Save className="w-3 h-3" />
                            Saved
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={resetResume}
                        className="btn btn-secondary text-rose-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 border-slate-200">
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear All
                    </button>

                    {/* Download Dropdown */}
                    <div className="relative" ref={downloadMenuRef}>
                        <div className="flex">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-l-lg text-white font-semibold transition-colors"
                                style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Download PDF</span>
                                <span className="sm:hidden">PDF</span>
                            </button>
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="flex items-center px-2 py-1.5 rounded-r-lg text-white font-semibold transition-colors border-l border-white/30"
                                style={{ background: 'linear-gradient(135deg, #334155, #475569)' }}>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">Download PDF</div>
                                        <div className="text-xs text-slate-400">Best for sharing</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleDownloadWord}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FileType className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">Download Word</div>
                                        <div className="text-xs text-slate-400">Editable .doc file</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Split Pane Area */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
                {/* Form Editor */}
                <div
                    className="overflow-y-auto bg-white border-r border-slate-200 shadow-inner z-0 shrink-0 print:hidden custom-scrollbar"
                    style={{ width: `${editorWidth}%` }}
                >
                    <div className="p-6">
                        <FormEditor />
                    </div>
                </div>

                {/* Drag Handle */}
                <div
                    className="w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-all flex items-center justify-center z-10 print:hidden shrink-0 group"
                    onMouseDown={handleMouseDown}
                    style={{ backgroundColor: isDragging ? '#6366f1' : undefined }}
                >
                    <div className="flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-0.5 h-1 bg-slate-500 rounded-full" />
                        <div className="w-0.5 h-1 bg-slate-500 rounded-full" />
                        <div className="w-0.5 h-1 bg-slate-500 rounded-full" />
                    </div>
                </div>

                {/* Preview Panel */}
                <div
                    className="bg-slate-100 overflow-y-auto overflow-x-auto flex-1 min-w-0 print:overflow-visible custom-scrollbar"
                    id="resume-preview-panel"
                >
                    <div className="w-fit mx-auto p-6 print:p-0">
                        <ResumePreview />
                    </div>
                </div>
            </div>

            {/* Print CSS specific to resume builder */}
            <style>{`
                @media print {
                    /* Hide Sidebar and Header of AppShell via targeting ids/classes */
                    #sidebar, header.app-header { display: none !important; }
                    /* Make main content stretch */
                    main, .split-pane-container { padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important;}
                    
                    /* Everything behaves */
                    body * { visibility: hidden; }
                    html, body, #root, #__next { height: auto !important; overflow: visible !important; }
                    
                    #resume-preview-panel, #resume-preview-panel * { visibility: visible !important; }
                    
                    #resume-preview-panel {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 99999 !important;
                    }
                    
                    @page { size: A4; margin: 0; }
                    
                    .resume-paper {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        transform: none !important;
                        margin: 0 !important;
                        page-break-after: auto;
                    }
                    
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    div, section, p, li, article, .flex { page-break-inside: auto !important; break-inside: auto !important; }
                    h1, h2, h3, h4, h5, h6 { page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: avoid !important; break-after: avoid !important; }
                }
            `}</style>
        </div>
    );
};

export default function ResumeBuilderWorkspace() {
    return (
        <ResumeProvider>
            <ResumeBuilderContent />
        </ResumeProvider>
    );
}
