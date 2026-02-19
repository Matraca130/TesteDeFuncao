// ============================================================
// A6-10 | VideoStudyPage.tsx | Agent 6 — PRISM
// SIGNAL: STUDENT_UI_CONNECTED
// Layout split: video + panel de notas
// P3: Refactored to use useVideos + useSummaries hooks
// ============================================================
import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, Home, BookOpen, ExternalLink } from 'lucide-react';
import { VideoPlayer, type VideoPlayerRef } from '../components/video/VideoPlayer';
import { VideoAnnotationPanel } from '../components/video/VideoAnnotationPanel';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import { useVideos } from '../hooks/use-videos';
import { useSummaries } from '../hooks/use-summaries';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';

export function VideoStudyPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const playerRef = useRef<VideoPlayerRef>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const { getVideoById, isLoading: videosLoading, error: videosError, refetch: refetchVideos } = useVideos();
  const { getSummaryById, isLoading: summariesLoading } = useSummaries();
  const isLoading = videosLoading || summariesLoading;
  const video = videoId ? getVideoById(videoId) : undefined;
  const summary = video ? getSummaryById(video.summary_id) : undefined;
  const handleTimeUpdate = useCallback((seconds: number) => { setCurrentTimestamp(seconds); }, []);
  const handleTimestampClick = useCallback((seconds: number) => { playerRef.current?.seekTo(seconds); }, []);

  if (isLoading) return <SkeletonPage variant="detail" />;
  if (videosError) return <div className="p-6 max-w-7xl mx-auto space-y-6"><ErrorBanner message={videosError} onRetry={refetchVideos} /></div>;
  if (!video) return <div className="p-6 max-w-7xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}><EmptyState variant="videos" title="Video nao encontrado" description="O video que voce procura nao foi encontrado." /></div>;

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/" className="flex items-center gap-1 text-gray-500 hover:text-teal-600"><Home className="w-4 h-4" /></Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator><BreadcrumbItem><BreadcrumbLink asChild><Link to="/study/smart-study" className="text-gray-500 hover:text-teal-600">Estudo</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator><BreadcrumbItem><BreadcrumbPage className="text-gray-900">{video.title}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer ref={playerRef} videoUrl={video.url} onTimeUpdate={handleTimeUpdate} />
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h1 className="text-gray-900 mb-2" style={{ fontFamily: "'Georgia', serif" }}>{video.title}</h1>
              <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>{video.description}</p>
              {summary && (<div className="mt-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-500" /><Link to="/study/smart-study" className="text-teal-600 hover:text-teal-700 flex items-center gap-1" style={{ fontSize: '0.875rem' }}>{summary.title}<ExternalLink className="w-3 h-3" /></Link><Badge variant="secondary" className={summary.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}>{summary.status}</Badge></div>)}
            </div>
          </div>
          <div className="lg:col-span-1" style={{ minHeight: '500px' }}>
            <VideoAnnotationPanel videoId={video.id} currentTimestamp={currentTimestamp} onTimestampClick={handleTimestampClick} />
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}