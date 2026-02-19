// Axon v4.4 — Full Seed: Content hierarchy + SACRED entities + Plans/Media/Admin/Quiz
// Called by POST /seed after student data is seeded.
import * as kv from "./kv_store.tsx";
import { K } from "./kv-schema.tsx";

export async function seedContentAndSacred(): Promise<number> {
  const keys: string[] = [];
  const values: any[] = [];

  // ── Courses ────────────────────────────────────────────
  const courses = [
    { id: 'course-anatomy', institution_id: 'inst-001', name: 'Anatomia Humana', description: 'Estudo completo da anatomia', color: '#14b8a6', sort_order: 0, created_at: '2025-01-10T10:00:00Z', updated_at: '2025-01-10T10:00:00Z', created_by: 'user-prof-001' },
    { id: 'course-physiology', institution_id: 'inst-001', name: 'Fisiologia Medica', description: 'Funcoes dos sistemas organicos', color: '#6366f1', sort_order: 1, created_at: '2025-01-10T10:00:00Z', updated_at: '2025-01-10T10:00:00Z', created_by: 'user-prof-001' },
  ];
  for (const c of courses) { keys.push(K.course(c.id)); values.push(c); }

  // ── Semesters ──────────────────────────────────────────
  const semesters = [
    { id: 'sem-1', course_id: 'course-anatomy', name: '1o Semestre', order_index: 0 },
    { id: 'sem-2', course_id: 'course-anatomy', name: '2o Semestre', order_index: 1 },
    { id: 'sem-3', course_id: 'course-physiology', name: '1o Semestre', order_index: 0 },
  ];
  for (const s of semesters) { keys.push(K.semester(s.id)); values.push(s); }

  // ── Sections ───────────────────────────────────────────
  const sections = [
    { id: 'sec-locomotor', semester_id: 'sem-1', name: 'Sistema Locomotor', image_url: null, order_index: 0 },
    { id: 'sec-nervoso', semester_id: 'sem-1', name: 'Sistema Nervoso', image_url: null, order_index: 1 },
    { id: 'sec-cardio', semester_id: 'sem-3', name: 'Sistema Cardiovascular', image_url: null, order_index: 0 },
  ];
  for (const s of sections) { keys.push(K.section(s.id)); values.push(s); }

  // ── Topics ─────────────────────────────────────────────
  const topics = [
    { id: 'topic-femur', section_id: 'sec-locomotor', name: 'Femur', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
    { id: 'topic-tibia', section_id: 'sec-locomotor', name: 'Tibia e Fibula', order_index: 1, created_at: '2025-01-15T10:00:00Z' },
    { id: 'topic-cranial', section_id: 'sec-nervoso', name: 'Nervos Cranianos', order_index: 0, created_at: '2025-01-20T10:00:00Z' },
  ];
  for (const t of topics) { keys.push(K.topic(t.id)); values.push(t); }

  // ── Summaries (content) ────────────────────────────────
  const summaries = [
    { id: 'sum-femur-1', topic_id: 'topic-femur', course_id: 'course-anatomy', institution_id: 'inst-001', content_markdown: '# Femur\n\nO femur e o osso mais longo...', status: 'published', created_by: 'user-prof-001', created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', version: 2 },
    { id: 'sum-cranial-1', topic_id: 'topic-cranial', course_id: 'course-anatomy', institution_id: 'inst-001', content_markdown: '# Nervos Cranianos\n\nOs 12 pares de nervos...', status: 'published', created_by: 'user-prof-001', created_at: '2025-02-05T10:00:00Z', updated_at: '2025-02-15T10:00:00Z', version: 1 },
  ];
  for (const s of summaries) { keys.push(K.summary(s.id)); values.push(s); }

  // ── Keywords ───────────────────────────────────────────
  const keywords = [
    { id: 'kw-femur', institution_id: 'inst-001', term: 'Femur', definition: 'Osso mais longo do corpo humano.', priority: 2, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
    { id: 'kw-nervo-vago', institution_id: 'inst-001', term: 'Nervo Vago', definition: 'X par craniano com funcao parassimpatica.', priority: 3, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-20T10:00:00Z', updated_at: '2025-01-20T10:00:00Z' },
    { id: 'kw-trocanter', institution_id: 'inst-001', term: 'Trocanter', definition: 'Saliencia ossea do femur proximal.', priority: 1, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
  ];
  for (const k of keywords) { keys.push(K.keyword(k.id)); values.push(k); }

  // ── SACRED: KwStudentNotes ─────────────────────────────
  const kwStudentNotes = [
    { id: 'kw-note-001', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'O femur articula-se com o acetabulo.', created_at: '2025-02-15T14:00:00Z', updated_at: '2025-02-15T14:00:00Z', deleted_at: null },
    { id: 'kw-note-002', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'Trocanter maior: insercao do gluteo medio.', created_at: '2025-02-16T10:00:00Z', updated_at: '2025-02-16T10:00:00Z', deleted_at: null },
    { id: 'kw-note-003', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'Nota deletada para teste de soft-delete.', created_at: '2025-02-17T08:00:00Z', updated_at: '2025-02-17T09:00:00Z', deleted_at: '2025-02-17T09:00:00Z' },
    { id: 'kw-note-004', keyword_id: 'kw-nervo-vago', student_id: 'demo-student-001', content: 'O vago tem funcao parassimpatica.', created_at: '2025-02-18T11:00:00Z', updated_at: '2025-02-18T11:00:00Z', deleted_at: null },
  ];
  for (const n of kwStudentNotes) { keys.push(K.kwStudentNote(n.id)); values.push(n); }

  // ── SACRED: KwProfNotes ────────────────────────────────
  const kwProfNotes = [
    { id: 'prof-note-001', keyword_id: 'kw-femur', professor_id: 'user-prof-001', content: 'Angulo de inclinacao do colo do femur: ~125 graus.', visibility: 'visible', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z' },
    { id: 'prof-note-002', keyword_id: 'kw-femur', professor_id: 'user-prof-001', content: 'Para a prova: diferenciar fratura do colo vs trochanteriana.', visibility: 'visible', created_at: '2025-02-11T10:00:00Z', updated_at: '2025-02-11T10:00:00Z' },
    { id: 'prof-note-003', keyword_id: 'kw-nervo-vago', professor_id: 'user-prof-001', content: 'Estimulacao vagal: manobra de Valsalva para TSV.', visibility: 'visible', created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-15T10:00:00Z' },
  ];
  for (const n of kwProfNotes) { keys.push(K.kwProfNote(n.id)); values.push(n); }

  // ── SACRED: VideoNotes ─────────────────────────────────
  const videoNotes = [
    { id: 'vnote-001', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Cabeca do femur.', timestamp_ms: 120000, created_at: '2025-02-20T10:00:00Z', updated_at: '2025-02-20T10:00:00Z', deleted_at: null },
    { id: 'vnote-002', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Linha aspera.', timestamp_ms: 480000, created_at: '2025-02-20T11:00:00Z', updated_at: '2025-02-20T11:00:00Z', deleted_at: null },
    { id: 'vnote-003', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Nota geral.', timestamp_ms: null, created_at: '2025-02-20T12:00:00Z', updated_at: '2025-02-20T12:00:00Z', deleted_at: null },
    { id: 'vnote-004', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Nota deletada.', timestamp_ms: 300000, created_at: '2025-02-20T13:00:00Z', updated_at: '2025-02-20T14:00:00Z', deleted_at: '2025-02-20T14:00:00Z' },
    { id: 'vnote-005', video_id: 'vid-cranial-01', student_id: 'demo-student-001', content: 'Mnemonica nervos cranianos.', timestamp_ms: 60000, created_at: '2025-02-21T10:00:00Z', updated_at: '2025-02-21T10:00:00Z', deleted_at: null },
  ];
  for (const n of videoNotes) { keys.push(K.videoNote(n.id)); values.push(n); }

  // ── SACRED: TextAnnotations ────────────────────────────
  const textAnnotations = [
    { id: 'ann-001', summary_id: 'sum-femur-1', student_id: 'demo-student-001', original_text: 'O femur e o osso mais longo do corpo humano', display_text: 'O femur e o osso mais longo do corpo humano', color: 'yellow', note: 'Importante para prova!', type: 'highlight', created_at: '2025-02-15T14:00:00Z', updated_at: '2025-02-15T14:00:00Z', deleted_at: null },
    { id: 'ann-002', summary_id: 'sum-femur-1', student_id: 'demo-student-001', original_text: 'Cabeca do femur', display_text: 'Cabeca do femur', color: 'blue', note: 'Articulacao esferoidea com o acetabulo.', type: 'note', created_at: '2025-02-15T14:30:00Z', updated_at: '2025-02-15T14:30:00Z', deleted_at: null },
  ];
  for (const a of textAnnotations) { keys.push(K.textAnnotation(a.id)); values.push(a); }

  // ── Plans ──────────────────────────────────────────────
  const plans = [
    { id: 'plan-free', institution_id: 'inst-001', name: 'Plano Gratuito', description: 'Acesso basico.', price: 0, currency: 'BRL', is_default: true, is_trial: false, max_students: 50, features: ['Resumos', 'Flashcards', 'Quiz limitado'], created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
    { id: 'plan-premium', institution_id: 'inst-001', name: 'Premium Academico', description: 'Acesso completo.', price: 49.90, currency: 'BRL', is_default: false, is_trial: false, max_students: 500, features: ['Tudo', 'AI', 'Videos', 'Analytics'], created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
    { id: 'plan-trial', institution_id: 'inst-001', name: 'Trial 14 dias', description: 'Acesso completo 14 dias.', price: 0, currency: 'BRL', is_default: false, is_trial: true, trial_duration_days: 14, max_students: 100, features: ['Temporario completo'], created_at: '2025-03-01T10:00:00Z', updated_at: '2025-03-01T10:00:00Z' },
  ];
  for (const p of plans) { keys.push(K.plan(p.id)); values.push(p); }

  // ── Plan Rules ─────────────────────────────────────────
  const planRules = [
    { id: 'rule-001', plan_id: 'plan-free', resource_type: 'course', resource_id: 'course-anatomy', permission: 'read', created_at: '2025-01-15T10:00:00Z' },
    { id: 'rule-002', plan_id: 'plan-premium', resource_type: 'course', resource_id: 'course-anatomy', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
    { id: 'rule-003', plan_id: 'plan-premium', resource_type: 'feature', resource_id: 'ai-assistant', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
    { id: 'rule-004', plan_id: 'plan-premium', resource_type: 'feature', resource_id: 'video-notes', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
  ];
  for (const r of planRules) { keys.push(K.planRule(r.id)); values.push(r); }

  // ── Videos ─────────────────────────────────────────────
  const videos = [
    { id: 'vid-femur-01', summary_id: 'sum-femur-1', title: 'Anatomia do Femur', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 2400000, order_index: 0, created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', created_by: 'user-prof-001' },
    { id: 'vid-femur-02', summary_id: 'sum-femur-1', title: 'Palpacao Ossea', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 900000, order_index: 1, created_at: '2025-02-12T10:00:00Z', updated_at: '2025-02-12T10:00:00Z', created_by: 'user-prof-001' },
    { id: 'vid-cranial-01', summary_id: 'sum-cranial-1', title: 'Nervos Cranianos', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 1800000, order_index: 0, created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-15T10:00:00Z', created_by: 'user-prof-001' },
  ];
  for (const v of videos) { keys.push(K.video(v.id)); values.push(v); }

  // ── Admin Scopes ───────────────────────────────────────
  const adminScopes = [
    { id: 'scope-001', institution_id: 'inst-001', user_id: 'user-prof-001', scope_type: 'all', role: 'owner', created_at: '2025-01-10T10:00:00Z' },
    { id: 'scope-002', institution_id: 'inst-001', user_id: 'user-prof-002', scope_type: 'course', scope_id: 'course-anatomy', role: 'professor', created_at: '2025-01-15T10:00:00Z' },
  ];
  for (const s of adminScopes) { keys.push(K.adminScope(s.id)); values.push(s); }

  // ── Quiz Attempts ──────────────────────────────────────
  const quizAttempts = [
    { id: 'quiz-att-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', keyword_id: 'kw-femur', quiz_type: 'multiple-choice', score: 80, total_questions: 5, correct_answers: 4, time_seconds: 180, answers: [], completed_at: '2025-02-18T14:00:00Z' },
    { id: 'quiz-att-002', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-cranial', keyword_id: 'kw-nervo-vago', quiz_type: 'fill-blank', score: 60, total_questions: 5, correct_answers: 3, time_seconds: 240, answers: [], completed_at: '2025-02-19T10:00:00Z' },
  ];
  for (const q of quizAttempts) { keys.push(K.quizAttempt(q.id)); values.push(q); }

  // ── Batch write ────────────────────────────────────────
  // mset in chunks of 50 to avoid payload limits
  const CHUNK = 50;
  for (let i = 0; i < keys.length; i += CHUNK) {
    await kv.mset(keys.slice(i, i + CHUNK), values.slice(i, i + CHUNK));
  }

  console.log(`[seed-all] Content+SACRED+Misc: ${keys.length} keys written`);
  return keys.length;
}
