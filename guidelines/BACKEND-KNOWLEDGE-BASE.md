# Axon v4.4 — Backend Knowledge Base

> Complete reference for all backend entities, business rules, and known issues.
> Generated: 2026-02-19 | Based on full codebase audit.

## 1. Content Hierarchy

```
Institution (multi-tenant)
  └── Course (Materia, e.g., "Anatomia")
      └── Semester (Año, e.g., "1 Semestre")
          └── Section (Tema, e.g., "Membro Superior")
              └── Topic (Subtema, e.g., "Musculos")
                  └── Summary (Resumen, e.g., "Biceps, Triceps...")
                      ├── Texto (markdown) ← content_markdown
                      ├── Chunks[] (text fragments)
                      ├── Keywords[] (BKT tracked)
                      │   └── Subtopics[]
                      ├── Flashcards[] (FSRS scheduled)
                      ├── Quizzes[] (4 types)
                      └── Videos[] (NEW - YouTube/Vimeo links)
```

## 2. Summary Entity

- **KV key:** `summary:<id>`
- **Index:** `idx:topic-summaries:<topicId>:<sumId>`
- **Children:** Chunks, Keywords, Flashcards, Quizzes, Videos (NEW)
- **NEVER deleted** (sacred data principle)

### Known Bugs

| Bug | Backend stores | Types expect | Severity |
|-----|---------------|--------------|----------|
| Content field | `content` | `content_markdown` | CRITICAL |
| Status enum | `draft\|published\|rejected` | `draft\|processing\|ready\|error` | CRITICAL |
| Title | REQUIRED | Optional in types | MEDIUM |
| Ownership | `institution_id` | `course_id` in types | MEDIUM |

## 3. Video Entity (NEW — not yet implemented)

```typescript
interface Video {
  id: string;              // UUID
  summary_id: string;      // lives inside Summary
  title: string;
  url: string;             // YouTube/Vimeo URL
  platform: 'youtube' | 'vimeo' | 'other';
  duration_seconds?: number;
  order_index: number;
  created_at: string;
  created_by: string;      // userId
}
```

- **KV key:** `video:<videoId>`
- **Index:** `idx:summary-videos:<summaryId>:<padded_order>` → videoId
- **padded_order:** `String(order_index).padStart(6, '0')`
- **RBAC:** owner, admin, professor can CRUD; student: read if plan allows
- **NEVER deleted** (sacred data)

### Endpoints (Sprint 4)

| Method | Route | RBAC |
|--------|-------|------|
| GET | `/summaries/:summaryId/videos` | Any authenticated (student: per plan) |
| POST | `/summaries/:summaryId/videos` | owner, admin, professor |
| PUT | `/summaries/:summaryId/videos/:videoId` | owner, admin, professor |
| DELETE | `/summaries/:summaryId/videos/:videoId` | owner, admin, professor |

## 4. Data Persistence Model

### KV Store API (CRITICAL)

```
kv.set(key, value)           → void
kv.get(key)                  → any | null
kv.del(key)                  → void
kv.mset(keys[], values[])    → void  ⚠️ TWO ARRAYS, NOT an object!
kv.mget(keys[])              → any[] (positional, undefined if missing)
kv.mdel(keys[])              → void
kv.getByPrefix(prefix)       → any[] (returns VALUES, not keys)
```

### Sacred Data Principle

**NEVER deleted:** Summaries, Student annotations, Professor notes, Inline annotations, AI content, BKT progress, Flashcards, Quizzes, Videos.

**Soft-delete pattern:** Mark `archived: true`, remove indices. Student memberships: soft-delete. Admin/professor: hard delete.

### All KV Keys

**Existing:**
```
user:<userId>                                    → User
inst:<instId>                                    → Institution
membership:<instId>:<userId>                     → Membership
idx:inst-members:<instId>:<userId>               → userId
idx:user-insts:<userId>:<instId>                 → instId
course:<id>  / idx:inst-courses:<instId>:<cId>   → Course / courseId
semester:<id> / idx:course-semesters:<cId>:<sId>  → Semester / semId
section:<id> / idx:semester-sections:<sId>:<secId> → Section / secId
topic:<id> / idx:section-topics:<secId>:<tId>     → Topic / topicId
summary:<id> / idx:topic-summaries:<tId>:<sumId>  → Summary / sumId
chunk:<id> / idx:summary-chunks:<sId>:<padded>    → Chunk / chunkId
kw:<id> / idx:summary-kw:<sumId>:<kwId>           → Keyword / kwId
subtopic:<id> / conn:<id>                         → Subtopic / Connection
```

**New (to create):**
```
idx:slug-inst:<slug>                              → instId
plan:<planId> / idx:inst-plans:<instId>:<pId>     → Plan / planId
plan-rule:<rId> / idx:plan-rules:<pId>:<rId>      → Rule / ruleId
admin-scope:<sId> / idx:member-scopes:<mId>:<sId> → Scope / scopeId
video:<vId> / idx:summary-videos:<sumId>:<pad>    → Video / videoId
```

## 5. Business Rules

### Roles (RBAC)
- **owner:** Total control. Creates plans, scopes admins.
- **admin:** Co-admin, limited by AdminScope. Can invite student/professor.
- **professor:** Creates/edits content. No management.
- **student:** Consumes content per plan.

### Plans
- Types: Free (default), Trial (temporal), Pro, Completo
- Only owner creates/manages plans
- `PlanAccessRule`: scope (all|course|semester|section|topic|summary) × content type (summary|flashcards|quizzes|videos)

### Auto-registration
1. Student visits `/i/:slug`
2. Signs up with name/email/password
3. Backend creates user + student membership + Free plan
4. Redirects to study area

### Field Name Bugs (hierarchy)

| Entity | Backend | Should be |
|--------|---------|----------|
| Semester/Section/Topic | `title` | `name` |
| Semester/Section/Topic | `sort_order` | `order_index` |

## 6. Complete Change List (50 items)

### A. New Entities (5)
1. Video entity + CRUD
2. Plan entity + CRUD
3. PlanAccessRule entity + GET/POST/DELETE
4. AdminScope entity + GET/POST/DELETE
5. GET /access/check endpoint

### B. Missing Entities (no interface yet) (5)
6. StudentAnnotation (on keywords)
7. ProfessorNote (pop-ups)
8. InlineAnnotation (highlights in summary text)
9. AIContent tracking
10. Content versioning

### C. Missing Backend Endpoints (13)
11-23. All auth + institution + member endpoints (see Sprint 1 plan)

### D. Bugs to Fix (14)
24. Summary.content → content_markdown
25. SummaryStatus enum alignment
26. Semester/Section/Topic title→name, sort_order→order_index (×3)
27-37. Membership id, joined_at→created_at, creator role, singleton client, AuthContext role enum, double sign-in, INST_ID hardcode, signup without institutionId, Institution updated_at, keyword priority, duplicate kv-keys.tsx

### E. Infrastructure (7)
38-44. React Router, role-based routing, RequireAuth, RequireRole, AdminLayout, selectInstitution, ApiProvider integration

### F. Future Features (6)
45-50. Payments, plan expiration enforcement, admin scope enforcement, model3d audit, upgrade CTA, plan upgrade flow
