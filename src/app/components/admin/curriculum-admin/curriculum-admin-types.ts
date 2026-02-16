// ══════════════════════════════════════════════════════════════
// AXON — Curriculum Admin Types & Helpers
// ══════════════════════════════════════════════════════════════

import type { Course } from '@/app/data/courses';

// ── Editable types (decoupled from static Course types) ──
export interface EditableTopic {
  id: string;
  title: string;
  summary: string;
  subtopics?: EditableTopic[];
}

export interface EditableSection {
  id: string;
  title: string;
  topics: EditableTopic[];
}

export interface EditableSemester {
  id: string;
  title: string;
  sections: EditableSection[];
}

// ── Helpers ──
export const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function staticToEditable(course: Course): EditableSemester[] {
  return course.semesters.map(sem => ({
    id: sem.id,
    title: sem.title,
    sections: sem.sections.map(sec => ({
      id: sec.id,
      title: sec.title,
      topics: sec.topics.map(t => ({
        id: t.id,
        title: t.title,
        summary: t.summary || '',
        subtopics: t.subtopics?.map(st => ({
          id: st.id,
          title: st.title,
          summary: st.summary || '',
        })),
      })),
    })),
  }));
}

export function countItems(semesters: EditableSemester[]) {
  let sections = 0, topics = 0, subtopics = 0;
  semesters.forEach(s => {
    sections += s.sections.length;
    s.sections.forEach(sec => {
      topics += sec.topics.length;
      sec.topics.forEach(t => { subtopics += t.subtopics?.length || 0; });
    });
  });
  return { semesters: semesters.length, sections, topics, subtopics };
}
