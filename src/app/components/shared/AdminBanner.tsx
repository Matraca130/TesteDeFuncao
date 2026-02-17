import React from 'react';
import { useApp } from '@/app/context/AppContext';
import { useAdmin } from '@/app/context/AdminContext';
import { Shield, ArrowRight, Lock, Wrench, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

// ══════════════════════════════════════════════════════════
// ADMIN BANNER — Componente global reutilizável
// 
// Uso: Colocar em qualquer módulo/view para indicar que
// o conteúdo é gerenciado pelo painel Administrador.
//
// Auth: useAdmin() (AdminContext — nucleo independiente)
// Navegacao: useApp() (AppContext — setActiveView)
// 
// Variantes:
//   'banner'   — faixa completa com descrição e botão
//   'inline'   — linha compacta dentro de um card
//   'floating' — pílula flutuante fixa (corner)
//   'minimal'  — apenas um link discreto
//
// Props:
//   context  — o que é gerenciado ("Resumos", "Quiz", etc.)
//   message  — mensagem custom (override do default)
//   variant  — estilo visual
//   showAction — mostra botão "Ir para Admin"
//
// Exemplo:
//   <AdminBanner context="Resumos" variant="banner" />
//   <AdminBanner context="Quiz" variant="inline" />
//   <AdminBanner variant="floating" />
// ══════════════════════════════════════════════════════════

type BannerVariant = 'banner' | 'inline' | 'floating' | 'minimal';

interface AdminBannerProps {
  /** O que o admin gerencia neste contexto */
  context?: string;
  /** Mensagem custom (override) */
  message?: string;
  /** Estilo visual */
  variant?: BannerVariant;
  /** Mostra botão de ação */
  showAction?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export function AdminBanner({
  context,
  message,
  variant = 'banner',
  showAction = true,
  className,
}: AdminBannerProps) {
  const { setActiveView } = useApp();
  const { isAdmin } = useAdmin();

  const goToAdmin = () => setActiveView('admin');

  const defaultMessage = context
    ? `${context} ${isAdmin ? 'são gerenciados' : 'são gerenciados'} pelo painel Administrador`
    : 'Conteúdo gerenciado pelo painel Administrador';

  const displayMessage = message || defaultMessage;

  // ── BANNER — faixa completa ──
  if (variant === 'banner') {
    return (
      <div className={clsx(
        'rounded-xl border px-5 py-4 flex items-center gap-4 justify-between',
        isAdmin
          ? 'bg-amber-50/80 border-amber-200/60'
          : 'bg-gray-50 border-gray-200/60',
        className,
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx(
            'p-2 rounded-lg shrink-0',
            isAdmin ? 'bg-amber-100' : 'bg-gray-100',
          )}>
            <Shield size={16} className={isAdmin ? 'text-amber-600' : 'text-gray-500'} />
          </div>
          <div className="min-w-0">
            <p className={clsx(
              'text-sm font-medium',
              isAdmin ? 'text-amber-800' : 'text-gray-700',
            )}>
              {displayMessage}
            </p>
            {isAdmin && (
              <p className="text-[11px] text-amber-600/70 mt-0.5">
                Voce esta com sessao admin ativa
              </p>
            )}
          </div>
        </div>

        {showAction && (
          <button
            onClick={goToAdmin}
            className={clsx(
              'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isAdmin
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200',
            )}
          >
            <Shield size={13} />
            {isAdmin ? 'Abrir Admin' : 'Ir para Admin'}
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    );
  }

  // ── INLINE — compacto, para dentro de cards ──
  if (variant === 'inline') {
    return (
      <div className={clsx(
        'flex items-center gap-2 text-xs',
        isAdmin ? 'text-amber-600' : 'text-gray-400',
        className,
      )}>
        <Shield size={11} />
        <span>{displayMessage}</span>
        {showAction && (
          <button
            onClick={goToAdmin}
            className={clsx(
              'ml-1 font-medium underline underline-offset-2 transition-colors',
              isAdmin
                ? 'text-amber-700 hover:text-amber-800'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Abrir Admin
          </button>
        )}
      </div>
    );
  }

  // ── FLOATING — pílula fixa, para posicionar em um corner ──
  if (variant === 'floating') {
    return (
      <button
        onClick={goToAdmin}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-lg',
          isAdmin
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200/50'
            : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:shadow-xl',
          className,
        )}
        title={displayMessage}
      >
        <Shield size={12} />
        Admin
        {isAdmin && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
      </button>
    );
  }

  // ── MINIMAL — link discreto ──
  return (
    <button
      onClick={goToAdmin}
      className={clsx(
        'flex items-center gap-1 text-[11px] font-medium transition-colors',
        isAdmin
          ? 'text-amber-600 hover:text-amber-700'
          : 'text-gray-400 hover:text-gray-600',
        className,
      )}
    >
      <Lock size={10} />
      {context ? `Gerenciado no Admin` : 'Admin'}
    </button>
  );
}


// ══════════════════════════════════════════════════════════
// BACKEND STATUS BADGE — Indicador de status temporário
//
// Uso: Mostra quando um módulo está usando dados locais
// em vez de dados do backend (backend em desenvolvimento).
//
// Exemplo:
//   <BackendStatusBadge
//     module="Estudar"
//     status="local"
//     message="Usando dados locais de preview"
//   />
// ══════════════════════════════════════════════════════════

type BackendStatus = 'live' | 'local' | 'building' | 'error';

interface BackendStatusBadgeProps {
  /** Nome do módulo */
  module?: string;
  /** Status atual */
  status: BackendStatus;
  /** Mensagem custom */
  message?: string;
  /** Classe CSS adicional */
  className?: string;
}

const statusConfig: Record<BackendStatus, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  icon: React.ElementType;
}> = {
  live: {
    label: 'Conectado',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: Shield,
  },
  local: {
    label: 'Dados Locais',
    bg: 'bg-blue-50 border-blue-200/60',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    icon: Wrench,
  },
  building: {
    label: 'Em Desenvolvimento',
    bg: 'bg-amber-50 border-amber-200/60',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    icon: Wrench,
  },
  error: {
    label: 'Erro',
    bg: 'bg-red-50 border-red-200/60',
    text: 'text-red-700',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
};

export function BackendStatusBadge({ module, status, message, className }: BackendStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const defaultMessages: Record<BackendStatus, string> = {
    live: 'Dados sincronizados com o servidor',
    local: 'Usando dados locais de preview',
    building: 'Backend em desenvolvimento',
    error: 'Falha na conexao com o servidor',
  };

  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium',
      config.bg,
      config.text,
      className,
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', config.dot)} />
      <Icon size={11} className="shrink-0" />
      <span>{module ? `${module}: ` : ''}{message || config.label}</span>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// ADMIN REQUIRED WRAPPER — Para módulos futuros
//
// Uso: Envolver conteúdo que requer login admin para editar.
// Mostra o conteúdo normalmente, mas adiciona indicadores.
//
// Exemplo:
//   <AdminRequired context="Quiz" showBanner>
//     <QuizEditor />
//   </AdminRequired>
// ══════════════════════════════════════════════════════════

interface AdminRequiredProps {
  children: React.ReactNode;
  /** O que é gerenciado */
  context: string;
  /** Mostra banner no topo */
  showBanner?: boolean;
  /** Mostra floating pill */
  showFloating?: boolean;
}

export function AdminRequired({ children, context, showBanner = true, showFloating = false }: AdminRequiredProps) {
  return (
    <div className="relative">
      {showBanner && (
        <div className="mb-4">
          <AdminBanner context={context} variant="banner" />
        </div>
      )}
      {children}
      {showFloating && (
        <div className="fixed bottom-4 right-4 z-40">
          <AdminBanner context={context} variant="floating" />
        </div>
      )}
    </div>
  );
}
