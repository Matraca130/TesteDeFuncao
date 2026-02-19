import type { KwStudentNote, KwProfNote, VideoNote, TextAnnotation } from './types-sacred';

export const MOCK_KW_STUDENT_NOTES: KwStudentNote[] = [
  { id: 'kw-note-001', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'O femur articula-se com o acetabulo.', created_at: '2025-02-15T14:00:00Z', updated_at: '2025-02-15T14:00:00Z', deleted_at: null },
  { id: 'kw-note-002', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'Trocanter maior: insercao do gluteo medio.', created_at: '2025-02-16T10:00:00Z', updated_at: '2025-02-16T10:00:00Z', deleted_at: null },
  { id: 'kw-note-003', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'Nota deletada para teste de soft-delete.', created_at: '2025-02-17T08:00:00Z', updated_at: '2025-02-17T09:00:00Z', deleted_at: '2025-02-17T09:00:00Z' },
  { id: 'kw-note-004', keyword_id: 'kw-nervo-vago', student_id: 'demo-student-001', content: 'O vago tem funcao parassimpatica.', created_at: '2025-02-18T11:00:00Z', updated_at: '2025-02-18T11:00:00Z', deleted_at: null },
];
export const MOCK_KW_PROF_NOTES: KwProfNote[] = [
  { id: 'prof-note-001', keyword_id: 'kw-femur', professor_id: 'user-prof-001', content: 'Angulo de inclinacao do colo do femur: ~125 graus.', visibility: 'visible', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z' },
  { id: 'prof-note-002', keyword_id: 'kw-femur', professor_id: 'user-prof-001', content: 'Para a prova: diferenciar fratura do colo vs trochanteriana.', visibility: 'visible', created_at: '2025-02-11T10:00:00Z', updated_at: '2025-02-11T10:00:00Z' },
  { id: 'prof-note-003', keyword_id: 'kw-nervo-vago', professor_id: 'user-prof-001', content: 'Estimulacao vagal: manobra de Valsalva para TSV.', visibility: 'visible', created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-15T10:00:00Z' },
];
export const MOCK_VIDEO_NOTES: VideoNote[] = [
  { id: 'vnote-001', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Cabeca do femur.', timestamp_ms: 120000, created_at: '2025-02-20T10:00:00Z', updated_at: '2025-02-20T10:00:00Z', deleted_at: null },
  { id: 'vnote-002', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Linha aspera.', timestamp_ms: 480000, created_at: '2025-02-20T11:00:00Z', updated_at: '2025-02-20T11:00:00Z', deleted_at: null },
  { id: 'vnote-003', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Nota geral.', timestamp_ms: null, created_at: '2025-02-20T12:00:00Z', updated_at: '2025-02-20T12:00:00Z', deleted_at: null },
  { id: 'vnote-004', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Nota deletada.', timestamp_ms: 300000, created_at: '2025-02-20T13:00:00Z', updated_at: '2025-02-20T14:00:00Z', deleted_at: '2025-02-20T14:00:00Z' },
  { id: 'vnote-005', video_id: 'vid-cranial-01', student_id: 'demo-student-001', content: 'Mnemonica nervos cranianos.', timestamp_ms: 60000, created_at: '2025-02-21T10:00:00Z', updated_at: '2025-02-21T10:00:00Z', deleted_at: null },
];
export const MOCK_TEXT_ANNOTATIONS: TextAnnotation[] = [
  { id: 'ann-001', summary_id: 'sum-femur-1', student_id: 'demo-student-001', original_text: 'O femur e o osso mais longo do corpo humano', display_text: 'O femur e o osso mais longo do corpo humano', color: 'yellow', note: 'Importante para prova!', type: 'highlight', created_at: '2025-02-15T14:00:00Z', updated_at: '2025-02-15T14:00:00Z', deleted_at: null },
  { id: 'ann-002', summary_id: 'sum-femur-1', student_id: 'demo-student-001', original_text: 'Cabeca do femur', display_text: 'Cabeca do femur', color: 'blue', note: 'Articulacao esferoidea com o acetabulo.', type: 'note', created_at: '2025-02-15T14:30:00Z', updated_at: '2025-02-15T14:30:00Z', deleted_at: null },
];
