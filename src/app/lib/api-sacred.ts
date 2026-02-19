// Axon v4.4 — API: SACRED entities (soft-delete only)
import type { KwStudentNote, KwProfNote, VideoNote, TextAnnotation } from './types';
import { USE_MOCKS, API_BASE_URL, authHeaders, store, mockId, delay, now } from './api-core';

// KwStudentNotes
export async function getKwStudentNotes(kwId: string): Promise<KwStudentNote[]> { if (USE_MOCKS) { await delay(); return store.kwStudentNotes.filter(n => n.keyword_id === kwId); } return (await (await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes`, { headers: authHeaders() })).json()).data; }
export async function createKwStudentNote(kwId: string, content: string): Promise<KwStudentNote> { if (USE_MOCKS) { await delay(); const n: KwStudentNote = { id: mockId('kw-note'), keyword_id: kwId, student_id: 'demo-student-001', content, created_at: now(), updated_at: now(), deleted_at: null }; store.kwStudentNotes.push(n); return n; } return (await (await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ content }) })).json()).data; }
export async function updateKwStudentNote(kwId: string, noteId: string, content: string): Promise<KwStudentNote> { if (USE_MOCKS) { await delay(); const i = store.kwStudentNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Note ${noteId} not found`); store.kwStudentNotes[i] = { ...store.kwStudentNotes[i], content, updated_at: now() }; return store.kwStudentNotes[i]; } return (await (await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes/${noteId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ content }) })).json()).data; }
export async function deleteKwStudentNote(kwId: string, noteId: string): Promise<{ deleted: true }> { if (USE_MOCKS) { await delay(); const i = store.kwStudentNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Note ${noteId} not found`); store.kwStudentNotes[i] = { ...store.kwStudentNotes[i], deleted_at: now(), updated_at: now() }; return { deleted: true }; } return (await (await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes/${noteId}`, { method: 'DELETE', headers: authHeaders() })).json()).data; }
export async function restoreKwStudentNote(kwId: string, noteId: string): Promise<KwStudentNote> { if (USE_MOCKS) { await delay(); const i = store.kwStudentNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Note ${noteId} not found`); store.kwStudentNotes[i] = { ...store.kwStudentNotes[i], deleted_at: null, updated_at: now() }; return store.kwStudentNotes[i]; } return (await (await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes/${noteId}/restore`, { method: 'POST', headers: authHeaders() })).json()).data; }

