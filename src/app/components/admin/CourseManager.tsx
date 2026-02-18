// ============================================================
// Axon v4.4 — CourseManager (Dev 1, FASE 2)
// CRUD de cursos con color picker — wired to LIVE backend
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Course } from '../../lib/types';
import {
  Plus, Pencil, Trash2, GraduationCap, X, Check,
  Palette, BookOpen, MoreVertical, Loader2,
} from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

interface CourseManagerProps {
  courses: Course[];
  institutionId: string;
  onCoursesChange: (courses: Course[]) => void;
  onSelectCourse?: (course: Course) => void;
  onCreateCourse?: (data: { name: string; description: string | null; color: string }) => Promise<Course | null>;
  onUpdateCourse?: (id: string, data: { name: string; description: string | null; color: string }) => Promise<Course | null>;
  onDeleteCourse?: (id: string) => Promise<boolean>;
}

export function CourseManager({ courses, institutionId, onCoursesChange, onSelectCourse, onCreateCourse, onUpdateCourse, onDeleteCourse }: CourseManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setEditingCourse(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (course: Course) => {
    setFormData({ name: course.name, description: course.description || '', color: course.color });
    setEditingCourse(course);
    setShowForm(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingCourse) {
        if (onUpdateCourse) {
          const updated = await onUpdateCourse(editingCourse.id, {
            name: formData.name, description: formData.description || null, color: formData.color,
          });
          if (updated) {
            onCoursesChange(courses.map(c => c.id === editingCourse.id ? updated : c));
          }
        } else {
          onCoursesChange(courses.map(c =>
            c.id === editingCourse.id
              ? { ...c, name: formData.name, description: formData.description || null, color: formData.color }
              : c
          ));
        }
      } else {
        if (onCreateCourse) {
          const newCourse = await onCreateCourse({
            name: formData.name, description: formData.description || null, color: formData.color,
          });
          if (newCourse) onCoursesChange([...courses, newCourse]);
        } else {
          const newCourse: Course = {
            id: `course-${Date.now()}`,
            institution_id: institutionId,
            name: formData.name,
            description: formData.description || null,
            color: formData.color,
            sort_order: courses.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user-prof-001',
          };
          onCoursesChange([...courses, newCourse]);
        }
      }
    } catch (err) {
      console.error('Failed to save course:', err);
    } finally {
      setSaving(false);
      resetForm();
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja deletar este curso? Todos os semestres, secoes e topicos serao removidos.')) return;
    try {
      if (onDeleteCourse) {
        const ok = await onDeleteCourse(courseId);
        if (ok) onCoursesChange(courses.filter(c => c.id !== courseId));
      } else {
        onCoursesChange(courses.filter(c => c.id !== courseId));
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cursos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{courses.length} curso{courses.length !== 1 ? 's' : ''} cadastrado{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Curso
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {courses.map((course) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectCourse?.(course)}
            >
              <div className="h-2" style={{ backgroundColor: course.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: course.color + '20' }}>
                      <GraduationCap size={20} style={{ color: course.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{course.name}</h3>
                      {course.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === course.id ? null : course.id); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === course.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button onClick={() => openEdit(course)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Pencil size={14} /> Editar
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> Deletar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <BookOpen size={12} />
                    <span className="font-medium" style={{ color: course.color }}>{course.sort_order + 1}o</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Palette size={12} />
                    <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: course.color }} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {courses.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Nenhum curso cadastrado ainda.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium">
            Criar primeiro curso
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">{editingCourse ? 'Editar Curso' : 'Novo Curso'}</h3>
                  <button onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome do curso</label>
                  <input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Anatomia Humana" autoFocus
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Descricao (opcional)</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descricao breve do curso..." rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Cor do curso</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button key={color} onClick={() => setFormData(f => ({ ...f, color }))}
                        className="w-8 h-8 rounded-xl border-2 transition-all hover:scale-110"
                        style={{ backgroundColor: color, borderColor: formData.color === color ? '#111827' : 'transparent' }}>
                        {formData.color === color && <Check size={14} className="text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: formData.color }} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{formData.name || 'Nome do curso'}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{formData.color}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={!formData.name.trim() || saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingCourse ? 'Salvar' : 'Criar Curso'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
