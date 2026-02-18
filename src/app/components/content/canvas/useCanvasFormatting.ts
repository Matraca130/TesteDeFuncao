// ══════════════════════════════════════════════════════════════
// CANVAS FORMATTING — text formatting, highlights, keywords
// ══════════════════════════════════════════════════════════════
import { useCallback, useRef } from 'react';
import { keywordsDatabase } from '@/app/data/keywords';
import type { KeywordData } from '@/app/data/keywords';

export interface UseCanvasFormattingReturn {
  applyFormat: (command: string, value?: string) => void;
  applyHighlight: (color: string) => void;
  removeHighlight: () => void;
  toggleKeyword: () => void;
  insertKeywordFromPicker: (kw: KeywordData) => void;
  savedSelectionRef: React.MutableRefObject<Range | null>;
}

export function useCanvasFormatting(): UseCanvasFormattingReturn {
  const savedSelectionRef = useRef<Range | null>(null);

  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const applyHighlight = useCallback((color: string) => {
    document.execCommand('hiliteColor', false, color);
  }, []);

  const removeHighlight = useCallback(() => {
    document.execCommand('hiliteColor', false, 'transparent');
  }, []);

  const toggleKeyword = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const anchor = sel.anchorNode;
    const parentEl = anchor?.nodeType === 3 ? anchor.parentElement : (anchor as HTMLElement);
    const existingKw = parentEl?.closest('.keyword-mark') as HTMLElement | null;
    if (existingKw) {
      const text = document.createTextNode(existingKw.textContent || '');
      existingKw.parentNode?.replaceChild(text, existingKw);
      return;
    }

    if (sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const text = range.toString().trim();
    if (!text) return;

    const kwData = keywordsDatabase.find(kw =>
      kw.term.toLowerCase() === text.toLowerCase()
    );
    const mastery = kwData ? kwData.masteryLevel : 'default';

    const span = document.createElement('span');
    span.className = `keyword-mark keyword-${mastery}`;
    span.setAttribute('data-keyword', text.toLowerCase());

    try {
      range.surroundContents(span);
    } catch {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    sel.removeAllRanges();
  }, []);

  const insertKeywordFromPicker = useCallback((kw: KeywordData) => {
    const mastery = kw.masteryLevel;
    const term = kw.term;

    const sel = window.getSelection();
    const range = savedSelectionRef.current;
    if (sel && range) {
      sel.removeAllRanges();
      sel.addRange(range);

      if (!sel.isCollapsed) {
        const span = document.createElement('span');
        span.className = `keyword-mark keyword-${mastery}`;
        span.setAttribute('data-keyword', term.toLowerCase());
        try { range.surroundContents(span); } catch {
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
      } else {
        const span = document.createElement('span');
        span.className = `keyword-mark keyword-${mastery}`;
        span.setAttribute('data-keyword', term.toLowerCase());
        span.textContent = term;
        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      savedSelectionRef.current = null;
    }
  }, []);

  return {
    applyFormat,
    applyHighlight,
    removeHighlight,
    toggleKeyword,
    insertKeywordFromPicker,
    savedSelectionRef,
  };
}
