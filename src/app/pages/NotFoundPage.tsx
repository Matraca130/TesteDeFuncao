// ============================================================
// Axon v4.4 — 404 Not Found Page (Dev 5)
// ============================================================
import { useNavigate } from 'react-router';
import { AxonLogo } from '../components/AxonLogo';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center gap-4 p-8">
      <AxonLogo size="lg" />
      <h1 className="text-6xl font-black text-gray-200">404</h1>
      <p className="text-lg text-gray-500">Pagina nao encontrada</p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-teal-600 hover:underline mt-2"
      >
        <ArrowLeft size={14} />
        Voltar ao inicio
      </button>
    </div>
  );
}
