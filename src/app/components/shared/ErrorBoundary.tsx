// ErrorBoundary + Skeleton Presets — Agent 7 (NEXUS)
import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';

// ── Error Boundary ──
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Algo deu errado
              </h2>
              <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                {this.state.error?.message || 'Ocorreu um erro inesperado.'}
              </p>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Skeleton Presets ──

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="py-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="py-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent></Card>
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}><CardContent className="py-6 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-2 w-full" />
        </CardContent></Card>
      ))}
    </div>
  );
}

export function FeedbackSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="py-6 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent></Card>
        <Card><CardContent className="py-6 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent></Card>
      </div>
      {[1, 2, 3].map(i => (
        <Card key={i}><CardContent className="py-4">
          <Skeleton className="h-12 w-full" />
        </CardContent></Card>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="py-6 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="py-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </CardContent></Card>
    </div>
  );
}
