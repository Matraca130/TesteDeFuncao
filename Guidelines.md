# Axon — Protocolo de Desarrollo (Central de Comando)

## REGLA #0: Pre-Flight Check (OBLIGATORIO antes de cualquier cambio)

Antes de editar CUALQUIER archivo, el agente/dev DEBE:

1. **Leer el archivo completo** que va a modificar (usa `read` o `cat`).
2. **Leer los archivos vecinos** que importan o son importados por ese archivo.
3. **Identificar** todas las funciones, hooks, props, y tipos que el archivo expone o consume.
4. **Confirmar** que el cambio propuesto no rompe ninguna interfaz existente.
5. **Si el cambio toca mas de 30% del archivo**, explicar POR QUE antes de proceder.

> Si no puedes listar los imports y exports del archivo ANTES de editarlo, NO lo edites.

---

## Documento de Diseño Canonico (LEER ANTES de cualquier cambio)

La especificacion completa del sistema vive en **`/src/app/components/GuidelinesView.tsx`** — 15 secciones que cubren:

| Seccion | Contenido |
|---|---|
| 1. Resumen Ejecutivo | Stack, IDs, estado general |
| 2. Infraestructura | Project ID, PREFIX, KV table |
| 3. Arquitectura | Capas del sistema, flujo de datos |
| 4. Modelos de Datos | Todas las interfaces/tipos (Student, Quiz, Flashcard, Connection, etc.) |
| 5. Esquema KV | Patrones de keys, prefijos, formato |
| 6. API — Rutas Existentes | Los ~35 endpoints del backend actual |
| 7. API — Rutas Nuevas | ~8 endpoints adicionales planificados |
| 8. Autenticacion | Supabase Auth, roles admin/student |
| 9. Gemini AI | Integracion con modelos 2.0-flash |
| 10. Seed Data | Datos iniciales para desarrollo |
| 11. Sistema Subtopicos | Estructura jerarquica de contenido |
| 12. Contrato Frontend | Que espera el frontend del backend |
| 13. Patrones de Error | Manejo de errores estandarizado |
| 14. Checklist | Verificacion pre-deploy |
| 15. Mapa Frontend | ~80 archivos: hooks, design system, layout, views, canvas editor |

**REGLA**: Antes de hacer cualquier cambio que toque la estructura, los tipos, las rutas API, o la forma en que se obtienen datos, el agente DEBE leer las secciones relevantes de `GuidelinesView.tsx` para entender el diseno actual. NO adivinar — leer.

---

## Archivos Protegidos (NUNCA modificar)

| Archivo | Razon |
|---|---|
| `/supabase/functions/server/kv_store.tsx` | Store atomico — protegido por sistema |
| `/src/app/components/fsrs-engine.ts` | Algoritmo FSRS auditado — solo con autorizacion explicita del usuario |
| `shared-types.ts` (en repo GitHub) | Contrato canonico — cambios requieren PR |
| `kv-keys.ts` (en repo GitHub) | Patrones de KV — cambios requieren PR |

---

## Convenciones Criticas

### Formato de keys
- Quiz: `quiz:{id}` (CORRECTO) — nunca `quiz-q:{id}`
- El PREFIX de produccion es `0ada7954` — al copiar index.tsx al LIVE, mantenerlo

### Backend
- Backend esta 100% completo y auditado (commit `126e689` en main).
- 9 modulos de rutas, ~80+ endpoints.
- NO modificar el backend a menos que el usuario lo pida explicitamente.

### Frontend — Patron Adapter Layer (para student app)

La arquitectura del student app sigue 3 capas para evitar cambios masivos al conectar backend:

```
Componentes UI  -->  Solo consumen hooks, NUNCA llaman fetch()
Custom Hooks    -->  Llaman al API client, manejan loading/error
API Client      -->  UNICO punto de contacto con el backend
```

**Regla**: Si necesitas cambiar como se obtienen datos, solo toca `api.ts`. Los componentes y hooks no cambian.

### Imagenes en Flashcards/Resumenes
- `FlashcardCard` tiene campos opcionales `front_image?`, `back_image?`
- Supabase Storage se implementa en oleada futura — por ahora los campos existen pero no se usan

### Design Gap D3 (pendiente)
- Keywords sin BKT state (nunca estudiados) no aparecen en `POST /smart-study/generate` ni en `POST /study-plans/:id/recalculate`
- Segun D26, deberian tener maxima prioridad
- Solucion pendiente: se maneja en la capa de hooks como fallback temporal, o se arregla en backend

### Auto-chunking de resumenes
- Se implementa DESPUES de Oleada 3 — no ahora

---

## Checklist Rapido (copiar antes de cada tarea)

```
[ ] Lei el archivo que voy a modificar
[ ] Lei los archivos que importa / que lo importan
[ ] Puedo listar sus exports e imports
[ ] Mi cambio NO rompe interfaces existentes
[ ] Si toco >30% del archivo, explique por que
[ ] No toque archivos protegidos
[ ] Use el formato correcto de KV keys
[ ] Si es student app: los cambios de data van en api.ts, no en componentes
```

---

## Proyectos Figma Make

| Proyecto | Proposito |
|---|---|
| **Este proyecto** | Central de Comando (architect dashboard) — NO es la app de estudiantes |
| **Proyecto separado** | Student app frontend (Camino C) — Dev 4 (Quiz UI) + Dev 5 (Dashboard/Progress/Smart Study/Study Plans) |
