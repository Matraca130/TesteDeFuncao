// ============================================================
// Axon v4.4 — No Institution Page (Dev 5)
// Shown when user has no memberships
// ============================================================
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireAuth } from '../components/guards/RequireAuth';
import { AxonLogo } from '../components/AxonLogo';
import { AlertTriangle, LogOut, ArrowLeft } from 'lucide-react';

function NoInstitutionContent() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center gap-4 p-8">
      <AxonLogo size="lg" />

      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
        <AlertTriangle size={20} className="text-white" />
      </div>

      <h1 className="text-xl font-bold text-gray-900">Sem instituicao</h1>

      <p className="text-sm text-gray-500 text-center max-w-md">
        Ola, {user?.name || 'usuario'}. Voce nao esta vinculado a nenhuma instituicao.
        Entre em contato com um administrador para solicitar acesso.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-white rounded-xl border border-gray-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar ao inicio
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
        >
          <LogOut size={14} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

export function NoInstitutionPage() {
  return (
    <RequireAuth>
      <NoInstitutionContent />
    </RequireAuth>
  );
}
