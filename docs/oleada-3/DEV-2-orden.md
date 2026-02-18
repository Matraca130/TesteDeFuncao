# Dev 2 - ORDEN: Empieza ya, no esperes a nadie

**Tu entrega es 100% independiente** - no necesitas nada de Dev 3/4/5.

## Imports

```ts
import type { SummaryReadingState, SummaryAnnotation, HighlightColor } from "./shared-types.ts";
import { readingKey, annotationKey, idxStudentReading, idxStudentAnnotations, KV_PREFIXES } from "./kv-keys.ts";
```

## Archivo: `routes-reading.tsx`

### 1. Reading State (2 rutas)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `PUT` | `/reading-state` | Guarda progreso de lectura |
| `GET` | `/reading-state/:summaryId` | Lee estado de lectura |

**KV key:** `reading:{studentId}:{summaryId}`
**Indice:** `idx:student-reading:{studentId}:{summaryId}`

### 2. Annotations CRUD (4 rutas)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/annotations` | Crear anotacion |
| `GET` | `/annotations` | Listar por summaryId/studentId |
| `PUT` | `/annotations/:id` | Actualizar anotacion |
| `DELETE` | `/annotations/:id` | Eliminar anotacion |

**KV key:** `annotation:{annotationId}`
**Indice:** `idx:student-annotations:{studentId}:{summaryId}:{annotationId}`

## Entregable

- 6 rutas
- 2 KV primarios (`reading`, `annotation`)
- 2 indices (`idx:student-reading`, `idx:student-annotations`)

## Reglas

- Importa tipos desde `./shared-types.ts` y keys desde `./kv-keys.ts`
- NO crees stubs propios de tipos
- El `studentId` se extrae del token JWT via `supabase.auth.getUser(accessToken)`
- Cuando termines, avisa para verificacion manual
