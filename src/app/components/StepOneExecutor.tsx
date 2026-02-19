import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  ArrowRight,
  FileText,
  FolderOpen,
  ExternalLink,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// Decomposition & Types Unification Progress Tracker
// Branch: refactor/flashcard-decomposition
// ═══════════════════════════════════════════════════════════════

interface StepInfo {
  id: string;
  title: string;
  commit: string;
  sha: string;
  files: string[];
  linesMovedOut: number;
  status: "done" | "next" | "pending";
  optimization?: number; // 1 or 2
}

const STEPS: StepInfo[] = [
  {
    id: "1",
    title: "Extraer constantes, utilidades y tipos",
    commit: "refactor(flashcard): Step 1 — Extract constants, utils & types",
    sha: "6a78b30",
    files: [
      "src/types/enums.ts",
      "src/types/instruments.ts",
      "src/types/api-contract.ts",
      "src/app/components/flashcard/constants.ts",
      "src/app/components/flashcard/utils.ts",
      "src/app/components/flashcard/types.ts",
      "src/app/components/flashcard/index.ts",
    ],
    linesMovedOut: 35,
    status: "done",
    optimization: 1,
  },
  {
    id: "2",
    title: "Extraer sub-componentes de UI",
    commit: "refactor(flashcard): Step 2 — Extract 4 UI sub-components",
    sha: "47ea427",
    files: [
      "src/app/components/flashcard/SpeedometerGauge.tsx",
      "src/app/components/flashcard/GradeButtons.tsx",
      "src/app/components/flashcard/ReviewFeedbackDisplay.tsx",
      "src/app/components/flashcard/StudentCardCreator.tsx",
    ],
    linesMovedOut: 350,
    status: "done",
    optimization: 1,
  },
  {
    id: "3",
    title: "Extraer custom hook useFlashcardSession",
    commit: "refactor(flashcard): Step 3 — Extract useFlashcardSession hook",
    sha: "3b9e3b1",
    files: [
      "src/app/components/flashcard/useFlashcardSession.ts",
    ],
    linesMovedOut: 220,
    status: "done",
    optimization: 1,
  },
  {
    id: "4",
    title: "Extraer vistas por fase (Loading, Empty, Summary, Studying)",
    commit: "refactor(flashcard): Step 4 — Extract phase views",
    sha: "6d4ec2d",
    files: [
      "src/app/components/flashcard/views/LoadingView.tsx",
      "src/app/components/flashcard/views/EmptyView.tsx",
      "src/app/components/flashcard/views/SummaryView.tsx",
      "src/app/components/flashcard/views/StudyingView.tsx",
      "src/app/components/flashcard/views/index.ts",
    ],
    linesMovedOut: 380,
    status: "done",
    optimization: 1,
  },
  {
    id: "5",
    title: "Reescribir FlashcardSession como orquestador",
    commit: "refactor(flashcard): Step 5 — Thin orchestrator + final barrel",
    sha: "9ba719a",
    files: [
      "src/app/components/flashcard/FlashcardSession.tsx",
    ],
    linesMovedOut: 75,
    status: "done",
    optimization: 1,
  },
  {
    id: "6",
    title: "Cleanup: monolito → shim + deprecar hook legacy",
    commit: "refactor(flashcard): Replace monolith with re-export shim",
    sha: "6a80f48",
    files: [
      "src/app/components/flashcard-session.tsx (shim)",
      "src/app/hooks/useFlashcardSession.ts (@deprecated)",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 1,
  },
  {
    id: "7",
    title: "Crear keyword.ts + types barrel index.ts",
    commit: "refactor(types): Opt 2 Step 1 — Create keyword.ts + types barrel",
    sha: "0514e9b",
    files: [
      "src/types/keyword.ts",
      "src/types/index.ts",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 2,
  },
  {
    id: "8",
    title: "Shim services/types.ts + dedupe KeywordState en spacedRepetition",
    commit: "refactor(types): Opt 2 Step 2 — Replace services/types.ts + dedupe",
    sha: "3123361",
    files: [
      "src/app/services/types.ts (shim)",
      "src/app/services/spacedRepetition.ts (import from types/)",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 2,
  },
  {
    id: "9",
    title: "Mover auth.ts + student.ts a src/types/",
    commit: "refactor(types): Opt 2 Step 3 — Move auth + student to src/types/",
    sha: "b9664bf",
    files: [
      "src/types/auth.ts",
      "src/types/student.ts",
      "src/app/types/auth.ts (shim)",
      "src/app/types/student.ts (shim)",
      "src/types/index.ts (updated)",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 2,
  },
  {
    id: "10",
    title: "Crear useContentData hook compartido",
    commit: "refactor(hooks): Opt 3 Step 1 — Create useContentData shared hook",
    sha: "99c75f4",
    files: [
      "src/app/hooks/useContentData.ts",
      "src/types/content.ts",
      "src/types/index.ts (updated)",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 3,
  },
  {
    id: "11",
    title: "Conectar 3 paginas a useContentData",
    commit: "refactor(pages): Opt 3 Step 2 — Wire useContentData into 3 pages",
    sha: "8224d8e",
    files: [
      "src/app/pages/StudyDashboard.tsx",
      "src/app/pages/ProfessorDashboard.tsx",
      "src/app/pages/LegacyAdminPanel.tsx",
    ],
    linesMovedOut: 135,
    status: "done",
    optimization: 3,
  },
  {
    id: "12",
    title: "Migrar 6 consumidores de services/types → types/",
    commit: "cleanup(imports): Step 12 — Migrate 6 consumers off services/types shim",
    sha: "b0f1c60",
    files: [
      "src/app/hooks/useKeywordPopup.ts",
      "src/app/hooks/useKeywordChat.ts",
      "src/app/components/ai/SubTopicCard.tsx",
      "src/app/components/ai/keyword-popup-utils.ts",
      "src/app/components/ai/AIChatPanel.tsx",
      "src/app/components/ai/KeywordPopup.tsx",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 4,
  },
  {
    id: "13",
    title: "Eliminar shim services/types.ts",
    commit: "cleanup(shims): Step 13 — Delete services/types.ts shim",
    sha: "273643f",
    files: ["src/app/services/types.ts (DELETED)"],
    linesMovedOut: 0,
    status: "done",
    optimization: 4,
  },
  {
    id: "14",
    title: "Eliminar shim services/supabaseClient.ts",
    commit: "cleanup(shims): Step 14 — Delete services/supabaseClient.ts shim",
    sha: "fb729eb",
    files: ["src/app/services/supabaseClient.ts (DELETED)"],
    linesMovedOut: 0,
    status: "done",
    optimization: 4,
  },
  {
    id: "15",
    title: "Eliminar shims app/types/auth.ts + student.ts",
    commit: "cleanup(shims): Step 15 — Delete type shims",
    sha: "bd7f32f",
    files: [
      "src/app/types/auth.ts (DELETED)",
      "src/app/types/student.ts (DELETED)",
    ],
    linesMovedOut: 0,
    status: "done",
    optimization: 4,
  },
  {
    id: "16",
    title: "Eliminar shim flashcard-session.tsx",
    commit: "cleanup(shims): Step 16 — Delete flashcard-session.tsx shim",
    sha: "2777831",
    files: ["src/app/components/flashcard-session.tsx (DELETED)"],
    linesMovedOut: 0,
    status: "done",
    optimization: 4,
  },
];

// ─── File tree of current state ──────────────────────────────

interface TreeNode {
  name: string;
  type: "file" | "folder";
  step?: number; // which step created this
  children?: TreeNode[];
}

const CURRENT_TREE: TreeNode[] = [
  {
    name: "src/",
    type: "folder",
    children: [
      {
        name: "types/",
        type: "folder",
        step: 1,
        children: [
          { name: "enums.ts", type: "file", step: 1 },
          { name: "instruments.ts", type: "file", step: 1 },
          { name: "api-contract.ts", type: "file", step: 1 },
          { name: "keyword.ts", type: "file", step: 7 },
          { name: "index.ts", type: "file", step: 7 },
          { name: "auth.ts", type: "file", step: 9 },
          { name: "student.ts", type: "file", step: 9 },
          { name: "content.ts", type: "file", step: 10 },
        ],
      },
      {
        name: "app/components/",
        type: "folder",
        children: [
          {
            name: "flashcard/",
            type: "folder",
            step: 1,
            children: [
              { name: "index.ts", type: "file", step: 2 },
              { name: "constants.ts", type: "file", step: 1 },
              { name: "utils.ts", type: "file", step: 1 },
              { name: "types.ts", type: "file", step: 1 },
              { name: "SpeedometerGauge.tsx", type: "file", step: 2 },
              { name: "GradeButtons.tsx", type: "file", step: 2 },
              { name: "ReviewFeedbackDisplay.tsx", type: "file", step: 2 },
              { name: "StudentCardCreator.tsx", type: "file", step: 2 },
              { name: "useFlashcardSession.ts", type: "file", step: 3 },
              { name: "FlashcardSession.tsx", type: "file", step: 5 },
              {
                name: "views/",
                type: "folder",
                step: 4,
                children: [
                  { name: "LoadingView.tsx", type: "file", step: 4 },
                  { name: "EmptyView.tsx", type: "file", step: 4 },
                  { name: "SummaryView.tsx", type: "file", step: 4 },
                  { name: "StudyingView.tsx", type: "file", step: 4 },
                  { name: "index.ts", type: "file", step: 4 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

function FileTree({
  nodes,
  depth = 0,
}: {
  nodes: TreeNode[];
  depth?: number;
}) {
  const stepColors: Record<number, string> = {
    1: "text-blue-500",
    2: "text-emerald-500",
    3: "text-violet-500",
    4: "text-amber-500",
    5: "text-rose-500",
  };
  const stepBg: Record<number, string> = {
    1: "bg-blue-100 text-blue-600",
    2: "bg-emerald-100 text-emerald-600",
    3: "bg-violet-100 text-violet-600",
    4: "bg-amber-100 text-amber-600",
    5: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="space-y-px">
      {nodes.map((node) => (
        <div key={node.name}>
          <div
            className="flex items-center gap-1.5 py-0.5"
            style={{ paddingLeft: depth * 14 }}
          >
            {node.type === "folder" ? (
              <FolderOpen
                size={12}
                className={node.step ? stepColors[node.step] : "text-amber-500"}
              />
            ) : (
              <FileText
                size={11}
                className={node.step ? stepColors[node.step] : "text-gray-400"}
              />
            )}
            <span
              className={`text-[11px] ${
                node.step ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {node.name}
            </span>
            {node.step && (
              <span
                className={`text-[8px] px-1 py-px rounded ${stepBg[node.step]}`}
              >
                P{node.step}
              </span>
            )}
          </div>
          {node.children && <FileTree nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────

function StepCard({ step }: { step: StepInfo }) {
  const [open, setOpen] = useState(false);

  const statusStyle =
    step.status === "done"
      ? "border-emerald-200 bg-emerald-50/40"
      : step.status === "next"
      ? "border-violet-300 bg-violet-50/40 ring-1 ring-violet-200"
      : "border-gray-200 bg-gray-50/30 opacity-60";

  const badge =
    step.status === "done" ? (
      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
        <CheckCircle2 size={9} /> DONE
      </span>
    ) : step.status === "next" ? (
      <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full animate-pulse">
        NEXT
      </span>
    ) : (
      <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
        PENDING
      </span>
    );

  return (
    <div className={`border rounded-xl overflow-hidden ${statusStyle}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/30 transition-colors"
      >
        <span className="text-xs text-gray-400 w-5 shrink-0">#{step.id}</span>
        <span className="flex-1 text-sm text-gray-800 truncate">
          {step.title}
        </span>
        {step.linesMovedOut > 0 && (
          <span className="text-[9px] text-red-400 shrink-0">
            ~{step.linesMovedOut} lines
          </span>
        )}
        {badge}
        {open ? (
          <ChevronDown size={13} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
          <div className="text-[10px] text-gray-500 font-mono">
            {step.commit}
          </div>
          {step.sha !== "—" && (
            <div className="text-[10px] text-gray-400">SHA: {step.sha}</div>
          )}
          <div className="space-y-0.5">
            {step.files.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <FileText size={9} className="text-gray-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────

export function StepOneExecutor() {
  const done = STEPS.filter((s) => s.status === "done").length;
  const total = STEPS.length;
  const totalLinesMoved = STEPS.filter((s) => s.status === "done").reduce(
    (a, s) => a + s.linesMovedOut,
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-sm">A</span>
          </div>
          <div>
            <h1 className="text-sm text-gray-900">
              Flashcard Decomposition
            </h1>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <GitBranch size={9} />
              refactor/flashcard-decomposition
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400">
            ~{totalLinesMoved} lines moved
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {done}/{total} steps
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Steps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>

          {/* Step cards */}
          <div className="space-y-2">
            {STEPS.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>

          {/* Next step CTA */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} />
              <span className="text-xs opacity-80 uppercase tracking-wider">
                Refactor Completo + Cleanup
              </span>
            </div>
            <h3 className="text-white text-sm mb-1">
              19 commits — 3 optimizaciones + cleanup de shims
            </h3>
            <p className="text-xs text-emerald-200">
              Opt 1: monolito descompuesto en 19 modulos. Opt 2: tipos
              unificados en src/types/ (8 archivos). Opt 3: useContentData
              elimina ~135 lineas. Cleanup: 5 shims eliminados, 6 imports
              migrados a rutas canonicas. Pendiente (manual): git rm --cached
              node_modules/, rotar credenciales Supabase.
            </p>
          </div>
        </div>

        {/* Right: File tree */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Estado actual del repo
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <FileTree nodes={CURRENT_TREE} />
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                P1 = Paso 1
              </span>
              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                P2 = Paso 2
              </span>
              <span className="text-[9px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                P3 = Paso 3
              </span>
              <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                P4 = Paso 4
              </span>
              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                P5 = Paso 5
              </span>
              <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                sin tag = original
              </span>
            </div>
          </div>

          {/* Commit log */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Commit log
            </h3>
            <div className="space-y-2">
              {STEPS.filter((s) => s.status === "done")
                .reverse()
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-2 text-[10px]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-gray-700 font-mono">{s.sha}</span>
                      <span className="text-gray-400 ml-1.5">{s.commit.split(" — ")[1]}</span>
                    </div>
                  </div>
                ))}
              <div className="flex items-start gap-2 text-[10px] opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1 shrink-0" />
                <span className="text-gray-400">... pasos pendientes</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Impacto acumulado
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xl text-gray-900">19</p>
                <p className="text-[9px] text-gray-400 uppercase">commits</p>
              </div>
              <div className="text-center">
                <p className="text-xl text-gray-900">5</p>
                <p className="text-[9px] text-gray-400 uppercase">shims eliminados</p>
              </div>
              <div className="text-center">
                <p className="text-xl text-gray-900">8</p>
                <p className="text-[9px] text-gray-400 uppercase">tipos canonicos</p>
              </div>
              <div className="text-center">
                <p className="text-xl text-emerald-600">4/4</p>
                <p className="text-[9px] text-gray-400 uppercase">fases completas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}