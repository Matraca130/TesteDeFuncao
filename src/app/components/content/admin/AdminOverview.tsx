import React from 'react';
import { motion } from 'motion/react';
import { headingStyle } from '@/app/design-system';
import type { StudySummary } from '@/app/types/student';
import { courses } from '@/app/data/courses';
import clsx from 'clsx';
import {
  FileText, GraduationCap, Layers, BookOpen,
  TrendingUp, Clock, Shield, Wrench, CheckCircle2,
  ArrowRight, AlertCircle,
} from 'lucide-react';

// ══════════════════════════════════════════════
// ADMIN OVERVIEW — Visao geral do conteudo
// Mostra status de cada modulo gerenciado pelo Admin
// ══════════════════════════════════════════════

type AdminTab = 'overview' | 'resumos' | 'quiz' | 'flashcards' | 'content' | 'settings';

interface AdminOverviewProps {
  summaries: StudySummary[];
  onNavigateTab: (tab: AdminTab) => void;
}

const CARD = 'bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100';

export function AdminOverview({ summaries, onNavigateTab }: AdminOverviewProps) {
  const totalSummaries = summaries.length;
  const bookmarkedCount = summaries.filter(s => s.bookmarked).length;
  const totalEditTime = summaries.reduce((s, r) => s + (r.editTimeMinutes || 0), 0);
  const uniqueCourses = new Set(summaries.map(s => s.courseId)).size;

  // Module status cards
  const modules: {
    id: AdminTab;
    title: string;
    description: string;
    icon: React.ElementType;
    status: 'active' | 'placeholder' | 'planned';
    stats: string;
    color: string;
    iconBg: string;
  }[] = [
    {
      id: 'resumos',
      title: 'Resumos',
      description: 'Criar, editar e gerenciar resumos de estudo com editor canvas avancado',
      icon: FileText,
      status: 'active',
      stats: `${totalSummaries} resumos | ${uniqueCourses} materias`,
      color: 'border-teal-200',
      iconBg: 'bg-teal-50 text-teal-600',
    },
    {
      id: 'quiz',
      title: 'Quiz',
      description: 'Gerenciar banco de questoes e quizzes por topico, com geracao via Gemini AI',
      icon: GraduationCap,
      status: 'placeholder',
      stats: 'Rota /ai/quiz disponivel no backend',
      color: 'border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Gerenciar decks de flashcards e configurar algoritmo de repeticao espacada',
      icon: Layers,
      status: 'placeholder',
      stats: 'Rota /ai/flashcards disponivel no backend',
      color: 'border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'content',
      title: 'Conteudo Didatico',
      description: 'Gerenciar conteudo de estudo, materiais e imagens por secao e topico',
      icon: BookOpen,
      status: 'planned',
      stats: `${courses.length} materias configuradas no courses.ts`,
      color: 'border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600',
    },
  ];

  const statusBadge = (status: 'active' | 'placeholder' | 'planned') => {
    const config = {
      active: { label: 'Ativo', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      placeholder: { label: 'Em Desenvolvimento', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
      planned: { label: 'Planejado', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
    };
    const c = config[status];
    return (
      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border', c.bg, c.text)}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', c.dot, status === 'active' && 'animate-pulse')} />
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome card */}
      <div className={clsx(CARD, 'bg-gradient-to-r from-amber-50 to-white border-amber-200/60')}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1" style={headingStyle}>
              Painel do Administrador
            </h2>
            <p className="text-sm text-gray-500 max-w-lg">
              Gerencie todo o conteudo da plataforma Axon. Cada modulo abaixo indica
              seu status atual — ativo, em desenvolvimento ou planejado.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-100/80 shrink-0">
            <Shield size={24} className="text-amber-600" />
          </div>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickKPI
          icon={<FileText className="w-5 h-5 text-teal-600" />}
          label="Resumos Publicados"
          value={String(totalSummaries)}
          sub={`${uniqueCourses} materias`}
          color="bg-teal-50"
        />
        <QuickKPI
          icon={<Clock className="w-5 h-5 text-teal-600" />}
          label="Tempo de Edicao"
          value={totalEditTime > 60 ? `${Math.floor(totalEditTime / 60)}h ${totalEditTime % 60}m` : `${totalEditTime}m`}
          sub="total acumulado"
          color="bg-teal-50"
        />
        <QuickKPI
          icon={<GraduationCap className="w-5 h-5 text-purple-600" />}
          label="Quizzes"
          value="--"
          sub="em desenvolvimento"
          color="bg-purple-50"
        />
        <QuickKPI
          icon={<Layers className="w-5 h-5 text-amber-600" />}
          label="Flashcards"
          value="--"
          sub="em desenvolvimento"
          color="bg-amber-50"
        />
      </div>

      {/* Module cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4" style={headingStyle}>
          Modulos Gerenciados
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => onNavigateTab(mod.id)}
                  className={clsx(
                    'w-full text-left bg-white rounded-2xl p-5 border-2 transition-all group',
                    'shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md',
                    mod.color,
                    mod.status === 'active' ? 'hover:border-teal-400' : 'hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={clsx('p-2.5 rounded-xl shrink-0', mod.iconBg)}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-gray-900" style={headingStyle}>
                          {mod.title}
                        </h4>
                        {statusBadge(mod.status)}
                      </div>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{mod.description}</p>
                      <p className="text-xs text-gray-400 font-medium">{mod.stats}</p>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Architecture info */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={16} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Arquitetura Admin</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-gray-800">Componentes Admin</p>
            <ul className="space-y-1.5 text-gray-500 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">AdminPanel.tsx</code> — Hub principal com tabs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">AdminBanner.tsx</code> — 4 variantes (banner, inline, floating, minimal)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">AdminLoginGate</code> — Autenticacao (ADMIN_PLACEHOLDER)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">ResumoCanvas.tsx</code> — Editor canvas completo</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-800">Indicadores em Outros Modulos</p>
            <ul className="space-y-1.5 text-gray-500 text-xs">
              <li className="flex items-start gap-2">
                <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">ResumosView.tsx</code> — AdminBanner inline na lista</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">StudyView.tsx</code> — AdminBanner minimal + banner quando admin</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">Sidebar.tsx</code> — Botao Admin + indicador de sessao ativa</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                <span><code className="text-[10px] bg-gray-100 px-1 rounded">AppContext.tsx</code> — isAdmin, adminLogin, adminLogout</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick KPI card ──
function QuickKPI({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-2.5 rounded-xl', color)}>{icon}</div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
