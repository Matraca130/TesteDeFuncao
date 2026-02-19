// ============================================================
// Axon v4.4 — Landing Page
// ============================================================
import { useNavigate } from 'react-router';
import { AxonLogo } from '../components/AxonLogo';
import { ShieldCheck, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="flex flex-col items-center gap-4 mb-10">
        <AxonLogo size="xl" />
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Axon</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-sm">Plataforma de estudo medico inteligente para instituicoes de ensino</p>
        </div>
      </div>
      <div className="w-full max-w-md space-y-3">
        <button onClick={() => navigate('/admin/login')} className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-indigo-200">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors flex-shrink-0"><ShieldCheck size={22} className="text-indigo-600" /></div>
          <div className="flex-1"><h3 className="text-sm font-semibold text-gray-900">Admin / Owner</h3><p className="text-xs text-gray-500">Gerencie sua instituicao e conteudo</p></div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
        </button>
        <button onClick={() => navigate('/professor/login')} className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group hover:border-teal-200">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors flex-shrink-0"><BookOpen size={22} className="text-teal-600" /></div>
          <div className="flex-1"><h3 className="text-sm font-semibold text-gray-900">Professor</h3><p className="text-xs text-gray-500">Crie e gerencie resumos e conteudo</p></div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
        </button>
      </div>
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 border border-gray-200 rounded-full px-4 py-2">
          <GraduationCap size={14} className="text-amber-500" />
          <p className="text-xs text-gray-500">Alunos: acesse pelo link da sua instituicao <span className="text-gray-400">(/i/slug)</span></p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-10">Axon v4.4 — Plataforma educacional medica</p>
    </div>
  );
}
