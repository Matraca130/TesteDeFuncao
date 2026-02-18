# Dev 3 - ORDEN: FC CRUD primero, /due segundo, despues coordinas Reviews

Tu trabajo tiene **3 fases**. Hace la Fase 1 ya, la 2 cuando este lista, y la 3 es coordinacion.

## Imports

```ts
// Fase 1+2
import type { FlashcardCard, DueFlashcardItem, CardFsrsState } from "./shared-types.ts";
import { fcKey, idxSummaryFc, idxKwFc, idxStudentFc, idxDue, idxStudentFsrs, fsrsKey } from "./kv-keys.ts";

// Fase 2
import { reviewCard, createNewCard } from "./fsrs-engine.ts";

// Fase 3
import type { SubTopicBktState, ReviewLog, ReviewRequest, ReviewResponse } from "./shared-types.ts";
import { bktKey, reviewKey, idxSessionReviews, idxStudentKwBkt, idxStudentBkt } from "./kv-keys.ts";
```

---

## Fase 1 (AHORA) - Flashcards CRUD en `routes-flashcards.tsx`

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/flashcards` | Crear card -> `fc:{cardId}` + indices |
| `GET` | `/flashcards` | Listar por query params (summaryId, keywordId, studentId) |
| `GET` | `/flashcards/:id` | Get por ID |
| `PUT` | `/flashcards/:id` | Update |
| `DELETE` | `/flashcards/:id` | Delete + limpiar indices |

**KV:** `fc:{cardId}`
**Indices:**
- `idx:summary-fc:{summaryId}:{fcId}`
- `idx:kw-fc:{keywordId}:{fcId}`
- `idx:student-fc:{studentId}:{fcId}`

---

## Fase 2 (despues de Fase 1) - GET /flashcards/due

- Importa `fsrs-engine.ts` (**NO lo modifiques** - es Protected)
- Lee `idx:due:{studentId}` para obtener cards pendientes
- Filtra por fecha usando FSRS `nextReviewDate`
- Confirmado: **NO agregues `bkt` a `DueFlashcardItem`** - correcto, mantenelo asi
- Retorna array de `DueFlashcardItem`

---

## Fase 3 (coordinacion con Dev 4) - POST /reviews

**Archivo:** `routes-reviews.tsx` (NUEVO)

Vos escribis el handler, Dev 4 lo revisa/testea.

El handler recibe `ReviewRequest` y:
1. Llama a `reviewCard()` del FSRS engine
2. Actualiza `fsrs:{studentId}:{cardId}`
3. Busca el `subtopicId` del card y actualiza `bkt:{studentId}:{subtopicId}`
4. Guarda el review en `review:{reviewId}` + `idx:session-reviews:{sessionId}:{reviewId}`
5. Actualiza `idx:student-kw-bkt`, `idx:student-bkt`, `idx:student-fsrs`
6. Retorna `ReviewResponse`

---

## Entregable total

- 6 rutas (5 FC CRUD + 1 /due)
- 1 KV primario (`fc`)
- 3 indices (`idx:summary-fc`, `idx:kw-fc`, `idx:student-fc`)
- + Reviews handler (coordinado con Dev 4)

## Reglas

- `quiz:{id}` es el formato correcto (NO `quiz-q:{id}`)
- `fsrs-engine.ts` es PROTECTED - no modificar sin autorizacion del arquitecto
- Importa SIEMPRE desde `./shared-types.ts` y `./kv-keys.ts`
