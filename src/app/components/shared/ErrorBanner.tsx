// ============================================================
// ErrorBanner — Reusable error state for Agent 6 pages
// Added by Agent 6 — PRISM — P4: Motion animation added
// ============================================================
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="bg-red-100 rounded-xl p-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-800" style={{ fontSize: '0.875rem' }}>{message}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0 border-red-200 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}