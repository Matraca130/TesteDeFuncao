import React from 'react';
import { headingStyle } from '@/app/design-system';
import clsx from 'clsx';
import {
  Wrench, CheckCircle2, AlertCircle, ArrowRight,
  Cpu, Server, Code2, Layers,
} from 'lucide-react';

// ══════════════════════════════════════════════
// ADMIN PLACEHOLDER TAB
// Componente reutilizavel para modulos em desenvolvimento.
// Mostra o status atual, o que ja existe no backend,
// e o que falta implementar.
// ══════════════════════════════════════════════

interface BackendRoute {
  method: string;
  path: string;
  description: string;
  status: 'ready' | 'pending';
}

interface FrontendItem {
  file: string;
  description: string;
  status: 'exists' | 'needed';
}

interface AdminPlaceholderTabProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  backendRoutes: BackendRoute[];
  frontendItems: FrontendItem[];
  /** Notas adicionais sobre o modulo */
  notes?: string[];
}

const CARD = 'bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100';

export function AdminPlaceholderTab({
  title, description, icon: Icon, iconColor,
  backendRoutes, frontendItems, notes,
}: AdminPlaceholderTabProps) {
  const readyRoutes = backendRoutes.filter(r => r.status === 'ready').length;
  const existingFrontend = frontendItems.filter(f => f.status === 'exists').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={clsx(CARD, 'border-2 border-dashed border-amber-300 bg-amber-50/30')}>
        <div className="flex items-start gap-4">
          <div className={clsx('p-3 rounded-2xl shrink-0', iconColor)}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900" style={headingStyle}>{title}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 border-amber-200 text-amber-700">
                <Wrench size={10} />
                Em Desenvolvimento
              </span>
            </div>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend status */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Backend (Hono)</h3>
            <span className="text-[10px] text-gray-400 font-medium ml-auto">{readyRoutes}/{backendRoutes.length} rotas</span>
          </div>
          <div className="space-y-2">
            {backendRoutes.map((route, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                <span className={clsx(
                  'shrink-0 mt-0.5',
                  route.status === 'ready' ? 'text-emerald-500' : 'text-gray-300'
                )}>
                  {route.status === 'ready' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      route.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                      route.method === 'POST' ? 'bg-green-100 text-green-700' :
                      route.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {route.method}
                    </span>
                    <code className="text-[10px] text-gray-600 font-mono truncate">{route.path}</code>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{route.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frontend status */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4">
            <Code2 size={16} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Frontend (React)</h3>
            <span className="text-[10px] text-gray-400 font-medium ml-auto">{existingFrontend}/{frontendItems.length} componentes</span>
          </div>
          <div className="space-y-2">
            {frontendItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                <span className={clsx(
                  'shrink-0 mt-0.5',
                  item.status === 'exists' ? 'text-emerald-500' : 'text-gray-300'
                )}>
                  {item.status === 'exists' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-[10px] text-gray-600 font-mono">{item.file}</code>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && notes.length > 0 && (
        <div className={clsx(CARD, 'bg-blue-50/40 border-blue-200/60')}>
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-blue-500" />
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Notas de Implementacao</h3>
          </div>
          <ul className="space-y-2">
            {notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <ArrowRight size={12} className="text-blue-400 mt-1 shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// PRE-CONFIGURED TABS — Quiz, Flashcards, Content
// ══════════════════════════════════════════════

export function AdminQuizTab() {
  return (
    <AdminPlaceholderTab
      title="Gerenciamento de Quiz"
      description="Criar e gerenciar banco de questoes por topico. Inclui geracao automatica via Gemini AI e revisao manual pelo admin."
      icon={Layers}
      iconColor="bg-purple-50 text-purple-600"
      backendRoutes={[
        { method: 'POST', path: '/ai/quiz', description: 'Gerar quiz via Gemini AI (topic, count, difficulty)', status: 'ready' },
        { method: 'GET', path: '/student/:id/quiz-attempts', description: 'Listar tentativas de quiz do aluno', status: 'ready' },
        { method: 'GET', path: '/student/:id/quiz-attempts/:courseId', description: 'Tentativas por materia', status: 'ready' },
        { method: 'PUT', path: '/student/:id/quiz-attempts/:courseId/:topicId', description: 'Salvar tentativa de quiz', status: 'ready' },
        { method: 'GET', path: '/admin/quiz-bank/:courseId', description: 'Listar questoes do banco (admin)', status: 'pending' },
        { method: 'PUT', path: '/admin/quiz-bank/:courseId/:topicId', description: 'Salvar/editar questoes (admin)', status: 'pending' },
      ]}
      frontendItems={[
        { file: 'courses.ts — topic.quizzes[]', description: 'Dados de quiz por topico (estrutura existe)', status: 'exists' },
        { file: 'studentApi.ts — quiz-attempts', description: 'API functions para quiz attempts', status: 'exists' },
        { file: 'types/student.ts — QuizAttempt', description: 'Tipos TypeScript para quiz', status: 'exists' },
        { file: 'AdminQuizEditor.tsx', description: 'Editor visual de questoes no admin', status: 'needed' },
        { file: 'QuizPlayerView.tsx', description: 'View do aluno para responder quiz', status: 'needed' },
      ]}
      notes={[
        'O backend ja tem rota /ai/quiz que gera questoes via Gemini AI — falta interface admin para revisar/editar as questoes geradas',
        'Os botoes de Quiz no floating bar do StudyView precisam ser conectados a esta funcionalidade',
        'Tipo QuizAttempt e QuizAnswer ja existem em types/student.ts',
        'Considerar criar rota admin separada para banco de questoes (quiz-bank) vs tentativas de alunos (quiz-attempts)',
      ]}
    />
  );
}

export function AdminFlashcardsTab() {
  return (
    <AdminPlaceholderTab
      title="Gerenciamento de Flashcards"
      description="Criar e gerenciar decks de flashcards por topico, configurar algoritmo de repeticao espacada (SM2/FSRS) e revisar cards gerados por IA."
      icon={Layers}
      iconColor="bg-amber-50 text-amber-600"
      backendRoutes={[
        { method: 'POST', path: '/ai/flashcards', description: 'Gerar flashcards via Gemini AI (topic, count, context)', status: 'ready' },
        { method: 'POST', path: '/student/:id/reviews', description: 'Salvar reviews de flashcards', status: 'ready' },
        { method: 'GET', path: '/student/:id/reviews', description: 'Listar todas as reviews do aluno', status: 'ready' },
        { method: 'GET', path: '/student/:id/reviews/:courseId', description: 'Reviews por materia', status: 'ready' },
        { method: 'GET', path: '/admin/flashcard-decks/:courseId', description: 'Listar decks do admin', status: 'pending' },
        { method: 'PUT', path: '/admin/flashcard-decks/:courseId/:topicId', description: 'Salvar/editar deck (admin)', status: 'pending' },
      ]}
      frontendItems={[
        { file: 'courses.ts — topic.flashcards[]', description: 'Dados de flashcards por topico (estrutura existe)', status: 'exists' },
        { file: 'studentApi.ts — reviews', description: 'API functions para flashcard reviews', status: 'exists' },
        { file: 'types/student.ts — FlashcardReview', description: 'Tipos TypeScript para flashcards', status: 'exists' },
        { file: 'AdminFlashcardEditor.tsx', description: 'Editor de decks no admin', status: 'needed' },
        { file: 'FlashcardPlayerView.tsx', description: 'View do aluno para estudar flashcards', status: 'needed' },
      ]}
      notes={[
        'O backend ja tem rota /ai/flashcards que gera cards via Gemini AI — falta interface admin para revisar',
        'Os botoes de Flashcard no floating bar do StudyView precisam ser conectados',
        'Tipo FlashcardReview ja existe em types/student.ts com campos de SM2 (ease, interval, repetitions)',
        'O KeywordPopover poderia ser integrado aos flashcards para tracking de dominio por palavra-chave',
      ]}
    />
  );
}

export function AdminContentTab() {
  return (
    <AdminPlaceholderTab
      title="Conteudo Didatico"
      description="Gerenciar a estrutura de cursos, semestres, secoes e topicos. Editar conteudo de estudo, imagens de secao e materiais didaticos."
      icon={Layers}
      iconColor="bg-blue-50 text-blue-600"
      backendRoutes={[
        { method: 'PUT', path: '/content/:courseId/:key', description: 'Salvar conteudo generico', status: 'ready' },
        { method: 'GET', path: '/content/:courseId/:key', description: 'Buscar conteudo por chave', status: 'ready' },
        { method: 'GET', path: '/content/:courseId', description: 'Listar todo conteudo de uma materia', status: 'ready' },
      ]}
      frontendItems={[
        { file: 'data/courses.ts', description: 'Estrutura de cursos/semestres/secoes/topicos (67KB, arquivo grande)', status: 'exists' },
        { file: 'data/studyContent.ts', description: 'Conteudo de estudo por topico (dados locais)', status: 'exists' },
        { file: 'data/sectionImages.ts', description: 'Mapeamento de imagens por secao', status: 'exists' },
        { file: 'data/keywords.ts', description: 'Banco de palavras-chave', status: 'exists' },
        { file: 'studentApi.ts — content', description: 'API functions para conteudo generico', status: 'exists' },
        { file: 'AdminCourseEditor.tsx', description: 'Editor visual de estrutura de cursos', status: 'needed' },
        { file: 'AdminStudyContentEditor.tsx', description: 'Editor de conteudo de estudo', status: 'needed' },
      ]}
      notes={[
        'Atualmente a estrutura de cursos esta hardcoded no courses.ts (67KB) — migrar para backend e necessario',
        'O conteudo de estudo (studyContent.ts) e usado pelo StudyView como fallback quando o backend nao tem dados',
        'As imagens de secao (sectionImages.ts) usam URLs do Unsplash',
        'As rotas /content/:courseId/:key ja existem no backend mas nao sao usadas pelo StudyView ainda',
      ]}
    />
  );
}
