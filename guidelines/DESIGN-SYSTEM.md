# AXON v4.4 — Design System Lock
## Reglas para NO romper la UI | 2026-02-19

> **PROBLEMA:** Cada vez que un dev implementa algo, rompe la estructura visual.
> **SOLUCION:** Componentes de layout BLOQUEADOS + reglas estrictas.

---

## ARQUITECTURA VISUAL

```
┌──────────────────────────────────────────────────────────────┐
│  TopBar (BLOQUEADO — AppShell.tsx)                            │
│  [≡] AXON  [Curso Atual: Anatomia ▾]         🔍 🔔  Dr. Reed│
├────────────┬─────────────────────────────────────────────────┤
│  Sidebar   │  Content Area                                   │
│ (BLOQUEADO)│                                                 │
│            │  ┌───────────────────────────────────────────┐  │
│  MENU      │  │  <PageHeader />        ← Siempre primero │  │
│  · Inicio  │  │  <QuickAccessCards />                     │  │
│  · Dash    │  │  <SectionHeader />                        │  │
│  · Estudar │  │  <CourseCards />                           │  │
│  · ...     │  │  <PerformanceWidget />                    │  │
│            │  │                                           │  │
│  OUTROS    │  │  ← Tu pagina va AQUI DENTRO               │  │
│  · Config  │  │     Usando componentes compartidos         │  │
│            │  └───────────────────────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────┘
```

---

## REGLA #1: NO TOCAR EL SHELL

Estos archivos estan BLOQUEADOS. Ningun dev los modifica:

```
BLOQUEADO  src/app/components/layout/AppShell.tsx       ← Sidebar + Topbar + Content area
BLOQUEADO  src/app/components/layout/nav-config.ts      ← Items de navegacion por rol
BLOQUEADO  src/app/components/layout/PageHeader.tsx      ← Header de pagina
BLOQUEADO  src/app/components/layout/QuickAccessCard.tsx ← Cards de acceso rapido
BLOQUEADO  src/app/components/layout/CourseCard.tsx      ← Cards de curso/disciplina
BLOQUEADO  src/app/components/layout/SectionHeader.tsx   ← Headers de seccion
BLOQUEADO  src/app/components/layout/TimeFilter.tsx      ← Filtro Hoje/Semana/Mes
BLOQUEADO  src/app/components/layout/PerformanceWidget.tsx ← Widget de desempenho
BLOQUEADO  src/styles/axon-tokens.css                    ← Tokens de color/spacing
```

Si necesitas un cambio en alguno de estos, **pide al arquitecto**.

---

## REGLA #2: CONSTRUYE SOLO EL CONTENIDO

Tu pagina va DENTRO del AppShell. Tu NO creas:
- ❌ Sidebar
- ❌ Top navigation bar
- ❌ Layout wrapper con flex
- ❌ Tu propia version de cards o headers

Tu SI creas:
- ✅ El contenido de la pagina usando componentes compartidos
- ✅ Componentes especificos de tu feature (ej: FlashcardViewer, QuizQuestion)

### Ejemplo correcto:
```tsx
// MiPagina.tsx — CORRECTO
import PageHeader from '../components/layout/PageHeader';
import SectionHeader from '../components/layout/SectionHeader';

export default function MiPagina() {
  return (
    <div className="space-y-6">
      <PageHeader title="Mi Pagina" subtitle="Descripcion" />
      <SectionHeader title="SECCION" />
      {/* Tu contenido aqui */}
    </div>
  );
}
```

### Ejemplo INCORRECTO:
```tsx
// MiPagina.tsx — INCORRECTO ❌
export default function MiPagina() {
  return (
    <div className="h-screen flex">
      <aside className="w-60 bg-gray-900">  {/* ❌ NO crear sidebar */}
        <nav>...</nav>
      </aside>
      <main className="flex-1">
        <header>...</header>               {/* ❌ NO crear topbar */}
        <div>
          <h1 style={{fontSize: '32px'}}>  {/* ❌ NO usar estilos inline */}
            Mi Pagina
          </h1>
        </div>
      </main>
    </div>
  );
}
```

---

## REGLA #3: COLORES — SOLO CSS VARIABLES

NUNCA hardcodear colores. Siempre usar los tokens de axon-tokens.css:

```css
/* ✅ CORRECTO */
color: var(--axon-text-primary);
background: var(--axon-card-bg);
border-color: var(--axon-card-border);

/* ✅ CORRECTO en Tailwind */
className="text-[--axon-text-primary]"
className="bg-[--axon-card-bg]"
className="border-[--axon-card-border]"

/* ❌ INCORRECTO */
color: #333333;
className="text-gray-800"  /* SOLO si es un gris neutro generico */
className="bg-[#1a2332]"   /* NO — usar var(--axon-sidebar-bg) */
```

### Paleta de colores:

