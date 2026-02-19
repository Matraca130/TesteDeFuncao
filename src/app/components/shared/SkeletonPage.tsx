// ============================================================
// SkeletonPage — Refined skeleton loading patterns
// Added by Agent 6 — PRISM — P4 polish
// Variants: editor, grid, detail, dashboard, study
// ============================================================
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';

type Variant = 'editor' | 'grid' | 'detail' | 'dashboard' | 'study' | 'wizard';

interface SkeletonPageProps {
  variant?: Variant;
  className?: string;
}

function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-4 w-80 rounded-md" />
    </div>
  );
}

function SkeletonControls() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Skeleton className="h-10 w-56 rounded-lg" />
      <Skeleton className="h-10 flex-1 min-w-48 rounded-lg" />
      <Skeleton className="h-10 w-36 rounded-full" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-gray-100">
      <Skeleton className="h-4 w-32 rounded-md" />
      <Skeleton className="h-4 flex-1 rounded-md hidden md:block" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <div className="flex gap-1 ml-auto">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
    </div>
  );
}

function SkeletonGridCard() {
  return (
    <Card className="border-gray-200 overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardContent>
    </Card>
  );
}

function SkeletonStatCard() {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-7 w-12 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonStudyItem() {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5 flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-3 w-48 rounded-md" />
        </div>
        <Skeleton className="w-32 h-2 rounded-full hidden sm:block" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </CardContent>
    </Card>
  );
}

export function SkeletonPage({ variant = 'editor', className = '' }: SkeletonPageProps) {
  return (
    <div className={`space-y-6 p-6 max-w-7xl mx-auto animate-pulse ${className}`}>
      {variant === 'editor' && (
        <>
          <SkeletonHeader />
          <SkeletonControls />
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-b border-gray-100 py-2 flex gap-4 px-4">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md hidden md:block" />
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md ml-auto" />
              </div>
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {variant === 'grid' && (
        <>
          <SkeletonHeader />
          <SkeletonControls />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonGridCard key={i} />
            ))}
          </div>
        </>
      )}

      {variant === 'detail' && (
        <>
          <Skeleton className="h-4 w-64 rounded-md" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Card className="border-gray-200">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-7 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-56 rounded-md" />
                </CardContent>
              </Card>
            </div>
            <Card className="border-gray-200 h-[500px]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-36 rounded-md" />
                  <Skeleton className="h-5 w-6 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 space-y-2">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {variant === 'dashboard' && (
        <>
          <SkeletonHeader />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader><Skeleton className="h-6 w-36 rounded-md" /></CardHeader>
              <CardContent><Skeleton className="h-[120px] w-full rounded-lg" /></CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader><Skeleton className="h-6 w-40 rounded-md" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {variant === 'study' && (
        <>
          <SkeletonHeader />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <Skeleton className="h-10 w-56 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonStudyItem key={i} />
            ))}
          </div>
        </>
      )}

      {variant === 'wizard' && (
        <>
          <SkeletonHeader />
          <Card className="border-gray-200">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    {i < 4 && <Skeleton className="h-0.5 flex-1 mx-2 rounded-full" />}
                  </div>
                ))}
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-7 w-48 rounded-md" />
              <Skeleton className="h-4 w-72 rounded-md" />
              <Skeleton className="h-10 w-full max-w-md rounded-lg" />
              <Skeleton className="h-16 w-full max-w-md rounded-xl" />
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </>
      )}
    </div>
  );
}
