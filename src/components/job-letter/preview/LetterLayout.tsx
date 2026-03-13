import React from 'react';
import { useLetterStore } from '@/store/letter-store';

export default function LetterLayout({ forExport = false }: { forExport?: boolean }) {
    const { template, font, fontSize, margin, spacing, content, language } = useLetterStore();

    // Mapping template specific styles
    const getTemplateStyles = () => {
        switch (template) {
            case 'handwritten-style':
                return { fontFamily: 'Caveat, cursive', textAlign: 'left' as const };
            case 'modern-letter':
                return { fontFamily: font, textAlign: 'justify' as const, borderLeft: '4px solid #1e293b', paddingLeft: '15px' };
            case 'executive-letter':
                return { fontFamily: font, textAlign: 'justify' as const };
            default: // formal, pt-application, english-cover, classic-formal, general
                return { fontFamily: font, textAlign: 'justify' as const };
        }
    };

    const containerStyle: React.CSSProperties = {
        fontFamily: getTemplateStyles().fontFamily,
        fontSize: `${fontSize}pt`,
        lineHeight: spacing.lineSpacing,
        color: '#000',
        backgroundColor: '#fff',
        width: '210mm',
        minHeight: '297mm',
        // Box sizing border-box for padding = margins
        boxSizing: 'border-box',
        paddingTop: `${margin.top}mm`,
        paddingBottom: `${margin.bottom}mm`,
        paddingLeft: `${margin.left}mm`,
        paddingRight: `${margin.right}mm`,
        position: 'relative',
        margin: forExport ? '0' : '0 auto',
        // Apply shadow only in preview
        boxShadow: forExport ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        textAlign: getTemplateStyles().textAlign,
        // Ensure words break properly
        wordWrap: 'break-word',
    };

    const blockStyle = {
        marginBottom: `${spacing.paragraphSpacing}px`,
    };

    return (
        <div id="letter-document" className="letter-paper" style={containerStyle}>
            {/* Template variations can inject different header layouts here */}
            {template === 'executive-letter' ? (
                <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', ...blockStyle }}>
                    <div style={{ fontSize: `${fontSize + 6}pt`, fontWeight: 'bold' }}>{content.signatureName || ''}</div>
                    <div style={{ color: '#555' }}>
                        {[content.email, content.phone].filter(Boolean).join(' | ')}
                    </div>
                </div>
            ) : null}

            {/* Date & City Block */}
            <div style={{ textAlign: template === 'classic-formal' ? 'left' : 'right', ...blockStyle }}>
                {content.city ? `${content.city}, ` : ''}{content.date}
            </div>

            {/* Recipient Block */}
            <div style={blockStyle}>
                <div>{language === 'en' ? 'To:' : 'Kepada Yth.,'}</div>
                {content.recipientName && <div>{content.recipientName}</div>}
                {content.position && <div>{content.position}</div>}
                {content.companyName && <div style={{ fontWeight: 'bold' }}>{content.companyName}</div>}
                {content.companyAddress && (
                    <div style={{ whiteSpace: 'pre-line' }}>{content.companyAddress}</div>
                )}
            </div>

            {/* Greeting */}
            <div style={blockStyle}>
                {content.openingGreeting}
            </div>

            {/* Body */}
            <div style={{ ...blockStyle, whiteSpace: 'pre-wrap' }}>
                {content.bodyText}
            </div>
            
            {/* Custom Paragraph */}
            {content.customParagraph && (
                <div style={{ ...blockStyle, whiteSpace: 'pre-wrap' }}>
                    {content.customParagraph}
                </div>
            )}

            {/* Closing */}
            <div style={blockStyle}>
                {content.closingText}
            </div>

            {/* Signature Area (Space for physical sign) */}
            <div style={{ marginTop: '40px', ...blockStyle }}>
                <div style={{ fontWeight: template === 'executive-letter' ? 'bold' : 'normal' }}>
                    {content.signatureName}
                </div>
                {['modern-letter', 'executive-letter'].includes(template) && (
                    <div style={{ color: '#555', fontSize: `${fontSize - 1}pt` }}>
                        {[content.phone, content.email].filter(Boolean).join(' | ')}
                    </div>
                )}
            </div>

            {/* Attachments */}
            {content.attachmentsList && (
                <div style={{ marginTop: '20px', ...blockStyle }}>
                    <div>{language === 'en' ? 'Enclosures:' : 'Lampiran:'}</div>
                    <div style={{ whiteSpace: 'pre-line' }}>{content.attachmentsList}</div>
                </div>
            )}
        </div>
    );
}
