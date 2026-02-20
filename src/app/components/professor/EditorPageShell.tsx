// ============================================================
// EditorPageShell.tsx | Agent 6 — PRISM — P6 DRY
// Shared layout wrapper for professor editor pages.
// Provides: header (title/subtitle/icon), loading skeleton,
// error banner with retry, and children slot.
// Used by: VideoManager, StudyPlansPage, ProfessorKeywordEditor,
//          ProfessorFlashcardEditor, ProfessorQuizEditor
// ============================================================
import { type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface EditorPageShellProps {
  /** Page title — rendered in Georgia serif */
  title: string;
  /** Page subtitle — rendered in Inter */
  subtitle: string;
  /** Optional icon next to the title */
  headerIcon?: ReactNode;
  /** Show loading skeleton */
  isLoading: boolean;
  /** Skeleton variant: 'grid' = card grid, 'study' = row list, 'table' = rows */
  loadingVariant?: 'grid' | 'study' | 'table';
  /** Error message — shows error banner if truthy */
  error: string | null;
  /** Retry callback for error state */
  onRetry?: () => void;
  children: ReactNode;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-lg" />
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-gray-100 p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="w-16 h-6 bg-gray-100 rounded" />
    </div>
  );
}

function LoadingSkeleton({ variant }: { variant: 'grid' | 'study' | 'table' }) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="py-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-red-800" style={{ fontFamily: "'Inter', sans-serif" }}>
              {error}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Tentar novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EditorPageShell({
  title,
  subtitle,
  headerIcon,
  isLoading,
  loadingVariant = 'grid',
  error,
  onRetry,
  children,
}: EditorPageShellProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {headerIcon}
        <div>
          <h1
            className="text-gray-900"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '1.5rem',
              fontWeight: 400,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
          <p
            className="text-gray-500 mt-0.5"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-teal-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
              Carregando...
            </span>
          </div>
          <LoadingSkeleton variant={loadingVariant} />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && <ErrorBanner error={error} onRetry={onRetry} />}

      {/* Content */}
      {!isLoading && !error && children}
    </div>
  );
}
