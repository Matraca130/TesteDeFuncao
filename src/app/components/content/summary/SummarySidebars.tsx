import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Pen } from 'lucide-react';
import clsx from 'clsx';
import { MasteryLevel, masteryConfig, KeywordData } from '@/app/data/keywords';

// ─── Outline Sidebar ─────────────────────────────────────────────────────────

interface OutlineSidebarProps {
  showOutline: boolean;
  sections: any[];
  currentSection: number;
  scrollToSection: (idx: number) => void;
}

export function OutlineSidebar({ showOutline, sections, currentSection, scrollToSection }: OutlineSidebarProps) {
  return (
    <AnimatePresence>
      {showOutline && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="bg-[#3e4246] border-r border-black/20 overflow-hidden flex-shrink-0">
          <div className="p-4 h-full overflow-y-auto custom-scrollbar">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 px-2">Sumario</h3>
            <nav className="space-y-1">
              {sections.map((section: any, index: number) => (
                <button key={index} onClick={() => scrollToSection(index)} className={clsx("w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all", currentSection === index ? "bg-white/10 text-white font-medium" : "text-gray-300 hover:text-white hover:bg-white/5")}>
                  <div className="flex items-center gap-2">
                    <span className={clsx("w-1.5 h-1.5 rounded-full", currentSection === index ? "bg-sky-400" : "bg-gray-500")} />
                    <span className="line-clamp-2">{section.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Keywords Sidebar ────────────────────────────────────────────────────────

interface AnnotationStats { red: number; yellow: number; green: number; total: number; }
interface AnnotatedKeyword { keyword: KeywordData; mastery: MasteryLevel; notes: string[]; }
interface KeywordsSidebarProps { stats: AnnotationStats; annotatedKeywords: AnnotatedKeyword[]; }

export function KeywordsSidebar({ stats, annotatedKeywords }: KeywordsSidebarProps) {
  return (
    <div className="bg-white flex flex-col border-l border-gray-800 h-full">
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/80">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Palavras-Chave</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs font-medium text-red-700">{stats.red}</span></div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs font-medium text-amber-700">{stats.yellow}</span></div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium text-emerald-700">{stats.green}</span></div>
          <span className="text-xs text-gray-400 ml-auto">{stats.total} termos</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {annotatedKeywords.map(({ keyword, mastery: level, notes }) => {
          const mc = masteryConfig[level];
          return (
            <div key={keyword.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-default">
              <div className="flex items-center gap-2.5 mb-1">
                <span className={clsx("w-2.5 h-2.5 rounded-full shrink-0", mc.bgDot)} />
                <span className="font-medium text-sm text-gray-900 capitalize">{keyword.term}</span>
                {keyword.has3DModel && <Box size={12} className="text-blue-400 ml-auto shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 ml-5 leading-relaxed">{keyword.definition}</p>
              {notes.length > 0 && (<div className="ml-5 mt-1.5 flex items-center gap-1"><Pen size={10} className="text-emerald-500" /><span className="text-[10px] text-emerald-600">{notes.length} anotacao(oes)</span></div>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