// KwProfNotes
export async function getKwProfNotes(kwId: string): Promise<KwProfNote[]> { if (USE_MOCKS) { await delay(); return store.kwProfNotes.filter(n => n.keyword_id === kwId); } return (await (await fetch(`${API_BASE_URL}/keywords/${kwId}/prof-notes`, { headers: authHeaders() })).json()).data; }
export async function toggleKwProfNoteVisibility(kwId: string, noteId: string, hidden: boolean): Promise<void> { if (USE_MOCKS) { await delay(); const i = store.kwProfNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Prof note ${noteId} not found`); store.kwProfNotes[i] = { ...store.kwProfNotes[i], visibility: hidden ? 'hidden' : 'visible', updated_at: now() }; return; } await fetch(`${API_BASE_URL}/keywords/${kwId}/prof-notes/${noteId}/visibility`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ hidden }) }); }

// VideoNotes
export async function getVideoNotes(videoId: string): Promise<VideoNote[]> { if (USE_MOCKS) { await delay(); return store.videoNotes.filter(n => n.video_id === videoId); } return (await (await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, { headers: authHeaders() })).json()).data; }
export async function createVideoNote(videoId: string, content: string, timestamp_ms?: number): Promise<VideoNote> { if (USE_MOCKS) { await delay(); const n: VideoNote = { id: mockId('vnote'), video_id: videoId, student_id: 'demo-student-001', content, timestamp_ms: timestamp_ms ?? null, created_at: now(), updated_at: now(), deleted_at: null }; store.videoNotes.push(n); return n; } return (await (await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ content, timestamp_ms }) })).json()).data; }
export async function updateVideoNote(videoId: string, noteId: string, data: Partial<VideoNote>): Promise<VideoNote> { if (USE_MOCKS) { await delay(); const i = store.videoNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Video note ${noteId} not found`); store.videoNotes[i] = { ...store.videoNotes[i], ...data, updated_at: now() }; return store.videoNotes[i]; } return (await (await fetch(`${API_BASE_URL}/videos/${videoId}/notes/${noteId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })).json()).data; }
export async function deleteVideoNote(videoId: string, noteId: string): Promise<{ deleted: true }> { if (USE_MOCKS) { await delay(); const i = store.videoNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Video note ${noteId} not found`); store.videoNotes[i] = { ...store.videoNotes[i], deleted_at: now(), updated_at: now() }; return { deleted: true }; } return (await (await fetch(`${API_BASE_URL}/videos/${videoId}/notes/${noteId}`, { method: 'DELETE', headers: authHeaders() })).json()).data; }
export async function restoreVideoNote(videoId: string, noteId: string): Promise<VideoNote> { if (USE_MOCKS) { await delay(); const i = store.videoNotes.findIndex(n => n.id === noteId); if (i === -1) throw new Error(`Video note ${noteId} not found`); store.videoNotes[i] = { ...store.videoNotes[i], deleted_at: null, updated_at: now() }; return store.videoNotes[i]; } return (await (await fetch(`${API_BASE_URL}/videos/${videoId}/notes/${noteId}/restore`, { method: 'POST', headers: authHeaders() })).json()).data; }

