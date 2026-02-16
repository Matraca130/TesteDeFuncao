// ══════════════════════════════════════════════════════════════
// PREVIEW BLOCK — Read-only rendering of a single block
// ══════════════════════════════════════════════════════════════
import React from 'react';
import clsx from 'clsx';
import { headingStyle } from '@/app/design-system';
import type { CanvasBlock } from './types';
import { CALLOUT_STYLES } from './types';

export function PreviewBlock({ block }: { block: CanvasBlock }) {
  if (block.type === 'divider') {
    return (
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    );
  }

  if (block.type === 'image') {
    const pAr = block.meta?.imageAspectRatio || 'auto';
    const pMh = block.meta?.imageMaxHeight || 0;
    const pHasRatio = pAr !== 'auto';
    const pFrameStyle: React.CSSProperties = {};
    if (pHasRatio) pFrameStyle.aspectRatio = pAr;
    if (pMh > 0) pFrameStyle.maxHeight = `${pMh}px`;
    return block.content ? (
      <figure className="my-5" style={{ width: `${block.meta?.imageWidth || 100}%`, margin: '1.25rem auto' }}>
        <div className="overflow-hidden rounded-xl" style={pFrameStyle}>
          <img
            src={block.content}
            alt={block.meta?.imageCaption || ''}
            className={clsx(
              'w-full rounded-xl',
              pHasRatio && 'h-full',
              block.meta?.imageFit === 'contain' ? 'object-contain bg-gray-50' : 'object-cover',
            )}
            style={!pHasRatio && pMh <= 0 ? { maxHeight: '480px' } : undefined}
          />
        </div>
        {block.meta?.imageCaption && <figcaption className="text-center text-[13px] text-gray-400 italic mt-2.5">{block.meta.imageCaption}</figcaption>}
      </figure>
    ) : null;
  }

  if (block.type === 'callout') {
    const style = CALLOUT_STYLES[block.meta?.calloutColor || 'teal'];
    return (
      <div className={clsx('border-l-4 rounded-r-xl p-5 my-3', style.border, style.bg)}>
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5 shrink-0">{style.icon}</span>
          <div className="text-[15px] text-gray-700 leading-[1.75]" dangerouslySetInnerHTML={{ __html: block.content }} />
        </div>
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-gray-300 pl-5 py-2 my-3">
        <div className="text-[15px] text-gray-500 italic leading-[1.75]" dangerouslySetInnerHTML={{ __html: block.content }} />
      </blockquote>
    );
  }

  if (block.type === 'list') {
    const isNumbered = block.meta?.listStyle === 'numbered';
    const tag = isNumbered ? 'ol' : 'ul';
    const listCls = isNumbered ? 'list-decimal' : 'list-disc';
    const stripPrefix = (l: string) => l.replace(/^[\\d]+[.)]\\s*/, '').replace(/^[-*]\\s*/, '').trim();
    const html = block.content.includes('<li>') ? block.content
      : `<${tag} class="${listCls} ml-5 space-y-1.5">${block.content.split('\n').filter(l => l.trim()).map(l => `<li class="text-[15px] text-gray-700 leading-[1.75]">${stripPrefix(l)}</li>`).join('')}</${tag}>`;
    return <div className="my-3 text-[15px] text-gray-700 leading-[1.75] [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:space-y-1.5" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  if (block.type === 'heading') {
    return (
      <div className="my-5">
        <div
          className="text-[26px] font-bold text-gray-900 leading-tight"
          style={headingStyle}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
        <div className="mt-2 h-[2px] w-16 rounded-full bg-teal-400/60" />
      </div>
    );
  }

  if (block.type === 'subheading') {
    return (
      <div
        className="text-[19px] font-semibold text-gray-800 leading-snug my-4"
        style={headingStyle}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    );
  }

  // text
  return (
    <div
      className="text-[15px] text-gray-700 leading-[1.75] my-2.5"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}
