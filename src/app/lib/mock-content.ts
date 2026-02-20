import type { Course, Semester, Section, Topic, Summary, Keyword } from './types-core';

export const MOCK_COURSES: Course[] = [
  { id: 'course-anatomy', institution_id: 'inst-001', name: 'Anatomia Humana', description: 'Estudo completo da anatomia', color: '#14b8a6', sort_order: 0, created_at: '2025-01-10T10:00:00Z', updated_at: '2025-01-10T10:00:00Z', created_by: 'user-prof-001' },
  { id: 'course-physiology', institution_id: 'inst-001', name: 'Fisiologia Medica', description: 'Funcoes dos sistemas organicos', color: '#6366f1', sort_order: 1, created_at: '2025-01-10T10:00:00Z', updated_at: '2025-01-10T10:00:00Z', created_by: 'user-prof-001' },
];
export const MOCK_SEMESTERS: Semester[] = [
  { id: 'sem-1', course_id: 'course-anatomy', name: '1o Semestre', order_index: 0 },
  { id: 'sem-2', course_id: 'course-anatomy', name: '2o Semestre', order_index: 1 },
  { id: 'sem-3', course_id: 'course-physiology', name: '1o Semestre', order_index: 0 },
];
export const MOCK_SECTIONS: Section[] = [
  { id: 'sec-locomotor', semester_id: 'sem-1', name: 'Sistema Locomotor', image_url: null, order_index: 0 },
  { id: 'sec-nervoso', semester_id: 'sem-1', name: 'Sistema Nervoso', image_url: null, order_index: 1 },
  { id: 'sec-cardio', semester_id: 'sem-3', name: 'Sistema Cardiovascular', image_url: null, order_index: 0 },
];
export const MOCK_TOPICS: Topic[] = [
  { id: 'topic-femur', section_id: 'sec-locomotor', name: 'Femur', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-tibia', section_id: 'sec-locomotor', name: 'Tibia e Fibula', order_index: 1, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-cranial', section_id: 'sec-nervoso', name: 'Nervos Cranianos', order_index: 0, created_at: '2025-01-20T10:00:00Z' },
];
export const MOCK_SUMMARIES: Summary[] = [
  { id: 'sum-femur-1', topic_id: 'topic-femur', course_id: 'course-anatomy', institution_id: 'inst-001', title: 'Anatomia do Femur', content_markdown: '# Femur\n\nO femur e o osso mais longo...', status: 'published', created_by: 'user-prof-001', created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', version: 2 },
  { id: 'sum-cranial-1', topic_id: 'topic-cranial', course_id: 'course-anatomy', institution_id: 'inst-001', title: 'Nervos Cranianos \u2014 Visao Geral', content_markdown: '# Nervos Cranianos\n\nOs 12 pares de nervos...', status: 'published', created_by: 'user-prof-001', created_at: '2025-02-05T10:00:00Z', updated_at: '2025-02-15T10:00:00Z', version: 1 },
];
export const MOCK_KEYWORDS: Keyword[] = [
  { id: 'kw-femur', institution_id: 'inst-001', term: 'Femur', definition: 'Osso mais longo do corpo humano.', priority: 2, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
  { id: 'kw-nervo-vago', institution_id: 'inst-001', term: 'Nervo Vago', definition: 'X par craniano com funcao parassimpatica.', priority: 3, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-20T10:00:00Z', updated_at: '2025-01-20T10:00:00Z' },
  { id: 'kw-trocanter', institution_id: 'inst-001', term: 'Trocanter', definition: 'Saliencia ossea do femur proximal.', priority: 1, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
];
