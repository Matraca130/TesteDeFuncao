import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { Section, Topic, Flashcard } from '@/app/data/courses';
import clsx from 'clsx';
import {
  CheckCircle, Brain, X, Trophy, Play, Eye, ChevronRight,
  ChevronLeft, Layers, BookOpen,
  GraduationCap, Zap, Sparkles, Heart, Activity,
} from 'lucide-react';
import { AxonLogo, AxonBrand, AxonBadge, AxonWatermark } from '@/app/components/shared/AxonLogo';
import { SmartFlashcardGenerator } from '@/app/components/ai/SmartFlashcardGenerator';
import { getTopicKeywords, getCourseKeywords } from '@/app/services/studentApi';
import type { KeywordCollection } from '@/app/services/keywordManager';
import { colors, components, headingStyle, sectionColors, shapes, shadows } from '@/app/design-system';
import { iconClasses, ctaButtonClasses } from '@/app/design-system';

// ── Ratings ──
const RATINGS = [
  { value: 1, label: 'Não sei', color: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-500', desc: 'Repetir logo' },
  { value: 2, label: 'Difícil', color: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-500', desc: 'Repetir em breve' },
  { value: 3, label: 'Médio', color: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-yellow-500', desc: 'Dúvida razoável' },
  { value: 4, label: 'Fácil', color: 'bg-lime-500', hover: 'hover:bg-lime-600', text: 'text-lime-600', desc: 'Entendi bem' },
  { value: 5, label: 'Perfeito', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-500', desc: 'Memorizado' },
];

// ── Section accent colors — imported from design system ──
const SECTION_COLORS = sectionColors.multi;

type ViewState = 'hub' | 'section' | 'deck' | 'session' | 'summary';

// ── Helpers ──
function getMasteryStats(cards: Flashcard[]) {
  if (cards.length === 0) return { avg: 0, pct: 0, mastered: 0, learning: 0, newCards: 0 };
  const avg = cards.reduce((s, c) => s + c.mastery, 0) / cards.length;
  return {
    avg,
    pct: (avg / 5) * 100,
    mastered: cards.filter(c => c.mastery >= 4).length,
    learning: cards.filter(c => c.mastery === 3).length,
    newCards: cards.filter(c => c.mastery <= 2).length,
  };
}

function ProgressRing({ pct, size = 44, stroke = 4, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={color}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-gray-700">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export function FlashcardView() {
  const { currentCourse, setActiveView, setCurrentTopic } = useApp();
  const [viewState, setViewState] = useState<ViewState>('hub');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);

  // Session state
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<number[]>([]);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);

  // Gather ALL sections & topics from current course
  const allSections = useMemo(() => {
    return currentCourse.semesters.flatMap(sem => sem.sections);
  }, [currentCourse]);

  const allFlashcards = useMemo(() => {
    return allSections.flatMap(sec => sec.topics.flatMap(t => t.flashcards || []));
  }, [allSections]);

  // Reset on course change
  useEffect(() => {
    setViewState('hub');
    setSelectedSection(null);
    setSelectedTopic(null);
  }, [currentCourse]);

  // ── Navigation ──
  const openSection = (section: Section, idx: number) => {
    setSelectedSection(section);
    setSelectedSectionIdx(idx);
    setViewState('section');
  };

  const openDeck = (topic: Topic) => {
    setSelectedTopic(topic);
    setViewState('deck');
  };

  const goBack = () => {
    if (viewState === 'deck') { setViewState('section'); setSelectedTopic(null); }
    else if (viewState === 'section') { setViewState('hub'); setSelectedSection(null); }
    else { setActiveView('study'); }
  };

  // ── Session ──
  const startSession = (cards: Flashcard[]) => {
    if (cards.length === 0) return;
    setSessionCards(cards);
    setViewState('session');
    setCurrentIndex(0);
    setSessionStats([]);
    setIsRevealed(false);
  };

  const handleRate = (rating: number) => {
    const newStats = [...sessionStats, rating];
    setSessionStats(newStats);
    setIsRevealed(false);
    if (currentIndex < sessionCards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setTimeout(() => setViewState('summary'), 200);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-dashboard relative overflow-hidden">
      <AnimatePresence mode="wait">
        {viewState === 'hub' && (
          <HubScreen
            key="hub"
            sections={allSections}
            allCards={allFlashcards}
            courseColor={currentCourse.color}
            courseName={currentCourse.name}
            onOpenSection={openSection}
            onStartAll={() => startSession(allFlashcards)}
            onBack={() => setActiveView('study')}
          />
        )}
        {viewState === 'section' && selectedSection && (
          <SectionScreen
            key="section"
            section={selectedSection}
            sectionIdx={selectedSectionIdx}
            courseColor={currentCourse.color}
            onOpenDeck={openDeck}
            onStartSection={(cards) => startSession(cards)}
            onBack={goBack}
          />
        )}
        {viewState === 'deck' && selectedTopic && (
          <DeckScreen
            key="deck"
            topic={selectedTopic}
            sectionIdx={selectedSectionIdx}
            sectionName={selectedSection?.title || ''}
            courseColor={currentCourse.color}
            onStart={(cards) => startSession(cards)}
            onBack={goBack}
            onStudyTopic={() => { setCurrentTopic(selectedTopic); setActiveView('study'); }}
          />
        )}
        {viewState === 'session' && (
          <SessionScreen
            key="session"
            cards={sessionCards}
            currentIndex={currentIndex}
            isRevealed={isRevealed}
            setIsRevealed={setIsRevealed}
            handleRate={handleRate}
            sessionStats={sessionStats}
            courseColor={currentCourse.color}
            onBack={goBack}
          />
        )}
        {viewState === 'summary' && (
          <SummaryScreen
            key="summary"
            stats={sessionStats}
            courseColor={currentCourse.color}
            courseId={currentCourse.id}
            courseName={currentCourse.name}
            topicId={selectedTopic?.id || null}
            topicTitle={selectedTopic?.title || null}
            onRestart={() => { setCurrentIndex(0); setSessionStats([]); setIsRevealed(false); setViewState('session'); }}
            onExit={() => setViewState(selectedTopic ? 'deck' : selectedSection ? 'section' : 'hub')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// ═══════════════════════════════════════════
// HUB SCREEN — Light premium
// ═══════════════════════════════════════════
function HubScreen({ sections, allCards, courseColor, courseName, onOpenSection, onStartAll, onBack }: {
  sections: Section[];
  allCards: Flashcard[];
  courseColor: string;
  courseName: string;
  onOpenSection: (s: Section, i: number) => void;
  onStartAll: () => void;
  onBack: () => void;
}) {
  const stats = getMasteryStats(allCards);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -30 }}
      className="h-full overflow-y-auto bg-surface-dashboard"
    >
      {/* ── Light Premium Header ── */}
      <div className="relative px-8 pt-4 pb-6 bg-white overflow-hidden border-b border-gray-200/80">
        {/* Decorative gradient orbs — subtle light */}
        <div className="absolute top-[-120px] left-1/4 w-[500px] h-[350px] bg-gradient-to-br from-teal-200/20 via-teal-100/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[-80px] right-[-100px] w-[400px] h-[300px] bg-gradient-to-bl from-teal-200/15 via-teal-100/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-80px] w-[350px] h-[250px] bg-gradient-to-tr from-teal-200/10 via-teal-100/5 to-transparent rounded-full blur-3xl" />

        {/* Diagonal AXON watermark */}
        <AxonWatermark />

        <div className="relative z-10">
          {/* Top bar: back */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Voltar
            </button>
          </div>

          {/* Main title area */}
          <div className="flex items-end justify-between gap-8 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold text-gray-900 tracking-tight leading-[0.95] mb-2 flex items-center gap-3" style={headingStyle}>
                Flashcards
                <AxonBrand theme="gradient" />
              </h1>
              <p className="text-sm text-gray-500 font-medium">{courseName}</p>
            </div>

            {/* Right side — study button */}
            {allCards.length > 0 && (
              <button
                onClick={onStartAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-lg text-white font-medium text-sm transition-colors shrink-0"
              >
                <Zap size={15} /> Estudar Todos
              </button>
            )}
          </div>

          {/* Bottom stats row */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{allCards.length} flashcards em {sections.length} seções</p>

            {allCards.length > 0 && (
              <div className="hidden md:flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500"><span className="text-emerald-600 font-semibold">{stats.mastered}</span> dominados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-500"><span className="text-amber-600 font-semibold">{stats.learning}</span> aprendendo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-xs text-gray-500"><span className="text-rose-600 font-semibold">{stats.newCards}</span> a revisar</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="px-6 py-6 bg-surface-dashboard">
        {/* Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min max-w-5xl mx-auto">
          {sections.map((section, idx) => {
            const sectionCards = section.topics.flatMap(t => t.flashcards || []);
            const sStats = getMasteryStats(sectionCards);

            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onOpenSection(section, idx)}
                className={clsx(
                  "bg-white rounded-xl p-5 text-left border border-gray-200 group relative overflow-hidden transition-all duration-200",
                  "hover:border-gray-300 hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-50 shrink-0">
                      <BookOpen size={18} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate" style={headingStyle}>
                          {section.title}
                        </h3>
                        <span className="text-sm font-semibold text-teal-600 shrink-0 ml-2">{Math.round(sStats.pct)}%</span>
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        {section.topics.length} tópicos
                      </p>
                    </div>
                  </div>

                  {/* Progress info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4 mb-4">
                    <span>Progresso</span>
                    <span>{sStats.mastered}/{sectionCards.length} Cards</span>
                  </div>

                  {/* Action button */}
                  <div className="w-full py-2.5 rounded-full bg-teal-600 text-white text-sm font-semibold text-center group-hover:bg-teal-700 transition-colors">
                    Continuar Estudo
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>


      </div>
    </motion.div>
  );
}


// ═══════════════════════════════════════════
// SECTION SCREEN — Decks inside a section
// ═══════════════════════════════════════════
function SectionScreen({ section, sectionIdx, courseColor, onOpenDeck, onStartSection, onBack }: {
  section: Section;
  sectionIdx: number;
  courseColor: string;
  onOpenDeck: (t: Topic) => void;
  onStartSection: (cards: Flashcard[]) => void;
  onBack: () => void;
}) {
  const colorSet = SECTION_COLORS[sectionIdx % SECTION_COLORS.length];
  const sectionCards = section.topics.flatMap(t => t.flashcards || []);
  const stats = getMasteryStats(sectionCards);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      {/* ── Header ── */}
      <div className="relative px-8 pt-6 pb-6 bg-white border-b border-gray-200">

        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-5 transition-colors font-medium">
            <ChevronLeft size={16} /> Todas as Seções
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-sm">
                <BookOpen size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>{section.title}</h2>
                <p className="text-sm text-gray-500">{section.topics.length} decks &middot; {sectionCards.length} flashcards</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {sectionCards.length > 0 && (
                <>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-gray-500">{stats.mastered} dominados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-gray-500">{stats.learning} aprendendo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-xs text-gray-500">{stats.newCards} a revisar</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartSection(sectionCards)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all bg-teal-600 hover:bg-teal-700"
                  >
                    <Play size={14} fill="currentColor" /> Estudar Seção
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Deck List ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-surface-dashboard">
        <div className="max-w-4xl mx-auto space-y-3">
          {section.topics.map((topic, idx) => {
            const cards = topic.flashcards || [];
            const tStats = getMasteryStats(cards);

            return (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ x: 4 }}
                onClick={() => onOpenDeck(topic)}
                className="w-full bg-white rounded-2xl p-5 text-left border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5 relative overflow-hidden"
              >
                {/* Left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />

                {/* Stacked cards visual */}
                <div className="relative w-14 h-14 shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-teal-500 opacity-10 translate-x-1 translate-y-1" />
                  <div className="absolute inset-0 rounded-xl bg-teal-500 opacity-20 translate-x-0.5 translate-y-0.5" />
                  <div className="absolute inset-0 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                    <Layers size={22} className="text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 mb-0.5 group-hover:text-gray-900 transition-colors">{topic.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{topic.summary}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {cards.length > 0 ? (
                    <>
                      <div className="hidden sm:flex flex-col items-end gap-0.5">
                        <span className="text-sm font-bold text-gray-700">{cards.length}</span>
                        <span className="text-[10px] text-gray-400">cards</span>
                      </div>
                      <ProgressRing pct={tStats.pct} size={40} stroke={3} color="text-teal-500" />
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg font-medium border border-gray-200">Vazio</span>
                  )}
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}


// ═══════════════════════════════════════════
// DECK SCREEN — Cards inside a topic/deck
// ═══════════════════════════════════════════
function DeckScreen({ topic, sectionIdx, sectionName, courseColor, onStart, onBack, onStudyTopic }: {
  topic: Topic;
  sectionIdx: number;
  sectionName: string;
  courseColor: string;
  onStart: (cards: Flashcard[]) => void;
  onBack: () => void;
  onStudyTopic: () => void;
}) {
  const colorSet = SECTION_COLORS[sectionIdx % SECTION_COLORS.length];
  const cards = topic.flashcards || [];
  const stats = getMasteryStats(cards);
  const [filterMastery, setFilterMastery] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');

  const filteredCards = useMemo(() => {
    switch (filterMastery) {
      case 'new': return cards.filter(c => c.mastery <= 2);
      case 'learning': return cards.filter(c => c.mastery === 3);
      case 'mastered': return cards.filter(c => c.mastery >= 4);
      default: return cards;
    }
  }, [cards, filterMastery]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200/80">
        <div className="px-8 pt-6 pb-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <button onClick={() => { onBack(); onBack(); }} className="hover:text-gray-700 transition-colors">Flashcards</button>
            <ChevronRight size={12} />
            <button onClick={onBack} className="hover:text-gray-700 transition-colors">{sectionName}</button>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{topic.title}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button onClick={onBack} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                <ChevronLeft size={20} />
              </button>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{topic.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-1">{topic.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onStudyTopic}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-medium text-gray-600 transition-colors border border-gray-200"
              >
                <GraduationCap size={14} /> Ver Tópico
              </button>
              {cards.length > 0 && (
                <button
                  onClick={() => onStart(filteredCards.length > 0 ? filteredCards : cards)}
                  className={clsx("flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-sm hover:scale-105 active:scale-95 transition-all bg-teal-600 hover:bg-teal-700")}
                >
                  <Play size={20} fill="currentColor" />
                  Estudar{filterMastery !== 'all' ? ` (${filteredCards.length})` : ''}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        {cards.length > 0 && (
          <div className="px-8 pb-4 flex items-center gap-6">
            <div className="flex items-center gap-5 flex-1">
              {/* Mastery distribution bar */}
              <div className="flex-1 max-w-xs">
                <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                  {stats.mastered > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.mastered / cards.length) * 100}%` }} />}
                  {stats.learning > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${(stats.learning / cards.length) * 100}%` }} />}
                  {stats.newCards > 0 && <div className="bg-rose-400 transition-all" style={{ width: `${(stats.newCards / cards.length) * 100}%` }} />}
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'all' as const, label: 'Todos', count: cards.length, color: 'text-gray-700 bg-gray-100' },
                  { key: 'new' as const, label: 'A revisar', count: stats.newCards, color: 'text-rose-600 bg-rose-50' },
                  { key: 'learning' as const, label: 'Aprendendo', count: stats.learning, color: 'text-amber-600 bg-amber-50' },
                  { key: 'mastered' as const, label: 'Dominados', count: stats.mastered, color: 'text-emerald-600 bg-emerald-50' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilterMastery(f.key)}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                      filterMastery === f.key
                        ? `${f.color} ring-1 ring-current/20 shadow-sm`
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Cards Grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-surface-dashboard">
        <div className="h-full">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BookOpen size={48} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">
                {cards.length === 0 ? 'Nenhum flashcard neste deck' : 'Nenhum card nesta categoria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 auto-rows-fr h-full">
              {filteredCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-lg transition-all flex flex-col relative overflow-hidden min-h-0 shadow-sm"
                >
                  {/* Top color accent */}
                  <div className="h-1 w-full shrink-0 bg-teal-500" />

                  <div className="flex-1 flex flex-col p-1.5 min-h-0 overflow-hidden gap-0.5">
                    {/* Header row: number + mastery */}
                    <div className="flex items-center justify-between shrink-0">
                      <div className="w-3.5 h-3.5 rounded flex items-center justify-center text-[6px] font-bold bg-teal-50 text-teal-600">
                        {idx + 1}
                      </div>
                      <div className="flex items-center gap-px">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            className={clsx(
                              "w-0.5 h-1 rounded-full transition-colors",
                              level <= card.mastery ? "bg-teal-500" : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Question */}
                    <p className="text-[9px] font-semibold text-gray-800 line-clamp-2 leading-tight">{card.question}</p>

                    {/* Answer (subtle, revealed on hover) */}
                    <p className="text-[8px] text-gray-400 group-hover:text-gray-600 line-clamp-1 mt-auto leading-tight transition-colors">{card.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// ═══════════════════════════════════════════
// SESSION SCREEN — Immersive with Speedometer Gauge
// ═══════════════════════════════════════════

/* ── Speedometer Gauge Component ── */
function SpeedometerGauge({ cards, currentIndex, sessionStats }: {
  cards: Flashcard[];
  currentIndex: number;
  sessionStats: number[];
}) {
  const total = cards.length;
  const progress = ((currentIndex) / total) * 100;
  const size = 120;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;

  // Arc from 135° to 405° (270° sweep)
  const startAngle = 135;
  const sweepAngle = 270;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const segmentAngle = sweepAngle / total;
  const segmentGap = Math.min(1.5, segmentAngle * 0.1);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Background track segments */}
        {cards.map((_, i) => {
          const segStart = startAngle + i * segmentAngle + segmentGap;
          const segEnd = startAngle + (i + 1) * segmentAngle - segmentGap;
          return (
            <path
              key={`bg-${i}`}
              d={describeArc(segStart, segEnd)}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {/* Colored segments for completed/current cards */}
        {cards.map((_, i) => {
          const isCompleted = i < sessionStats.length;
          const isCurrent = i === currentIndex;
          const rating = sessionStats[i];

          if (!isCompleted && !isCurrent) return null;

          let color = "#14b8a6";
          if (isCompleted && rating !== undefined) {
            if (rating >= 4) color = "#10b981";
            else if (rating === 3) color = "#f59e0b";
            else color = "#f43f5e";
          }

          const segStart = startAngle + i * segmentAngle + segmentGap;
          const segEnd = startAngle + (i + 1) * segmentAngle - segmentGap;

          return (
            <motion.path
              key={`seg-${i}`}
              d={describeArc(segStart, segEnd)}
              fill="none"
              stroke={color}
              strokeWidth={isCurrent ? strokeWidth + 2 : strokeWidth}
              strokeLinecap="round"
              className={isCurrent ? "drop-shadow(0 0 6px rgba(20,184,166,0.5))" : undefined}
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: isCurrent ? [0.6, 1, 0.6] : 1, pathLength: 1 }}
              transition={isCurrent
                ? { opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }, pathLength: { duration: 0.4 } }
                : { duration: 0.4 }
              }
            />
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Needle indicator */}
        {(() => {
          const needleAngle = startAngle + (currentIndex / total) * sweepAngle + segmentAngle / 2;
          const needleTip = polarToCartesian(needleAngle);
          const rad = (needleAngle * Math.PI) / 180;
          const needleInner = {
            x: center + (radius - 18) * Math.cos(rad),
            y: center + (radius - 18) * Math.sin(rad),
          };
          return (
            <motion.line
              x1={needleInner.x}
              y1={needleInner.y}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="#374151"
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,0.1))" }}
            />
          );
        })()}

        {/* Center dot */}
        <circle cx={center} cy={center} r={3} fill="#6b7280" opacity={0.5} />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 8 }}>
        <span className="text-2xl font-black text-gray-800 tabular-nums leading-none">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Counter below gauge */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
          {currentIndex + 1}
        </span>
        <span className="text-[10px] text-gray-400">/</span>
        <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
          {cards.length}
        </span>
      </div>
    </div>
  );
}

function SessionScreen({ cards, currentIndex, isRevealed, setIsRevealed, handleRate, sessionStats, courseColor, onBack }: {
  cards: Flashcard[];
  currentIndex: number;
  isRevealed: boolean;
  setIsRevealed: (v: boolean) => void;
  handleRate: (r: number) => void;
  sessionStats: number[];
  courseColor: string;
  onBack: () => void;
}) {
  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col h-full relative z-10 bg-[#0a0a0f] overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-teal-600/8 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-tl from-teal-600/5 via-teal-500/3 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ── Overlaid Header (absolute, no vertical space) ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-30">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100/80 backdrop-blur-sm">
          <X size={22} />
        </button>
        <AxonLogo size="xs" theme="dark" />
      </div>

      {/* ── Main Card Area (fills entire screen) ── */}
      <div className="flex-1 flex items-center justify-center p-0 relative z-10 min-h-0">
        <div className="relative w-full h-full bg-white shadow-2xl shadow-black/40 overflow-hidden flex flex-row">

          {/* ── Left Column: Content ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">

            {/* Question */}
            <motion.div
              layout
              className={clsx(
                "p-6 md:p-8 lg:p-10 flex flex-col transition-colors duration-300 w-full",
                isRevealed ? "bg-gray-50 border-b border-gray-200 shrink-0" : "flex-1 items-center justify-center text-center bg-white"
              )}
            >
              {/* Speedometer Gauge — centered above question */}
              <div className="flex justify-center mb-4 pointer-events-none">
                <SpeedometerGauge
                  cards={cards}
                  currentIndex={currentIndex}
                  sessionStats={sessionStats}
                />
              </div>

              <div className={clsx("flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3", !isRevealed && "justify-center")}>
                <Brain size={14} /> Pergunta
              </div>
              <motion.h3
                layout="position"
                className={clsx(
                  "font-semibold leading-tight transition-all duration-300",
                  isRevealed ? "text-base text-left text-gray-500" : "text-xl md:text-3xl lg:text-4xl text-gray-900"
                )}
              >
                {currentCard.question}
              </motion.h3>
            </motion.div>

            {/* Answer */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 p-6 md:p-8 lg:p-10 bg-white flex flex-col justify-center overflow-y-auto min-h-0"
                >
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    <CheckCircle size={14} /> Resposta
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-relaxed text-balance">
                    {currentCard.answer}
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reveal overlay */}
            {!isRevealed && (
              <button
                onClick={() => setIsRevealed(true)}
                className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pb-10 bg-gradient-to-t from-white/80 to-transparent hover:from-gray-50/60 transition-colors cursor-pointer group outline-none"
              >
                <div className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-gray-900/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-sm">
                  <Eye size={16} /> Mostrar Resposta
                </div>
                <span className="text-xs font-medium text-gray-400 mt-3 group-hover:opacity-0 transition-opacity">
                  Toque em qualquer lugar para ver a resposta
                </span>
              </button>
            )}

            {/* ── Rating Buttons (inside card, at bottom when revealed) ── */}
            <AnimatePresence mode="wait">
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="shrink-0 bg-gray-50 border-t border-gray-200 px-5 py-4"
                >
                  <div className="w-full max-w-xl mx-auto grid grid-cols-5 gap-2">
                    {RATINGS.map((rate) => (
                      <button
                        key={rate.value}
                        onClick={() => handleRate(rate.value)}
                        className="group flex flex-col items-center gap-1.5 transition-transform active:scale-95 outline-none"
                      >
                        <div className={clsx(
                          "w-full h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-1 group-hover:shadow-lg",
                          rate.color, rate.hover
                        )}>
                          <span className="text-base font-bold">{rate.value}</span>
                        </div>
                        <div className="text-center">
                          <span className={clsx("block text-[10px] font-bold uppercase tracking-wide", rate.text)}>{rate.label}</span>
                          <span className="block text-[9px] text-gray-400 font-medium hidden md:block">{rate.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Column: Image / Progress Area ── */}
          <div className="hidden lg:flex w-[38%] shrink-0 border-l border-gray-100 bg-gray-50/30 flex-col relative overflow-hidden">
            {/* Subtle decorative pattern (visible when no image) */}
            {!currentCard.image && (
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #14b8a6 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${isRevealed ? 'revealed' : 'question'}-${currentIndex}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="flex-1 flex flex-col relative z-10 min-h-0"
              >
                {currentCard.image ? (
                  /* ── Image fills the entire right column ── */
                  <img
                    src={currentCard.image}
                    alt={currentCard.question}
                    className="flex-1 w-full object-cover min-h-0"
                  />
                ) : (
                  /* ── No image: show progress info centered ── */
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-[220px] flex flex-col items-center gap-4">
                      {/* Card counter */}
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-gray-800 tabular-nums">{currentIndex + 1}</span>
                        <span className="text-lg text-gray-300 font-light">/</span>
                        <span className="text-lg font-semibold text-gray-400 tabular-nums">{cards.length}</span>
                      </div>

                      {/* Segmented progress bar */}
                      <div className="w-full flex gap-1">
                        {cards.map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor:
                                i < currentIndex
                                  ? sessionStats[i] >= 4
                                    ? '#22c55e'
                                    : sessionStats[i] >= 3
                                    ? '#eab308'
                                    : sessionStats[i] >= 1
                                    ? '#ef4444'
                                    : '#d1d5db'
                                  : i === currentIndex
                                  ? '#14b8a6'
                                  : '#e5e7eb',
                              opacity: i === currentIndex ? 1 : i < currentIndex ? 0.8 : 0.4,
                            }}
                          />
                        ))}
                      </div>

                      {/* Percentage */}
                      <span className="text-xs font-semibold text-gray-400 tracking-wide">
                        {Math.round(progress)}% concluído
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Speedometer Gauge — removed from right column, now in left column top-right */}
          </div>

        </div>
      </div>

      {/* Removed mobile fallback gauge — gauge is always visible in left column top-right */}
    </motion.div>
  );
}


// ═══════════════════════════════════════════
// SUMMARY SCREEN — Light theme
// ═══════════════════════════════════════════
function SummaryScreen({ stats, onRestart, courseColor, courseId, courseName, topicId, topicTitle, onExit }: {
  stats: number[];
  onRestart: () => void;
  courseColor: string;
  courseId: string;
  courseName: string;
  topicId: string | null;
  topicTitle: string | null;
  onExit: () => void;
}) {
  const average = stats.reduce((a, b) => a + b, 0) / stats.length;
  const mastery = (average / 5) * 100;

  // AI Flashcard Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [keywords, setKeywords] = useState<KeywordCollection | null>(null);
  const [keywordsError, setKeywordsError] = useState<string | null>(null);

  const handleOpenGenerator = async () => {
    setLoadingKeywords(true);
    setKeywordsError(null);
    try {
      let data: any;
      if (topicId) {
        data = await getTopicKeywords(courseId, topicId);
      } else {
        data = await getCourseKeywords(courseId);
      }
      const kw = (data?.keywords || {}) as KeywordCollection;
      setKeywords(kw);
      setShowGenerator(true);
    } catch (err: any) {
      console.error('[SummaryScreen] Error loading keywords:', err);
      // If no keywords exist yet, use empty collection so generator can still work
      if (err?.status === 404 || err?.message?.includes('404')) {
        setKeywords({});
        setShowGenerator(true);
      } else {
        setKeywordsError('Não foi possível carregar as keywords. Tente novamente.');
      }
    } finally {
      setLoadingKeywords(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full bg-surface-dashboard p-8 text-center relative overflow-hidden"
    >
      {/* Ambient celebration glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-br from-teal-200/20 via-teal-100/15 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/25">
          <Trophy size={40} className="text-white" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sessão Concluída!</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Você completou {stats.length} flashcards com um domínio estimado de:
        </p>

        <div className="relative w-48 h-48 flex items-center justify-center mb-10">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="#e2e8f0" strokeWidth="12" fill="none" />
            <motion.circle
              cx="96" cy="96" r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className="text-teal-500"
              strokeDasharray={2 * Math.PI * 88}
              initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - mastery / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">{mastery.toFixed(0)}%</span>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Domínio</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <button onClick={onExit} className="px-6 py-3 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
              Voltar ao Deck
            </button>
            <button onClick={onRestart} className="px-6 py-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-500/20 hover:scale-105 transition-all">
              Praticar Novamente
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full max-w-xs my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* AI Generate button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={handleOpenGenerator}
            disabled={loadingKeywords}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#ec43ef] to-[#b830e8] text-white font-semibold shadow-lg shadow-[#ec43ef]/20 hover:shadow-xl hover:shadow-[#ec43ef]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2.5">
              {loadingKeywords ? (
                <>
                  <Activity size={16} className="animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Gerar Novos Flashcards com IA
                </>
              )}
            </span>
          </motion.button>

          {keywordsError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-rose-500 mt-1"
            >
              {keywordsError}
            </motion.p>
          )}

          <p className="text-[11px] text-gray-400 max-w-xs">
            A IA analisa seus gaps de conhecimento e gera flashcards focados nas keywords que mais precisam de reforço
          </p>
        </div>
      </div>

      {/* Smart Flashcard Generator Modal */}
      <AnimatePresence>
        {showGenerator && keywords !== null && (
          <SmartFlashcardGenerator
            courseId={courseId}
            topicId={topicId || courseId}
            courseName={courseName}
            topicTitle={topicTitle || courseName}
            keywords={keywords}
            onFlashcardsGenerated={(flashcards, updatedKeywords) => {
              console.log(`[SummaryScreen] Generated ${flashcards.length} flashcards`);
              setKeywords(updatedKeywords);
            }}
            onClose={() => setShowGenerator(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}