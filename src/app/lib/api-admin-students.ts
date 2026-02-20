// ============================================================
// Axon v4.4 — API Admin Students
// Client functions for /admin/students endpoints
// Uses real backend (ADMIN_LIVE = true pattern from api-admin.ts)
// ============================================================
import { API_BASE_URL, authHeaders } from './api-core';

// ── Fetch helper ────────────────────────────────────────────
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

// ── Types ───────────────────────────────────────────────────

export interface StudentPlan {
  id: string;
  name: string;
  description?: string;
  price_cents?: number;
  billing_cycle?: string;
  is_default?: boolean;
}

export interface StudentListItem {
  membership_id: string;
  user_id: string;
  institution_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan: StudentPlan | null;
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
  by_plan: Array<{ plan_id: string; plan_name: string; count: number }>;
}

export interface StudentDetail {
  membership_id: string;
  user_id: string;
  institution_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan: StudentPlan | null;
  institution_plan_id: string | null;
  stats: any | null;
  learning_profile: any | null;
  today_activity: any | null;
}

export interface ListStudentsParams {
  institution_id: string;
  search?: string;
  plan_id?: string;
  is_active?: string;
  sort_by?: string;
  order?: string;
}

// ── API Functions ───────────────────────────────────────────

export async function listStudents(params: ListStudentsParams): Promise<StudentListItem[]> {
  try {
    const qs = new URLSearchParams();
    qs.set('institution_id', params.institution_id);
    if (params.search) qs.set('search', params.search);
    if (params.plan_id) qs.set('plan_id', params.plan_id);
    if (params.is_active !== undefined) qs.set('is_active', params.is_active);
    if (params.sort_by) qs.set('sort_by', params.sort_by);
    if (params.order) qs.set('order', params.order);

    const data = await adminFetch(
      `${API_BASE_URL}/admin/students?${qs.toString()}`,
      { headers: authHeaders() }
    );
    return data.data || [];
  } catch (err) {
    console.error('[api-admin-students] listStudents error:', err);
    return [];
  }
}

export async function getStudentStats(institutionId: string): Promise<StudentStats | null> {
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/admin/students/stats?institution_id=${institutionId}`,
      { headers: authHeaders() }
    );
    return data.data;
  } catch (err) {
    console.error('[api-admin-students] getStudentStats error:', err);
    return null;
  }
}

export async function getStudentDetail(userId: string, institutionId: string): Promise<StudentDetail | null> {
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/admin/students/${userId}/detail?institution_id=${institutionId}`,
      { headers: authHeaders() }
    );
    return data.data;
  } catch (err) {
    console.error('[api-admin-students] getStudentDetail error:', err);
    return null;
  }
}

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
      body: JSON.stringify({ institution_id: institutionId, institution_plan_id: institutionPlanId }),
    }
  );
  return data.data;
}

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
      body: JSON.stringify({ institution_id: institutionId, is_active: isActive }),
    }
  );
  return data.data;
}

export async function inviteStudent(
  institutionId: string,
  email: string,
  name?: string,
  institutionPlanId?: string
): Promise<any> {
  const data = await adminFetch(
    `${API_BASE_URL}/admin/students/invite`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        institution_id: institutionId,
        email,
        name: name || undefined,
        institution_plan_id: institutionPlanId || undefined,
      }),
    }
  );
  return data.data;
}
