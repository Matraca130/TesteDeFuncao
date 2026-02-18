// ============================================================
// Axon v4.4 — Mock Data for Dev 1 (Content Management)
// Aligned with backend contract field names
// Used as fallback when backend is unreachable
// ============================================================

import type {
  Course, Semester, Section, Topic,
  Summary, Keyword, SubTopic, KeywordConnection,
} from './types';

export const MOCK_INSTITUTION = {
  id: 'inst-001',
  name: 'Faculdade de Medicina USP',
  slug: 'fmusp',
  logo_url: null,
  created_at: '2025-01-10T10:00:00Z',
  created_by: 'user-prof-001',
};

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-anatomy',
    institution_id: 'inst-001',
    name: 'Anatomia Humana',
    description: 'Estudo macroscopico e microscopico do corpo humano.',
    color: '#ef4444',
    sort_order: 0,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    created_by: 'user-prof-001',
  },
  {
    id: 'course-physiology',
    institution_id: 'inst-001',
    name: 'Fisiologia Medica',
    description: 'Mecanismos funcionais dos sistemas corporais.',
    color: '#3b82f6',
    sort_order: 1,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    created_by: 'user-prof-001',
  },
  {
    id: 'course-histology',
    institution_id: 'inst-001',
    name: 'Histologia',
    description: 'Estudo dos tecidos biologicos e suas funcoes.',
    color: '#8b5cf6',
    sort_order: 2,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    created_by: 'user-prof-001',
  },
  {
    id: 'course-biochemistry',
    institution_id: 'inst-001',
    name: 'Bioquimica',
    description: 'Reacoes quimicas e moleculares nos sistemas biologicos.',
    color: '#10b981',
    sort_order: 3,
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
    created_by: 'user-prof-001',
  },
];

// Backend: name + order_index (not title + sort_order)
export const MOCK_SEMESTERS: Semester[] = [
  { id: 'sem-anat-1', course_id: 'course-anatomy', name: '1o Semestre', order_index: 0 },
  { id: 'sem-anat-2', course_id: 'course-anatomy', name: '2o Semestre', order_index: 1 },
  { id: 'sem-phys-1', course_id: 'course-physiology', name: '1o Semestre', order_index: 0 },
];

// Backend: name + order_index (not title + sort_order)
export const MOCK_SECTIONS: Section[] = [
  { id: 'sec-locomotor', semester_id: 'sem-anat-1', name: 'Aparelho Locomotor', image_url: null, order_index: 0 },
  { id: 'sec-neuro', semester_id: 'sem-anat-1', name: 'Neuroanatomia', image_url: null, order_index: 1 },
  { id: 'sec-visceral', semester_id: 'sem-anat-2', name: 'Anatomia Visceral', image_url: null, order_index: 0 },
  { id: 'sec-cardio-phys', semester_id: 'sem-phys-1', name: 'Fisiologia Cardiovascular', image_url: null, order_index: 0 },
];

