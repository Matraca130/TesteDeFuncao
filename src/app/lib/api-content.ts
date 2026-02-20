// Axon v4.4 — API Content: Full CRUD for courses → semesters → sections → topics → summaries → keywords
import type { Course, Semester, Section, Topic, Summary, Keyword } from './types';
import { USE_MOCKS, API_BASE_URL, authHeaders, store, mockId, delay, now } from './api-core';

// ── Aggregate Fetch ───────────────────────────────────────────
export async function fetchContentHierarchy(): Promise<{
  courses: Course[]; semesters: Semester[]; sections: Section[];
  topics: Topic[]; summaries: Summary[]; keywords: Keyword[];
}> {
  if (USE_MOCKS) {
    await delay();
    return {
      courses: [...store.courses], semesters: [...store.semesters],
      sections: [...store.sections], topics: [...store.topics],
      summaries: [...store.summaries], keywords: [...store.keywords],
    };
  }
  const res = await fetch(`${API_BASE_URL}/content/hierarchy`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// Courses
// ══════════════════════════════════════════════════════════════
export async function getCourses(institutionId?: string): Promise<Course[]> {
  if (USE_MOCKS) { await delay(); return institutionId ? store.courses.filter(c => c.institution_id === institutionId) : [...store.courses]; }
  const q = institutionId ? `?institution_id=${institutionId}` : '';
  const res = await fetch(`${API_BASE_URL}/courses${q}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createCourse(course: Partial<Course>): Promise<Course> {
  if (USE_MOCKS) {
    await delay();
    const n: Course = {
      id: mockId('course'), institution_id: course.institution_id || 'inst-001',
      name: course.name || 'Novo Curso', description: course.description ?? null,
      color: course.color || '#14b8a6', sort_order: course.sort_order ?? store.courses.length,
      created_at: now(), updated_at: now(), created_by: course.created_by || 'demo-user',
    };
    store.courses.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/courses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(course) });
  return (await res.json()).data;
}

export async function updateCourse(courseId: string, data: Partial<Course>): Promise<Course> {
  if (USE_MOCKS) {
    await delay();
    const i = store.courses.findIndex(c => c.id === courseId);
    if (i === -1) throw new Error(`Course ${courseId} not found`);
    store.courses[i] = { ...store.courses[i], ...data, updated_at: now() };
    return store.courses[i];
  }
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteCourse(courseId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.courses = store.courses.filter(c => c.id !== courseId); return; }
  await fetch(`${API_BASE_URL}/courses/${courseId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// Semesters
// ══════════════════════════════════════════════════════════════
export async function getSemesters(courseId: string): Promise<Semester[]> {
  if (USE_MOCKS) { await delay(); return store.semesters.filter(s => s.course_id === courseId); }
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/semesters`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createSemester(courseId: string, semester: Partial<Semester>): Promise<Semester> {
  if (USE_MOCKS) {
    await delay();
    const n: Semester = {
      id: mockId('sem'), course_id: courseId,
      name: semester.name || 'Novo Semestre',
      order_index: semester.order_index ?? store.semesters.filter(s => s.course_id === courseId).length,
    };
    store.semesters.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/semesters`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(semester) });
  return (await res.json()).data;
}

export async function updateSemester(semesterId: string, data: Partial<Semester>): Promise<Semester> {
  if (USE_MOCKS) {
    await delay();
    const i = store.semesters.findIndex(s => s.id === semesterId);
    if (i === -1) throw new Error(`Semester ${semesterId} not found`);
    store.semesters[i] = { ...store.semesters[i], ...data };
    return store.semesters[i];
  }
  const res = await fetch(`${API_BASE_URL}/semesters/${semesterId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteSemester(semesterId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.semesters = store.semesters.filter(s => s.id !== semesterId); return; }
  await fetch(`${API_BASE_URL}/semesters/${semesterId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// Sections
// ══════════════════════════════════════════════════════════════
export async function getSections(semesterId: string): Promise<Section[]> {
  if (USE_MOCKS) { await delay(); return store.sections.filter(s => s.semester_id === semesterId); }
  const res = await fetch(`${API_BASE_URL}/semesters/${semesterId}/sections`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createSection(semesterId: string, section: Partial<Section>): Promise<Section> {
  if (USE_MOCKS) {
    await delay();
    const n: Section = {
      id: mockId('sec'), semester_id: semesterId,
      name: section.name || 'Nova Secao', image_url: section.image_url ?? null,
      order_index: section.order_index ?? store.sections.filter(s => s.semester_id === semesterId).length,
    };
    store.sections.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/semesters/${semesterId}/sections`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(section) });
  return (await res.json()).data;
}

export async function updateSection(sectionId: string, data: Partial<Section>): Promise<Section> {
  if (USE_MOCKS) {
    await delay();
    const i = store.sections.findIndex(s => s.id === sectionId);
    if (i === -1) throw new Error(`Section ${sectionId} not found`);
    store.sections[i] = { ...store.sections[i], ...data };
    return store.sections[i];
  }
  const res = await fetch(`${API_BASE_URL}/sections/${sectionId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteSection(sectionId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.sections = store.sections.filter(s => s.id !== sectionId); return; }
  await fetch(`${API_BASE_URL}/sections/${sectionId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// Topics
// ══════════════════════════════════════════════════════════════
export async function getTopics(sectionId: string): Promise<Topic[]> {
  if (USE_MOCKS) { await delay(); return store.topics.filter(t => t.section_id === sectionId); }
  const res = await fetch(`${API_BASE_URL}/sections/${sectionId}/topics`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createTopic(sectionId: string, topic: Partial<Topic>): Promise<Topic> {
  if (USE_MOCKS) {
    await delay();
    const n: Topic = {
      id: mockId('topic'), section_id: sectionId,
      name: topic.name || 'Novo Topico',
      order_index: topic.order_index ?? store.topics.filter(t => t.section_id === sectionId).length,
      created_at: now(),
    };
    store.topics.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/sections/${sectionId}/topics`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(topic) });
  return (await res.json()).data;
}

export async function updateTopic(topicId: string, data: Partial<Topic>): Promise<Topic> {
  if (USE_MOCKS) {
    await delay();
    const i = store.topics.findIndex(t => t.id === topicId);
    if (i === -1) throw new Error(`Topic ${topicId} not found`);
    store.topics[i] = { ...store.topics[i], ...data };
    return store.topics[i];
  }
  const res = await fetch(`${API_BASE_URL}/topics/${topicId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteTopic(topicId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.topics = store.topics.filter(t => t.id !== topicId); return; }
  await fetch(`${API_BASE_URL}/topics/${topicId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// Summaries
// ══════════════════════════════════════════════════════════════
export async function getSummaries(topicId: string): Promise<Summary[]> {
  if (USE_MOCKS) { await delay(); return store.summaries.filter(s => s.topic_id === topicId); }
  const res = await fetch(`${API_BASE_URL}/topics/${topicId}/summaries`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createSummary(topicId: string, summary: Partial<Summary>): Promise<Summary> {
  if (USE_MOCKS) {
    await delay();
    const n: Summary = {
      id: mockId('sum'), topic_id: topicId, course_id: summary.course_id || '',
      institution_id: summary.institution_id, title: summary.title,
      content_markdown: summary.content_markdown || '',
      status: summary.status || 'draft', created_by: summary.created_by || 'demo-user',
      created_at: now(), updated_at: now(), version: 1,
    };
    store.summaries.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/topics/${topicId}/summaries`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(summary) });
  return (await res.json()).data;
}

export async function updateSummary(summaryId: string, data: Partial<Summary>): Promise<Summary> {
  if (USE_MOCKS) {
    await delay();
    const i = store.summaries.findIndex(s => s.id === summaryId);
    if (i === -1) throw new Error(`Summary ${summaryId} not found`);
    store.summaries[i] = { ...store.summaries[i], ...data, updated_at: now(), version: (store.summaries[i].version || 0) + 1 };
    return store.summaries[i];
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteSummary(summaryId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.summaries = store.summaries.filter(s => s.id !== summaryId); return; }
  await fetch(`${API_BASE_URL}/summaries/${summaryId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// Keywords
// ══════════════════════════════════════════════════════════════
export async function getKeywords(institutionId?: string): Promise<Keyword[]> {
  if (USE_MOCKS) { await delay(); return institutionId ? store.keywords.filter(k => k.institution_id === institutionId) : [...store.keywords]; }
  const q = institutionId ? `?institution_id=${institutionId}` : '';
  const res = await fetch(`${API_BASE_URL}/keywords${q}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createKeyword(keyword: Partial<Keyword>): Promise<Keyword> {
  if (USE_MOCKS) {
    await delay();
    const n: Keyword = {
      id: mockId('kw'), institution_id: keyword.institution_id || 'inst-001',
      term: keyword.term || 'Nova Keyword', definition: keyword.definition ?? null,
      priority: keyword.priority ?? 1, status: keyword.status || 'draft',
      source: keyword.source || 'manual', created_by: keyword.created_by || 'demo-user',
      created_at: now(), updated_at: now(),
    };
    store.keywords.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/keywords`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(keyword) });
  return (await res.json()).data;
}

export async function updateKeyword(keywordId: string, data: Partial<Keyword>): Promise<Keyword> {
  if (USE_MOCKS) {
    await delay();
    const i = store.keywords.findIndex(k => k.id === keywordId);
    if (i === -1) throw new Error(`Keyword ${keywordId} not found`);
    store.keywords[i] = { ...store.keywords[i], ...data, updated_at: now() };
    return store.keywords[i];
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteKeyword(keywordId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.keywords = store.keywords.filter(k => k.id !== keywordId); return; }
  await fetch(`${API_BASE_URL}/keywords/${keywordId}`, { method: 'DELETE', headers: authHeaders() });
}
