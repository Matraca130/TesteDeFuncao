# Sprint 1 — Execution Plan (Parallel)

> Generated: 2026-02-19 | Status: PRE-IMPLEMENTATION
> Visual version: Figma Make → AuditDashboard → "Sprint 1 Exec" tab

## Overview

| Metric | Value |
|--------|-------|
| Tasks | 19 |
| Phases | 4 (sequential checkpoints) |
| Programmers | 3 max parallel |
| Checkpoints | 3 |
| Estimated time | ~75 min (parallel) / ~120 min (sequential) |

## CRITICAL: kv_store.tsx API

```typescript
// mset takes TWO ARRAYS, not an object!
kv.mset(keys: string[], values: any[]): Promise<void>

// CORRECT:
await kv.mset(
  ["membership:inst1:user1", "idx:inst-members:inst1:user1"],
  [membershipObj, "user1"]
);

// WRONG (TypeError):
await kv.mset({ "membership:inst1:user1": membershipObj });

// getByPrefix returns VALUES, not keys
const instIds = await kv.getByPrefix(`idx:user-insts:${userId}:`);
// instIds = ["inst-001", "inst-002"]  (values, not keys)

// mget returns positional (undefined if key missing, NOT omitted)
const results = await kv.mget(["key1", "key2", "key3"]);
// results = [val1, undefined, val3]  → use .filter(Boolean)
```

## Dependency Graph

```
PHASE 0: FOUNDATION (sequential — 1 programmer, ~15 min)
┌──────────────────────────────────────────────────────┐
│  T0.1  Helpers backend (supa, getUserFromToken,      │
│        requireRole, ok, err)                         │
│  T0.2  Fix Membership interface in AuthContext.tsx   │
└──────────────────────────────────────────────────────┘
     │                            │
     ▼                            ▼
PHASE 1: PARALLEL (up to 3 programmers, ~20 min)
┌────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ TRACK A: Backend   │ │ TRACK B: FE Auth │ │ TRACK C: FE Shell│
│ (P1 — index.tsx)   │ │ (P2 — AuthCtx)   │ │ (P3 — new files) │
│                    │ │                  │ │                  │
│ T1.1 /auth/signup  │ │ T1.5 Fix login() │ │ T1.8  AdminLayout│
│ T1.2 /auth/signin  │ │ T1.6 Fix signup()│ │ T1.9  RequireAuth│
│ T1.3 /auth/me      │ │ T1.7 selectInst  │ │ T1.10 RequireRole│
│ T1.4 /auth/signout │ │                  │ │ T1.11 routes.tsx │
└────────────────────┘ └──────────────────┘ └──────────────────┘
     │                                           │
     ▼ ── CHECKPOINT 1 ──                        ▼

PHASE 2: PARALLEL (2-3 programmers, ~20 min)
┌──────────────────────────┐ ┌──────────────────────────┐
│ TRACK A cont: Backend    │ │ TRACK D: Frontend Wiring │
│ T2.1 POST /institutions  │ │ T2.5 App→RouterProvider  │
│ T2.2 GET  /institutions  │ │ T2.6 PostLoginRouter     │
│ T2.3 GET  /by-slug/:slug │ │ T2.7 AdminDashboard stub │
│ T2.4 PUT  /institutions  │ │ T2.8 LoginPage real      │
└──────────────────────────┘ └──────────────────────────┘
     │                              │
     ▼ ── CHECKPOINT 2 ──           ▼

PHASE 3: SEQUENTIAL (1 programmer, ~15 min)
┌──────────────────────────────────────┐
│ T3.1 GET    /institutions/:id/members│
│ T3.2 POST   /institutions/:id/members│
│ T3.3 PUT    /.../members/:userId     │
│ T3.4 DELETE /.../members/:userId     │
└──────────────────────────────────────┘
     │
     ▼ ── CHECKPOINT 3 (SPRINT 1 DONE) ──
```

## Programmers

| ID | Name | File(s) | Phases | Tasks |
|----|------|---------|--------|-------|
| P1 | Backend Dev | index.tsx | 0→1→2→3 | T0.1, T1.1-T1.4, T2.1-T2.4, T3.1-T3.4 |
| P2 | Frontend Auth | AuthContext.tsx | 0→1 | T0.2, T1.5-T1.7 |
| P3 | Frontend Shell | New files + App.tsx | 1→2 | T1.8-T1.11, T2.5-T2.8 |

> P4 not needed in Sprint 1. Enters in Sprint 2 (Plan CRUD + UI).

## Phase 0: Foundation

### T0.1 — Backend Helpers (P1, index.tsx)

Add BEFORE endpoints in `supabase/functions/server/index.tsx`:

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const P = "/make-server-ae4c3d80";

