import {
  MasteryLevel,
  findKeyword,
  getAllKeywordTerms,
} from '@/app/data/keywords';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TextPart {
  type: 'text' | 'keyword';
  content: string;
  index: number;
}

export interface AnnotationStats {
  red: number;
  yellow: number;
  green: number;
  total: number;
}

export interface AnnotatedKeyword {
  keyword: ReturnType<typeof findKeyword>;
  mastery: MasteryLevel;
  notes: string[];
}

// ─── Parse text to detect keywords ───────────────────────────────────────────

export function parseTextWithKeywords(text: string): TextPart[] {
  const allTerms = getAllKeywordTerms();
  const parts: TextPart[] = [];
  let currentIndex = 0;
  const lowerText = text.toLowerCase();

  allTerms.forEach(term => {
    const escapedTerm = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Unicode-aware word boundaries for accented characters (é, á, ú, ã, etc.)
    const termRegex = new RegExp(`(?<!\\p{L})${escapedTerm}(?!\\p{L})`, 'giu');
    let match;

    while ((match = termRegex.exec(lowerText)) !== null) {
      if (match.index > currentIndex) {
        parts.push({ type: 'text', content: text.substring(currentIndex, match.index), index: currentIndex });
      }
      parts.push({ type: 'keyword', content: text.substring(match.index, match.index + term.length), index: match.index });
      currentIndex = match.index + term.length;
    }
  });

  if (currentIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(currentIndex), index: currentIndex });
  }

  // Sort by index and remove overlaps
  const sorted = parts.sort((a, b) => a.index - b.index);
  const clean: TextPart[] = [];
  let lastEnd = 0;

  sorted.forEach(part => {
    if (part.index >= lastEnd) {
      clean.push(part);
      lastEnd = part.index + part.content.length;
    }
  });

  return clean.length === 0 ? [{ type: 'text', content: text, index: 0 }] : clean;
}

// ─── Get annotation/keyword stats ────────────────────────────────────────────

export function getKeywordStats(keywordMastery: Record<string, MasteryLevel>): AnnotationStats {
  const allTerms = getAllKeywordTerms();
  let red = 0, yellow = 0, green = 0;

  allTerms.forEach(term => {
    const kw = findKeyword(term);
    if (!kw) return;
    const level = keywordMastery[kw.term] || kw.masteryLevel;
    if (level === 'red') red++;
    else if (level === 'yellow') yellow++;
    else green++;
  });

  return { red, yellow, green, total: allTerms.length };
}

// ─── Get sorted annotated keywords ───────────────────────────────────────────

export function getAnnotatedKeywords(
  keywordMastery: Record<string, MasteryLevel>,
  personalNotes: Record<string, string[]>,
): AnnotatedKeyword[] {
  return getAllKeywordTerms()
    .map(term => {
      const kw = findKeyword(term)!;
      return {
        keyword: kw,
        mastery: (keywordMastery[kw.term] || kw.masteryLevel) as MasteryLevel,
        notes: personalNotes[kw.term] || [],
      };
    })
    .sort((a, b) => {
      const order: Record<MasteryLevel, number> = { red: 0, yellow: 1, green: 2 };
      return order[a.mastery] - order[b.mastery];
    });
}