// TextAnnotations
export async function getTextAnnotations(sumId: string): Promise<TextAnnotation[]> { if (USE_MOCKS) { await delay(); return store.textAnnotations.filter(a => a.summary_id === sumId); } return (await (await fetch(`${API_BASE_URL}/summaries/${sumId}/annotations`, { headers: authHeaders() })).json()).data; }
export async function createTextAnnotation(sumId: string, ann: Partial<TextAnnotation>): Promise<TextAnnotation> { if (USE_MOCKS) { await delay(); const n: TextAnnotation = { id: mockId('ann'), summary_id: sumId, student_id: 'demo-student-001', original_text: ann.original_text || '', display_text: ann.display_text || ann.original_text || '', color: ann.color || 'yellow', note: ann.note || '', type: ann.type || 'highlight', bot_reply: ann.bot_reply, created_at: now(), updated_at: now(), deleted_at: null }; store.textAnnotations.push(n); return n; } return (await (await fetch(`${API_BASE_URL}/summaries/${sumId}/annotations`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(ann) })).json()).data; }
export async function updateTextAnnotation(sumId: string, annId: string, data: Partial<TextAnnotation>): Promise<TextAnnotation> { if (USE_MOCKS) { await delay(); const i = store.textAnnotations.findIndex(a => a.id === annId); if (i === -1) throw new Error(`Annotation ${annId} not found`); store.textAnnotations[i] = { ...store.textAnnotations[i], ...data, updated_at: now() }; return store.textAnnotations[i]; } return (await (await fetch(`${API_BASE_URL}/summaries/${sumId}/annotations/${annId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })).json()).data; }
export async function deleteTextAnnotation(sumId: string, annId: string): Promise<{ deleted: true }> { if (USE_MOCKS) { await delay(); const i = store.textAnnotations.findIndex(a => a.id === annId); if (i === -1) throw new Error(`Annotation ${annId} not found`); store.textAnnotations[i] = { ...store.textAnnotations[i], deleted_at: now(), updated_at: now() }; return { deleted: true }; } return (await (await fetch(`${API_BASE_URL}/summaries/${sumId}/annotations/${annId}`, { method: 'DELETE', headers: authHeaders() })).json()).data; }
export async function restoreTextAnnotation(sumId: string, annId: string): Promise<TextAnnotation> { if (USE_MOCKS) { await delay(); const i = store.textAnnotations.findIndex(a => a.id === annId); if (i === -1) throw new Error(`Annotation ${annId} not found`); store.textAnnotations[i] = { ...store.textAnnotations[i], deleted_at: null, updated_at: now() }; return store.textAnnotations[i]; } return (await (await fetch(`${API_BASE_URL}/summaries/${sumId}/annotations/${annId}/restore`, { method: 'POST', headers: authHeaders() })).json()).data; }
// Axon v4.4 — API SACRED: KwStudentNote, KwProfNote, VideoNote, TextAnnotation
// RULE: SACRED entities use soft-delete (deleted_at) — NEVER hard delete.
import type { KwStudentNote, KwProfNote, VideoNote, TextAnnotation } from './types';
import { USE_MOCKS, API_BASE_URL, authHeaders, store, mockId, delay, now } from './api-core';

// ══════════════════════════════════════════════════════════════
// KwStudentNote (student keyword notes — soft-delete)
// ══════════════════════════════════════════════════════════════
export async function getKwStudentNotesByKeyword(keywordId: string, studentId: string): Promise<KwStudentNote[]> {
  if (USE_MOCKS) { await delay(); return store.kwStudentNotes.filter(n => n.keyword_id === keywordId && n.student_id === studentId && !n.deleted_at); }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes?student_id=${studentId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createKwStudentNote(keywordId: string, studentId: string, content: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const n: KwStudentNote = { id: mockId('kw-note'), keyword_id: keywordId, student_id: studentId, content, created_at: now(), updated_at: now(), deleted_at: null };
    store.kwStudentNotes.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ student_id: studentId, content }) });
  return (await res.json()).data;
}

export async function updateKwStudentNote(noteId: string, content: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.kwStudentNotes.findIndex(n => n.id === noteId && !n.deleted_at);
    if (i === -1) throw new Error(`KwStudentNote ${noteId} not found or deleted`);
    store.kwStudentNotes[i] = { ...store.kwStudentNotes[i], content, updated_at: now() };
    return store.kwStudentNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/student-notes/${noteId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ content }) });
  return (await res.json()).data;
}

export async function softDeleteKwStudentNote(noteId: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.kwStudentNotes.findIndex(n => n.id === noteId && !n.deleted_at);
    if (i === -1) throw new Error(`KwStudentNote ${noteId} not found or already deleted`);
    store.kwStudentNotes[i] = { ...store.kwStudentNotes[i], deleted_at: now(), updated_at: now() };
    return store.kwStudentNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/student-notes/${noteId}/soft-delete`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

export async function restoreKwStudentNote(noteId: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.kwStudentNotes.findIndex(n => n.id === noteId && n.deleted_at);
    if (i === -1) throw new Error(`KwStudentNote ${noteId} not found or not deleted`);
    store.kwStudentNotes[i] = { ...store.kwStudentNotes[i], deleted_at: null, updated_at: now() };
    return store.kwStudentNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/student-notes/${noteId}/restore`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// KwProfNote (professor keyword notes — read-only for students)
// ══════════════════════════════════════════════════════════════
export async function getKwProfNotesByKeyword(keywordId: string): Promise<KwProfNote[]> {
  if (USE_MOCKS) { await delay(); return store.kwProfNotes.filter(n => n.keyword_id === keywordId && n.visibility === 'visible'); }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/prof-notes`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// VideoNote (student video notes — soft-delete)
// ══════════════════════════════════════════════════════════════
export async function getVideoNotesByVideo(videoId: string, studentId: string): Promise<VideoNote[]> {
  if (USE_MOCKS) { await delay(); return store.videoNotes.filter(n => n.video_id === videoId && n.student_id === studentId && !n.deleted_at); }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes?student_id=${studentId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createVideoNote(videoId: string, studentId: string, content: string, timestampMs: number | null): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const n: VideoNote = { id: mockId('vnote'), video_id: videoId, student_id: studentId, content, timestamp_ms: timestampMs, created_at: now(), updated_at: now(), deleted_at: null };
    store.videoNotes.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ student_id: studentId, content, timestamp_ms: timestampMs }) });
  return (await res.json()).data;
}

export async function updateVideoNote(noteId: string, content: string): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videoNotes.findIndex(n => n.id === noteId && !n.deleted_at);
    if (i === -1) throw new Error(`VideoNote ${noteId} not found or deleted`);
    store.videoNotes[i] = { ...store.videoNotes[i], content, updated_at: now() };
    return store.videoNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/video-notes/${noteId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ content }) });
  return (await res.json()).data;
}

