# Dev 5 - ORDEN: Solo Sessions por ahora, Progress es Oleada 4

En Oleada 3 tu unica responsabilidad es **Sessions CRUD**.
Tu trabajo principal (Progress/Study Plans) es Oleada 4.

## Imports

```ts
import type { StudySession, DailyActivity, SessionType } from "./shared-types.ts";
import { sessionKey, dailyKey, idxStudentSessions, idxStudentCourseSessions, idxSessionReviews } from "./kv-keys.ts";
```

---

## Tarea Oleada 3: Sessions CRUD en `routes-sessions.tsx` (ARCHIVO NUEVO)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/sessions` | Crear sesion de estudio |
| `PUT` | `/sessions/:id/end` | Cerrar sesion (calcula duracion, actualiza daily) |
| `GET` | `/sessions/:id` | Get por ID |
| `GET` | `/sessions` | Listar por studentId |

### KV primarios

- `session:{sessionId}` - la sesion
- `daily:{studentId}:{date}` - actividad diaria (se actualiza al cerrar sesion)

### Indices

- `idx:student-sessions:{studentId}:{courseId}:{sessionId}`
- `idx:student-course-sessions:{studentId}:{courseId}:{sessionId}`

### Logica de PUT /sessions/:id/end

1. Lee la sesion existente
2. Calcula `duration_seconds` = now - `started_at`
3. Cuenta `total_reviews` y `correct_reviews` via `idx:session-reviews:{sessionId}`
4. Actualiza/crea `daily:{studentId}:{date}` con:
   - Incrementa `reviews_count`, `correct_count`, `time_spent_seconds`
   - Incrementa `sessions_count`
5. Guarda sesion actualizada con `ended_at`

---

## Mientras tanto: Prepara Progress (Oleada 4)

Podes ir **disenando** `routes-progress.tsx`, pero **NO lo pushees todavia**.

Lo que podes ir pensando:
- Study Plans CRUD
- Progress dashboard views
- Student stats aggregation
- KV: `plan:{planId}`, `plan-task:{taskId}`, `stats:{studentId}`
- Indices: `idx:student-plans`, `idx:plan-tasks`

## Entregable Oleada 3

- 4 rutas
- 2 KV primarios (`session`, `daily`)
- 2 indices (`idx:student-sessions`, `idx:student-course-sessions`)

## Reglas

- Importa SIEMPRE desde `./shared-types.ts` y `./kv-keys.ts`
- NO pushees routes-progress.tsx hasta que Oleada 3 cierre
- Coordina con Dev 3 sobre el flujo de reviews -> sessions
