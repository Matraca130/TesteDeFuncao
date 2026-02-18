# Dev 4 - ORDEN: Solo Reviews por ahora, Quiz es Oleada 4

En Oleada 3 tu unica responsabilidad es **ayudar a Dev 3 con POST /reviews**.
Tu trabajo principal (Quiz CRUD) es Oleada 4.

## Imports (para cuando prepares Quiz)

```ts
import type { QuizQuestion, QuizOption, SubTopicBktState, ReviewLog } from "./shared-types.ts";
import { quizKey, bktKey, idxStudentKwBkt, idxStudentBkt, idxSummaryQuiz, idxKwQuiz, idxStudentQuiz } from "./kv-keys.ts";
```

---

## Tarea Oleada 3: Verificar POST /reviews con Dev 3

Cuando Dev 3 tenga la Fase 1 (FC CRUD) lista, coordina con el en el handler de `POST /reviews`:

### Tu checklist de verificacion

- [ ] El handler actualiza correctamente `bkt:{studentId}:{subtopicId}`
- [ ] Testea el endpoint con diferentes ratings (1, 2, 3, 4)
- [ ] Verifica que FSRS/BKT states se actualizan correctamente
- [ ] `idx:student-kw-bkt:{studentId}:{keywordId}:{subtopicId}` se escribe correctamente
- [ ] `idx:student-bkt:{studentId}:{subtopicId}` se escribe correctamente
- [ ] El review se guarda en `review:{reviewId}` con todos los campos de `ReviewLog`
- [ ] `idx:session-reviews:{sessionId}:{reviewId}` se crea
- [ ] La respuesta cumple con `ReviewResponse` de shared-types.ts

---

## Mientras tanto: Prepara Quiz (Oleada 4)

Podes ir **disenando** tu archivo `routes-quiz.tsx`, pero **NO lo pushees todavia**.

Lo que podes ir pensando:
- Quiz CRUD: POST/GET/PUT/DELETE `/quiz`
- Quiz evaluate: POST `/quiz/:id/evaluate`
- KV: `quiz:{questionId}` (**CORRECTO** - no `quiz-q:{id}`)
- Indices: `idx:summary-quiz`, `idx:kw-quiz`, `idx:student-quiz`

## Reglas

- **`quiz:{id}`** es el formato CORRECTO (NO `quiz-q:{id}`)
- Importa SIEMPRE desde `./shared-types.ts` y `./kv-keys.ts`
- NO pushees routes-quiz.tsx hasta que Oleada 3 cierre
