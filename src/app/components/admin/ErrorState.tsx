// ============================================================
// Axon v4.4 — ErrorState (Shared Admin Component)
// Agent 5: FORGE
//
// Generic error state with retry button.
// Used by: MemberManagement, PlanManagement, AdminScopesPage
// ============================================================

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface ErrorStateProps {
  /** Title shown above the error message */
  title?: string;
  /** Detailed error message */
  message: string;
  /** Callback for the "Retry" button */
  onRetry: () => void;
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="size-10 text-red-400 mb-3" />
        <p className="text-zinc-700 mb-1">{title}</p>
        <p className="text-sm text-zinc-500 mb-4">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="size-4 mr-1" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