export async function softDeleteVideoNote(noteId: string): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videoNotes.findIndex(n => n.id === noteId && !n.deleted_at);
    if (i === -1) throw new Error(`VideoNote ${noteId} not found or already deleted`);
    store.videoNotes[i] = { ...store.videoNotes[i], deleted_at: now(), updated_at: now() };
    return store.videoNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/video-notes/${noteId}/soft-delete`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

export async function restoreVideoNote(noteId: string): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videoNotes.findIndex(n => n.id === noteId && n.deleted_at);
    if (i === -1) throw new Error(`VideoNote ${noteId} not found or not deleted`);
    store.videoNotes[i] = { ...store.videoNotes[i], deleted_at: null, updated_at: now() };
    return store.videoNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/video-notes/${noteId}/restore`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// TextAnnotation (summary text annotations — soft-delete)
// ══════════════════════════════════════════════════════════════
export async function getTextAnnotationsBySummary(summaryId: string, studentId: string): Promise<TextAnnotation[]> {
  if (USE_MOCKS) { await delay(); return store.textAnnotations.filter(a => a.summary_id === summaryId && a.student_id === studentId && !a.deleted_at); }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations?student_id=${studentId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createTextAnnotation(summaryId: string, studentId: string, data: Partial<TextAnnotation>): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const n: TextAnnotation = {
      id: mockId('ann'), summary_id: summaryId, student_id: studentId,
      original_text: data.original_text || '', display_text: data.display_text || data.original_text || '',
      color: data.color || 'yellow', note: data.note || '',
      type: data.type || 'highlight', bot_reply: data.bot_reply,
      created_at: now(), updated_at: now(), deleted_at: null,
    };
    store.textAnnotations.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ student_id: studentId, ...data }) });
  return (await res.json()).data;
}

export async function updateTextAnnotation(annotationId: string, data: Partial<TextAnnotation>): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const i = store.textAnnotations.findIndex(a => a.id === annotationId && !a.deleted_at);
    if (i === -1) throw new Error(`TextAnnotation ${annotationId} not found or deleted`);
    store.textAnnotations[i] = { ...store.textAnnotations[i], ...data, updated_at: now() };
    return store.textAnnotations[i];
  }
  const res = await fetch(`${API_BASE_URL}/annotations/${annotationId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function softDeleteTextAnnotation(annotationId: string): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const i = store.textAnnotations.findIndex(a => a.id === annotationId && !a.deleted_at);
    if (i === -1) throw new Error(`TextAnnotation ${annotationId} not found or already deleted`);
    store.textAnnotations[i] = { ...store.textAnnotations[i], deleted_at: now(), updated_at: now() };
    return store.textAnnotations[i];
  }
  const res = await fetch(`${API_BASE_URL}/annotations/${annotationId}/soft-delete`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

export async function restoreTextAnnotation(annotationId: string): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const i = store.textAnnotations.findIndex(a => a.id === annotationId && a.deleted_at);
    if (i === -1) throw new Error(`TextAnnotation ${annotationId} not found or not deleted`);
    store.textAnnotations[i] = { ...store.textAnnotations[i], deleted_at: null, updated_at: now() };
    return store.textAnnotations[i];
  }
  const res = await fetch(`${API_BASE_URL}/annotations/${annotationId}/restore`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}
