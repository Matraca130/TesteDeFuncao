// ════════════════════════════════════════════════════════════════
// CANVAS HELPERS
// ════════════════════════════════════════════════════════════════
import { courses } from '@/app/data/courses';
import type { BlockType, CanvasBlock, TopicOption, RowGroup, ColumnSlotData } from './types';

// ── Unique ID generator ──
export function uid() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Block factory ──
export function makeBlock(type: BlockType, content = '', extraMeta?: Partial<CanvasBlock['meta']>): CanvasBlock {
  return {
    id: uid(),
    type,
    content: content || defaultContent(type),
    meta: {
      ...(type === 'callout' ? { calloutColor: 'teal' as const } : {}),
      ...(type === 'list' ? { listStyle: 'bullet' as const } : {}),
      ...(type === 'image' ? { imageWidth: 100, imageFit: 'cover' as const } : {}),
      ...extraMeta,
    },
  };
}

export function defaultContent(_type: BlockType): string {
  return '';
}

// ── Topic helpers ──
export function getAllTopics(): TopicOption[] {
  const result: TopicOption[] = [];
  for (const course of courses) {
    for (const sem of course.semesters) {
      for (const sec of sem.sections) {
        for (const topic of sec.topics) {
          result.push({ courseId: course.id, courseName: course.name, topicId: topic.id, topicTitle: topic.title, sectionTitle: sec.title });
        }
      }
    }
  }
  return result;
}

// ── Row grouping ──
export function groupBlocksIntoRows(blocks: CanvasBlock[]): RowGroup[] {
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

// ── Convert markdown-ish content to blocks ──
export function contentToBlocks(text: string): CanvasBlock[] {
  if (!text) return [makeBlock('text')];
  const lines = text.split('\n');
  const blocks: CanvasBlock[] = [];
  let currentParagraph: string[] = [];
  let currentListItems: string[] = [];
  let currentListIsNumbered = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join('<br/>');
      blocks.push(makeBlock('text', content));
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      blocks.push(makeBlock('list', currentListItems.join('\n'), {
        listStyle: currentListIsNumbered ? 'numbered' : 'bullet',
      }));
      currentListItems = [];
      currentListIsNumbered = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushParagraph(); flushList(); continue; }

    if (trimmed.startsWith('# ')) {
      flushParagraph(); flushList();
      blocks.push(makeBlock('heading', trimmed.slice(2)));
    } else if (trimmed.startsWith('## ')) {
      flushParagraph(); flushList();
      blocks.push(makeBlock('subheading', trimmed.slice(3)));
    } else if (trimmed.startsWith('### ')) {
      flushParagraph(); flushList();
      blocks.push(makeBlock('subheading', trimmed.slice(4)));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      if (currentListItems.length > 0 && currentListIsNumbered) flushList();
      const itemText = trimmed.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      currentListItems.push(itemText);
    } else if (/^\d+[\\.\\)]\s/.test(trimmed)) {
      flushParagraph();
      if (currentListItems.length > 0 && !currentListIsNumbered) flushList();
      currentListIsNumbered = true;
      const itemText = trimmed.replace(/^\d+[\\.\\)]\s*/, '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      currentListItems.push(itemText);
    } else if (trimmed.startsWith('> ')) {
      flushParagraph(); flushList();
      blocks.push(makeBlock('quote', trimmed.slice(2)));
    } else if (trimmed === '---') {
      flushParagraph(); flushList();
      blocks.push(makeBlock('divider'));
    } else {
      flushList();
      const formatted = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      currentParagraph.push(formatted);
    }
  }
  flushParagraph();
  flushList();
  return blocks.length > 0 ? blocks : [makeBlock('text')];
}

// ── Extract keywords from blocks for auto-tagging ──
export function extractKeywordsFromBlocks(blocksArr: CanvasBlock[]): string[] {
  const keywords = new Set<string>();
  blocksArr.forEach(b => {
    const matches = b.content.matchAll(/data-keyword="([^"]+)"/g);
    for (const m of matches) {
      keywords.add(m[1]);
    }
  });
  return Array.from(keywords);
}
