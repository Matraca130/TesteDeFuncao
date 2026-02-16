import React from 'react';
import clsx from 'clsx';
import { headingStyle } from '@/app/design-system';

/**
 * Read-only renderer for canvas blocks saved in a StudySummary.
 * Parses the JSON string of CanvasBlock[] and renders each block.
 * Supports column groups for side-by-side layout.
 */

interface CanvasBlock {
  id: string;
  type: 'heading' | 'subheading' | 'text' | 'image' | 'callout' | 'divider' | 'list' | 'quote';
  content: string;
  meta?: {
    align?: 'left' | 'center' | 'right';
    calloutColor?: 'yellow' | 'blue' | 'green' | 'pink' | 'teal';
    imageCaption?: string;
    imageWidth?: number;
    imageFit?: 'cover' | 'contain';
    imageAspectRatio?: string;
    imageMaxHeight?: number;
    listStyle?: 'bullet' | 'numbered';
    columnGroup?: string;
    columnWidth?: number;
    columnSlot?: number;
  };
}

interface ColumnSlotData {
  slot: number;
  width: number;
  blocks: CanvasBlock[];
}

interface RowGroup {
  groupId: string | null;
  columns: ColumnSlotData[];
}

const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  yellow: { border: 'border-l-amber-400', bg: 'bg-amber-50', icon: '\u{1F4A1}' },
  blue:   { border: 'border-l-blue-400',  bg: 'bg-blue-50',  icon: '\u{1F4D8}' },
  green:  { border: 'border-l-green-400', bg: 'bg-green-50', icon: '\u{2705}' },
  pink:   { border: 'border-l-pink-400',  bg: 'bg-pink-50',  icon: '\u{26A0}\u{FE0F}' },
  teal:   { border: 'border-l-teal-400',  bg: 'bg-teal-50',  icon: '\u{1F52C}' },
};

function groupBlocksIntoRows(blocks: CanvasBlock[]): RowGroup[] {
  const rows: RowGroup[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if (seen.has(block.id)) continue;
    seen.add(block.id);

    const gid = block.meta?.columnGroup;
    if (gid) {
      const siblings = blocks.filter(b => b.meta?.columnGroup === gid && !seen.has(b.id));
      siblings.forEach(b => seen.add(b.id));
      const allGroupBlocks = [block, ...siblings];

      const slotMap = new Map<number, CanvasBlock[]>();
      let autoSlot = 0;
      for (const gb of allGroupBlocks) {
        const s = gb.meta?.columnSlot ?? autoSlot;
        if (!slotMap.has(s)) { slotMap.set(s, []); autoSlot = s + 1; } else { autoSlot = s + 1; }
        slotMap.get(s)!.push(gb);
      }

      const columns: ColumnSlotData[] = [];
      const sortedSlots = [...slotMap.keys()].sort((a, b) => a - b);
      const defaultW = Math.floor(100 / sortedSlots.length);
      for (const s of sortedSlots) {
        const sBlocks = slotMap.get(s)!;
        const width = sBlocks[0]?.meta?.columnWidth || defaultW;
        columns.push({ slot: s, width, blocks: sBlocks });
      }

      rows.push({ groupId: gid, columns });
    } else {
      rows.push({ groupId: null, columns: [{ slot: 0, width: 100, blocks: [block] }] });
    }
  }
  return rows;
}

export function CanvasBlocksRenderer({ blocksJson }: { blocksJson: string }) {
  let blocks: CanvasBlock[];
  try {
    blocks = JSON.parse(blocksJson);
  } catch {
    return <p className="text-gray-400 italic">Erro ao renderizar blocos do canvas.</p>;
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return <p className="text-gray-400 italic">Sem conteudo.</p>;
  }

  const rows = groupBlocksIntoRows(blocks);

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        if (row.groupId) {
          return (
            <div key={row.groupId} className="flex gap-4 items-start">
              {row.columns.map(col => (
                <div key={`cbr-${row.groupId}-${col.slot}`} style={{ width: `${col.width}%` }}>
                  {col.blocks.map(block => (
                    <RenderBlock key={block.id} block={block} />
                  ))}
                </div>
              ))}
            </div>
          );
        }
        return <RenderBlock key={row.columns[0].blocks[0].id} block={row.columns[0].blocks[0]} />;
      })}
    </div>
  );
}

function RenderBlock({ block }: { block: CanvasBlock }) {
  if (block.type === 'divider') {
    return <hr className="border-gray-200 my-4" />;
  }

  if (block.type === 'image') {
    const ar = block.meta?.imageAspectRatio || 'auto';
    const mh = block.meta?.imageMaxHeight || 0;
    const hasRatio = ar !== 'auto';
    const frameStyle: React.CSSProperties = { overflow: 'hidden', borderRadius: '0.75rem' };
    if (hasRatio) frameStyle.aspectRatio = ar;
    if (mh > 0) frameStyle.maxHeight = `${mh}px`;
    return block.content ? (
      <figure className="my-4" style={{ width: `${block.meta?.imageWidth || 100}%`, margin: '1rem auto' }}>
        <div style={frameStyle}>
          <img
            src={block.content}
            alt={block.meta?.imageCaption || ''}
            className={clsx(
              'w-full rounded-xl',
              hasRatio && 'h-full',
              block.meta?.imageFit === 'contain' ? 'object-contain bg-gray-50' : 'object-cover',
            )}
            style={!hasRatio && mh <= 0 ? { maxHeight: '384px' } : undefined}
          />
        </div>
        {block.meta?.imageCaption && (
          <figcaption className="text-center text-xs text-gray-400 italic mt-2">{block.meta.imageCaption}</figcaption>
        )}
      </figure>
    ) : null;
  }

  if (block.type === 'callout') {
    const style = CALLOUT_STYLES[block.meta?.calloutColor || 'teal'];
    return (
      <div className={clsx('border-l-4 rounded-r-xl p-4 my-2', style.border, style.bg)}>
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">{style.icon}</span>
          <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content }} />
        </div>
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2">
        <div className="text-sm text-gray-500 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content }} />
      </blockquote>
    );
  }

  if (block.type === 'list') {
    const isNumbered = block.meta?.listStyle === 'numbered';
    const tag = isNumbered ? 'ol' : 'ul';
    const listCls = isNumbered ? 'list-decimal' : 'list-disc';
    const stripPrefix = (l: string) => l.replace(/^[\d]+[.)]\s*/, '').replace(/^[-*]\s*/, '').trim();
    const html = block.content.includes('<li>') ? block.content
      : `<${tag} class="${listCls} ml-5 space-y-1">${block.content.split('\n').filter(l => l.trim()).map(l => `<li class="text-sm text-gray-700 leading-relaxed">${stripPrefix(l)}</li>`).join('')}</${tag}>`;
    return (
      <div
        className="my-2 text-sm text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:space-y-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // heading, subheading, text
  const cls: Record<string, string> = {
    heading: 'text-2xl font-bold text-gray-900 leading-tight my-4',
    subheading: 'text-lg font-semibold text-gray-800 leading-tight my-3',
    text: 'text-sm text-gray-700 leading-relaxed my-2',
  };

  return (
    <div
      className={cls[block.type] || cls.text}
      style={(block.type === 'heading' || block.type === 'subheading') ? headingStyle : undefined}
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}