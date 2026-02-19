// ============================================================
// Axon v4.4 — Not Found Page (404)
// ============================================================
import { useNavigate } from 'react-router';
import { AxonLogo } from '../components/AxonLogo';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <AxonLogo size="lg" />
      <h1 className="text-6xl font-black text-gray-200 mt-6">404</h1>
      <h2 className="text-lg font-bold text-gray-900 mt-2">Pagina nao encontrada</h2>
      <p className="text-sm text-gray-500 mt-1">O endereco que voce acessou nao existe.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar ao inicio
      </button>
    </div>
  );
}
