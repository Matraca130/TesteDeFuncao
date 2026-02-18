// ============================================================
// Axon v4.4 — ContentTree (Dev 1, FASE 2)
// Semester -> Section -> Topic tree view
// Wired to LIVE backend via callbacks from App.tsx
// Field names aligned: name, order_index (backend contract)
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Course, Semester, Section, Topic } from '../../lib/types';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  GraduationCap, FileText,
  X, Check, FolderOpen, Folder, Loader2,
} from 'lucide-react';

interface ContentTreeProps {
  course: Course;
  semesters: Semester[];
  sections: Section[];
  topics: Topic[];
  onSemestersChange: (semesters: Semester[]) => void;
  onSectionsChange: (sections: Section[]) => void;
  onTopicsChange: (topics: Topic[]) => void;
  onSelectTopic?: (topic: Topic) => void;
  // Backend CRUD callbacks (optional — if absent, uses local-only)
  onCreateSemester?: (data: { course_id: string; name: string; order_index: number }) => Promise<Semester | null>;
  onUpdateSemester?: (id: string, data: { name: string }) => Promise<Semester | null>;
  onDeleteSemester?: (id: string) => Promise<boolean>;
  onCreateSection?: (data: { semester_id: string; name: string; order_index: number }) => Promise<Section | null>;
  onUpdateSection?: (id: string, data: { name: string }) => Promise<Section | null>;
  onDeleteSection?: (id: string) => Promise<boolean>;
  onCreateTopic?: (data: { section_id: string; name: string; order_index: number }) => Promise<Topic | null>;
  onUpdateTopic?: (id: string, data: { name: string }) => Promise<Topic | null>;
  onDeleteTopic?: (id: string) => Promise<boolean>;
}

type InlineEditTarget = { type: 'semester' | 'section' | 'topic'; id: string | null; parentId?: string };

