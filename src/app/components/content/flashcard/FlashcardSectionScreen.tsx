import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Section, Topic, Flashcard, groupTopicsBySubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, ChevronDown, BookOpen, Layers, Play, FolderOpen } from 'lucide-react';
import { headingStyle } from '@/app/design-system';
import { getMasteryStats } from '@/app/hooks/useFlashcardSession';
import { ProgressRing } from './ProgressRing';

export function SectionScreen({ section, sectionIdx, courseColor, onOpenDeck, onStartSection, onBack }: {
  section: Section;
  sectionIdx: number;
  courseColor: string;
  onOpenDeck: (t: Topic) => void;
  onStartSection: (cards: Flashcard[]) => void;
  onBack: () => void;
}) {
  const sectionCards = section.topics.flatMap(t => {
    const topicCards = t.flashcards || [];
    const subCards = (t.subtopics || []).flatMap(st => st.flashcards || []);
    return [...topicCards, ...subCards];
  });
  const stats = getMasteryStats(sectionCards);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col h-full">
      <div className="relative px-8 pt-6 pb-6 bg-white border-b border-gray-200">
        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-5 transition-colors font-medium">
            <ChevronLeft size={16} /> Todas as Secoes
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
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">{stats.mastered} dominados</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs text-gray-500">{stats.learning} aprendendo</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-xs text-gray-500">{stats.newCards} a revisar</span></div>
                  </div>
                  <button onClick={() => onStartSection(sectionCards)} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all bg-teal-600 hover:bg-teal-700">
                    <Play size={14} fill="currentColor" /> Estudar Secao
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-surface-dashboard">
        <div className="max-w-4xl mx-auto space-y-6">
          {groupTopicsBySubcategory(section.topics).map((subGroup) => {
            const cfg = SUBCATEGORY_CONFIG[subGroup.subcategory];
            return (
              <div key={subGroup.subcategory}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={clsx("w-2 h-2 rounded-full", cfg.dot)} />
                  <span className={clsx("text-xs font-bold uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
                  <div className="flex-1 border-b border-gray-200/60" />
                </div>
                <div className="space-y-3">
                  {subGroup.topics.map((topic, idx) => (
                    <TopicDeckCard key={topic.id} topic={topic} idx={idx} cfg={cfg} onOpenDeck={onOpenDeck} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/** Individual topic deck card — expandable if it has subtopics */
function TopicDeckCard({ topic, idx, cfg, onOpenDeck }: {
  topic: Topic;
  idx: number;
  cfg: typeof SUBCATEGORY_CONFIG[keyof typeof SUBCATEGORY_CONFIG];
  onOpenDeck: (t: Topic) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const cards = topic.flashcards || [];
  const tStats = getMasteryStats(cards);

  if (hasSubtopics) {
    const totalCards = topic.subtopics!.reduce((sum, st) => sum + (st.flashcards?.length || 0), 0);
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
        {/* Folder header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full bg-white rounded-2xl p-5 text-left border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5 relative overflow-hidden"
        >
          <div className={clsx("absolute left-0 top-0 bottom-0 w-1", cfg.dot)} />
          <div className="relative w-14 h-14 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-teal-500 opacity-10 translate-x-1 translate-y-1" />
            <div className="absolute inset-0 rounded-xl bg-teal-500 opacity-20 translate-x-0.5 translate-y-0.5" />
            <div className="absolute inset-0 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
              <FolderOpen size={22} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 mb-0.5 group-hover:text-gray-900 transition-colors">{topic.title}</h3>
            <p className="text-xs text-gray-500">{topic.subtopics!.length} subtopicos &middot; {totalCards} flashcards</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[9px] text-teal-500 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">{topic.subtopics!.length} sub</span>
            <ChevronDown size={16} className={clsx("text-gray-400 transition-transform duration-200", expanded && "rotate-180")} />
          </div>
        </button>
        {/* Subtopics */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-8 pl-4 border-l-2 border-teal-100 space-y-2 pt-2 pb-1">
                {topic.subtopics!.map((sub, subIdx) => {
                  const subCards = sub.flashcards || [];
                  const subStats = getMasteryStats(subCards);
                  return (
                    <motion.button key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: subIdx * 0.03 }}
                      whileHover={{ x: 3 }} onClick={() => onOpenDeck(sub)}
                      className="w-full bg-white rounded-xl p-4 text-left border border-gray-200/60 hover:border-gray-300 shadow-sm hover:shadow-md transition-all group flex items-center gap-4 relative overflow-hidden">
                      <div className="w-1 h-1 rounded-full bg-teal-300 shrink-0 absolute left-3 top-1/2 -translate-y-1/2" />
                      <div className="relative w-10 h-10 shrink-0 ml-2">
                        <div className="absolute inset-0 rounded-lg bg-teal-500 flex items-center justify-center shadow-sm">
                          <Layers size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 text-sm group-hover:text-gray-900 transition-colors">{sub.title}</h4>
                        {sub.summary && <p className="text-[11px] text-gray-400 line-clamp-1">{sub.summary}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {subCards.length > 0 ? (
                          <>
                            <div className="hidden sm:flex flex-col items-end gap-0.5">
                              <span className="text-xs font-bold text-gray-600">{subCards.length}</span>
                              <span className="text-[9px] text-gray-400">cards</span>
                            </div>
                            <ProgressRing pct={subStats.pct} size={32} stroke={2.5} color="text-teal-500" />
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg font-medium border border-gray-200">Vazio</span>
                        )}
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Regular topic (no subtopics)
  return (
    <motion.button key={topic.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      whileHover={{ x: 4 }} onClick={() => onOpenDeck(topic)}
      className="w-full bg-white rounded-2xl p-5 text-left border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5 relative overflow-hidden">
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1", cfg.dot)} />
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
}
