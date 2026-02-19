// ============================================================
// Axon v4.4 — Institution Public Page (Dev 5 + Dev 6 fix)
// Public page for /i/:slug — shows institution info + student access
// Dev 6: Fixed response reading (data.data instead of data.institution)
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AxonLogo } from '../components/AxonLogo';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Loader2, GraduationCap, LogIn, UserPlus, Building2 } from 'lucide-react';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-50277a39`;

interface InstitutionData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan?: string;
}

export function InstitutionPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchInstitution = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/institutions/by-slug/${slug}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        // FIX Dev 6: Backend returns { success: true, data: inst }
        const inst = data.data || data.institution;
        setInstitution(inst);
      } catch (err) {
        console.log('[InstitutionPublicPage] Error fetching institution:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitution();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-teal-500" />
          <p className="text-sm text-gray-500">Carregando instituicao...</p>
        </div>
      </div>
    );
  }

  if (notFound || !institution) {
    return (
      <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center gap-4 p-8">
        <Building2 size={48} className="text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900">Instituicao nao encontrada</h1>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Nao encontramos uma instituicao com o identificador "{slug}". Verifique o link fornecido.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-teal-600 hover:underline mt-2"
        >
          Voltar ao inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Institution Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center mb-6">
          <div className="flex flex-col items-center gap-4">
            {institution.logo_url ? (
              <img
                src={institution.logo_url}
                alt={institution.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                <Building2 size={32} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{institution.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Plataforma de estudo medico</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/i/${slug}/login`)}
            className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <LogIn size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Entrar</h3>
              <p className="text-xs text-gray-500">Ja tenho uma conta</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/i/${slug}/signup`)}
            className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <UserPlus size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Criar conta</h3>
              <p className="text-xs text-gray-500">Novo aluno? Cadastre-se aqui</p>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          <AxonLogo size="sm" />
          <span className="text-xs text-gray-400">Powered by Axon</span>
        </div>
      </div>
    </div>
  );
}
