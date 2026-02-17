// ══════════════════════════════════════════════════════════════
// RESUMO CANVAS — Main editor orchestrator
// All sub-components live in ./canvas/*
// ══════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { headingStyle } from '@/app/design-system';
import { courses } from '@/app/data/courses';
import { keywordsDatabase } from '@/app/data/keywords';
import type { KeywordData } from '@/app/data/keywords';
import * as api from '@/app/services/studentApi';
import type { StudySummary } from '@/app/types/student';
import clsx from 'clsx';
import {
  Bold, Italic, Underline, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  Plus, X,
  ChevronUp, ChevronDown,
  ZoomIn, ZoomOut,
  Undo2, Redo2,
  Tag, Search,
} from 'lucide-react';

// Canvas sub-modules
import type { CanvasBlock, RowGroup } from './canvas/types';
import { HIGHLIGHT_COLORS, A4_CONTENT_HEIGHT } from './canvas/types';
import {
  getAllTopics, makeBlock, contentToBlocks, groupBlocksIntoRows,
  extractKeywordsFromBlocks,
} from './canvas/helpers';
import { useBlockOperations } from './canvas/useBlockOperations';
import { CanvasTopBar } from './canvas/CanvasTopBar';
import { ToolBtn, AddBlockMenu } from './canvas/ToolbarComponents';
import { PreviewBlock } from './canvas/PreviewBlock';
import { PdfBlocksRenderer } from './canvas/PdfRenderer';
import { ImagePickerModal, ColumnResizeHandle } from './canvas/ImageComponents';
import { KeywordPicker } from './canvas/KeywordPicker';
import { KeywordPopoverProvider } from './canvas/KeywordPopover';
import { AnnotationPanel } from './canvas/AnnotationPanel';
import { ReorderBlockWrapper } from './canvas/ReorderBlockWrapper';

// Re-export types so other files (AdminPanel, CanvasBlocksRenderer) can import from here
export type { CanvasBlock } from './canvas/types';
export type { BlockType } from './canvas/types';

const allTopics = getAllTopics();

// ══════════════════════════════════════════════════════════
// MAIN CANVAS EDITOR
// ══════════════════════════════════════════════════════════
interface ResumoCanvasProps {
  existing: StudySummary | null;
  onSaved: (s: StudySummary) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ResumoCanvas({ existing, onSaved, onCancel, onDelete }: ResumoCanvasProps) {
  const isNew = !existing;

  // ── Topic selection state ──
  const [courseId, setCourseId] = useState(existing?.courseId || courses[0]?.id || '');
  const [topicId, setTopicId] = useState(existing?.topicId || '');
  const [tags, setTags] = useState(existing?.tags?.join(', ') || '');
  const availableTopics = allTopics.filter(t => t.courseId === courseId);
  const selectedTopic = allTopics.find(t => t.courseId === courseId && t.topicId === topicId);

  // Track edit time
  const [canvasOpenedAt] = useState(Date.now());

  useEffect(() => {
    if (isNew && availableTopics.length > 0 && !availableTopics.find(t => t.topicId === topicId)) {
      setTopicId(availableTopics[0].topicId);
    }
  }, [courseId]);

  // ── Block operations (extracted hook) ──
  const initialBlocks = useMemo(() => {
    if (existing?.canvasBlocks) {
      try { return JSON.parse(existing.canvasBlocks as any); } catch { /* fallback */ }
    }
    if (existing?.content) {
      return contentToBlocks(existing.content);
    }
    return [
      makeBlock('heading', selectedTopic?.topicTitle || ''),
      makeBlock('text', ''),
    ];
  }, []);

  const ops = useBlockOperations(initialBlocks);
  const {
    blocks, setBlocks,
    activeBlockId, setActiveBlockId,
    undoStack, redoStack,
    showTypeSelector, setShowTypeSelector,
    pushUndo, undo, redo,
    updateBlock, deleteBlock, duplicateBlock, moveBlock,
    addBlockAt, addBlockBeside, ungroupBlock, changeBlockType, resizeColumn,
  } = ops;

  // ── UI state ──
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState<number>(-1);
  const [addMenuColumnMeta, setAddMenuColumnMeta] = useState<{ columnGroup: string; columnSlot: number; columnWidth: number } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showKeywordPicker, setShowKeywordPicker] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ── Annotations & keyword context state ──
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [annotations, setAnnotations] = useState<import('@/app/types/student').SummaryAnnotation[]>(existing?.annotations || []);
  const [keywordMastery, setKeywordMastery] = useState<Record<string, string>>(existing?.keywordMastery || {});
  const [keywordNotes, setKeywordNotes] = useState<Record<string, string[]>>(existing?.keywordNotes || {});

