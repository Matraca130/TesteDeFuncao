// ============================================================
// Axon v4.4 — API Admin Students
// Frontend client for admin student management endpoints.
//
// Backend: supabase/functions/server/routes-admin-students.tsx
//
// Endpoint mapping:
//   GET    /admin/students?institution_id=X     → listStudents
//   GET    /admin/students/stats?institution_id= → getStudentStats
//   GET    /admin/students/:userId/detail       → getStudentDetail
//   PATCH  /admin/students/:userId/plan         → changeStudentPlan
//   PATCH  /admin/students/:userId/status       → toggleStudentStatus
//   POST   /admin/students/invite               → inviteStudent
// ============================================================
import { API_BASE_URL, authHeaders } from './api-core';

// ── Types ────────────────────────────────────────────────────

export interface AdminStudent {
  membership_id: string;
  user_id: string;
  institution_id: string;
  role: 'student';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan: {
    id: string;
    name: string;
    description?: string;
    price_cents?: number;
    billing_cycle?: string;
    is_default?: boolean;
  } | null;
  institution_plan_id: string | null;
}

export interface StudentStats {
  total_students: number;
  active_students: number;
  inactive_students: number;
  with_plan: number;
  without_plan: number;
  new_this_month: number;
  new_this_week: number;
  by_plan: Array<{
    plan_id: string;
    plan_name: string;
    count: number;
  }>;
}

export interface StudentDetail {
  membership_id: string;
  user_id: string;
  institution_id: string;
  role: 'student';
  is_active: boolean;
  joined_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan: {
    id: string;
    name: string;
    description?: string;
    price_cents?: number;
  } | null;
  institution_plan_id: string | null;
  stats: {
    totalStudyMinutes: number;
    totalSessions: number;
    totalCardsReviewed: number;
    totalQuizzesCompleted: number;
    currentStreak: number;
    longestStreak: number;
    averageDailyMinutes: number;
    lastStudyDate: string | null;
    weeklyActivity: number[];
  } | null;
  learning_profile: {
    strengths: string[];
    weaknesses: string[];
    total_study_minutes: number;
    current_streak: number;
  } | null;
  today_activity: any | null;
}

export interface ListStudentsFilters {
  search?: string;
  plan_id?: string;
  is_active?: boolean;
  sort_by?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface InviteStudentPayload {
  institution_id: string;
  email: string;
  name?: string;
  institution_plan_id?: string;
}

// ── Fetch helper (same pattern as api-admin.ts) ─────────────

async function adminFetch(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!data.success) {
    const errMsg = data.error?.message || `HTTP ${res.status}`;
    console.error(`[api-admin-students] ${options?.method || 'GET'} ${url} failed:`, errMsg);
    throw new Error(errMsg);
  }
  return data;
}

// ══════════════════════════════════════════════════════════════
// LIST STUDENTS
// GET /admin/students?institution_id=X&search=&plan_id=&is_active=&sort_by=&order=
// ══════════════════════════════════════════════════════════════

export async function listStudents(
  institutionId: string,
  filters?: ListStudentsFilters
): Promise<AdminStudent[]> {
  try {
    const params = new URLSearchParams({ institution_id: institutionId });

    if (filters?.search) params.set('search', filters.search);
    if (filters?.plan_id) params.set('plan_id', filters.plan_id);
    if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));
    if (filters?.sort_by) params.set('sort_by', filters.sort_by);
    if (filters?.order) params.set('order', filters.order);

    const data = await adminFetch(
      `${API_BASE_URL}/admin/students?${params.toString()}`,
      { headers: authHeaders() }
    );
    return data.data || [];
  } catch (err) {
    console.error(`[api-admin-students] listStudents(${institutionId}) error:`, err);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// STUDENT STATS
// GET /admin/students/stats?institution_id=X
// ══════════════════════════════════════════════════════════════

export async function getStudentStats(
  institutionId: string
): Promise<StudentStats> {
  const fallback: StudentStats = {
    total_students: 0,
    active_students: 0,
    inactive_students: 0,
    with_plan: 0,
    without_plan: 0,
    new_this_month: 0,
    new_this_week: 0,
    by_plan: [],
  };
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/admin/students/stats?institution_id=${institutionId}`,
      { headers: authHeaders() }
    );
    return data.data || fallback;
  } catch (err) {
    console.error(`[api-admin-students] getStudentStats(${institutionId}) error:`, err);
    return fallback;
  }
}

// ══════════════════════════════════════════════════════════════
// STUDENT DETAIL
// GET /admin/students/:userId/detail?institution_id=X
// ══════════════════════════════════════════════════════════════

export async function getStudentDetail(
  userId: string,
  institutionId: string
): Promise<StudentDetail | null> {
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/admin/students/${userId}/detail?institution_id=${institutionId}`,
      { headers: authHeaders() }
    );
    return data.data || null;
  } catch (err) {
    console.error(`[api-admin-students] getStudentDetail(${userId}) error:`, err);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// CHANGE STUDENT PLAN
// PATCH /admin/students/:userId/plan
// ══════════════════════════════════════════════════════════════

export async function changeStudentPlan(
  userId: string,
  institutionId: string,
  institutionPlanId: string | null
): Promise<any> {
  const data = await adminFetch(
    `${API_BASE_URL}/admin/students/${userId}/plan`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        institution_id: institutionId,
        institution_plan_id: institutionPlanId,
      }),
    }
  );
  return data.data;
}

// ══════════════════════════════════════════════════════════════
// TOGGLE STUDENT STATUS (active/inactive)
// PATCH /admin/students/:userId/status
// ══════════════════════════════════════════════════════════════

export async function toggleStudentStatus(
  userId: string,
  institutionId: string,
  isActive: boolean
): Promise<any> {
  const data = await adminFetch(
    `${API_BASE_URL}/admin/students/${userId}/status`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        institution_id: institutionId,
        is_active: isActive,
      }),
    }
  );
  return data.data;
}

// ══════════════════════════════════════════════════════════════
// INVITE STUDENT
// POST /admin/students/invite
// ══════════════════════════════════════════════════════════════

export async function inviteStudent(
  payload: InviteStudentPayload
): Promise<any> {
  const data = await adminFetch(
    `${API_BASE_URL}/admin/students/invite`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return data.data;
}
