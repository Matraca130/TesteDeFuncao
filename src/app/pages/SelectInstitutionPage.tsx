// ============================================================
// Axon v4.4 — Select Institution Page
// ============================================================
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireAuth } from '../components/guards/RequireAuth';
import { AxonLogo } from '../components/AxonLogo';
import { Building2, ChevronRight, LogOut } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = { owner: 'bg-indigo-100 text-indigo-700', admin: 'bg-violet-100 text-violet-700', professor: 'bg-teal-100 text-teal-700', student: 'bg-amber-100 text-amber-700' };
const ROLE_LABELS: Record<string, string> = { owner: 'Owner', admin: 'Admin', professor: 'Professor', student: 'Aluno' };

function SelectInstitutionContent() {
  const { user, memberships, selectInstitution, logout } = useAuth();
  const navigate = useNavigate();
  const handleSelect = (instId: string) => { selectInstitution(instId); navigate('/go'); };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <AxonLogo size="lg" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Ola, {user?.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Selecione uma instituicao</p>
          </div>
        </div>
        <div className="space-y-3">
          {memberships.map((m) => {
            const inst = (m as any).institution;
            const roleBadge = ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-700';
            const roleLabel = ROLE_LABELS[m.role] || m.role;
            return (
              <button key={m.id} onClick={() => handleSelect(m.institution_id)} className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-teal-200">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><Building2 size={22} className="text-gray-500" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{inst?.name || m.institution_id}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${roleBadge}`}>{roleLabel}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-teal-500 flex-shrink-0" />
              </button>
            );
          })}
        </div>
        <button onClick={logout} className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"><LogOut size={14} /> Sair</button>
      </div>
    </div>
  );
}

export function SelectInstitutionPage() {
  return <RequireAuth><SelectInstitutionContent /></RequireAuth>;
}
