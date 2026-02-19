// ============================================================
// Axon v4.4 — No Institution Page
// ============================================================
import { useAuth } from '../context/AuthContext';
import { RequireAuth } from '../components/guards/RequireAuth';
import { AxonLogo } from '../components/AxonLogo';
import { Building2, LogOut } from 'lucide-react';

function NoInstitutionContent() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-3 mb-6">
          <AxonLogo size="lg" />
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><Building2 size={28} className="text-gray-400" /></div>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Sem Instituicao</h1>
        <p className="text-sm text-gray-500 mt-2">Ola {user?.name}, voce ainda nao pertence a nenhuma instituicao. Peca ao administrador para adiciona-lo ou acesse pelo link da sua instituicao.</p>
        <button onClick={logout} className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><LogOut size={14} /> Sair</button>
      </div>
    </div>
  );
}

export function NoInstitutionPage() {
  return <RequireAuth><NoInstitutionContent /></RequireAuth>;
}
