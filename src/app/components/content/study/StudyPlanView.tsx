// ============================================================
// Axon v4.4 — Study View: Study Plan + section/topic cards
// ============================================================
// StudyPlan       — Main plan view with left nav + semester grid
// SemesterBlock   — Renders a semester with sections
// SectionCard     — Card for a section in the grid
// SectionExpanded — Expanded view of a section showing topics
// TopicCard       — Card for a topic within a section
// ============================================================
import React, { useState } from 'react';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { AdminBanner, BackendStatusBadge } from '@/app/components/shared/AdminBanner';
import { headingStyle } from '@/app/design-system';
import type { Course, Section, Topic, Semester } from '@/app/data/courses';
import clsx from 'clsx';
import {
  ChevronLeft, ChevronUp, ChevronDown,
  BookOpen, Clock, Play, GraduationCap,
} from 'lucide-react';

// ── StudyPlan ──

export function StudyPlan({ course, selectedSection, onSelectSection, onStartSession }: {
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

// ── SemesterBlock ──

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

// ── SectionCard ──

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

// ── SectionExpanded ──

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

// ── TopicCard ──

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
