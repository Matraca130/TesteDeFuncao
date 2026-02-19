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

---

## REGLA #1: Arquitectura de 3 Capas — Refactoring Seguro (Student App)

### Problema que resuelve

Cuando un agente construye UI con mocks y luego conecta al backend real, el riesgo es que los cambios se propaguen por toda la app. La arquitectura de 3 capas **aisla el impacto**: conectar el backend solo toca UN archivo.

### Las 3 capas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1: Componentes UI                                     │
│  ─────────────────────                                      │
│  Solo renderizan. Consumen datos de hooks.                  │
│  NUNCA importan fetch, axios, api-client, ni URLs.          │
│  NUNCA manejan loading/error directamente.                  │
│                                                             │
│  Ejemplo:                                                   │
│    function QuizCard({ question, onAnswer }) {              │
│      return <div>...</div>;                                 │
│    }                                                        │
├─────────────────────────────────────────────────────────────┤
│  CAPA 2: Custom Hooks                                       │
│  ────────────────────                                       │
│  Orquestan la logica. Llaman funciones del API client.      │
│  Manejan loading, error, y transformaciones de datos.       │
│  NUNCA hacen fetch() directo — solo llaman a api.ts.        │
│                                                             │
│  Ejemplo:                                                   │
│    function useQuizSession(courseId: string) {               │
│      const [questions, setQuestions] = useState([]);         │
│      const [loading, setLoading] = useState(true);          │
│      useEffect(() => {                                      │
│        api.listQuizQuestions({ course_id: courseId })        │
│          .then(setQuestions)                                 │
│          .finally(() => setLoading(false));                  │
│      }, [courseId]);                                         │
│      return { questions, loading };                         │
│    }                                                        │
├─────────────────────────────────────────────────────────────┤
│  CAPA 3: API Client (api.ts)                                │
│  ───────────────────────────                                │
│  UNICO archivo que sabe como obtener datos.                 │
│  En desarrollo: retorna mocks.                              │
│  En produccion: llama al backend real via fetch.            │
│  NADIE MAS en la app sabe si los datos son mock o reales.  │
│                                                             │
│  Ejemplo (mock):                                            │
│    export async function listQuizQuestions(params) {         │
│      return MOCK.quizQuestions.filter(...);                  │
│    }                                                        │
│                                                             │
│  Ejemplo (real — swap sin tocar nada mas):                  │
│    export async function listQuizQuestions(params) {         │
│      return apiClient.get('/quiz-questions', params);        │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Reglas para agentes

1. **Crear componentes nuevos** → Usa hooks, nunca fetch. Libre de refactorizar.
2. **Refactorizar UI existente** → Los hooks no cambian. Libre de refactorizar.
3. **Conectar al backend real** → Solo toca `api.ts`. Componentes y hooks NO se enteran.
4. **Agregar un endpoint nuevo** → Agrega funcion en `api.ts`, crea hook que la consume, componente usa el hook. Tres archivos, cero acoplamiento.

### Que PUEDE hacer un agente libremente

- Crear, mover, renombrar, o partir componentes UI
- Cambiar props, layout, estilos, animaciones
- Crear hooks nuevos que consuman funciones de api.ts
- Refactorizar hooks existentes (mientras mantengan la misma interfaz publica)

### Que NO puede hacer un agente sin autorizacion

- Meter `fetch()`, `axios`, o URLs de backend dentro de un componente UI
- Meter `fetch()` directo dentro de un hook (debe pasar por api.ts)
- Modificar la interfaz publica de api.ts sin actualizar los hooks que la consumen
- Tocar archivos protegidos (fsrs-engine.ts, shared-types.ts, kv-keys.ts, kv_store.tsx)

### Archivos de contrato disponibles

| Archivo | Que contiene | Donde vive |
|---|---|---|
| `shared-types.ts` (13 modulos + barrel) | Forma de cada entidad (Student, Quiz, Flashcard, etc.) | `/src/types/` |
| `api-contract.ts` | Cada ruta HTTP: method, request body, response body | `/src/types/api-contract.ts` |
| `kv-schema.ts` | Patrones de keys del KV store | `/src/types/kv-schema.ts` |
| `api-client.ts` | Fetch wrapper tipado con auth | `/src/app/lib/api-client.ts` |
| `api-provider.tsx` | React Context que inyecta el client | `/src/app/lib/api-provider.tsx` |
| `mock-data.ts` | Factories + escenario pre-armado | `/src/app/lib/mock-data.ts` |
| `fsrs-engine.ts` | Algoritmo BKT+FSRS (PROTEGIDO) | `/src/app/components/fsrs-engine.ts` |

### Flujo de trabajo de un agente (dia 1 → produccion)

```
DIA 1:  Copia archivos de contrato al proyecto student app
        Crea api.ts con funciones que retornan mocks
        Crea hooks/ que consumen api.ts
        Crea componentes UI que consumen hooks
        → App funciona 100% con datos mock

DIA N:  Backend esta listo para conectar
        Abre api.ts
        Swapea cada funcion: mock → apiClient.get/post/put/del
        → App funciona 100% con datos reales
        → Componentes y hooks: CERO cambios
```

---

## REGLA #2: Preservacion de Diseno (Design Freeze)

### Problema que resuelve

Los agentes, al conectar el frontend con el backend o al refactorizar componentes, reconstruyen el JSX desde cero en vez de adaptar lo existente. Esto cambia classNames, spacing, colores, y tipografia — rompiendo el diseno aprobado sin que nadie lo pida.

### Principio central

> **El diseno vive en el codigo.** Las clases Tailwind de un componente existente SON la especificacion visual. Si no hay una razon explicita para cambiar un className, NO se cambia.

### Reglas obligatorias

1. **NUNCA reescribir un componente para conectar datos.** Conectar al backend = cambiar `api.ts` (o el hook). El JSX del componente NO cambia.

2. **Si un componente debe cambiar su JSX**, el agente DEBE:
   - Leer el componente actual completo ANTES de editarlo (REGLA #0)
   - Hacer edits QUIRURGICOS (fast_apply_tool / edit_tool), no reescrituras
   - Preservar TODAS las clases Tailwind existentes a menos que el usuario pida un cambio visual
   - Si se agregan elementos nuevos, usar el mismo patron visual del componente (mismos colores, spacing, rounded, font sizes)

3. **Prohibido** al conectar backend o refactorizar:
   - Cambiar `className` de elementos existentes
   - Cambiar el layout (flex → grid, column → row, etc.)
   - Cambiar colores, font sizes, padding, margins, border-radius
   - Reemplazar componentes UI por alternativas (ej: `<Card>` por `<div>`)
   - Remover animaciones, transiciones, o hover states

4. **Response Adapters**: Si la shape del backend difiere de lo que el componente espera, la transformacion va en `api.ts`, NUNCA en el componente.

```
// ❌ MAL — el agente cambia el componente para matchear el backend
function QuizCard({ quiz_id, question_text }) {  // ← props cambiaron
  return <div className="p-3 bg-gray-50">...     // ← clases cambiaron
  
// ✅ BIEN — api.ts transforma, componente no se entera
// api.ts:
export async function getQuiz(id) {
  const raw = await apiClient.get(`/quizzes/${id}`);
  return { id: raw.quiz_id, text: raw.question_text };  // ← adapter
}
// Componente: CERO cambios
```

5. **Test visual rapido**: Antes de commitear, el agente debe confirmar:
   - ¿El componente se ve IDENTICO a como se veia antes del cambio?
   - ¿Las unicas diferencias son los datos que muestra (reales vs mock)?
   - Si hay diferencias visuales, ¿el usuario las pidio explicitamente?

### Checklist de Design Freeze (agregar a Pre-Flight)

```
[ ] No cambie ningun className existente
[ ] No cambie el layout (flex/grid direction, gaps, padding)
[ ] No cambie colores, font-sizes, ni border-radius
[ ] Si la data shape cambio, la transformacion esta en api.ts
[ ] El componente se ve visualmente identico al original
```

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
[ ] DESIGN FREEZE: No cambie classNames, layout, ni estilos existentes sin autorizacion
[ ] DESIGN FREEZE: Si adapte data shape, la transformacion esta en api.ts
```

---

## Proyectos Figma Make

| Proyecto | Proposito |
|---|---|
| **Este proyecto** | Central de Comando (architect dashboard) — NO es la app de estudiantes |
| **Proyecto separado** | Student app frontend (Camino C) — Dev 4 (Quiz UI) + Dev 5 (Dashboard/Progress/Smart Study/Study Plans) |