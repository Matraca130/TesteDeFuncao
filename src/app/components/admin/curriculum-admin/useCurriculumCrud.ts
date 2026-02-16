// ══════════════════════════════════════════════════════════════
// AXON — useCurriculumCrud (all state + CRUD + save/load logic)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Course, Section, TopicSubcategory } from '@/app/data/courses';
import { getTopicSubcategory } from '@/app/data/courses';
import { API_BASE, publicAnonKey, kvFetch } from '../shared/admin-api';
import type { EditableTopic, EditableSection, EditableSemester } from './curriculum-admin-types';
import { genId, staticToEditable, countItems } from './curriculum-admin-types';

export function useCurriculumCrud(currentCourse: Course) {
  // ── State ──
  const [semesters, setSemesters] = useState<EditableSemester[]>([]);
  const [originalHash, setOriginalHash] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isFromKV, setIsFromKV] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [quizIndex, setQuizIndex] = useState<Record<string, any>>({});
  const [flashcardIndex, setFlashcardIndex] = useState<Record<string, any>>({});

  // ── Computed ──
  const currentHash = useMemo(() => JSON.stringify(semesters), [semesters]);
  const hasChanges = currentHash !== originalHash && !isLoading;
  const counts = useMemo(() => countItems(semesters), [semesters]);

  // ── Load ──
  useEffect(() => { loadData(currentCourse); }, [currentCourse.id]);

  useEffect(() => {
    if (!isLoading) setOriginalHash(JSON.stringify(semesters));
  }, [isLoading]);

  const loadData = async (course: Course) => {
    setIsLoading(true);
    setSaveStatus('idle');

    try {
      const data = await kvFetch(`curriculum/${course.id}`);
      if (data.exists && data.semesters?.length > 0) {
        setSemesters(data.semesters);
        setIsFromKV(true);
        setExpandedNodes(new Set(data.semesters.map((s: any) => s.id)));
      } else {
        const staticData = staticToEditable(course);
        setSemesters(staticData);
        setIsFromKV(false);
        setExpandedNodes(new Set(staticData.map(s => s.id)));
      }
    } catch (err) {
      console.error('[Curriculum] Error loading:', err);
      const staticData = staticToEditable(course);
      setSemesters(staticData);
      setIsFromKV(false);
      setExpandedNodes(new Set(staticData.map(s => s.id)));
    }

    try {
      const [qData, fData] = await Promise.all([
        kvFetch(`quizzes-index/${course.id}`),
        kvFetch(`flashcards-index/${course.id}`),
      ]);
      setQuizIndex(qData.index || {});
      setFlashcardIndex(fData.index || {});
    } catch (err) {
      console.error('[Curriculum] Error loading indexes:', err);
    }

    setIsLoading(false);
  };

  // ── Toggle expand ──
  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ════════════ CRUD ════════════

  const addSemester = () => {
    const newSem: EditableSemester = {
      id: genId('sem'),
      title: `${semesters.length + 1}o Semestre`,
      sections: [],
    };
    setSemesters(prev => [...prev, newSem]);
    setExpandedNodes(prev => new Set([...prev, newSem.id]));
  };

  const updateSemester = (semIdx: number, field: keyof EditableSemester, value: any) => {
    setSemesters(prev => prev.map((s, i) => i === semIdx ? { ...s, [field]: value } : s));
  };

  const deleteSemester = (semIdx: number) => {
    setSemesters(prev => prev.filter((_, i) => i !== semIdx));
  };

  const addSection = (semIdx: number) => {
    const newSec: EditableSection = { id: genId('sec'), title: 'Nova Secao', topics: [] };
    setSemesters(prev => prev.map((s, i) => {
      if (i !== semIdx) return s;
      return { ...s, sections: [...s.sections, newSec] };
    }));
    const semId = semesters[semIdx]?.id;
    if (semId) setExpandedNodes(prev => new Set([...prev, semId, newSec.id]));
  };

  const updateSection = (semIdx: number, secIdx: number, field: keyof EditableSection, value: any) => {
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return { ...s, sections: s.sections.map((sec, secI) => secI === secIdx ? { ...sec, [field]: value } : sec) };
    }));
  };

  const deleteSection = (semIdx: number, secIdx: number) => {
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return { ...s, sections: s.sections.filter((_, i) => i !== secIdx) };
    }));
  };

  const addTopic = (semIdx: number, secIdx: number, subcategory?: TopicSubcategory) => {
    const idSuffix = subcategory === 'Aparelho Locomotor' ? 'artrologia'
      : subcategory === 'Neurovascular' ? 'vasc'
      : 'topic';
    const titleSuffix = subcategory === 'Aparelho Locomotor' ? ' (Locomotor)'
      : subcategory === 'Neurovascular' ? ' (Neurovascular)'
      : '';

    const newTopic: EditableTopic = { id: genId(idSuffix), title: `Novo Topico${titleSuffix}`, summary: '' };

    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return {
        ...s,
        sections: s.sections.map((sec, secI) => {
          if (secI !== secIdx) return sec;
          if (!subcategory) return { ...sec, topics: [...sec.topics, newTopic] };
          const topics = [...sec.topics];
          let insertIdx = topics.length;
          for (let i = topics.length - 1; i >= 0; i--) {
            if (getTopicSubcategory(topics[i] as any) === subcategory) {
              insertIdx = i + 1;
              break;
            }
          }
          topics.splice(insertIdx, 0, newTopic);
          return { ...sec, topics };
        }),
      };
    }));
    const secId = semesters[semIdx]?.sections[secIdx]?.id;
    if (secId) setExpandedNodes(prev => new Set([...prev, secId]));
  };

  const updateTopic = (semIdx: number, secIdx: number, topicIdx: number, field: keyof EditableTopic, value: string) => {
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return {
        ...s,
        sections: s.sections.map((sec, secI) => {
          if (secI !== secIdx) return sec;
          return { ...sec, topics: sec.topics.map((t, tI) => tI === topicIdx ? { ...t, [field]: value } : t) };
        }),
      };
    }));
  };

  const deleteTopic = (semIdx: number, secIdx: number, topicIdx: number) => {
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return {
        ...s,
        sections: s.sections.map((sec, secI) => {
          if (secI !== secIdx) return sec;
          return { ...sec, topics: sec.topics.filter((_, i) => i !== topicIdx) };
        }),
      };
    }));
  };

  const addSubtopic = (semIdx: number, secIdx: number, topicIdx: number) => {
    const newSub: EditableTopic = { id: genId('sub'), title: 'Novo Subtopico', summary: '' };
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return {
        ...s,
        sections: s.sections.map((sec, secI) => {
          if (secI !== secIdx) return sec;
          return {
            ...sec,
            topics: sec.topics.map((t, tI) => {
              if (tI !== topicIdx) return t;
              return { ...t, subtopics: [...(t.subtopics || []), newSub] };
            }),
          };
        }),
      };
    }));
    const topicId = semesters[semIdx]?.sections[secIdx]?.topics[topicIdx]?.id;
    if (topicId) setExpandedNodes(prev => new Set([...prev, topicId]));
  };

  const updateSubtopic = (semIdx: number, secIdx: number, topicIdx: number, subIdx: number, field: keyof EditableTopic, value: string) => {
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return {
        ...s,
        sections: s.sections.map((sec, secI) => {
          if (secI !== secIdx) return sec;
          return {
            ...sec,
            topics: sec.topics.map((t, tI) => {
              if (tI !== topicIdx) return t;
              return {
                ...t,
                subtopics: (t.subtopics || []).map((st, stI) => stI === subIdx ? { ...st, [field]: value } : st),
              };
            }),
          };
        }),
      };
    }));
  };

  const deleteSubtopic = (semIdx: number, secIdx: number, topicIdx: number, subIdx: number) => {
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return {
        ...s,
        sections: s.sections.map((sec, secI) => {
          if (secI !== secIdx) return sec;
          return {
            ...sec,
            topics: sec.topics.map((t, tI) => {
              if (tI !== topicIdx) return t;
              const newSubs = (t.subtopics || []).filter((_, i) => i !== subIdx);
              return { ...t, subtopics: newSubs.length > 0 ? newSubs : undefined };
            }),
          };
        }),
      };
    }));
  };

  const resetToStatic = () => {
    const staticData = staticToEditable(currentCourse);
    setSemesters(staticData);
    setIsFromKV(false);
    setExpandedNodes(new Set(staticData.map(s => s.id)));
  };

  // ── Save / Discard ──
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`${API_BASE}/curriculum/${currentCourse.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ semesters, courseName: currentCourse.name }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('success');
        setOriginalHash(JSON.stringify(semesters));
        setIsFromKV(true);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('[Curriculum] Save error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => { loadData(currentCourse); };

  const findStaticSection = (secId: string): Section | undefined => {
    for (const sem of currentCourse.semesters) {
      const found = sem.sections.find(s => s.id === secId);
      if (found) return found;
    }
    return undefined;
  };

  return {
    semesters, isLoading, isSaving, saveStatus, isFromKV,
    hasChanges, counts, expandedNodes, quizIndex, flashcardIndex,
    toggleExpand,
    addSemester, updateSemester, deleteSemester,
    addSection, updateSection, deleteSection,
    addTopic, updateTopic, deleteTopic,
    addSubtopic, updateSubtopic, deleteSubtopic,
    resetToStatic, handleSave, handleDiscard, findStaticSection,
  };
}
