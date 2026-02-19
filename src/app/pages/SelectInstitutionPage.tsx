// ============================================================
// Axon v4.4 — Select Institution Page (Dev 5)
// Shown when user has multiple memberships
// ============================================================
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireAuth } from '../components/guards/RequireAuth';
import { AxonLogo } from '../components/AxonLogo';
import {
  Building2,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import type { MembershipRole } from '../types/auth';

const roleConfig: Record<MembershipRole, { label: string; icon: typeof ShieldCheck; color: string }> = {
  owner: { label: 'Owner', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50' },
  professor: { label: 'Professor', icon: BookOpen, color: 'text-teal-600 bg-teal-50' },
  student: { label: 'Aluno', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
};

function SelectInstitutionContent() {
  const { memberships, selectInstitution, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (instId: string) => {
    selectInstitution(instId);
    // After selecting, navigate to the post-login router to redirect by role
    navigate('/go');
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <AxonLogo size="lg" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Selecionar instituicao</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ola, {user?.name || 'usuario'}! Escolha onde deseja entrar.
            </p>
          </div>
        </div>

        {/* Institution list */}
        <div className="space-y-3">
          {memberships.map((membership) => {
            const config = roleConfig[membership.role] || roleConfig.student;
            const RoleIcon = config.icon;
            const instName = membership.institution?.name || 'Instituicao';
            const instSlug = membership.institution?.slug || '';

            return (
              <button
                key={membership.id}
                onClick={() => handleSelect(membership.institution_id)}
                className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-teal-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{instName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${config.color}`}
                    >
                      <RoleIcon size={10} />
                      {config.label}
                    </span>
                    {instSlug && (
                      <span className="text-xs text-gray-400">/{instSlug}</span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0"
                />
              </button>
            );
          })}
        </div>

        {memberships.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma instituicao encontrada.</p>
          </div>
        )}

        {/* Logout */}
        <div className="mt-8 text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

export function SelectInstitutionPage() {
  return (
    <RequireAuth>
      <SelectInstitutionContent />
    </RequireAuth>
  );
}
