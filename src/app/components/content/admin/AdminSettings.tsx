import React from 'react';
import { useAdmin } from '@/app/context/AdminContext';
import { headingStyle } from '@/app/design-system';
import clsx from 'clsx';
import {
  Shield, Key, Users, Database,
  Server, AlertTriangle, CheckCircle2,
  ExternalLink,
} from 'lucide-react';

// ══════════════════════════════════════════════
// ADMIN SETTINGS TAB
// Configuracoes de sessao admin, status de conexoes,
// e informacoes sobre o ambiente.
//
// Auth: useAdmin() (AdminContext — nucleo independiente)
// ══════════════════════════════════════════════

const CARD = 'bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100';

export function AdminSettings() {
  const { isAdmin, adminLogout, sessionStartedAt, sessionDurationMinutes } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Session info */}
      <div className={clsx(CARD, 'border-amber-200/60')}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 shrink-0">
              <Shield size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1" style={headingStyle}>Sessao Admin</h2>
              <p className="text-sm text-gray-500 mb-3">
                {isAdmin ? 'Sessao ativa — voce tem acesso total ao painel de gerenciamento.' : 'Sessao inativa.'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
                  isAdmin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                )}>
                  <span className={clsx('w-2 h-2 rounded-full', isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400')} />
                  {isAdmin ? 'Autenticado' : 'Nao autenticado'}
                </span>
                {isAdmin && sessionStartedAt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Sessao: {sessionDurationMinutes < 1 ? '< 1 min' : `${sessionDurationMinutes} min`}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={adminLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors border border-red-200"
            >
              Encerrar Sessao
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auth info */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Autenticacao</h3>
          </div>
          <div className="space-y-3">
            <InfoRow
              label="Metodo atual"
              value="Senha hardcoded (ADMIN_PLACEHOLDER)"
              status="warning"
            />
            <InfoRow
              label="Contexto"
              value="AdminContext.tsx (nucleo independiente)"
              status="ok"
            />
            <InfoRow
              label="Destino"
              value="Migrar para Supabase Auth com roles"
              status="info"
            />
            <InfoRow
              label="Marcador no codigo"
              value='Buscar "ADMIN_PLACEHOLDER" no projeto'
              status="info"
            />
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
            <p className="text-[11px] text-amber-700 flex items-start gap-2">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>
                A autenticacao atual usa senha hardcoded ("admin123") em AdminContext.tsx.
                Em producao, deve ser migrada para Supabase Auth com roles de admin.
                Busque "ADMIN_PLACEHOLDER" no codigo para encontrar todos os pontos
                que precisam ser atualizados. Apenas AdminContext.tsx precisa mudar —
                todos os consumidores (useAdmin) continuam funcionando.
              </span>
            </p>
          </div>
        </div>

        {/* Backend connections */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Conexoes</h3>
          </div>
          <div className="space-y-3">
            <InfoRow
              label="Supabase Edge Function"
              value="Hono server com ~35 rotas"
              status="ok"
            />
            <InfoRow
              label="Banco de Dados"
              value="KV Store (kv_store_3d98c276)"
              status="ok"
            />
            <InfoRow
              label="Gemini AI"
              value="Chat, Flashcards, Quiz, Explain"
              status="ok"
            />
            <InfoRow
              label="Storage"
              value="Nao configurado ainda"
              status="warning"
            />
          </div>
        </div>
      </div>

      {/* Files reference */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Arquivos Admin Relacionados</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { file: 'AdminContext.tsx', desc: 'Nucleo independiente: isAdmin, adminLogin, adminLogout, session metadata', tag: 'context' },
            { file: 'AppContext.tsx', desc: 'Navegacao e estado do aluno (sem admin auth)', tag: 'context' },
            { file: 'AdminPanel.tsx', desc: 'Hub principal com navegacao por tabs', tag: 'view' },
            { file: 'admin/AdminOverview.tsx', desc: 'Dashboard de visao geral do admin', tag: 'tab' },
            { file: 'admin/AdminResumos.tsx', desc: 'CRUD de resumos (lista + acoes)', tag: 'tab' },
            { file: 'admin/AdminPlaceholderTab.tsx', desc: 'Template para modulos em desenvolvimento', tag: 'tab' },
            { file: 'admin/AdminSettings.tsx', desc: 'Configuracoes e status (este arquivo)', tag: 'tab' },
            { file: 'AdminBanner.tsx', desc: '4 variantes: banner, inline, floating, minimal', tag: 'shared' },
            { file: 'ResumoCanvas.tsx', desc: 'Editor canvas completo (usado pelo admin)', tag: 'editor' },
            { file: 'canvas/*.tsx', desc: '13 sub-modulos do editor canvas', tag: 'editor' },
            { file: 'Sidebar.tsx', desc: 'Botao Admin + indicador sessao ativa', tag: 'nav' },
          ].map(item => (
            <div key={item.file} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className={clsx(
                'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5',
                item.tag === 'context' ? 'bg-purple-100 text-purple-700' :
                item.tag === 'view' ? 'bg-teal-100 text-teal-700' :
                item.tag === 'tab' ? 'bg-blue-100 text-blue-700' :
                item.tag === 'shared' ? 'bg-amber-100 text-amber-700' :
                item.tag === 'editor' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {item.tag}
              </span>
              <div className="min-w-0">
                <code className="text-[10px] text-gray-700 font-mono font-semibold">{item.file}</code>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Info row helper ──
function InfoRow({ label, value, status }: {
  label: string; value: string; status: 'ok' | 'warning' | 'info';
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
      <span className={clsx('shrink-0',
        status === 'ok' ? 'text-emerald-500' :
        status === 'warning' ? 'text-amber-500' :
        'text-blue-400'
      )}>
        {status === 'ok' ? <CheckCircle2 size={14} /> :
         status === 'warning' ? <AlertTriangle size={14} /> :
         <ExternalLink size={14} />}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <p className="text-[11px] text-gray-400">{value}</p>
      </div>
    </div>
  );
}
