// ============================================================
// Axon v4.2 — QuizView: Quiz module integration for AppShell
// ============================================================
// This is the ADAPTER between the platform (AuthContext, AppShell)
// and the standalone quiz components (QuizSession, etc.).
//
// It replaces the placeholder in App.tsx ViewRouter:
//   case 'quiz': return <QuizView key="quiz" />
//
// Key responsibilities:
//   1. Get accessToken from useAuth() (no own auth flow)
//   2. Wrap AuthContext.apiFetch to match QuizSession's interface
//   3. Handle seed + menu + quiz states within the AppShell
//   4. No sidebar/header (already provided by AppShell)
// ============================================================
import { useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { QuizSession } from './QuizSession';

type QuizViewState = 'menu' | 'seeding' | 'quiz';

export function QuizView() {
  const { apiFetch, user } = useAuth();
  const [state, setState] = useState<QuizViewState>('menu');
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState('');

  // ── Wrap AuthContext.apiFetch to match QuizSession's expected interface ──
  // AuthContext.apiFetch:
  //   - Returns unwrapped data (data.data)
  //   - Throws on error
  // QuizSession expects:
  //   - Returns { success: boolean, data: any, error?: { message: string } }
  //   - Does NOT throw
  const quizApiFetch = useCallback(
    async (path: string, opts?: { method?: string; body?: any }) => {
      try {
        const data = await apiFetch(path, {
          method: opts?.method ?? 'GET',
          body: opts?.body ? JSON.stringify(opts.body) : undefined,
        });
        return { success: true, data };
      } catch (err: any) {
        console.error(`[QuizView] API error at ${path}:`, err.message);
        return { success: false, error: { message: err.message } };
      }
    },
    [apiFetch]
  );

  // ── Seed quiz data ──
  const handleSeed = async () => {
    setState('seeding');
    setError('');
    try {
      const res = await quizApiFetch('/seed/quiz', { method: 'POST' });
      if (!res.success) throw new Error(res.error?.message || 'Seed failed');
      setSeeded(true);
      setState('menu');
    } catch (e: any) {
      setError(e.message);
      setState('menu');
    }
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className="h-full overflow-y-auto bg-[#f5f2ea] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Seeding state ── */}
        {state === 'seeding' && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">Criando perguntas de demonstracao...</p>
          </div>
        )}

        {/* ── Menu state ── */}
        {state === 'menu' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Quiz — Manguito Rotador</h2>
              {user && (
                <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
              )}
            </div>

            {/* Seed card */}
            <button onClick={handleSeed} disabled={seeded} className="w-full text-left">
              <div className={`p-4 rounded-lg border transition-colors ${
                seeded
                  ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20'
                  : 'bg-white border-gray-200 hover:border-amber-400 cursor-pointer dark:bg-gray-900'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-lg flex items-center justify-center ${seeded ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <span className="text-lg">{seeded ? '\u2705' : '\uD83D\uDDC3\uFE0F'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">{seeded ? 'Dados ja semeados' : 'Semear dados de demonstracao'}</p>
                    <p className="text-xs text-gray-500">4 perguntas: MCQ, V/F, Preencher, Aberta</p>
                  </div>
                  {seeded && <span className="text-xs font-medium text-green-600 px-2 py-0.5 rounded bg-green-100">Pronto</span>}
                </div>
              </div>
            </button>

            {/* Start quiz card */}
            <button onClick={() => setState('quiz')} disabled={!seeded} className="w-full text-left">
              <div className={`p-4 rounded-lg border transition-colors ${
                !seeded
                  ? 'bg-gray-50 border-gray-100 opacity-40'
                  : 'bg-white border-gray-200 hover:border-amber-400 cursor-pointer dark:bg-gray-900'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <span className="text-lg">\u25B6\uFE0F</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">Iniciar Quiz</p>
                    <p className="text-xs text-gray-500">Sessao completa com avaliacao BKT</p>
                  </div>
                  <span className="text-gray-400">\u203A</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Quiz state ── */}
        {state === 'quiz' && (
          <div>
            <button
              onClick={() => setState('menu')}
              className="text-xs text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-1"
            >
              &larr; Voltar ao menu
            </button>
            <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
              <QuizSession
                keywordId="kw-manguito-rotador"
                apiFetchFn={quizApiFetch}
                onSessionEnd={(summary) => {
                  console.log('[QuizView] Session ended:', summary);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