export function ContentTree({
  course, semesters, sections, topics,
  onSemestersChange, onSectionsChange, onTopicsChange,
  onSelectTopic,
  onCreateSemester, onUpdateSemester, onDeleteSemester,
  onCreateSection, onUpdateSection, onDeleteSection,
  onCreateTopic, onUpdateTopic, onDeleteTopic,
}: ContentTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(semesters.filter(s => s.course_id === course.id).map(s => s.id)));
  const [editTarget, setEditTarget] = useState<InlineEditTarget | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const courseSemesters = semesters.filter(s => s.course_id === course.id).sort((a, b) => a.order_index - b.order_index);

  const getSections = (semId: string) =>
    sections.filter(s => s.semester_id === semId).sort((a, b) => a.order_index - b.order_index);

  const getTopics = (secId: string) =>
    topics.filter(t => t.section_id === secId).sort((a, b) => a.order_index - b.order_index);

  const startAdd = (type: 'semester' | 'section' | 'topic', parentId?: string) => {
    setEditTarget({ type, id: null, parentId });
    setEditValue('');
    if (parentId) setExpanded(prev => new Set(prev).add(parentId));
  };

  const startEdit = (type: 'semester' | 'section' | 'topic', id: string, currentName: string) => {
    setEditTarget({ type, id });
    setEditValue(currentName);
  };

  const cancelEdit = () => { setEditTarget(null); setEditValue(''); };

  const confirmEdit = async () => {
    if (!editTarget || !editValue.trim()) return;
    const { type, id, parentId } = editTarget;
    setSaving(true);

    try {
      if (!id) {
        // CREATE
        switch (type) {
          case 'semester': {
            if (onCreateSemester) {
              const created = await onCreateSemester({ course_id: course.id, name: editValue.trim(), order_index: courseSemesters.length });
              if (created) {
                onSemestersChange([...semesters, created]);
                setExpanded(prev => new Set(prev).add(created.id));
              }
            } else {
              const newSem: Semester = { id: `sem-${Date.now()}`, course_id: course.id, name: editValue.trim(), order_index: courseSemesters.length };
              onSemestersChange([...semesters, newSem]);
              setExpanded(prev => new Set(prev).add(newSem.id));
            }
            break;
          }
          case 'section': {
            if (onCreateSection) {
              const created = await onCreateSection({ semester_id: parentId!, name: editValue.trim(), order_index: getSections(parentId!).length });
              if (created) {
                onSectionsChange([...sections, created]);
                setExpanded(prev => new Set(prev).add(created.id));
              }
            } else {
              const newSec: Section = { id: `sec-${Date.now()}`, semester_id: parentId!, name: editValue.trim(), image_url: null, order_index: getSections(parentId!).length };
              onSectionsChange([...sections, newSec]);
              setExpanded(prev => new Set(prev).add(newSec.id));
            }
            break;
          }
          case 'topic': {
            if (onCreateTopic) {
              const created = await onCreateTopic({ section_id: parentId!, name: editValue.trim(), order_index: getTopics(parentId!).length });
              if (created) onTopicsChange([...topics, created]);
            } else {
              const newTopic: Topic = { id: `topic-${Date.now()}`, section_id: parentId!, name: editValue.trim(), order_index: getTopics(parentId!).length, created_at: new Date().toISOString() };
              onTopicsChange([...topics, newTopic]);
            }
            break;
          }
        }
      } else {
        // UPDATE
        switch (type) {
          case 'semester': {
            if (onUpdateSemester) {
              const updated = await onUpdateSemester(id, { name: editValue.trim() });
              if (updated) onSemestersChange(semesters.map(s => s.id === id ? updated : s));
            } else {
              onSemestersChange(semesters.map(s => s.id === id ? { ...s, name: editValue.trim() } : s));
            }
            break;
          }
          case 'section': {
            if (onUpdateSection) {
              const updated = await onUpdateSection(id, { name: editValue.trim() });
              if (updated) onSectionsChange(sections.map(s => s.id === id ? updated : s));
            } else {
              onSectionsChange(sections.map(s => s.id === id ? { ...s, name: editValue.trim() } : s));
            }
            break;
          }
          case 'topic': {
            if (onUpdateTopic) {
              const updated = await onUpdateTopic(id, { name: editValue.trim() });
              if (updated) onTopicsChange(topics.map(t => t.id === id ? updated : t));
            } else {
              onTopicsChange(topics.map(t => t.id === id ? { ...t, name: editValue.trim() } : t));
            }
            break;
          }
        }
      }
    } catch (err) {
      console.error(`[ContentTree] ${id ? 'Update' : 'Create'} ${type} failed:`, err);
    } finally {
      setSaving(false);
      cancelEdit();
    }
  };

  const handleDelete = async (type: 'semester' | 'section' | 'topic', id: string) => {
    const labels = { semester: 'semestre', section: 'secao', topic: 'topico' };
    if (!confirm(`Deletar este ${labels[type]} e todo seu conteudo?`)) return;

    try {
      switch (type) {
        case 'semester': {
          if (onDeleteSemester) {
            const ok = await onDeleteSemester(id);
            if (!ok) return;
          }
          const secs = getSections(id);
          const topicIds = secs.flatMap(s => getTopics(s.id).map(t => t.id));
          onTopicsChange(topics.filter(t => !topicIds.includes(t.id)));
          onSectionsChange(sections.filter(s => s.semester_id !== id));
          onSemestersChange(semesters.filter(s => s.id !== id));
          break;
        }
        case 'section': {
          if (onDeleteSection) {
            const ok = await onDeleteSection(id);
            if (!ok) return;
          }
          const topicIds = getTopics(id).map(t => t.id);
          onTopicsChange(topics.filter(t => !topicIds.includes(t.id)));
          onSectionsChange(sections.filter(s => s.id !== id));
          break;
        }
        case 'topic': {
          if (onDeleteTopic) {
            const ok = await onDeleteTopic(id);
            if (!ok) return;
          }
          onTopicsChange(topics.filter(t => t.id !== id));
          break;
        }
      }
    } catch (err) {
      console.error(`[ContentTree] Delete ${type} failed:`, err);
    }
  };

  const InlineInput = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div className="flex items-center gap-2 py-1">
      <input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-teal-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        autoFocus placeholder="Nome..."
        disabled={saving}
      />
      <button onClick={onConfirm} disabled={saving} className="p-1 rounded-lg bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      </button>
      <button onClick={onCancel} disabled={saving} className="p-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={14} /></button>
    </div>
  );

  const totalSections = courseSemesters.reduce((acc, sem) => acc + getSections(sem.id).length, 0);
  const totalTopics = courseSemesters.reduce((acc, sem) =>
    acc + getSections(sem.id).reduce((a2, sec) => a2 + getTopics(sec.id).length, 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: course.color + '20' }}>
            <GraduationCap size={16} style={{ color: course.color }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{course.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{courseSemesters.length} semestre{courseSemesters.length !== 1 ? 's' : ''}</span>
              <span>{totalSections} secao{totalSections !== 1 ? 'es' : ''}</span>
              <span>{totalTopics} topico{totalTopics !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {courseSemesters.map((sem) => {
          const isExpSem = expanded.has(sem.id);
          const semSections = getSections(sem.id);
          return (
            <div key={sem.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 group cursor-pointer hover:bg-gray-50" onClick={() => toggle(sem.id)}>
                <span className="text-gray-400">{isExpSem ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                <GraduationCap size={16} className="text-amber-500 shrink-0" />
                {editTarget?.type === 'semester' && editTarget.id === sem.id ? (
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <InlineInput onConfirm={confirmEdit} onCancel={cancelEdit} />
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-gray-800 flex-1">{sem.name}</span>
                    <span className="text-[10px] text-gray-400 mr-2">{semSections.length} secoes</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); startEdit('semester', sem.id, sem.name); }} className="p-1 rounded hover:bg-gray-200">
                        <Pencil size={12} className="text-gray-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete('semester', sem.id); }} className="p-1 rounded hover:bg-red-50">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence>
                {isExpSem && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                    <div className="pl-8 pr-4 pb-3 space-y-1">
                      {semSections.map((sec) => {
                        const isExpSec = expanded.has(sec.id);
                        const secTopics = getTopics(sec.id);
                        return (
                          <div key={sec.id}>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg group cursor-pointer hover:bg-blue-50/50" onClick={() => toggle(sec.id)}>
                              <span className="text-gray-400">{isExpSec ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                              {isExpSec ? <FolderOpen size={14} className="text-blue-500 shrink-0" /> : <Folder size={14} className="text-blue-500 shrink-0" />}
                              {editTarget?.type === 'section' && editTarget.id === sec.id ? (
                                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                  <InlineInput onConfirm={confirmEdit} onCancel={cancelEdit} />
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm font-medium text-gray-700 flex-1">{sec.name}</span>
                                  <span className="text-[10px] text-gray-400 mr-1">{secTopics.length} topicos</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit('section', sec.id, sec.name); }} className="p-1 rounded hover:bg-gray-200"><Pencil size={11} className="text-gray-400" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete('section', sec.id); }} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                                  </div>
                                </>
                              )}
                            </div>

                            <AnimatePresence>
                              {isExpSec && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                  <div className="pl-8 space-y-0.5 py-1">
                                    {secTopics.map((topic) => (
                                      <div key={topic.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg group hover:bg-teal-50/50 cursor-pointer" onClick={() => onSelectTopic?.(topic)}>
                                        <FileText size={13} className="text-teal-500 shrink-0" />
                                        {editTarget?.type === 'topic' && editTarget.id === topic.id ? (
                                          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                            <InlineInput onConfirm={confirmEdit} onCancel={cancelEdit} />
                                          </div>
                                        ) : (
                                          <>
                                            <span className="text-sm text-gray-700 flex-1">{topic.name}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={(e) => { e.stopPropagation(); startEdit('topic', topic.id, topic.name); }} className="p-1 rounded hover:bg-gray-200"><Pencil size={11} className="text-gray-400" /></button>
                                              <button onClick={(e) => { e.stopPropagation(); handleDelete('topic', topic.id); }} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {editTarget?.type === 'topic' && editTarget.id === null && editTarget.parentId === sec.id ? (
                                      <div className="px-3"><InlineInput onConfirm={confirmEdit} onCancel={cancelEdit} /></div>
                                    ) : (
                                      <button onClick={() => startAdd('topic', sec.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50/30 transition-colors w-full">
                                        <Plus size={12} /> Adicionar topico
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                      {editTarget?.type === 'section' && editTarget.id === null && editTarget.parentId === sem.id ? (
                        <div className="px-3"><InlineInput onConfirm={confirmEdit} onCancel={cancelEdit} /></div>
                      ) : (
                        <button onClick={() => startAdd('section', sem.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50/30 transition-colors w-full">
                          <Plus size={12} /> Adicionar secao
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {editTarget?.type === 'semester' && editTarget.id === null ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <InlineInput onConfirm={confirmEdit} onCancel={cancelEdit} />
          </div>
        ) : (
          <button onClick={() => startAdd('semester')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/30 transition-all">
            <Plus size={16} /> Adicionar Semestre
          </button>
        )}
      </div>
    </div>
  );
}
