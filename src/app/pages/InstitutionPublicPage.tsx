// ============================================================
// Axon v4.4 — Institution Public Page (/i/:slug)
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AxonLogo } from '../components/AxonLogo';
import { apiBaseUrl, supabaseAnonKey } from '../lib/config';
import type { Institution, InstitutionBySlugResponse } from '../../types/auth';
import { Loader2, GraduationCap, LogIn, UserPlus } from 'lucide-react';

export function InstitutionPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/institutions/by-slug/${slug}`, { headers: { Authorization: `Bearer ${supabaseAnonKey}` } });
        const result: InstitutionBySlugResponse = await res.json();
        if (result.success && result.data) setInstitution(result.data);
        else setError('Instituicao nao encontrada');
      } catch (err) { setError('Erro ao carregar instituicao'); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]"><Loader2 size={24} className="animate-spin text-teal-500" /></div>;
  if (error || !institution) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2ea] p-4">
      <AxonLogo size="lg" />
      <h2 className="text-lg font-bold text-gray-900 mt-4">Instituicao nao encontrada</h2>
      <p className="text-sm text-gray-500 mt-1">{error}</p>
      <button onClick={() => navigate('/')} className="mt-4 text-sm text-teal-600 hover:underline">Voltar ao inicio</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          {institution.logo_url ? <img src={institution.logo_url} alt={institution.name} className="w-16 h-16 rounded-2xl object-cover" /> : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center"><GraduationCap size={28} className="text-white" /></div>}
          <div className="text-center"><h1 className="text-2xl font-bold text-gray-900">{institution.name}</h1><p className="text-sm text-gray-500 mt-1">Plataforma de estudo via Axon</p></div>
        </div>
        <div className="space-y-3">
          <button onClick={() => navigate(`/i/${slug}/login`)} className="w-full bg-teal-600 text-white rounded-2xl p-4 font-semibold text-sm hover:bg-teal-700 flex items-center justify-center gap-2"><LogIn size={18} /> Entrar</button>
          <button onClick={() => navigate(`/i/${slug}/signup`)} className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 font-semibold text-sm hover:bg-gray-50 flex items-center justify-center gap-2"><UserPlus size={18} /> Criar Conta</button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-8">Powered by Axon v4.4</p>
      </div>
    </div>
  );
}