| Token | Valor | Uso |
|-------|-------|-----|
| `--axon-teal` | #2dd4bf | Color primario, botones, links activos |
| `--axon-sidebar-bg` | #1a2332 | Fondo del sidebar |
| `--axon-topbar-bg` | #1e293b | Fondo del topbar |
| `--axon-content-bg` | #f8fafc | Fondo del area de contenido |
| `--axon-card-bg` | #ffffff | Fondo de cards |
| `--axon-card-border` | #e2e8f0 | Borde de cards |
| `--axon-text-primary` | #0f172a | Texto principal |
| `--axon-text-secondary` | #475569 | Texto secundario |
| `--axon-text-muted` | #94a3b8 | Texto apagado |

---

## REGLA #4: PATRONES DE LAYOUT

### Cards:
```
rounded-2xl                    ← Siempre 16px radius
border border-[--axon-card-border]  ← Siempre borde
bg-[--axon-card-bg]            ← Siempre fondo blanco
p-4 o p-5                     ← Padding consistente
hover:shadow-md                ← Hover sutil
```

### Spacing:
```
space-y-6                      ← Entre secciones
gap-3 o gap-4                  ← Entre cards en grid
mb-4                           ← Despues de SectionHeader
mb-6                           ← Despues de PageHeader
```

### Grids:
```
grid grid-cols-2 md:grid-cols-4    ← Quick access cards
grid grid-cols-1 sm:grid-cols-2    ← Course cards
grid grid-cols-1 lg:grid-cols-3    ← Content + sidebar widget
```

### Typography:
```
font-family: 'Inter'           ← Se aplica via AppShell
text-2xl sm:text-3xl font-bold ← Titulos de pagina (PageHeader)
text-sm font-bold              ← Titulos de card
text-xs text-[--axon-text-muted] ← Subtitulos
text-[10px] uppercase tracking-wider ← Labels de seccion
```

---

## REGLA #5: COMO AGREGAR UN ITEM AL SIDEBAR

NO editar AppShell.tsx. Editar nav-config.ts:

```typescript
// En nav-config.ts, agregar al array correcto:
export const STUDENT_NAV: NavSection[] = [
  {
    title: 'MENU',
    items: [
      // ... items existentes ...
      { id: 'mi-nuevo-item', label: 'Mi Item', icon: Star, path: '/study/mi-item' },
    ],
  },
];
```

Y luego agregar la ruta en routes.tsx.

---

## REGLA #6: COMO CONECTAR UNA PAGINA AL LAYOUT

```tsx
// En routes.tsx:
{
  path: 'study',
  element: <StudentLayoutWrapper />,    // ← provee el AppShell
  children: [
    { index: true, Component: StudentHomePage },
    { path: 'dashboard', Component: StudentDashboardPage },
    { path: 'mi-nueva-pagina', Component: MiNuevaPagina },  // ← agrega aqui
  ],
}

// StudentLayoutWrapper.tsx conecta AppShell con Outlet:
function StudentLayoutWrapper() {
  const { user, memberships, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppShell
      variant="student"
      sections={STUDENT_NAV}
      user={{ name: user.name, role_label: 'PREMIUM', role_color: 'text-emerald-400' }}
      activePath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Outlet />     {/* ← Tu pagina se renderiza aqui */}
    </AppShell>
  );
}
```

---

## CHECKLIST PARA CADA PAGINA NUEVA

- [ ] Comienza con `<PageHeader title="..." />`
- [ ] Usa `space-y-6` como container principal
- [ ] Cards usan `rounded-2xl border border-[--axon-card-border] bg-[--axon-card-bg]`
- [ ] Secciones usan `<SectionHeader />` antes del contenido
- [ ] NO crea sidebar, topbar, ni layout wrapper
- [ ] NO hardcodea colores (usa CSS variables o componentes compartidos)
- [ ] Font es Inter (heredado de AppShell, no necesitas definirlo)
- [ ] Responsive: usa grids con breakpoints (sm:, md:, lg:)
- [ ] Los datos vienen de hooks (useAuth, useApi), no hardcodeados

---

## COMPONENTES COMPARTIDOS DISPONIBLES

| Componente | Import | Uso |
|------------|--------|-----|
| `AppShell` | `layout/AppShell` | Shell principal (sidebar + topbar) — SOLO en layout wrappers |
| `PageHeader` | `layout/PageHeader` | Titulo + subtitulo de pagina |
| `QuickAccessCard` | `layout/QuickAccessCard` | Card de acceso rapido con icono |
| `CourseCard` | `layout/CourseCard` | Card de curso con progreso |
| `SectionHeader` | `layout/SectionHeader` | Header de seccion con "Ver Todas" |
| `TimeFilter` | `layout/TimeFilter` | Pills Hoje/Semana/Mes |
| `PerformanceWidget` | `layout/PerformanceWidget` | Circulo de desempenho diario |
