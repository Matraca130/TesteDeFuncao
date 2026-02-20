// ============================================================
// Axon v4.4 — Landing Page
// Public landing page with role-based entry points
// UPDATED: Owner and Admin are now SEPARATE entries
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AxonLogo } from '../components/AxonLogo';
import {
  Crown,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';
import { apiBaseUrl, supabaseAnonKey, environment } from '../lib/config';

export function LandingPage() {
  const navigate = useNavigate();
  const [studentOpen, setStudentOpen] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleStudentGo = async () => {
    const slug = slugInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/institutions/by-slug/${slug}`, {
        headers: { Authorization: `Bearer ${supabaseAnonKey}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        navigate(`/i/${slug}`);
      } else {
        setSearchError('Instituicao nao encontrada. Verifique o codigo.');
      }
    } catch {
      navigate(`/i/${slug}`);
    } finally {
      setSearching(false);
    }
  };

  const handleStudentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStudentGo();
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Logo + Heading */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <AxonLogo size="xl" />
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Axon</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-sm">
            Plataforma de estudo medico inteligente para instituicoes de ensino
          </p>
        </div>
      </div>

      {/* Role Entry Cards */}
      <div className="w-full max-w-md space-y-3">

        {/* 1. DUEÑO (Owner) */}
        <button
          onClick={() => navigate('/admin/login')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-violet-200"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors flex-shrink-0">
            <Crown size={22} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Dueno</h3>
            <p className="text-xs text-gray-500">Crear y gestionar tus instituciones</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
        </button>

        {/* 2. ADMINISTRADOR */}
        <button
          onClick={() => navigate('/admin/login')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-indigo-200"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors flex-shrink-0">
            <ShieldCheck size={22} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Administrador</h3>
            <p className="text-xs text-gray-500">Administrar una institucion asignada</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
        </button>

        {/* 3. PROFESSOR */}
        <button
          onClick={() => navigate('/professor/login')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-teal-200"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors flex-shrink-0">
            <BookOpen size={22} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Professor</h3>
            <p className="text-xs text-gray-500">Entrar ou criar conta de professor</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
        </button>

        {/* 4. ALUNO (expandable) */}
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
          <button
            onClick={() => setStudentOpen(!studentOpen)}
            className="w-full p-5 flex items-center gap-4 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
              <GraduationCap size={22} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Aluno</h3>
              <p className="text-xs text-gray-500">Entrar com o codigo da sua instituicao</p>
            </div>
            <ArrowRight
              size={16}
              className={`text-gray-300 group-hover:text-amber-500 transition-all flex-shrink-0 ${studentOpen ? 'rotate-90' : ''}`}
            />
          </button>
          {studentOpen && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                Digite o codigo (slug) da sua instituicao. Ele foi fornecido pelo seu professor ou admin.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => { setSlugInput(e.target.value); setSearchError(null); }}
                    onKeyDown={handleStudentKeyDown}
                    placeholder="ex: faculdade-abc"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleStudentGo}
                  disabled={!slugInput.trim() || searching}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : 'Ir'}
                </button>
              </div>
              {searchError && <p className="text-xs text-red-500">{searchError}</p>}
              <p className="text-[10px] text-gray-400">
                Exemplo: se o link da sua instituicao e axon.com/i/<strong>faculdade-abc</strong>, digite{' '}
                <strong>faculdade-abc</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-10">Axon v4.4 | {environment}</p>
    </div>
  );
}
