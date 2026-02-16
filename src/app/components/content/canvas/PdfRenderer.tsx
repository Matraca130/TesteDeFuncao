// ══════════════════════════════════════════════════════════════
// PDF RENDERER — Inline-styled blocks for html2pdf capture
// ══════════════════════════════════════════════════════════════
import React from 'react';
import type { CanvasBlock, RowGroup } from './types';

const PDF_CALLOUT: Record<string, { border: string; bg: string; icon: string }> = {
  yellow: { border: '#fbbf24', bg: '#fffbeb', icon: '\u{1F4A1}' },
  blue:   { border: '#60a5fa', bg: '#eff6ff', icon: '\u{1F4D8}' },
  green:  { border: '#4ade80', bg: '#f0fdf4', icon: '\u{2705}' },
  pink:   { border: '#f472b6', bg: '#fdf2f8', icon: '\u{26A0}\u{FE0F}' },
  teal:   { border: '#2dd4bf', bg: '#f0fdfa', icon: '\u{1F52C}' },
};

// Convert keyword CSS classes to inline styles for PDF capture
const KEYWORD_INLINE_STYLES: Record<string, string> = {
  'keyword-default': 'text-decoration:underline dotted rgba(20,184,166,0.6);text-underline-offset:3px;text-decoration-thickness:2px;background-color:rgba(20,184,166,0.08);color:#0f766e;font-weight:600;padding:0 2px;border-radius:3px;',
  'keyword-red':     'text-decoration:underline dotted rgba(239,68,68,0.6);text-underline-offset:3px;text-decoration-thickness:2px;background-color:rgba(239,68,68,0.08);color:#b91c1c;font-weight:600;padding:0 2px;border-radius:3px;',
  'keyword-yellow':  'text-decoration:underline dotted rgba(245,158,11,0.6);text-underline-offset:3px;text-decoration-thickness:2px;background-color:rgba(245,158,11,0.08);color:#92400e;font-weight:600;padding:0 2px;border-radius:3px;',
  'keyword-green':   'text-decoration:underline dotted rgba(16,185,129,0.6);text-underline-offset:3px;text-decoration-thickness:2px;background-color:rgba(16,185,129,0.08);color:#065f46;font-weight:600;padding:0 2px;border-radius:3px;',
};

export function pdfKeywordHtml(html: string): string {
  return html.replace(
    /<span\s+class="keyword-mark\s+(keyword-\w+)"([^>]*)>/g,
    (_match, cls: string, rest: string) => {
      const style = KEYWORD_INLINE_STYLES[cls] || KEYWORD_INLINE_STYLES['keyword-default'];
      return `<span style="${style}"${rest}>`;
    }
  );
}

export function PdfBlocksRenderer({ blocks, rows }: { blocks: CanvasBlock[]; rows: RowGroup[] }) {
  return (
    <div>
      {rows.map((row) => {
        if (row.groupId) {
          return (
            <div key={row.groupId} style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              {row.columns.map(col => (
                <div key={`pdf-${row.groupId}-${col.slot}`} style={{ width: `${col.width}%` }}>
                  {col.blocks.map(block => (
                    <PdfBlock key={block.id} block={block} />
                  ))}
                </div>
              ))}
            </div>
          );
        }
        return <PdfBlock key={row.columns[0].blocks[0].id} block={row.columns[0].blocks[0]} />;
      })}
    </div>
  );
}

function PdfBlock({ block }: { block: CanvasBlock }) {
  if (block.type === 'divider') {
    return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />;
  }

  if (block.type === 'image' && block.content) {
    const pdfAr = block.meta?.imageAspectRatio || 'auto';
    const pdfMh = block.meta?.imageMaxHeight || 0;
    const pdfHasRatio = pdfAr !== 'auto';
    const pdfFrameStyle: React.CSSProperties = { overflow: 'hidden', borderRadius: '8px' };
    if (pdfHasRatio) pdfFrameStyle.aspectRatio = pdfAr;
    if (pdfMh > 0) pdfFrameStyle.maxHeight = `${pdfMh}px`;
    return (
      <figure style={{ width: `${block.meta?.imageWidth || 100}%`, margin: '12px auto', textAlign: 'center' }}>
        <div style={pdfFrameStyle}>
          <img
            src={block.content}
            alt={block.meta?.imageCaption || ''}
            style={{
              width: '100%',
              borderRadius: '8px',
              ...(pdfHasRatio ? { height: '100%' } : {}),
              ...(!pdfHasRatio && pdfMh <= 0 ? { maxHeight: '400px' } : {}),
              objectFit: block.meta?.imageFit === 'contain' ? 'contain' : 'cover',
            }}
            crossOrigin="anonymous"
          />
        </div>
        {block.meta?.imageCaption && (
          <figcaption style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', fontStyle: 'italic', marginTop: '6px' }}>
            {block.meta.imageCaption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === 'callout') {
    const s = PDF_CALLOUT[block.meta?.calloutColor || 'teal'];
    return (
      <div style={{ borderLeft: `4px solid ${s.border}`, background: s.bg, borderRadius: '0 8px 8px 0', padding: '12px 16px', margin: '8px 0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px' }}>{s.icon}</span>
        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: pdfKeywordHtml(block.content) }} />
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote style={{ borderLeft: '4px solid #d1d5db', paddingLeft: '16px', margin: '8px 0', fontStyle: 'italic', fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
        <div dangerouslySetInnerHTML={{ __html: pdfKeywordHtml(block.content) }} />
      </blockquote>
    );
  }

  if (block.type === 'list') {
    const isNumbered = block.meta?.listStyle === 'numbered';
    const tag = isNumbered ? 'ol' : 'ul';
    const listType = isNumbered ? 'decimal' : 'disc';
    const stripPrefix = (l: string) => l.replace(/^[\d]+[.)]\s*/, '').replace(/^[-*]\s*/, '').trim();
    const html = block.content.includes('<li>') ? block.content
      : `<${tag} style="margin-left:20px;list-style-type:${listType}">${block.content.split('\n').filter(l => l.trim()).map(l => `<li style="font-size:13px;color:#374151;line-height:1.7;margin-bottom:4px">${stripPrefix(l)}</li>`).join('')}</${tag}>`;
    return <div style={{ margin: '8px 0' }} dangerouslySetInnerHTML={{ __html: pdfKeywordHtml(html) }} />;
  }

  if (block.type === 'heading') {
    return (
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', margin: '20px 0 8px', fontFamily: 'Georgia, serif', lineHeight: '1.3' }}>
        <span dangerouslySetInnerHTML={{ __html: pdfKeywordHtml(block.content) }} />
      </h2>
    );
  }

  if (block.type === 'subheading') {
    return (
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '16px 0 6px', fontFamily: 'Georgia, serif', lineHeight: '1.3' }}>
        <span dangerouslySetInnerHTML={{ __html: pdfKeywordHtml(block.content) }} />
      </h3>
    );
  }

  // text
  return (
    <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', margin: '6px 0' }}>
      <span dangerouslySetInnerHTML={{ __html: pdfKeywordHtml(block.content) }} />
    </p>
  );
}