// Singleton Supabase admin
let _supa: ReturnType<typeof createClient> | null = null;
function supa() {
  if (!_supa) {
    _supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supa;
}

// Extract userId from JWT
async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const { data: { user }, error } = await supa().auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch { return null; }
}

// RBAC
type RoleType = 'owner' | 'admin' | 'professor' | 'student';
interface MembershipObj {
  id: string; user_id: string; institution_id: string;
  role: RoleType; plan_id?: string; plan_expires_at?: string;
  created_at: string;
}

async function requireRole(
  authHeader: string | undefined,
  instId: string,
  allowedRoles: RoleType[],
): Promise<{ userId: string; membership: MembershipObj } | { error: string; status: number }> {
  const userId = await getUserFromToken(authHeader);
  if (!userId) return { error: "No valid token", status: 401 };
  const membership = await kv.get(`membership:${instId}:${userId}`) as MembershipObj | null;
  if (!membership) return { error: "Not a member", status: 403 };
  if (!allowedRoles.includes(membership.role)) {
    return { error: `Role '${membership.role}' not allowed`, status: 403 };
  }
  return { userId, membership };
}

function ok(c: any, data: any, status = 200) {
  return c.json({ success: true, data }, status);
}
function err(c: any, message: string, status = 400) {
  return c.json({ success: false, error: { message } }, status);
}
```

### T0.2 — Fix Membership Interface (P2, AuthContext.tsx)

```typescript
// BEFORE:
export interface Membership {
  role: 'institution_admin' | 'professor' | 'student';
  joined_at: string;
}

// AFTER:
export interface Membership {
  id: string;
  user_id: string;
  institution_id: string;
  role: 'owner' | 'admin' | 'professor' | 'student';
  plan_id?: string;
  plan_expires_at?: string;
  created_at: string;
}
```

### Checkpoint 0 Criteria
- [ ] index.tsx compiles with 5 helpers
- [ ] Membership interface has `owner|admin|professor|student`
- [ ] Membership has `created_at` (not `joined_at`)
- [ ] Membership has `plan_id?` and `plan_expires_at?`

## Phase 1: Auth Endpoints + Frontend Shell

See Figma Make visual contract for full code of T1.1-T1.11.

**Key endpoints:**
- `POST /auth/signup` — creates user + optional membership (with institution_id)
- `POST /auth/signin` — signs in, self-heals KV user if missing
- `GET /auth/me` — session restore with memberships
- `POST /auth/signout` — cleanup

**Key frontend tasks:**
- Fix `login()` → use `GET /auth/me` instead of double sign-in
- Fix `signup()` → accept `institutionId?` parameter
- Create `AdminLayout`, `RequireAuth`, `RequireRole`, `routes.tsx`

### Checkpoint 1 Criteria
- [ ] All 4 auth endpoints respond correctly
- [ ] AdminLayout renders with sidebar
- [ ] RequireAuth redirects to /login
- [ ] routes.tsx compiles with stubs

## Phase 2: Institution Endpoints + Frontend Wiring

**Key endpoints:**
- `POST /institutions` — creates inst + owner membership + slug index (5 keys in 1 mset)
- `GET /institutions/by-slug/:slug` — PUBLIC, no auth (register BEFORE /:id!)
- `GET /institutions/:id` — with auth
- `PUT /institutions/:id` — with slug re-index

**CRITICAL:** Register `/by-slug/:slug` BEFORE `/:id` in Hono, or "by-slug" gets interpreted as an `:id`.

### Checkpoint 2 Criteria
- [ ] Login → /auth/me → memberships → redirect works
- [ ] Institutions can be created and queried
- [ ] App.tsx uses RouterProvider
- [ ] PostLoginRouter redirects by role

## Phase 3: Member Endpoints

**Key endpoints:**
- `GET /institutions/:id/members` — list with user data enrichment
- `POST /institutions/:id/members` — admin cannot assign owner/admin roles
- `PUT /institutions/:id/members/:userId` — only owner changes roles
- `DELETE /institutions/:id/members/:userId` — soft-delete for students

**Business rules:**
- Cannot remove the only owner
- Admin cannot remove another admin/owner
- Students: soft-delete (archived, preserve progress)
- Admin/professor: hard delete

### Checkpoint 3 (SPRINT 1 DONE) Criteria
- [ ] E2E: Signup → membership → redirect to /admin
- [ ] E2E: Login → /auth/me → PostLoginRouter → /admin
- [ ] E2E: Page refresh → session restore
- [ ] E2E: Logout → clear → /login
- [ ] Institution CRUD works
- [ ] Member CRUD with RBAC
- [ ] Soft-delete for students
- [ ] Zero references to `institution_admin` or `joined_at`
