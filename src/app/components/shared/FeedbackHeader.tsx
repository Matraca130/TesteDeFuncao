// ============================================================
// FeedbackHeader — Shared header for AI feedback pages
// Shows: Voltar button + AI Live/Mock badge + optional refresh
// ============================================================
import { useNavigate } from 'react-router';
import { ArrowLeft, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface FeedbackHeaderProps {
  isMock: boolean;
  onRefresh?: () => void;
  backTo?: string | number;
}

export function FeedbackHeader({ isMock, onRefresh, backTo = '/' }: FeedbackHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => typeof backTo === 'number' ? navigate(backTo) : navigate(backTo)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>
      <div className="flex items-center gap-2">
        {isMock ? (
          <Badge variant="outline" className="text-orange-500 border-orange-300">
            <WifiOff className="w-3 h-3 mr-1" /> Mock
          </Badge>
        ) : (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <Wifi className="w-3 h-3 mr-1" /> AI Live
          </Badge>
        )}
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