  // Track selected text for annotations
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        setSelectedText(sel.toString().trim());
      }
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  // Build summaryContext for KeywordPopover
  const summaryKeywordContext = useMemo(() => ({
    courseId,
    topicId,
    keywordMastery,
    keywordNotes,
    onUpdateMastery: (kw: string, mastery: string) => {
      setKeywordMastery(prev => ({ ...prev, [kw]: mastery }));
    },
    onAddNote: (kw: string, note: string) => {
      setKeywordNotes(prev => ({ ...prev, [kw]: [...(prev[kw] || []), note] }));
    },
  }), [courseId, topicId, keywordMastery, keywordNotes]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Keep a ref to the latest blocks so callbacks always have fresh state
  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  // ── Formatting ──
  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const applyHighlight = useCallback((color: string) => {
    document.execCommand('hiliteColor', false, color);
    setShowHighlightPicker(false);
  }, []);

  const removeHighlight = useCallback(() => {
    document.execCommand('hiliteColor', false, 'transparent');
    setShowHighlightPicker(false);
  }, []);

  // ── Keyword toggle (Palavra-chave) ──
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

  // ── Insert keyword from picker ──
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

    setShowKeywordPicker(false);
    setKeywordSearch('');
  }, []);

  // ── Build a fully-synced snapshot from DOM ──
  const getSyncedBlocks = useCallback((): CanvasBlock[] => {
    const current = blocksRef.current.map(b => ({ ...b, meta: { ...b.meta } }));
    if (!canvasRef.current) return current;
    const editables = canvasRef.current.querySelectorAll<HTMLDivElement>('[data-block-id][contenteditable="true"]');
    if (editables.length === 0) return current;
    const updates: Record<string, string> = {};
    editables.forEach(el => {
      const blockId = el.getAttribute('data-block-id');
      if (blockId) updates[blockId] = el.innerHTML;
    });
    if (Object.keys(updates).length === 0) return current;
    return current.map(b => updates[b.id] !== undefined ? { ...b, content: updates[b.id] } : b);
  }, []);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!courseId || !topicId) return;
    const currentBlocks = getSyncedBlocks();
    setBlocks(currentBlocks);
    setSaving(true);
    try {
      const manualTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const extractedKw = extractKeywordsFromBlocks(currentBlocks);
      const tagsArray = Array.from(new Set([...manualTags, ...extractedKw]));
      const plainContent = currentBlocks
        .filter(b => b.type !== 'divider' && b.type !== 'image')
        .map(b => {
          const text = b.content.replace(/<[^>]*>/g, '').trim();
          if (b.type === 'heading') return `# ${text}`;
          if (b.type === 'subheading') return `## ${text}`;
          if (b.type === 'quote') return `> ${text}`;
          if (b.type === 'list') return text.split('\n').map(l => `- ${l.replace(/<[^>]*>/g, '').trim()}`).join('\n');
          return text;
        })
        .filter(Boolean)
        .join('\n\n');

      const sessionMinutes = Math.max(1, Math.round((Date.now() - canvasOpenedAt) / 60000));
      const prevEditTime = existing?.editTimeMinutes || 0;

      const saved = await api.saveSummary(courseId, topicId, {
        content: plainContent,
        canvasBlocks: JSON.stringify(currentBlocks),
        tags: tagsArray,
        courseName: selectedTopic?.courseName || courseId,
        topicTitle: selectedTopic?.topicTitle || topicId,
        editTimeMinutes: prevEditTime + sessionMinutes,
        annotations,
        keywordMastery,
        keywordNotes,
      });
      onSaved(saved);
    } catch (err: any) {
      console.error('[ResumoCanvas] save:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [courseId, topicId, tags, selectedTopic, onSaved, canvasOpenedAt, existing, getSyncedBlocks, setBlocks, annotations, keywordMastery, keywordNotes]);

  // ── Generate AI Content ──
  const handleGenerateAI = useCallback(async () => {
    if (!topicId) return;
    setGenerating(true);
    try {
      const { projectId, publicAnonKey } = await import('/utils/supabase/info');
      const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;
      const res = await fetch(`${BASE}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          concept: selectedTopic?.topicTitle || topicId,
          context: `Materia: ${selectedTopic?.courseName}. Secao: ${selectedTopic?.sectionTitle}. Formato: resumo detalhado para estudo de medicina com secoes, bullet points e termos importantes em negrito.`,
        }),
      });
      if (!res.ok) throw new Error(`AI error ${res.status}`);
      const data = await res.json();
      if (data.explanation) {
        pushUndo();
        const aiBlocks = contentToBlocks(data.explanation);
        setBlocks(prev => [...prev, makeBlock('divider'), ...aiBlocks]);
      }
    } catch (err: any) {
      console.error('[ResumoCanvas] AI:', err);
      alert(`Erro IA: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }, [topicId, selectedTopic, pushUndo, setBlocks]);

  // ── Export PDF ──
  const handleExportPDF = useCallback(async () => {
    if (!pdfRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const title = selectedTopic?.topicTitle || 'Resumo';
      const courseName = selectedTopic?.courseName || '';
      const filename = `${courseName ? courseName + ' - ' : ''}${title}.pdf`.replace(/[/\\?%*:|"<>]/g, '-');

      await html2pdf()
        .set({
          margin: [12, 14, 12, 14],
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            onclone: (clonedDoc: Document) => {
              clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(pdfRef.current)
        .save();
    } catch (err: any) {
      console.error('[ResumoCanvas] html2pdf failed, using print fallback:', err);
      try {
        const printWin = window.open('', '_blank');
        if (printWin && pdfRef.current) {
          const pTitle = selectedTopic?.topicTitle || 'Resumo';
          printWin.document.write(`<!DOCTYPE html><html><head><title>${pTitle}</title><style>
            body{font-family:Georgia,serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
            img{max-width:100%;border-radius:8px}
            @media print{body{padding:20px}}
          </style></head><body>${pdfRef.current.innerHTML}</body></html>`);
          printWin.document.close();
          setTimeout(() => { printWin.print(); }, 500);
        }
      } catch (fallbackErr: any) {
        console.error('[ResumoCanvas] print fallback also failed:', fallbackErr);
        alert('Erro ao exportar. Tente Ctrl+P para imprimir como PDF.');
      }
    } finally {
      setExporting(false);
    }
  }, [selectedTopic]);

  // ── Smart Paste ──
  const handleSmartPaste = useCallback((blockId: string, e: React.ClipboardEvent<HTMLDivElement>) => {
    const plain = e.clipboardData.getData('text/plain');
    const paragraphs = plain.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length < 2) return;
    const newBlocks = contentToBlocks(plain);
    if (newBlocks.length < 2) return;
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    e.preventDefault();
    const currentHtml = e.currentTarget?.innerHTML || '';
    pushUndo();
    const currentBlock = blocks[idx];
    const textContent = currentHtml.replace(/<[^>]*>/g, '').trim();
    const isEmpty = !textContent;
    setBlocks(prev => {
      const next = [...prev];
      if (isEmpty) {
        const metaOverrides = currentBlock.meta?.columnGroup
          ? { columnGroup: currentBlock.meta.columnGroup, columnWidth: currentBlock.meta.columnWidth, columnSlot: currentBlock.meta.columnSlot }
          : {};
        const parsed = newBlocks.map(nb => ({ ...nb, meta: { ...nb.meta, ...metaOverrides } }));
        next.splice(idx, 1, ...parsed);
      } else {
        next[idx] = { ...next[idx], content: currentHtml };
        next.splice(idx + 1, 0, ...newBlocks);
      }
      return next;
    });
    setActiveBlockId(newBlocks[newBlocks.length - 1]?.id || blockId);
  }, [blocks, pushUndo, setBlocks, setActiveBlockId]);

  // ── Word count ──
  const wordCount = useMemo(() => {
    return blocks.reduce((total, b) => {
      const text = b.content.replace(/<[^>]*>/g, '').trim();
      return total + (text ? text.split(/\s+/).length : 0);
    }, 0);
  }, [blocks]);

  // ── Keyword count ──
  const keywordCount = useMemo(() => {
    return extractKeywordsFromBlocks(blocks).length;
  }, [blocks]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggleKeyword(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleSave, toggleKeyword]);

  // Group blocks into rows for rendering
  const rows = useMemo(() => groupBlocksIntoRows(blocks), [blocks]);

  // ── Page break indicators ──
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  useEffect(() => {
    if (!canvasRef.current || viewMode !== 'edit') { setPageBreaks([]); return; }
    const measure = () => {
      const el = canvasRef.current;
      if (!el) return;
      const height = el.scrollHeight;
      const breaks: number[] = [];
      let y = A4_CONTENT_HEIGHT;
      while (y < height - 100) { breaks.push(y); y += A4_CONTENT_HEIGHT; }
      setPageBreaks(breaks);
    };
    const timer = setTimeout(measure, 100);
    const observer = new ResizeObserver(measure);
    observer.observe(canvasRef.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [viewMode, blocks]);

  const totalPages = pageBreaks.length + 1;

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── TOP BAR ── */}
      <CanvasTopBar
        isNew={isNew}
        topicTitle={selectedTopic?.topicTitle || 'Editar Resumo'}
        wordCount={wordCount}
        keywordCount={keywordCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        generating={generating}
        onGenerateAI={handleGenerateAI}
        topicId={topicId}
        exporting={exporting}
        onExportPDF={handleExportPDF}
        onDelete={!isNew ? onDelete : undefined}
        saving={saving}
        onSave={handleSave}
        onCancel={onCancel}
      />

      {/* ── META PANEL (collapsible) ── */}
      <AnimatePresence>
        {showMetaPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white border-b border-gray-200"
          >
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Materia</label>
                  <select value={courseId} onChange={e => setCourseId(e.target.value)} disabled={!isNew}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Topico</label>
                  <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!isNew}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60">
                    <option value="">Selecionar...</option>
                    {availableTopics.map(t => <option key={t.topicId} value={t.topicId}>{t.topicTitle}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Tags</label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="musculos, nervos..."
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowMetaPanel(!showMetaPanel)}
        className="w-full py-1 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-400 font-semibold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
      >
        {showMetaPanel ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {showMetaPanel ? 'Recolher detalhes' : 'Expandir detalhes'}
      </button>

      {/* ── FORMATTING TOOLBAR ── */}
      {viewMode === 'edit' && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1 flex-wrap sticky top-[52px] z-20">
          {/* Undo/Redo */}
          <ToolBtn icon={<Undo2 size={15} />} label="Desfazer" onClick={undo} disabled={undoStack.length === 0} />
          <ToolBtn icon={<Redo2 size={15} />} label="Refazer" onClick={redo} disabled={redoStack.length === 0} />
          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Text formatting */}
          <ToolBtn icon={<Bold size={15} />} label="Negrito" onClick={() => applyFormat('bold')} />
          <ToolBtn icon={<Italic size={15} />} label="Italico" onClick={() => applyFormat('italic')} />
          <ToolBtn icon={<Underline size={15} />} label="Sublinhado" onClick={() => applyFormat('underline')} />
          <ToolBtn icon={<Strikethrough size={15} />} label="Riscado" onClick={() => applyFormat('strikeThrough')} />
          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Highlight */}
          <div className="relative">
            <ToolBtn
              icon={<Highlighter size={15} />}
              label="Subrayar"
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              active={showHighlightPicker}
            />
            <AnimatePresence>
              {showHighlightPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-1.5 z-50"
                >
                  {HIGHLIGHT_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => applyHighlight(c.css)}
                      className={clsx('w-7 h-7 rounded-lg transition-all hover:scale-110', c.bg, 'border border-gray-200/60 hover:ring-2', c.ring)}
                      title={c.label}
                    />
                  ))}
                  <button
                    onClick={removeHighlight}
                    className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover destaque"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Keyword — mark selected text OR open picker */}
          <ToolBtn icon={<Tag size={15} />} label="Marcar palavra-chave (Ctrl+K)" onClick={toggleKeyword} />
          <div className="relative">
            <button
              onClick={() => {
                if (!showKeywordPicker) {
                  const sel = window.getSelection();
                  if (sel && sel.rangeCount > 0) {
                    savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                  }
                }
                setShowKeywordPicker(!showKeywordPicker);
                setKeywordSearch('');
              }}
              className={clsx(
                'p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1',
                showKeywordPicker ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              title="Inserir palavra-chave do banco de dados"
            >
              <Search size={13} />
              <span className="hidden sm:inline text-[11px]">Buscar</span>
            </button>
            <AnimatePresence>
              {showKeywordPicker && (
                <KeywordPicker
                  search={keywordSearch}
                  onSearchChange={setKeywordSearch}
                  onSelect={insertKeywordFromPicker}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Alignment */}
          <ToolBtn icon={<AlignLeft size={15} />} label="Esquerda" onClick={() => applyFormat('justifyLeft')} />
          <ToolBtn icon={<AlignCenter size={15} />} label="Centro" onClick={() => applyFormat('justifyCenter')} />
          <ToolBtn icon={<AlignRight size={15} />} label="Direita" onClick={() => applyFormat('justifyRight')} />
          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Add block */}
          <div className="relative">
            <button
              onClick={() => { setAddMenuPosition(blocks.length - 1); setAddMenuColumnMeta(null); setShowAddMenu(!showAddMenu); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <Plus size={14} /> Bloco
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <AddBlockMenu
                  onAdd={(type) => {
                    const newBlock = addBlockAt(type, addMenuPosition, addMenuColumnMeta || undefined);
                    setShowAddMenu(false);
                    setAddMenuColumnMeta(null);
                    if (type === 'image') {
                      setTimeout(() => setShowImagePicker(newBlock.id), 100);
                    }
                  }}
                  onClose={() => { setShowAddMenu(false); setAddMenuColumnMeta(null); }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Annotations */}
          <AnnotationPanel
            annotations={annotations}
            onAdd={(ann) => setAnnotations(prev => [...prev, ann])}
            onRemove={(id) => setAnnotations(prev => prev.filter(a => a.id !== id))}
            isOpen={showAnnotations}
            onToggle={() => setShowAnnotations(!showAnnotations)}
            selectedText={selectedText}
          />

          {/* Spacer + Zoom */}
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <button onClick={() => setZoom(z => Math.max(70, z - 10))} className="p-1 rounded hover:bg-gray-100 transition-colors"><ZoomOut size={14} /></button>
            <span className="w-8 text-center font-mono">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 rounded hover:bg-gray-100 transition-colors"><ZoomIn size={14} /></button>
          </div>
        </div>
      )}

      {/* ── CANVAS AREA ── */}
      <div className="flex-1 overflow-y-auto bg-[#f5f2ea]" onClick={() => { setActiveBlockId(null); setShowHighlightPicker(false); setShowKeywordPicker(false); setShowTypeSelector(null); }}>
        <div className="max-w-[820px] mx-auto py-10 px-5">
          <motion.div
            ref={canvasRef}
            className="relative bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.06),0_6px_24px_rgba(0,0,0,0.05)] border border-gray-200/40 min-h-[800px]"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', padding: '56px 64px 48px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* A4 page break indicators */}
            {viewMode === 'edit' && pageBreaks.map((y, i) => (
              <div key={`pb-${i}`} className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: `${y}px` }}>
                <div className="mx-8 border-t border-dashed border-gray-300/50" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#f5f2ea] px-3 py-0.5 rounded-full border border-gray-200/40">
                  <span className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Pagina {i + 2}</span>
                </div>
              </div>
            ))}

            {viewMode === 'edit' ? (
              <KeywordPopoverProvider summaryContext={summaryKeywordContext}>
              <div className="space-y-2.5">
                <AnimatePresence>
                {rows.map((row) => {
                  if (row.groupId) {
                    return (
                      <motion.div key={row.groupId} exit={{ opacity: 0, height: 0, overflow: 'hidden' }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex gap-3 items-stretch">
                        {row.columns.map((col, colIdx) => (
                          <div key={`${row.groupId}-slot-${col.slot}`} className="relative min-w-0" style={{ width: `${col.width}%` }}>
                            <div className="space-y-2">
                              <AnimatePresence>
                              {col.blocks.map((block) => (
                                <motion.div key={block.id} exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                                <ReorderBlockWrapper
                                  block={block}
                                  isActive={activeBlockId === block.id}
                                  onFocus={() => setActiveBlockId(block.id)}
                                  onUpdate={(updates) => updateBlock(block.id, updates)}
                                  onDelete={() => deleteBlock(block.id)}
                                  onDuplicate={() => duplicateBlock(block.id)}
                                  onMoveUp={() => moveBlock(block.id, -1)}
                                  onMoveDown={() => moveBlock(block.id, 1)}
                                  onAddBelow={() => {
                                    const globalIdx = blocks.findIndex(b => b.id === block.id);
                                    const colMeta = { columnGroup: row.groupId!, columnSlot: col.slot, columnWidth: col.width };
                                    setAddMenuPosition(globalIdx);
                                    setAddMenuColumnMeta(colMeta);
                                    setShowAddMenu(true);
                                  }}
                                  onAddBeside={(hw) => addBlockBeside(block.id, hw)}
                                  onUngroup={() => ungroupBlock(block.id)}
                                  onPickImage={() => setShowImagePicker(block.id)}
                                  onChangeType={(t) => changeBlockType(block.id, t)}
                                  showTypeSelector={showTypeSelector === block.id}
                                  onToggleTypeSelector={() => setShowTypeSelector(showTypeSelector === block.id ? null : block.id)}
                                  onResizeColumn={(w) => resizeColumn(block.id, w)}
                                  isFirst={false}
                                  isLast={false}
                                  isInColumn={true}
                                  columnCount={row.columns.length}
                                  onSmartPaste={(e) => handleSmartPaste(block.id, e)}
                                />
                                </motion.div>
                              ))}
                              </AnimatePresence>
                              {activeBlockId && col.blocks.some(b => b.id === activeBlockId) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const lastBlock = col.blocks[col.blocks.length - 1];
                                    const globalIdx = blocks.findIndex(b => b.id === lastBlock.id);
                                    const colMeta = { columnGroup: row.groupId!, columnSlot: col.slot, columnWidth: col.width };
                                    setAddMenuPosition(globalIdx);
                                    setAddMenuColumnMeta(colMeta);
                                    setShowAddMenu(true);
                                  }}
                                  className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-gray-300 hover:text-teal-500 hover:border-teal-400 hover:bg-teal-50/30 transition-all flex items-center justify-center gap-1 text-[10px] font-semibold"
                                >
                                  <Plus size={10} /> Adicionar nesta coluna
                                </button>
                              )}
                            </div>
                            {colIdx < row.columns.length - 1 && (
                              <ColumnResizeHandle
                                blockId={col.blocks[0].id}
                                currentWidth={col.width}
                                onResize={(w) => resizeColumn(col.blocks[0].id, w)}
                              />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    );
                  }
                  // Solo block
                  const block = row.columns[0].blocks[0];
                  const globalIdx = blocks.findIndex(b => b.id === block.id);
                  return (
                    <motion.div key={block.id} exit={{ opacity: 0, x: -20, height: 0, overflow: 'hidden' }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                    <ReorderBlockWrapper
                      block={block}
                      isActive={activeBlockId === block.id}
                      onFocus={() => setActiveBlockId(block.id)}
                      onUpdate={(updates) => updateBlock(block.id, updates)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onMoveUp={() => moveBlock(block.id, -1)}
                      onMoveDown={() => moveBlock(block.id, 1)}
                      onAddBelow={() => { setAddMenuPosition(globalIdx); setAddMenuColumnMeta(null); setShowAddMenu(true); }}
                      onAddBeside={(hw) => addBlockBeside(block.id, hw)}
                      onUngroup={() => {}}
                      onPickImage={() => setShowImagePicker(block.id)}
                      onChangeType={(t) => changeBlockType(block.id, t)}
                      showTypeSelector={showTypeSelector === block.id}
                      onToggleTypeSelector={() => setShowTypeSelector(showTypeSelector === block.id ? null : block.id)}
                      onResizeColumn={() => {}}
                      isFirst={globalIdx === 0}
                      isLast={globalIdx === blocks.length - 1}
                      isInColumn={false}
                      columnCount={1}
                      onSmartPaste={(e) => handleSmartPaste(block.id, e)}
                    />
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
              </KeywordPopoverProvider>
            ) : (
              /* Preview mode */
              <KeywordPopoverProvider summaryContext={summaryKeywordContext}>
              <div className="space-y-5">
                {rows.map((row) => {
                  if (row.groupId) {
                    return (
                      <div key={row.groupId} className="flex gap-5 items-start">
                        {row.columns.map(col => (
                          <div key={`prev-${row.groupId}-${col.slot}`} style={{ width: `${col.width}%` }}>
                            {col.blocks.map(block => (
                              <PreviewBlock key={block.id} block={block} />
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <PreviewBlock key={row.columns[0].blocks[0].id} block={row.columns[0].blocks[0]} />;
                })}
              </div>
              </KeywordPopoverProvider>
            )}

            {/* Add block hint */}
            {viewMode === 'edit' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => { setAddMenuPosition(blocks.length - 1); setAddMenuColumnMeta(null); setShowAddMenu(true); }}
                className="w-full mt-8 py-5 border-2 border-dashed border-gray-200/70 rounded-xl text-gray-300 hover:text-teal-500 hover:border-teal-300 hover:bg-teal-50/20 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Adicionar bloco
              </motion.button>
            )}

            {/* Page footer */}
            <div className="mt-10 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-300 font-medium" style={headingStyle}>
                {selectedTopic?.topicTitle || 'Resumo'}
              </span>
              <span className="text-[10px] text-gray-300 font-medium">
                {totalPages} {totalPages === 1 ? 'pagina' : 'paginas'} &middot; {wordCount} palavras
                {keywordCount > 0 && <span> &middot; <Tag size={9} className="inline mb-px" /> {keywordCount} {keywordCount === 1 ? 'palavra-chave' : 'palavras-chave'}</span>}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── HIDDEN PDF CONTAINER ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px' }} aria-hidden="true">
        <div ref={pdfRef} style={{ padding: '32px 40px', background: 'white', fontFamily: 'Georgia, serif', color: '#111' }}>
          <div style={{ borderBottom: '2px solid #0d9488', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: 0, fontFamily: 'Georgia, serif' }}>
              {selectedTopic?.topicTitle || 'Resumo'}
            </h1>
            {selectedTopic?.courseName && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {selectedTopic.courseName} &mdash; {selectedTopic.sectionTitle}
              </p>
            )}
            {tags && (
              <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
                Tags: {tags}
              </p>
            )}
            {keywordCount > 0 && (
              <p style={{ fontSize: '10px', color: '#0d9488', marginTop: '4px' }}>
                Palavras-chave: {extractKeywordsFromBlocks(blocks).join(', ')}
              </p>
            )}
          </div>
          <PdfBlocksRenderer rows={rows} />
        </div>
      </div>

      {/* ── IMAGE PICKER MODAL ── */}
      <AnimatePresence>
        {showImagePicker && (
          <ImagePickerModal
            onSelect={(url) => {
              updateBlock(showImagePicker, { content: url });
              setShowImagePicker(null);
            }}
            onClose={() => setShowImagePicker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
