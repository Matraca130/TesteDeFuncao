// ============================================================
// A6-08 | VideoPlayer.tsx | Agent 6 — PRISM
// Embed YouTube/Vimeo player con timestamp sync
// ============================================================
import { parseVideoUrl } from '../../utils/media-helpers';
import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Play } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { AspectRatio } from '../ui/aspect-ratio';

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUrl, title, onTimeUpdate, className = '' }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const currentTimeRef = useRef(0);
    const parsed = parseVideoUrl(videoUrl);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (iframeRef.current?.contentWindow) {
          if (parsed.platform === 'youtube') {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
              '*'
            );
          } else if (parsed.platform === 'vimeo') {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ method: 'setCurrentTime', value: seconds }),
              '*'
            );
          }
        }
      },
      getCurrentTime: () => currentTimeRef.current,
    }));

    // Listen for time updates via postMessage
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        try {
          let data = event.data;
          if (typeof data === 'string') data = JSON.parse(data);
          // YouTube
          if (data?.event === 'infoDelivery' && data?.info?.currentTime != null) {
            currentTimeRef.current = data.info.currentTime;
            onTimeUpdate?.(data.info.currentTime);
          }
          // Vimeo
          if (data?.event === 'playProgress' || data?.method === 'playProgress') {
            const seconds = data?.data?.seconds ?? data?.value?.seconds ?? 0;
            currentTimeRef.current = seconds;
            onTimeUpdate?.(seconds);
          }
        } catch {
          // ignore
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onTimeUpdate]);

    const handleLoad = useCallback(() => setIsLoaded(true), []);

    if (!parsed.platform || !parsed.videoId) {
      return (
        <div className={`rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center aspect-video ${className}`}>
          <div className="text-center p-6">
            <Play className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>URL de video invalida</p>
          </div>
        </div>
      );
    }

    const embedUrl =
      parsed.platform === 'youtube'
        ? `https://www.youtube.com/embed/${parsed.videoId}?enablejsapi=1&origin=${window.location.origin}`
        : `https://player.vimeo.com/video/${parsed.videoId}?api=1`;

    return (
      <div className={className}>
        {title && (
          <h2 className="text-gray-900 mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            {title}
          </h2>
        )}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <AspectRatio ratio={16 / 9}>
            {!isLoaded && (
              <Skeleton className="absolute inset-0 rounded-none" />
            )}
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={handleLoad}
              style={{ opacity: isLoaded ? 1 : 0 }}
            />
          </AspectRatio>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';