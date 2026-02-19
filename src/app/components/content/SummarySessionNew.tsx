import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import clsx from 'clsx';
import { headingStyle } from '@/app/design-system';
import {
  ArrowLeft, FileText, Layers, Timer, Play, Pause,
  RotateCcw, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { getStudyContent } from '@/app/data/studyContent';
import { useApp } from '@/app/context/AppContext';
import { MasteryLevel, findKeyword } from '@/app/data/keywords';
import { getSectionImage } from '@/app/data/sectionImages';
import type { Model3D } from '@/app/data/courses';

// ── Local sub-modules ──
import {
  EditableKeyword,
  TextAnnotationsPanel,
  TextAnnotationPopup,
  SummaryToolbar,
  OutlineSidebar,
  KeywordsSidebar,
  Models3DGallery,
  highlighterStyles,
} from './summary';
import type { ToolType, AnnotationColor } from './summary';
import { useSummaryTimer } from './summary/useSummaryTimer';
import { useTextAnnotationManager } from './summary/useTextAnnotationManager';
import { useSummaryPersistence } from './summary/useSummaryPersistence';
import { parseTextWithKeywords, getKeywordStats, getAnnotatedKeywords } from './summary/keywordUtils';

// ─── Summary Session ─────────────────────────────────────────────────────────

export function SummarySession({ onBack, onStartFlashcards, topic, courseColor, accentColor }: any) {
  const { setActiveView, currentCourse, setQuizAutoStart } = useApp();

  // ── UI State ──
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showOutline, setShowOutline] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType>('cursor');
  const [highlightColor, setHighlightColor] = useState<AnnotationColor>('yellow');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Keyword State ──
  const [keywordMastery, setKeywordMastery] = useState<Record<string, MasteryLevel>>({});
  const [personalNotes, setPersonalNotes] = useState<Record<string, string[]>>({});

  // ── Hooks ──
  const timer = useSummaryTimer();
  const annotations = useTextAnnotationManager();

  const { summaryLoaded, saveStatus } = useSummaryPersistence(
    {
      courseId: currentCourse?.id,
      courseName: currentCourse?.name || '',
      topicId: topic?.id,
      topicTitle: topic?.title || '',
    },
    {
      textAnnotations: annotations.textAnnotations,
      keywordMastery,
      personalNotes,
      sessionElapsed: timer.sessionElapsed,
    },
    {
      setTextAnnotations: annotations.setTextAnnotations,
      setKeywordMastery,
      setPersonalNotes,
      setSessionElapsed: timer.setSessionElapsed,
    },
  );

  // ── Refs ──
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Study Content ──
  const studyContent = getStudyContent(topic.id);
  const sections = studyContent?.sections || [];

  // ── Counts ──
  const quizCount = topic?.quizzes?.length || 0;
  const flashcardCount = topic?.flashcards?.length || 0;
  const hasQuiz = quizCount > 0;
  const hasFlashcards = flashcardCount > 0;

  // ── 3D Models ──
  const related3DModels = useMemo(() => {
    const models: { topicTitle: string; model: Model3D; sectionTitle: string }[] = [];
    for (const semester of currentCourse.semesters) {
      for (const section of semester.sections) {
        for (const t of section.topics) {
          if (t.model3D) models.push({ topicTitle: t.title, model: t.model3D, sectionTitle: section.title });
        }
      }
    }
    return models;
  }, [currentCourse]);

  // ── Callbacks ──
  const handleMasteryChange = (term: string, level: MasteryLevel) => setKeywordMastery(prev => ({ ...prev, [term]: level }));
  const handleUpdateNotes = (term: string, notes: string[]) => setPersonalNotes(prev => ({ ...prev, [term]: notes }));
  const handleView3D = () => setActiveView('3d');
  const handleGoToQuiz = () => { setQuizAutoStart(true); setActiveView('quiz'); };
  const handleGoToFlashcards = () => { if (onStartFlashcards) onStartFlashcards(); };
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(false));
    }
  };

  const scrollToSection = (index: number) => {
    setCurrentSection(index);
    document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Effects ──

  // Close annotation popup on outside click
  useEffect(() => {
    if (!annotations.pendingAnnotation) return;
    const handler = (e: MouseEvent) => {
      const popup = document.getElementById('text-annotation-popup');
      if (popup && !popup.contains(e.target as Node)) annotations.closeAnnotation();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [annotations.pendingAnnotation]);

  // Fade-in on mount
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  // IntersectionObserver for auto-updating currentSection
  useEffect(() => {
    if (!sections.length || !mounted) return;
    const timeout = setTimeout(() => {
      const els = sections.map((_: any, idx: number) => document.getElementById(`section-${idx}`)).filter(Boolean) as HTMLElement[];
      if (!els.length) return;
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const idx = parseInt(visible[0].target.id.replace('section-', ''), 10);
          if (!isNaN(idx)) setCurrentSection(idx);
        }
      }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });
      els.forEach(el => observer.observe(el));
      (scrollContainerRef as any)._observer = observer;
    }, 300);
    return () => { clearTimeout(timeout); (scrollContainerRef as any)?._observer?.disconnect(); };
  }, [sections.length, mounted]);

  // ── Render Helpers ──

  const renderTextWithKeywords = (text: string) => {
    return parseTextWithKeywords(text).map((part, index) => {
      if (part.type === 'keyword') {
        const kwData = findKeyword(part.content);
        if (kwData) {
          return (
            <EditableKeyword
              key={`${part.content}-${part.index}-${index}`}
              keywordData={kwData}
              mastery={keywordMastery[kwData.term] || kwData.masteryLevel}
              onMasteryChange={handleMasteryChange}
              personalNotes={personalNotes[kwData.term] || []}
              onUpdateNotes={handleUpdateNotes}
              onView3D={kwData.has3DModel ? handleView3D : undefined}
            />
          );
        }
      }
      const matchedAnn = annotations.textAnnotations.find(a => a.originalText === part.content);
      return (
        <span
          key={`text-${part.index}-${index}`}
          className={clsx("cursor-pointer transition-all duration-150", !matchedAnn && "hover:bg-blue-50/50 rounded-sm")}
          style={matchedAnn ? { ...highlighterStyles[matchedAnn.color], borderRadius: '2px', padding: '0 1px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' } as React.CSSProperties : undefined}
          onClick={(e) => { e.stopPropagation(); annotations.openAnnotationFor(part.content, (e.target as HTMLElement).getBoundingClientRect()); }}
          title={matchedAnn ? "Trecho anotado" : "Clique para anotar"}
        >
          {part.content}
        </span>
      );
    });
  };

  const renderParagraph = (paragraph: string, pIndex: number) => {
    if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
      return <h3 key={pIndex} className="text-xl font-bold text-gray-800 mt-8 mb-4">{paragraph.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/:/g, '')}</h3>;
    }
    if (paragraph.trim().startsWith('*') && paragraph.includes(':')) {
      const parts = paragraph.split(':');
      const heading = parts[0].replace(/^\*/, '').trim();
      const contentText = parts.slice(1).join(':').trim();
      return (
        <div key={pIndex} className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-1 text-base">{heading}</h4>
          <div className="text-gray-600 leading-relaxed">{renderTextWithKeywords(contentText)}</div>
        </div>
      );
    }
    return <div key={pIndex} className="mb-4 text-justify leading-relaxed text-gray-600">{renderTextWithKeywords(paragraph)}</div>;
  };

  const renderStudyActionBar = (pageNum: number, totalPages: number, position: 'top' | 'bottom') => (
    <div className={clsx("flex items-center justify-between py-3 px-1", position === 'top' ? "mb-8 border-b border-gray-100" : "mt-10 pt-4 border-t border-gray-100")}>
      <span className="text-[11px] text-gray-400 font-medium tracking-wide">Pagina {pageNum} de {totalPages}</span>
    </div>
  );

  // ── Render Document Content ──

  let figureCounter = 0;

  const renderDocumentContent = () => {
    figureCounter = 0;
    const totalPages = sections.length || 1;
    return (
      <div className={clsx("min-h-screen p-12 md:p-20 flex flex-col transition-all", activeTool === 'highlight' && "cursor-text selection:bg-yellow-200 selection:text-black", activeTool === 'pen' && "cursor-crosshair")}>

        {/* Floating timer + actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="sticky top-4 z-50 ml-auto flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md rounded-full px-1.5 py-1 shadow-lg border border-gray-200/60">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Timer size={13} className={clsx("transition-colors", timer.isTimerRunning ? "text-emerald-500" : "text-gray-400")} />
                <span className={clsx("text-[12px] font-mono font-semibold tabular-nums tracking-wide", timer.isTimerRunning ? "text-gray-800" : "text-gray-400")}>{timer.formatTime(timer.sessionElapsed)}</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <button onClick={timer.toggleTimer} className={clsx("p-1.5 rounded-full transition-all active:scale-90", timer.isTimerRunning ? "text-gray-500 hover:bg-gray-100" : "text-emerald-500 hover:bg-emerald-50")} title={timer.isTimerRunning ? "Pausar" : "Retomar"}>
                {timer.isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button onClick={timer.resetTimer} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-all active:scale-90" title="Reiniciar"><RotateCcw size={11} /></button>
              <div className={clsx("flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all",
                saveStatus === 'saving' && "text-blue-500 bg-blue-50", saveStatus === 'saved' && "text-emerald-500 bg-emerald-50",
                saveStatus === 'error' && "text-red-500 bg-red-50", saveStatus === 'idle' && "text-gray-400 bg-gray-50")}>
                {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin" /> Salvando...</>}
                {saveStatus === 'saved' && <><CheckCircle2 size={10} /> Salvo</>}
                {saveStatus === 'error' && <><AlertCircle size={10} /> Erro</>}
                {saveStatus === 'idle' && summaryLoaded && annotations.textAnnotations.length > 0 && <><CheckCircle2 size={10} /> Sincronizado</>}
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <button onClick={handleGoToQuiz} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white transition-all active:scale-95"><FileText size={12} /><span>Quiz</span></button>
              <button onClick={handleGoToFlashcards} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-amber-600 bg-amber-50/80 hover:bg-amber-500 hover:text-white transition-all active:scale-95"><Layers size={12} /><span className="max-w-[90px] truncate">Flashcard</span></button>
            </div>
          </div>
        </div>

        {/* Document Header */}
        <div className="mb-12 pb-8 border-b border-gray-100">
          <div className={clsx("inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-3", courseColor, "text-white")}>Resumo Completo</div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" style={headingStyle}>{topic.title}</h1>
          <p className="mt-4 text-gray-500 text-sm">Material de estudo oficial AXON - Ultima atualizacao em 2025</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="font-medium text-gray-600">Palavras-chave:</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Nao domino</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Parcialmente</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Domino</span>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1">
          {sections.map((section: any, idx: number) => {
            const sectionImage = getSectionImage(topic.id, section.title);
            const imageOnLeft = idx % 2 === 1;
            let figNum: number | null = null;
            if (sectionImage) { figureCounter++; figNum = figureCounter; }
            return (
              <div key={idx}>
                <div id={`section-${idx}`} className="scroll-mt-24">
                  {renderStudyActionBar(idx + 1, totalPages, 'top')}
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 text-sm font-bold">{idx + 1}</span>
                    {section.title}
                  </h2>
                  {sectionImage && figNum !== null ? (
                    <div className={clsx("flex gap-8", imageOnLeft && "flex-row-reverse")}>
                      <div className="flex-1 min-w-0 prose prose-lg max-w-none text-gray-600 leading-relaxed">
                        {section.content.split('\n\n').map((p: string, i: number) => renderParagraph(p, i))}
                      </div>
                      <div className="w-72 shrink-0 self-stretch">
                        <div className="sticky top-6">
                          <figure className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                              <img src={sectionImage.url} alt={sectionImage.alt} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">Fig. {figNum}</div>
                            </div>
                            <figcaption className="px-4 py-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 bg-gray-50/80">
                              <span className="font-semibold text-gray-700">Fig. {figNum}</span> — {sectionImage.caption.replace(/^Fig\.\s*\d+\s*[—–-]\s*/, '')}
                            </figcaption>
                          </figure>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                      {section.content.split('\n\n').map((p: string, i: number) => renderParagraph(p, i))}
                    </div>
                  )}
                  {renderStudyActionBar(idx + 1, totalPages, 'bottom')}
                </div>
                {idx < sections.length - 1 && (
                  <div className="my-6 flex items-center justify-center gap-4 select-none">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Proxima secao</span>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Models3DGallery models={related3DModels} onView3D={handleView3D} />

        {/* Bottom actions */}
        <div className="mt-10 mb-4 flex justify-end">
          <div className="flex items-center gap-1.5">
            {hasQuiz && <button onClick={handleGoToQuiz} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white transition-all active:scale-95"><FileText size={13} /><span className="hidden sm:inline">Quiz ({quizCount})</span></button>}
            {hasFlashcards && <button onClick={handleGoToFlashcards} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-500 hover:text-white transition-all active:scale-95"><Layers size={13} /><span className="hidden sm:inline">Flashcard ({flashcardCount})</span></button>}
            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500 hover:text-white transition-all active:scale-95"><ArrowLeft size={13} /><span className="hidden sm:inline">Terminar</span></button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
          <span>Fim do documento</span><span>AXON &copy; 2025</span>
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────

  const content = (
    <div className={clsx("flex flex-col h-full bg-[#525659] z-20 transition-opacity duration-300", mounted ? "opacity-100" : "opacity-0", isFullscreen && "fixed inset-0 z-[100] w-screen h-screen")}>
      <SummaryToolbar
        onBack={() => { if (isFullscreen) toggleFullscreen(); onBack(); }}
        isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen}
        showOutline={showOutline} setShowOutline={setShowOutline}
        showAnnotations={showAnnotations} setShowAnnotations={setShowAnnotations}
        activeTool={activeTool} setActiveTool={setActiveTool}
        highlightColor={highlightColor}
        currentSection={currentSection} sectionsLength={sections.length}
        scrollToSection={scrollToSection}
        zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
      />

      <div className="flex-1 overflow-hidden flex">
        <OutlineSidebar showOutline={showOutline} sections={sections} currentSection={currentSection} scrollToSection={scrollToSection} />

        {showAnnotations ? (
          <PanelGroup direction="horizontal" autoSaveId="summary-keywords-split">
            <Panel defaultSize={70} minSize={40} className="flex flex-col bg-gray-100">
              <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={scrollContainerRef}>
                <div className="max-w-5xl mx-auto w-full bg-white min-h-full shadow-sm" style={{ zoom: `${zoom}%` }}>{renderDocumentContent()}</div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-black hover:bg-blue-500 transition-colors cursor-col-resize flex items-center justify-center z-40 focus:outline-none focus:bg-blue-500">
              <div className="w-0.5 h-8 bg-gray-700 rounded-full" />
            </PanelResizeHandle>
            <Panel defaultSize={30} minSize={20}>
              <KeywordsSidebar stats={getKeywordStats(keywordMastery)} annotatedKeywords={getAnnotatedKeywords(keywordMastery, personalNotes)} />
            </Panel>
          </PanelGroup>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-100" ref={scrollContainerRef}>
            <div className="max-w-5xl mx-auto w-full bg-white min-h-full shadow-sm" style={{ zoom: `${zoom}%` }}>{renderDocumentContent()}</div>
          </div>
        )}
      </div>

      {annotations.pendingAnnotation && (
        <TextAnnotationPopup
          pendingAnnotation={annotations.pendingAnnotation}
          annotationActiveTab={annotations.annotationActiveTab}
          setAnnotationActiveTab={annotations.setAnnotationActiveTab}
          annotationColor={annotations.annotationColor}
          setAnnotationColor={annotations.setAnnotationColor}
          annotationNoteInput={annotations.annotationNoteInput}
          setAnnotationNoteInput={annotations.setAnnotationNoteInput}
          annotationQuestionInput={annotations.annotationQuestionInput}
          setAnnotationQuestionInput={annotations.setAnnotationQuestionInput}
          annotationBotLoading={annotations.annotationBotLoading}
          onClose={annotations.closeAnnotation}
          onCreateAnnotation={annotations.createTextAnnotation}
        />
      )}

      {annotations.textAnnotations.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9998]">
          <TextAnnotationsPanel annotations={annotations.textAnnotations} onDelete={annotations.deleteTextAnnotation} botLoading={annotations.annotationBotLoading} />
        </div>
      )}
    </div>
  );

  if (isFullscreen) return createPortal(content, document.body);
  return content;
}