// Backend: name + order_index
export const MOCK_TOPICS: Topic[] = [
  { id: 'topic-femur', section_id: 'sec-locomotor', name: 'Femur e Articulacao do Quadril', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-joelho', section_id: 'sec-locomotor', name: 'Articulacao do Joelho', order_index: 1, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-cranial', section_id: 'sec-neuro', name: 'Nervos Cranianos', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-medula', section_id: 'sec-neuro', name: 'Medula Espinal', order_index: 1, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-coracao', section_id: 'sec-visceral', name: 'Coracao e Grandes Vasos', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-ciclo', section_id: 'sec-cardio-phys', name: 'Ciclo Cardiaco', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
];

// Backend: content_markdown (not content), NO title field
export const MOCK_SUMMARIES: Summary[] = [
  {
    id: 'sum-femur-1',
    topic_id: 'topic-femur',
    course_id: 'course-anatomy',
    institution_id: 'inst-001',
    content_markdown: '# Femur\n\nO femur e o osso mais longo do corpo humano. Articula-se proximalmente com o acetabulo do osso do quadril e distalmente com a tibia e a patela.\n\n## Epifise Proximal\n- Cabeca do femur\n- Colo do femur\n- Trocanter maior\n- Trocanter menor\n\n## Diafise\n- Linha aspera\n- Tuberosidade glutea\n\n## Epifise Distal\n- Condilos medial e lateral\n- Fossa intercondilar\n- Epicondilos',
    status: 'published',
    created_at: '2025-02-01T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-02-05T14:00:00Z',
  },
  {
    id: 'sum-cranial-1',
    topic_id: 'topic-cranial',
    course_id: 'course-anatomy',
    institution_id: 'inst-001',
    content_markdown: '# Nervos Cranianos\n\nSao 12 pares de nervos que emergem diretamente do encefalo.\n\n## Classificacao\n- **Sensitivos**: I (Olfatorio), II (Optico), VIII (Vestibulococlear)\n- **Motores**: III (Oculomotor), IV (Troclear), VI (Abducente), XI (Acessorio), XII (Hipoglosso)\n- **Mistos**: V (Trigemeo), VII (Facial), IX (Glossofaringeo), X (Vago)',
    status: 'published',
    created_at: '2025-02-10T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 'sum-joelho-draft',
    topic_id: 'topic-joelho',
    course_id: 'course-anatomy',
    institution_id: 'inst-001',
    content_markdown: '# Joelho\n\nEm construcao...',
    status: 'draft',
    created_at: '2025-03-01T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'sum-ciclo-draft',
    topic_id: 'topic-ciclo',
    course_id: 'course-anatomy',
    institution_id: 'inst-001',
    content_markdown: '# Ciclo Cardiaco\n\n## Sistole\n- Contracao isovolumetrica\n- Ejecao rapida\n- Ejecao lenta\n\n## Diastole\n- Relaxamento isovolumetrico\n- Enchimento rapido\n- Enchimento lento (diastase)\n- Sistole atrial',
    status: 'draft',
    created_at: '2025-03-05T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-03-05T10:00:00Z',
  },
];

export const MOCK_KEYWORDS: Keyword[] = [
  {
    id: 'kw-femur',
    institution_id: 'inst-001',
    term: 'Femur',
    definition: 'Osso mais longo do corpo humano, localizado na coxa.',
    priority: 3,
    status: 'published',
    created_at: '2025-02-01T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-02-01T10:00:00Z',
    subtopics: [
      { id: 'st-femur-prox', keyword_id: 'kw-femur', title: 'Epifise Proximal', description: 'Cabeca, colo e trocanters.', created_at: '2025-02-01T10:00:00Z' },
      { id: 'st-femur-diaf', keyword_id: 'kw-femur', title: 'Diafise', description: 'Corpo do femur com linha aspera.', created_at: '2025-02-01T10:00:00Z' },
      { id: 'st-femur-dist', keyword_id: 'kw-femur', title: 'Epifise Distal', description: 'Condilos e fossa intercondilar.', created_at: '2025-02-01T10:00:00Z' },
    ],
  },
  {
    id: 'kw-acetabulo',
    institution_id: 'inst-001',
    term: 'Acetabulo',
    definition: 'Cavidade do osso do quadril que recebe a cabeca do femur.',
    priority: 2,
    status: 'published',
    created_at: '2025-02-01T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-02-01T10:00:00Z',
    subtopics: [
      { id: 'st-ace-labrum', keyword_id: 'kw-acetabulo', title: 'Labrum Acetabular', description: 'Anel fibrocartilagineo.', created_at: '2025-02-01T10:00:00Z' },
    ],
  },
  {
    id: 'kw-nervo-vago',
    institution_id: 'inst-001',
    term: 'Nervo Vago (X)',
    definition: 'Decimo nervo craniano, o mais longo e com maior distribuicao.',
    priority: 3,
    status: 'published',
    created_at: '2025-02-10T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-02-10T10:00:00Z',
    subtopics: [
      { id: 'st-vago-cervical', keyword_id: 'kw-nervo-vago', title: 'Porcao Cervical', description: null, created_at: '2025-02-10T10:00:00Z' },
      { id: 'st-vago-toracica', keyword_id: 'kw-nervo-vago', title: 'Porcao Toracica', description: null, created_at: '2025-02-10T10:00:00Z' },
      { id: 'st-vago-abdominal', keyword_id: 'kw-nervo-vago', title: 'Porcao Abdominal', description: null, created_at: '2025-02-10T10:00:00Z' },
    ],
  },
  {
    id: 'kw-trigemeo',
    institution_id: 'inst-001',
    term: 'Nervo Trigemeo (V)',
    definition: 'Nervo craniano com tres ramos: oftalmico, maxilar e mandibular.',
    priority: 3,
    status: 'draft',
    created_at: '2025-02-10T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-02-10T10:00:00Z',
    subtopics: [],
  },
  {
    id: 'kw-menisco',
    institution_id: 'inst-001',
    term: 'Meniscos do Joelho',
    definition: 'Fibrocartilagens semilunares medial e lateral.',
    priority: 2,
    status: 'draft',
    created_at: '2025-03-01T10:00:00Z',
    created_by: 'user-prof-001',
    updated_at: '2025-03-01T10:00:00Z',
    subtopics: [
      { id: 'st-menisco-medial', keyword_id: 'kw-menisco', title: 'Menisco Medial', description: 'Formato de C, mais fixo.', created_at: '2025-03-01T10:00:00Z' },
      { id: 'st-menisco-lateral', keyword_id: 'kw-menisco', title: 'Menisco Lateral', description: 'Formato de O, mais movel.', created_at: '2025-03-01T10:00:00Z' },
    ],
  },
];

export const MOCK_CONNECTIONS: KeywordConnection[] = [
  {
    id: 'conn-femur-ace',
    keyword_a_id: 'kw-femur',
    keyword_b_id: 'kw-acetabulo',
    relationship_type: 'related',
    description: 'Articulacao coxofemoral - femur se articula com acetabulo.',
    created_at: '2025-02-01T10:00:00Z',
    created_by: 'user-prof-001',
  },
];

// Approval queue items - mixed entity types with draft status
export interface ApprovalItem {
  entity_type: 'keyword' | 'subtopic' | 'summary' | 'flashcard' | 'quiz_question';
  id: string;
  title: string;
  status: 'draft' | 'published' | 'rejected';
  source: string;
  created_at: string;
  parent_info?: string;
}

export const MOCK_APPROVAL_QUEUE: ApprovalItem[] = [
  { entity_type: 'summary', id: 'sum-joelho-draft', title: 'Articulacao do Joelho - Rascunho', status: 'draft', source: 'ai_generated', created_at: '2025-03-01T10:00:00Z', parent_info: 'Anatomia > 1o Sem > Locomotor > Joelho' },
  { entity_type: 'summary', id: 'sum-ciclo-draft', title: 'Ciclo Cardiaco - AI Generated', status: 'draft', source: 'ai_generated', created_at: '2025-03-05T10:00:00Z', parent_info: 'Fisiologia > 1o Sem > Cardiovascular > Ciclo' },
  { entity_type: 'keyword', id: 'kw-trigemeo', title: 'Nervo Trigemeo (V)', status: 'draft', source: 'manual', created_at: '2025-02-10T10:00:00Z', parent_info: 'Anatomia > 1o Sem > Neuro' },
  { entity_type: 'keyword', id: 'kw-menisco', title: 'Meniscos do Joelho', status: 'draft', source: 'manual', created_at: '2025-03-01T10:00:00Z', parent_info: 'Anatomia > 1o Sem > Locomotor' },
  { entity_type: 'subtopic', id: 'st-femur-dist', title: 'Epifise Distal (Femur)', status: 'draft', source: 'manual', created_at: '2025-02-01T10:00:00Z', parent_info: 'Keyword: Femur' },
  { entity_type: 'subtopic', id: 'st-vago-toracica', title: 'Porcao Toracica (N. Vago)', status: 'draft', source: 'manual', created_at: '2025-02-10T10:00:00Z', parent_info: 'Keyword: Nervo Vago (X)' },
  { entity_type: 'subtopic', id: 'st-vago-abdominal', title: 'Porcao Abdominal (N. Vago)', status: 'draft', source: 'manual', created_at: '2025-02-10T10:00:00Z', parent_info: 'Keyword: Nervo Vago (X)' },
  { entity_type: 'subtopic', id: 'st-menisco-medial', title: 'Menisco Medial', status: 'draft', source: 'manual', created_at: '2025-03-01T10:00:00Z', parent_info: 'Keyword: Meniscos do Joelho' },
  { entity_type: 'subtopic', id: 'st-menisco-lateral', title: 'Menisco Lateral', status: 'draft', source: 'manual', created_at: '2025-03-01T10:00:00Z', parent_info: 'Keyword: Meniscos do Joelho' },
];
