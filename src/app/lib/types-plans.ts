// Axon v4.4 — Types: Plans, Videos, Admin
import type { MembershipRole } from './types-core';

export interface PricingPlan { id: string; institution_id: string; name: string; description?: string; price?: number; currency?: string; is_default: boolean; is_trial: boolean; trial_duration_days?: number; max_students?: number; features?: string[]; created_at: string; updated_at: string; }
export interface PlanAccessRule { id: string; plan_id: string; resource_type: 'course' | 'section' | 'feature'; resource_id: string; permission: 'read' | 'write' | 'full'; created_at: string; }
export interface Video { id: string; summary_id: string; title: string; url: string; duration_ms?: number; thumbnail_url?: string; order_index: number; created_at: string; updated_at: string; created_by: string; }
export interface AdminScope { id: string; institution_id: string; user_id: string; scope_type: 'course' | 'section' | 'all'; scope_id?: string; role: MembershipRole; created_at: string; }
