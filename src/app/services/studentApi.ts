// ============================================================
// Axon — Student API Service (Frontend → Backend)
// ============================================================

import { projectId, publicAnonKey } from '/utils/supabase/info';
import type {
  StudentProfile,
  StudentStats,
  CourseProgress,
  FlashcardReview,
  StudySession,
  DailyActivity,
  StudySummary,
} from '@/app/types/student';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;

const DEFAULT_STUDENT_ID = 'demo-student-001';

// ── Helper ────────────────────────────────────────────────

class NotFoundError extends Error {
  status = 404;
  constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error || `API error ${res.status} at ${path}`;
    // 404 is expected when data hasn't been seeded — don't log as error
    if (res.status === 404) {
      throw new NotFoundError(msg);
    }
    console.error(`[studentApi] ${msg}`);
    throw new Error(msg);
  }

  return res.json();
}

// ── Profile ───────────────────────────────────────────────

export async function getProfile(
  studentId = DEFAULT_STUDENT_ID
): Promise<StudentProfile> {
  return request<StudentProfile>(`/student/${studentId}/profile`);
}

export async function updateProfile(
  data: Partial<StudentProfile>,
  studentId = DEFAULT_STUDENT_ID
): Promise<StudentProfile> {
  return request<StudentProfile>(`/student/${studentId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Stats ─────────────────────────────────────────────────

export async function getStats(
  studentId = DEFAULT_STUDENT_ID
): Promise<StudentStats> {
  return request<StudentStats>(`/student/${studentId}/stats`);
}

export async function updateStats(
  data: Partial<StudentStats>,
  studentId = DEFAULT_STUDENT_ID
): Promise<StudentStats> {
  return request<StudentStats>(`/student/${studentId}/stats`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Course Progress ───────────────────────────────────────

export async function getAllCourseProgress(
  studentId = DEFAULT_STUDENT_ID
): Promise<CourseProgress[]> {
  return request<CourseProgress[]>(`/student/${studentId}/progress`);
}

export async function getCourseProgress(
  courseId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<CourseProgress> {
  return request<CourseProgress>(`/student/${studentId}/progress/${courseId}`);
}

export async function updateCourseProgress(
  courseId: string,
  data: Partial<CourseProgress>,
  studentId = DEFAULT_STUDENT_ID
): Promise<CourseProgress> {
  return request<CourseProgress>(`/student/${studentId}/progress/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Study Sessions ────────────────────────────────────────

export async function getSessions(
  studentId = DEFAULT_STUDENT_ID
): Promise<StudySession[]> {
  return request<StudySession[]>(`/student/${studentId}/sessions`);
}

export async function logSession(
  data: Omit<StudySession, 'studentId'>,
  studentId = DEFAULT_STUDENT_ID
): Promise<StudySession> {
  return request<StudySession>(`/student/${studentId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Flashcard Reviews ─────────────────────────────────────

export async function getReviews(
  studentId = DEFAULT_STUDENT_ID
): Promise<FlashcardReview[]> {
  return request<FlashcardReview[]>(`/student/${studentId}/reviews`);
}

export async function getCourseReviews(
  courseId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<FlashcardReview[]> {
  return request<FlashcardReview[]>(
    `/student/${studentId}/reviews/${courseId}`
  );
}

export async function saveReviews(
  reviews: FlashcardReview[],
  studentId = DEFAULT_STUDENT_ID
): Promise<{ saved: number }> {
  return request<{ saved: number }>(`/student/${studentId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ reviews }),
  });
}

// ── Daily Activity ────────────────────────────────────────

export async function getDailyActivity(
  studentId = DEFAULT_STUDENT_ID
): Promise<DailyActivity[]> {
  return request<DailyActivity[]>(`/student/${studentId}/activity`);
}

// ── Content ───────────────────────────────────────────────

export async function getContent<T = any>(
  courseId: string,
  key: string
): Promise<T> {
  return request<T>(`/content/${courseId}/${key}`);
}

export async function saveContent(
  courseId: string,
  key: string,
  data: any
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/content/${courseId}/${key}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAllCourseContent<T = any>(
  courseId: string
): Promise<T[]> {
  return request<T[]>(`/content/${courseId}`);
}

// ── Seed ──────────────────────────────────────────────────

export async function seedDemoData(): Promise<{ ok: boolean; message: string }> {
  return request<{ ok: boolean; message: string }>('/seed', {
    method: 'POST',
  });
}

// ── Study Summaries (Resumos) ─────────────────────────────

export async function getAllSummaries(
  studentId = DEFAULT_STUDENT_ID
): Promise<StudySummary[]> {
  return request<StudySummary[]>(`/student/${studentId}/summaries`);
}

export async function getCourseSummaries(
  courseId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<StudySummary[]> {
  return request<StudySummary[]>(`/student/${studentId}/summaries/${courseId}`);
}

export async function getSummary(
  courseId: string,
  topicId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<StudySummary> {
  return request<StudySummary>(
    `/student/${studentId}/summaries/${courseId}/${topicId}`
  );
}

export async function saveSummary(
  courseId: string,
  topicId: string,
  data: Partial<StudySummary>,
  studentId = DEFAULT_STUDENT_ID
): Promise<StudySummary> {
  return request<StudySummary>(
    `/student/${studentId}/summaries/${courseId}/${topicId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteSummary(
  courseId: string,
  topicId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(
    `/student/${studentId}/summaries/${courseId}/${topicId}`,
    {
      method: 'DELETE',
    }
  );
}

// ── Keywords (Spaced Repetition V2) ───────────────────────

export async function getCourseKeywords(
  courseId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<{ courseId: string; keywords: Record<string, any>; lastUpdated: string }> {
  return request(`/student/${studentId}/keywords/${courseId}`);
}

export async function getTopicKeywords(
  courseId: string,
  topicId: string,
  studentId = DEFAULT_STUDENT_ID
): Promise<{ courseId: string; topicId: string; keywords: Record<string, any>; lastUpdated: string }> {
  return request(`/student/${studentId}/keywords/${courseId}/${topicId}`);
}

export async function saveTopicKeywords(
  courseId: string,
  topicId: string,
  keywords: Record<string, any>,
  studentId = DEFAULT_STUDENT_ID
): Promise<{ courseId: string; topicId: string; keywords: Record<string, any>; lastUpdated: string }> {
  return request(`/student/${studentId}/keywords/${courseId}/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify({ keywords }),
  });
}

export async function saveCourseKeywords(
  courseId: string,
  keywords: Record<string, any>,
  studentId = DEFAULT_STUDENT_ID
): Promise<{ courseId: string; keywords: Record<string, any>; lastUpdated: string }> {
  return request(`/student/${studentId}/keywords/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify({ keywords }),
  });
}