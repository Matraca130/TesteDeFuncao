// ══════════════════════════════════════════════════════════════
// RESUMO CANVAS — Slim orchestrator
// Sub-modules: ./canvas/* (types, helpers, hooks, components)
// ══════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { headingStyle } from '@/app/design-system';
import { courses } from '@/app/data/courses';
import type { StudySummary, SummaryAnnotation } from '@/app/types/student';
import { Plus, Tag } from 'lucide-react';

// Canvas sub-modules
import type { CanvasBlock, BlockType } from './canvas/types';
import { A4_CONTENT_HEIGHT } from './canvas/types';
import {
  getAllTopics, makeBlock, contentToBlocks,
  groupBlocksIntoRows, extractKeywordsFromBlocks,
} from './canvas/helpers';
import { useBlockOperations } from './canvas/useBlockOperations';
import { useCanvasFormatting } from './canvas/useCanvasFormatting';
import { useCanvasPersistence } from './canvas/useCanvasPersistence';
import { useCanvasAI } from './canvas/useCanvasAI';
import { useCanvasExport } from './canvas/useCanvasExport';
import { useSmartPaste } from './canvas/useSmartPaste';
import { CanvasTopBar } from './canvas/CanvasTopBar';
import { FormattingToolbar } from './canvas/FormattingToolbar';
import { MetaPanel } from './canvas/MetaPanel';
import { PreviewBlock } from './canvas/PreviewBlock';
import { PdfBlocksRenderer } from './canvas/PdfRenderer';
import { ImagePickerModal, ColumnResizeHandle } from './canvas/ImageComponents';
import { KeywordPopoverProvider } from './canvas/KeywordPopover';
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

  // ── Topic selection ──
  const [courseId, setCourseId] = useState(existing?.courseId || courses[0]?.id || '');
  const [topicId, setTopicId] = useState(existing?.topicId || '');
  const [tags, setTags] = useState(existing?.tags?.join(', ') || '');
  const availableTopics = allTopics.filter(t => t.courseId === courseId);
  const selectedTopic = allTopics.find(t => t.courseId === courseId && t.topicId === topicId);
  const [canvasOpenedAt] = useState(Date.now());

  useEffect(() => {
    if (isNew && availableTopics.length > 0 && !availableTopics.find(t => t.topicId === topicId)) {
      setTopicId(availableTopics[0].topicId);
    }
  }, [courseId]);

  // ── Block operations ──
  const initialBlocks = useMemo(() => {
    if (existing?.canvasBlocks) {
      try { return JSON.parse(existing.canvasBlocks as any); } catch { /* fallback */ }
    }
    if (existing?.content) return contentToBlocks(existing.content);
    return [makeBlock('heading', selectedTopic?.topicTitle || ''), makeBlock('text', '')];
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
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showMetaPanel, setShowMetaPanel] = useState(true);

  // ── Annotations & keyword context ──
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [annotations, setAnnotations] = useState<SummaryAnnotation[]>(existing?.annotations || []);
  const [keywordMastery, setKeywordMastery] = useState<Record<string, string>>(existing?.keywordMastery || {});
  const [keywordNotes, setKeywordNotes] = useState<Record<string, string[]>>(existing?.keywordNotes || {});

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) setSelectedText(sel.toString().trim());
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  const summaryKeywordContext = useMemo(() => ({
    courseId, topicId, keywordMastery, keywordNotes,
    onUpdateMastery: (kw: string, mastery: string) => setKeywordMastery(prev => ({ ...prev, [kw]: mastery })),
    onAddNote: (kw: string, note: string) => setKeywordNotes(prev => ({ ...prev, [kw]: [...(prev[kw] || []), note] })),
  }), [courseId, topicId, keywordMastery, keywordNotes]);

  // ── Refs ──
  const canvasRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  // ── Extracted hooks ──
  const formatting = useCanvasFormatting();
  const { saving, handleSave } = useCanvasPersistence({
    courseId, topicId, tags, selectedTopic, existing, canvasOpenedAt,
    annotations, keywordMastery, keywordNotes,
    blocks, setBlocks, blocksRef, canvasRef, onSaved,
  });
  const { generating, handleGenerateAI } = useCanvasAI({ topicId, selectedTopic, pushUndo, setBlocks });
  const { exporting, handleExportPDF } = useCanvasExport({ pdfRef, selectedTopic });
  const { handleSmartPaste } = useSmartPaste({ blocks, pushUndo, setBlocks, setActiveBlockId });

  // ── Computed ──
  const wordCount = useMemo(() =>
    blocks.reduce((t, b) => { const tx = b.content.replace(/<[^>]*>/g, '').trim(); return t + (tx ? tx.split(/\s+/).length : 0); }, 0),
  [blocks]);
  const keywordCount = useMemo(() => extractKeywordsFromBlocks(blocks).length, [blocks]);
  const rows = useMemo(() => groupBlocksIntoRows(blocks), [blocks]);

  // ── Page breaks ──
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  useEffect(() => {
    if (!canvasRef.current || viewMode !== 'edit') { setPageBreaks([]); return; }
    const measure = () => {
      const el = canvasRef.current; if (!el) return;
      const breaks: number[] = []; let y = A4_CONTENT_HEIGHT;
      while (y < el.scrollHeight - 100) { breaks.push(y); y += A4_CONTENT_HEIGHT; }
      setPageBreaks(breaks);
    };
    const timer = setTimeout(measure, 100);
    const observer = new ResizeObserver(measure);
    observer.observe(canvasRef.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [viewMode, blocks]);
  const totalPages = pageBreaks.length + 1;

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); formatting.toggleKeyword(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleSave, formatting.toggleKeyword]);

  // ── Add block handler (used by toolbar and canvas) ──
  const handleAddBlockType = (type: BlockType) => {
    const newBlock = addBlockAt(type, addMenuPosition, addMenuColumnMeta || undefined);
    setShowAddMenu(false);
    setAddMenuColumnMeta(null);
    if (type === 'image') setTimeout(() => setShowImagePicker(newBlock.id), 100);
  };

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

      {/* ── META PANEL ── */}
      <MetaPanel
        isNew={isNew}
        courseId={courseId}
        onCourseChange={setCourseId}
        topicId={topicId}
        onTopicChange={setTopicId}
        tags={tags}
        onTagsChange={setTags}
        availableTopics={availableTopics}
        showMetaPanel={showMetaPanel}
        onToggleMetaPanel={() => setShowMetaPanel(!showMetaPanel)}
      />

      {/* ── FORMATTING TOOLBAR ── */}
      {viewMode === 'edit' && (
        <FormattingToolbar
          undoCount={undoStack.length}
          redoCount={redoStack.length}
          onUndo={undo}
          onRedo={redo}
          onApplyFormat={formatting.applyFormat}
          onApplyHighlight={formatting.applyHighlight}
          onRemoveHighlight={formatting.removeHighlight}
          onToggleKeyword={formatting.toggleKeyword}
          onInsertKeyword={formatting.insertKeywordFromPicker}
          savedSelectionRef={formatting.savedSelectionRef}
          showAddMenu={showAddMenu}
          onToggleAddMenu={() => { setAddMenuPosition(blocks.length - 1); setAddMenuColumnMeta(null); setShowAddMenu(!showAddMenu); }}
          onAddBlockType={handleAddBlockType}
          onCloseAddMenu={() => { setShowAddMenu(false); setAddMenuColumnMeta(null); }}
          annotations={annotations}
          onAddAnnotation={(ann) => setAnnotations(prev => [...prev, ann])}
          onRemoveAnnotation={(id) => setAnnotations(prev => prev.filter(a => a.id !== id))}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          selectedText={selectedText}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      )}

      {/* ── CANVAS AREA ── */}
      <div className="flex-1 overflow-y-auto bg-[#f5f2ea]" onClick={() => { setActiveBlockId(null); setShowTypeSelector(null); }}>
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
                                    setAddMenuPosition(globalIdx);
                                    setAddMenuColumnMeta({ columnGroup: row.groupId!, columnSlot: col.slot, columnWidth: col.width });
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
                                    setAddMenuPosition(globalIdx);
                                    setAddMenuColumnMeta({ columnGroup: row.groupId!, columnSlot: col.slot, columnWidth: col.width });
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
