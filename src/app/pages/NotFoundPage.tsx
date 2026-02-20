// NotFoundPage.tsx — Agent 7 (NEXUS)
// P5/A7-10: Migrated inline fontFamily → font-heading / font-body
import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center gap-4 py-10">
          <p className="text-6xl text-gray-300 font-heading">
            404
          </p>
          <h1 className="text-gray-900 font-heading">
            Pagina nao encontrada
          </h1>
          <p className="text-gray-500 font-body">
            A pagina que voce procura nao existe ou foi movida.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
