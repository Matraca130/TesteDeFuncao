// ============================================================
// AiLoadingState — Shared loading state for AI feedback pages
// Shows: Sparkles animation + custom message + Skeleton
// ============================================================
import { Sparkles } from 'lucide-react';
import { FeedbackSkeleton, ProfileSkeleton } from './ErrorBoundary';

interface AiLoadingStateProps {
  message: string;
  variant?: 'feedback' | 'profile';
}

export function AiLoadingState({ message, variant = 'feedback' }: AiLoadingStateProps) {
  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
          <p className="text-indigo-600 font-body">
            {message}
          </p>
        </div>
        {variant === 'profile' ? <ProfileSkeleton /> : <FeedbackSkeleton />}
      </div>
    </div>
  );
}
