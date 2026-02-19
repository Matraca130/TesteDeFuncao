// ============================================================
// Axon v4.4 — Study View: Study Session (PDF-reader viewer)
// ============================================================
// Full-screen PDF-reader style viewer with:
//   - Dark toolbar + sidebar TOC
//   - Zoom, timer, page navigation
//   - Backend live/local status indicator
//   - Canvas blocks + markdown rendering
// ============================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { AdminBanner } from '@/app/components/shared/AdminBanner';
import { headingStyle } from '@/app/design-system';
import type { Course, Topic } from '@/app/data/courses';
import { studyContents } from '@/app/data/studyContent';
import { SessionPageContent } from './SessionPageContent';
import * as api from '@/app/services/studentApi';
import type { StudySummary } from '@/app/types/student';
import clsx from 'clsx';
import {
  ChevronLeft, ChevronRight, Clock, Play, Pause, Wrench,
  Search, ZoomIn, ZoomOut, Bookmark,
  Layers, GraduationCap, Loader2,
} from 'lucide-react';

export function StudySession({ course, topic, onBack }: {
  course: Course; topic: Topic; sectionId: string | null; onBack: () => void;
}) {
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
