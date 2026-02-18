# AXON Frontend Blueprint v1.0
## Context for Figma Make AI Sessions

> **PASTE THIS AS YOUR FIRST PROMPT** in any Figma Make session that builds
> the Axon student app. It tells the AI what already exists and what rules to follow.

---

## 1. IDENTITY

You are building **Axon** — a medical education platform ("Plataforma de Estudos Medicos").
The app already exists with a mature codebase. You are EXTENDING it, not rebuilding it.

---

## 2. CRITICAL RULES

1. **DO NOT rewrite** App.tsx, Sidebar, AuthGuard, or any Context provider — they work.
2. **DO NOT create** your own design system — one already exists at `src/app/design-system/`.
3. **DO NOT change** the provider hierarchy: AuthProvider → AuthGuard → AppProvider → AdminProvider → StudentDataProvider → AppShell.
4. **DO NOT change** the ViewRouter pattern — add new cases to the existing switch.
5. **USE selection-based editing** — select only the component you want to change.
6. **New components** go in `src/app/components/{feature}/` (e.g., `components/quiz/`, `components/dashboard/`).
7. **New hooks** go in `src/app/hooks/`.
8. **Font**: Headings = Georgia serif, Body = Inter sans-serif. No other fonts.
9. **Primary color**: Teal (#14b8a6 / teal-500). No blue, no violet, no gradients on icons.
10. **Backend prefix**: The LIVE server uses `make-server-0ada7954`. Update `studentApi.ts` if needed.

---

## 3. DESIGN SYSTEM (MANDATORY)

All tokens are at `src/app/design-system/`. Import from `@/app/design-system`.

### Colors
```
Primary:     teal-500 (#14b8a6) — buttons, badges, progress
Primary hover: teal-600 (#0d9488)
Surface:     #f5f2ea (dashboard bg), #ffffff (cards), #f9fafb (page bg)
Sidebar:     #1c1c1e (outer), #2d3e50 (inner)
Header:      #1e293b
Borders:     gray-200 (#e5e7eb)
Text:        gray-900, gray-500, gray-400
Success:     emerald-500 | Warning: amber-500 | Error: red-500
```

### Typography
```
Page titles:    Georgia, serif — text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight
Section titles: Georgia, serif — text-lg font-semibold
Body text:      Inter, sans-serif — text-sm font-medium
Captions:       Inter — text-xs
Labels:         Inter — text-[10px] uppercase tracking-wider
```

### Component Patterns
```
Cards:          bg-white rounded-2xl border border-gray-200 shadow-sm p-5
Buttons:        bg-teal-500 hover:bg-teal-600 text-white rounded-full font-semibold
Icons:          bg-teal-50 text-teal-500 rounded-xl (container) — NO gradients
Progress bar:   h-2 bg-gray-100 rounded-full, fill: bg-teal-500
Filter buttons: active=bg-teal-500 text-white, inactive=text-gray-500
KPI cards:      bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-gray-100
```

### Layout
```
Sidebar width:  260px
Header height:  48px (h-12)
Content:        px-6 py-6 gap-6 max-w-7xl
Grid stats:     grid-cols-2 lg:grid-cols-4 gap-4
Grid courses:   grid-cols-1 lg:grid-cols-2 gap-5
```

### Navigation (Sidebar items)
```
Primary:  Home, Dashboard, Estudar, Cronograma, Flashcards, Atlas 3D, Quiz, Meus Dados
Secondary: Comunidade, Configuracoes
Icons: lucide-react (Home, LayoutDashboard, BookOpen, Calendar, Layers, Box, GraduationCap, Database)
```

---

## 4. EXISTING ARCHITECTURE

### Folder Structure (DO NOT reorganize)
```
src/app/
├── App.tsx                    ← Main entry (DO NOT rewrite)
├── components/
│   ├── admin/                 ← Admin panel
│   ├── ai/                    ← AI generate, approval, chat
│   ├── auth/                  ← AuthGuard, LoginPage, SignupPage
│   ├── content/               ← DashboardView, ResumosView, StudyView
│   ├── demo/                  ← Demo components
│   ├── figma/                 ← ImageWithFallback (PROTECTED)
│   ├── layout/                ← Layout components
│   ├── shared/                ← Sidebar, shared UI
│   └── ui/                    ← Base UI primitives
├── context/
│   ├── AuthContext.tsx         ← Supabase Auth (DO NOT touch)
│   ├── AppContext.tsx          ← Navigation state, current course
│   ├── AdminContext.tsx        ← Admin session
│   └── StudentDataContext.tsx  ← FSRS, study data
├── data/                       ← Static course data, keywords
├── design-system/              ← THE design system (NEVER override)
├── hooks/                      ← Custom hooks
├── services/                   ← API services (studentApi, etc.)
└── types/                      ← TypeScript types
```

### ViewRouter Pattern (in App.tsx)
To add a new view, add a case to the `switch(activeView)` in ViewRouter:
```tsx
case 'quiz':
  return <QuizSessionView key="quiz" />;
case 'mastery-dashboard':
  return <MasteryDashboard key="mastery" />;
```
Also add the view to `navigation.views` in `design-system/navigation.ts`.

### Animation
View transitions use `AnimatePresence` + `motion` from `motion/react`:
```tsx
initial={{ opacity: 0, x: 8 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -8 }}
transition={{ duration: 0.15, ease: 'easeOut' }}
```

---

## 5. BACKEND API CONTRACT

Server: `https://{projectId}.supabase.co/functions/v1/make-server-0ada7954`
Auth: `Authorization: Bearer {access_token}` (from Supabase Auth)
Response: `{ success: boolean, data?: T, error?: { code, message } }`

### Quiz Routes (Dev 4)
```
POST   /quizzes                      — Create quiz question
GET    /quizzes?summary_id=X          — List by summary
GET    /quizzes/:id                    — Get single quiz
PUT    /quizzes/:id                    — Update quiz
DELETE /quizzes/:id                    — Delete quiz
POST   /quizzes/:id/answer             — Submit answer { answer: string }
       Response: { correct, explanation, correct_answer, color_before, color_after }
```

### Flashcard Routes (Dev 3)
```
POST   /flashcards                     — Create card
GET    /flashcards?summary_id=X        — List by summary
GET    /flashcards/:id                  — Get card
PUT    /flashcards/:id                  — Update card
DELETE /flashcards/:id                  — Delete card
GET    /flashcards/due?student_id=X     — Get due cards (FSRS)
```

### Review & Session Routes (Dev 3)
```
POST   /reviews                        — Submit review { session_id, item_id, instrument_type, grade }
POST   /sessions                       — Start session { course_id?, session_type }
PUT    /sessions/:id/end               — End session
GET    /sessions?student_id=X          — List sessions
```

### Dashboard Routes (Dev 5)
```
GET    /stats                          — Student stats (streak, totals)
GET    /daily-activity?from=X&to=Y     — Heatmap data
GET    /progress/keyword/:id           — Keyword progress (D25 color)
GET    /progress/topic/:id             — Topic progress
GET    /progress/course/:id            — Course progress
POST   /smart-study/generate           — Get NeedScore-ranked items
POST   /study-plans                    — Create study plan
GET    /study-plans                    — List plans
POST   /study-plans/:id/recalculate    — Recalculate plan
POST   /sessions/:id/finalize-stats    — Update daily+stats after session
```

### Content Routes (Dev 1)
```
POST   /courses, /semesters, /sections, /topics  — CRUD hierarchy
POST   /summaries                                 — Create summary
POST   /keywords, /subtopics                      — CRUD keywords
```

### AI Routes (Dev 6)
```
POST   /ai/generate-flashcards        — AI-generate flashcards from summary
POST   /ai/generate-quiz              — AI-generate quiz from summary
POST   /ai/chat                        — AI chat about keyword
```

---

## 6. BKT COLOR SYSTEM

Each keyword has subtopics. Each subtopic gets a color based on mastery:
```
red    = delta < 0.3  (needs review)
orange = delta 0.3-0.6
yellow = delta 0.6-1.0
green  = delta >= 1.0 (mastered)
```
Keyword color = min(delta) of its subtopics (D25).
Unevaluated subtopic = delta 0, color red (D26).
No quiz for keyword = coverage gap alert (D32).

---

## 7. HOW TO PROMPT (Tips for the user)

**Good prompts (incremental):**
- "Create a QuizSessionView component in src/app/components/quiz/ that shows one question at a time with MCQ options. Use the design system colors and card patterns."
- (Select the sidebar) "Add a quiz icon to the sidebar navigation"
- (Select DashboardView) "Add a heatmap section showing daily activity using recharts"

**Bad prompts (will cause rewrites):**
- "Build the entire Axon app" ← rewrites everything
- "Create a medical study app" ← ignores existing code
- "Make a dashboard with sidebar" ← already exists, will duplicate

---

## 8. PACKAGES ALREADY INSTALLED

Check package.json before installing. Likely already present:
- react, react-dom
- motion (for animations — import from 'motion/react')
- lucide-react (icons)
- @supabase/supabase-js
- recharts (if charts exist)
- react-markdown, remark-gfm (summary rendering)
