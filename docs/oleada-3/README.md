# Oleada 3 - Features Core

**Status:** IN PROGRESS
**Fecha inicio:** 2026-02-18
**Contratos pusheados:** commit `086d152`

## Archivos de contrato (ya en main)

| Archivo | Descripcion |
|---------|-------------|
| `supabase/functions/server/shared-types.ts` | Todas las interfaces TypeScript (25+ tipos) |
| `supabase/functions/server/kv-keys.ts` | Funciones de generacion de keys (primarias + indices) |
| `supabase/functions/server/fsrs-engine.ts` | Motor FSRS v4 (PROTEGIDO - no modificar) |

## Devs involucrados

| Dev | Rol | Items | Archivo |
|-----|-----|-------|---------|
| Dev 2 | Reading + Annotations | 6 items | `routes-reading.tsx` |
| Dev 3 | Flashcards CRUD + due | 5 items | `routes-flashcards.tsx` |
| Dev 3+4 | POST /reviews | 1 item | `routes-reviews.tsx` (NUEVO) |
| Dev 5 | Sessions CRUD | 4 items | `routes-sessions.tsx` (NUEVO) |

## Timeline

1. Dev 2 y Dev 3 Fase 1 **en paralelo** (ahora)
2. Dev 3 Fase 2 (/due) cuando Fase 1 este lista
3. Dev 3 Fase 3 + Dev 4: Reviews (coordinacion)
4. Dev 5: Sessions (puede empezar en paralelo)
5. Verificacion manual de cada uno

## Reglas globales

- **Importar tipos desde** `./shared-types.ts` (NO crear stubs propios)
- **Importar keys desde** `./kv-keys.ts` (NO hardcodear keys)
- **`quiz:{id}`** es el formato correcto (NO `quiz-q:{id}`)
- **`fsrs-engine.ts`** es PROTECTED - no modificar sin autorizacion
- **NO pushear** archivos de Oleada 4 hasta cerrar Oleada 3
