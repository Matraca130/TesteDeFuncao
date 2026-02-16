import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { AdminBanner, BackendStatusBadge } from '@/app/components/shared/AdminBanner';
import { headingStyle } from '@/app/design-system';
import type { Course, Section, Topic, Semester } from '@/app/data/courses';
import { studyContents } from '@/app/data/studyContent';
import { getSectionImage } from '@/app/data/sectionImages';
import { findKeyword, masteryConfig } from '@/app/data/keywords';
import { CanvasBlocksRenderer } from './CanvasBlocksRenderer';
import { KeywordPopoverProvider } from './canvas/KeywordPopover';
import * as api from '@/app/services/studentApi';
import type { StudySummary } from '@/app/types/student';
import clsx from 'clsx';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  BookOpen, Clock, Play, Pause, Wrench,
  Search, ZoomIn, ZoomOut, Bookmark,
  Layers, GraduationCap, Loader2,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════
// STUDY VIEW — Sessao de Estudos
// Sub-views: 'plan' (Plano de Estudos) | 'session' (Lector PDF)
// ══════════════════════════════════════════════════════════

type StudySubView = 'plan' | 'session';

export function StudyView() {
  const { currentCourse, setCurrentTopic } = useApp();
  const [subView, setSubView] = useState<StudySubView>('plan');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const handleStartSession = useCallback((topic: Topic, section: Section) => {
    setActiveTopic(topic);
    setActiveSectionId(section.id);
    setCurrentTopic(topic);
    setSubView('session');
  }, [setCurrentTopic]);

  const handleBackToPlan = useCallback(() => { setSubView('plan'); }, []);

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {subView === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <StudyPlan course={currentCourse} selectedSection={selectedSection} onSelectSection={setSelectedSection} onStartSession={handleStartSession} />
          </motion.div>
        )}
        {subView === 'session' && activeTopic && (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <StudySession course={currentCourse} topic={activeTopic} sectionId={activeSectionId} onBack={handleBackToPlan} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STUDY PLAN
// ══════════════════════════════════════════════════════════

function StudyPlan({ course, selectedSection, onSelectSection, onStartSession }: {
  course: Course; selectedSection: Section | null;
  onSelectSection: (s: Section | null) => void;
  onStartSession: (topic: Topic, section: Section) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));

  const totalTopics = course.semesters.reduce((s, sem) => s + sem.sections.reduce((ss, sec) => ss + sec.topics.length, 0), 0);
  const totalSections = course.semesters.reduce((s, sem) => s + sem.sections.length, 0);

  return (
    <div className="h-full flex bg-[#f5f2ea]">
      {/* Left nav */}
      <div className="w-[220px] shrink-0 bg-white border-r border-gray-200/80 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => onSelectSection(null)} className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
            <ChevronLeft size={14} /> Voltar aos temas
          </button>
        </div>
        <div className="p-3">
          {course.semesters.map(sem => (
            <div key={sem.id} className="mb-4">
              {sem.sections.map(sec => (
                <div key={sec.id} className="mb-3">
                  <button onClick={() => toggleExpand(sec.id)} className="flex items-center justify-between w-full text-left">
                    <span className="text-sm font-semibold text-gray-900">{sec.title}</span>
                    {expandedSections[sec.id] !== false ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>
                  {expandedSections[sec.id] !== false && (
                    <div className="mt-1 ml-1 space-y-0.5">
                      {sec.topics.map(t => (
                        <button key={t.id} onClick={() => onStartSession(t, sec)}
                          className={clsx('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all', selectedSection?.id === sec.id ? 'text-teal-700 bg-teal-50 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')}>
                          {t.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main plan content */}
      <div className="flex-1 overflow-y-auto">
        <AxonPageHeader
          title="Plano de Estudos"
          subtitle={course.name}
          statsLeft={<p className="text-gray-500 text-sm">{totalSections} secoes &middot; {totalTopics} topicos disponiveis</p>}
          actionButton={
            <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-teal-600/20 flex items-center gap-2">
              <Play size={16} /> Continuar Estudando
            </button>
          }
        />

        <div className="px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Global admin + backend status indicators */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <AdminBanner context="Resumos e conteudo" variant="inline" />
              <BackendStatusBadge module="Estudar" status="local" message="Preview com dados locais" />
            </div>

            {course.semesters.map(semester => (
              <SemesterBlock key={semester.id} semester={semester} onOpenSection={onSelectSection} onStartSession={onStartSession} selectedSection={selectedSection} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Semester block ──
function SemesterBlock({ semester, onOpenSection, onStartSession, selectedSection }: {
  semester: Semester; onOpenSection: (s: Section | null) => void;
  onStartSession: (t: Topic, s: Section) => void; selectedSection: Section | null;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4" style={headingStyle}>{semester.title}</h2>
      {selectedSection && semester.sections.some(s => s.id === selectedSection.id) ? (
        <SectionExpanded section={selectedSection} onClose={() => onOpenSection(null)} onStartSession={(t) => onStartSession(t, selectedSection)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semester.sections.map(sec => <SectionCard key={sec.id} section={sec} onOpen={() => onOpenSection(sec)} />)}
        </div>
      )}
    </div>
  );
}

// ── Section card ──
function SectionCard({ section, onOpen }: { section: Section; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all group text-left">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-xl bg-teal-50"><BookOpen size={16} className="text-teal-600" /></div>
          <span className="text-xs text-gray-400 font-medium">{section.topics.length} AULAS</span>
        </div>
        <h3 className="text-base font-bold text-gray-900" style={headingStyle}>{section.title}</h3>
      </div>
      {section.imageUrl && (
        <div className="h-36 overflow-hidden">
          <img src={section.imageUrl} alt={section.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
    </button>
  );
}

// ── Section expanded ──
function SectionExpanded({ section, onClose, onStartSession }: {
  section: Section; onClose: () => void; onStartSession: (t: Topic) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={18} /></button>
          <div>
            <h3 className="text-lg font-bold text-gray-900" style={headingStyle}>{section.title}</h3>
            <p className="text-sm text-gray-500">Lista de aulas disponiveis</p>
          </div>
        </div>
        <button onClick={onClose} className="text-sm text-teal-600 hover:text-teal-700 font-medium">Fechar</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.topics.map((topic, idx) => <TopicCard key={topic.id} topic={topic} index={idx} isFirst={idx === 0} onStart={() => onStartSession(topic)} />)}
      </div>
    </div>
  );
}

// ── Topic card ──
function TopicCard({ topic, index, isFirst, onStart }: { topic: Topic; index: number; isFirst: boolean; onStart: () => void }) {
  const letter = String.fromCharCode(65 + index);
  const hasQuiz = (topic.quizzes?.length || 0) > 0;

  return (
    <button onClick={onStart} className={clsx('rounded-2xl overflow-hidden border text-left transition-all hover:shadow-lg group', isFirst ? 'border-teal-300 shadow-md shadow-teal-100' : 'border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]')}>
      <div className="h-28 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
        {isFirst && <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white" />Atual</div>}
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <span className={clsx('w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold', isFirst ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500')}>{letter}</span>
          {topic.flashcards && <span className="text-[10px] text-gray-400 font-medium">{topic.flashcards.length} AULAS</span>}
        </div>
        <h4 className="text-sm font-bold text-gray-900 mb-1.5" style={headingStyle}>{topic.title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{topic.summary}</p>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><Clock size={10} /> 15 min</span>
          {hasQuiz && <span className="flex items-center gap-1"><GraduationCap size={10} /> Quiz</span>}
        </div>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════
// STUDY SESSION — PDF-reader style viewer
// ══════════════════════════════════════════════════════════

function StudySession({ course, topic, onBack }: { course: Course; topic: Topic; sectionId: string | null; onBack: () => void }) {
  const { isAdmin } = useApp();
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'live' | 'local' | 'error'>('local');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const studyContent = useMemo(() => studyContents.find(sc => sc.topicId === topic.id), [topic.id]);
  const contentSections = studyContent?.sections || [];
  const totalPages = contentSections.length || 1;

  // Fetch summary from API — gracefully handle when backend is not yet ready
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getSummary(course.id, topic.id)
      .then(s => { if (!cancelled) { setSummary(s); setBackendStatus('live'); } })
      .catch(() => { if (!cancelled) { setSummary(null); setBackendStatus('local'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course.id, topic.id]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => setTimerSeconds(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [timerRunning]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* ── Top Toolbar ── */}
      <div className="h-12 bg-gray-800 border-b border-gray-700/50 flex items-center px-3 gap-2 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 text-sm transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Sumario">
          <Layers size={16} />
        </button>

        <div className="flex-1" />

        {/* Page nav */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm text-gray-300 font-medium min-w-[60px] text-center">{currentPage + 1} / {totalPages}</span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
        </div>

        <div className="flex-1" />

        {/* Backend status indicator in toolbar */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
          backendStatus === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', backendStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
          {backendStatus === 'live' ? 'Servidor' : 'Preview'}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><ZoomOut size={14} /></button>
          <span className="text-xs text-gray-400 min-w-[36px] text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><ZoomIn size={14} /></button>
        </div>

        <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><Search size={14} /></button>
        <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><Bookmark size={14} /></button>
      </div>

      {/* ── Main body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dark sidebar — TOC */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="shrink-0 overflow-hidden">
              <div className="w-[220px] h-full bg-[#1a2332] border-r border-white/5 flex flex-col">
                <div className="px-4 pt-5 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-3">Sumario</p>
                </div>
                <nav className="px-2 flex-1 overflow-y-auto space-y-0.5">
                  {contentSections.map((sec, idx) => (
                    <button key={idx} onClick={() => goToPage(idx)}
                      className={clsx('w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start gap-2', currentPage === idx ? 'bg-teal-600/20 text-teal-300 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')}>
                      {currentPage === idx && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />}
                      <span className="leading-tight">{sec.title}</span>
                    </button>
                  ))}
                </nav>

                {/* Admin shortcut at bottom of TOC sidebar */}
                <div className="px-3 pb-4 pt-2 border-t border-white/5">
                  <AdminBanner context="Resumos" variant="minimal" className="text-gray-500 hover:text-amber-400" />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className="flex-1 bg-[#2a2a2e] overflow-y-auto" ref={contentRef}>
          <div className="max-w-[780px] mx-auto my-8 bg-white rounded-lg shadow-2xl shadow-black/30 min-h-[calc(100vh-160px)]" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>

            {/* Floating study bar */}
            <div className="sticky top-0 z-20 flex justify-end p-3">
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/80">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 font-mono">
                  <Clock size={13} className="text-teal-500" />
                  {fmt(timerSeconds)}
                </div>
                <button onClick={() => setTimerRunning(!timerRunning)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  {timerRunning ? <Pause size={12} className="text-gray-500" /> : <Play size={12} className="text-gray-500" />}
                </button>
                <div className="w-px h-4 bg-gray-200" />
                {/* Data source indicator */}
                <span className={clsx('text-[10px] font-medium flex items-center gap-1', backendStatus === 'live' ? 'text-emerald-600' : 'text-amber-600')}>
                  {backendStatus === 'live' ? 'Salvo' : <><Wrench size={9} /> Preview</>}
                </span>
                <div className="w-px h-4 bg-gray-200" />
                {topic.quizzes && topic.quizzes.length > 0 && (
                  <button className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1">
                    <GraduationCap size={11} /> Quiz
                  </button>
                )}
                {topic.flashcards && topic.flashcards.length > 0 && (
                  <button className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1">
                    <Layers size={11} /> Flashcard
                  </button>
                )}
              </div>
            </div>

            {/* Document content */}
            <div className="px-12 pb-12 pt-4">
              {/* Header — page 0 only */}
              {currentPage === 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wider">
                      Resumo Completo
                    </span>
                    {backendStatus === 'local' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                        <Wrench size={9} /> Dados locais de preview
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-3" style={headingStyle}>{topic.title}</h1>
                  <p className="text-sm text-gray-500 mb-4">Material de estudo oficial AXON &middot; Ultima atualizacao em 2025</p>

                  {/* Keyword mastery legend */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium">Palavras-chave:</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Nao domino</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Parcialmente</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Domino</span>
                  </div>

                  {/* Admin banner inside document */}
                  {isAdmin && (
                    <div className="mt-4">
                      <AdminBanner context="este resumo" variant="banner" message="Voce pode editar este conteudo no painel Administrador" />
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400 mb-6">Pagina {currentPage + 1} de {totalPages}</div>

              {/* Content rendering */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                  <span className="ml-3 text-gray-500 text-sm">Carregando resumo...</span>
                </div>
              ) : (
                <SessionPageContent summary={summary} topic={topic} contentSections={contentSections} currentPage={currentPage} />
              )}

              {/* Page nav bottom */}
              <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all">
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="text-xs text-gray-400">{currentPage + 1} / {totalPages}</span>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 disabled:opacity-30 transition-all">
                  Proximo <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SESSION PAGE CONTENT
// Priority: canvasBlocks > studyContent fallback
// ══════════════════════════════════════════════════════════

function SessionPageContent({ summary, topic, contentSections, currentPage }: {
  summary: StudySummary | null; topic: Topic;
  contentSections: { title: string; content: string }[]; currentPage: number;
}) {
  if (summary?.canvasBlocks && currentPage === 0) {
    return <CanvasBlocksRenderer blocksJson={summary.canvasBlocks} />;
  }

  const section = contentSections[currentPage];
  if (!section) {
    return (
      <KeywordPopoverProvider>
        <div className="prose prose-sm max-w-none">
          {summary?.content
            ? renderMarkdownContent(summary.content)
            : <p className="text-gray-500 italic">{topic.summary || 'Conteudo do resumo ainda nao disponivel para este topico.'}</p>}
        </div>
      </KeywordPopoverProvider>
    );
  }

  const sectionImage = getSectionImage(topic.id, section.title);

  return (
    <KeywordPopoverProvider>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{currentPage + 1}</span>
          <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>{section.title}</h2>
        </div>
        <div className="relative">
          {sectionImage && (
            <figure className="float-right ml-6 mb-4 w-[280px] rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <div className="relative">
                <img src={sectionImage.url} alt={sectionImage.alt} className="w-full h-auto object-cover" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">{sectionImage.caption.split(' \u2014 ')[0]}</div>
              </div>
              <figcaption className="px-3 py-2 bg-gray-50 text-[11px] text-gray-500 leading-relaxed">{sectionImage.caption}</figcaption>
            </figure>
          )}
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">{renderStudyContent(section.content)}</div>
          <div className="clear-both" />
        </div>
      </div>
    </KeywordPopoverProvider>
  );
}

// ══════════════════════════════════════════════════════════
// Content rendering helpers
// ══════════════════════════════════════════════════════════

function renderStudyContent(text: string): React.ReactNode {
  if (!text) return null;
  const elements: React.ReactNode[] = [];
  text.split('\n\n').forEach((para, pIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return;
    trimmed.split('\n').forEach((line, lIdx) => {
      const ln = line.trim();
      if (!ln) return;
      const key = `${pIdx}-${lIdx}`;
      if (ln.startsWith('**') && ln.endsWith('**')) {
        elements.push(<h4 key={key} className="text-sm font-bold text-gray-900 mt-5 mb-2" style={headingStyle}>{ln.slice(2, -2).replace(/:$/, '')}</h4>);
      } else if (ln.startsWith('- ')) {
        elements.push(<div key={key} className="flex items-start gap-2.5 ml-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" /><span className="text-sm text-gray-700 leading-relaxed">{renderInline(ln.slice(2))}</span></div>);
      } else if (ln.startsWith('*') && ln.endsWith('*') && !ln.startsWith('**')) {
        elements.push(<p key={key} className="text-sm text-gray-600 italic mt-3 mb-1 font-medium">{ln.slice(1, -1)}</p>);
      } else {
        elements.push(<p key={key} className="text-sm text-gray-700 leading-relaxed mb-3">{renderInline(ln)}</p>);
      }
    });
  });
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      const kw = findKeyword(inner);
      if (kw) {
        const config = masteryConfig[kw.masteryLevel];
        return <span key={i} className={clsx('keyword-mark font-semibold cursor-pointer underline decoration-2', config.underlineClass)} data-keyword={kw.term}>{inner}</span>;
      }
      return <strong key={i} className="font-semibold text-gray-900">{inner}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderMarkdownContent(text: string): React.ReactNode {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <br key={i} />;
    if (t.startsWith('### ')) return <h4 key={i} className="text-sm font-bold text-gray-900 mt-5 mb-2" style={headingStyle}>{t.slice(4)}</h4>;
    if (t.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2" style={headingStyle}>{t.slice(3)}</h3>;
    if (t.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3" style={headingStyle}>{t.slice(2)}</h2>;
    if (t.startsWith('- ')) return <div key={i} className="flex items-start gap-2 ml-1 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" /><span className="text-sm text-gray-700 leading-relaxed">{t.slice(2)}</span></div>;
    return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{t}</p>;
  });
}
