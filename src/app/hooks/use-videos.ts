// ============================================================
// useVideos — CRUD hook for professor video management
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Now uses Agent 4 api-client (api-media module)
// NOTE: Type adapters for duration_ms↔duration_seconds,
//       order_index↔order, description (A6-only field)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Video } from '../data/mock-data';
import {
  getVideos as apiGetVideos,
  createVideo as apiCreateVideo,
  updateVideo as apiUpdateVideo,
  deleteVideo as apiDeleteVideo,
} from '../lib/api-media';
import type { Video as A4Video } from '../lib/types';

// ── Type Adapter: Agent 4 Video → Agent 6 Video ──
// Agent 4: { duration_ms, order_index, thumbnail_url } | Agent 6: { duration_seconds, order, description, deleted_at }

function toA6Video(a4: A4Video): Video {
  return {
    id: a4.id,
    title: a4.title,
    url: a4.url,
    description: '', // A4 Video has no description field
    summary_id: a4.summary_id,
    duration_seconds: a4.duration_ms != null ? Math.round(a4.duration_ms / 1000) : 0,
    order: a4.order_index ?? 0,
    deleted_at: null, // A4 uses hard delete, no deleted_at
  };
}

interface UseVideosOptions {
  summaryId?: string;
}

interface UseVideosReturn {
  videos: Video[];
  filteredVideos: Video[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  getVideoById: (id: string) => Video | undefined;
  createVideo: (data: Omit<Video, 'id' | 'deleted_at'>) => Promise<void>;
  updateVideo: (id: string, data: Partial<Video>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useVideos({ summaryId }: UseVideosOptions = {}): UseVideosReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchVideos = useCallback(async () => {
    if (!summaryId) {
      setVideos([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // REWIRED: Agent 4 api-media
      const a4Videos = await apiGetVideos(summaryId);
      setVideos(a4Videos.map(toA6Video));
    } catch (err) {
      console.error('[useVideos] fetch error:', err);
      setError('Erro ao carregar videos');
    } finally {
      setIsLoading(false);
    }
  }, [summaryId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const filteredVideos = useMemo(
    () =>
      videos
        .filter(
          (v) =>
            v.deleted_at === null &&
            (!summaryId || v.summary_id === summaryId)
        )
        .sort((a, b) => a.order - b.order),
    [videos, summaryId]
  );

  const getVideoById = useCallback(
    (id: string) => videos.find((v) => v.id === id && v.deleted_at === null),
    [videos]
  );

  const createVideo = useCallback(
    async (data: Omit<Video, 'id' | 'deleted_at'>) => {
      if (!data.summary_id) return;
      setIsMutating(true);
      try {
        // REWIRED: Agent 4 api-media — adapt fields
        const a4Video = await apiCreateVideo(data.summary_id, {
          title: data.title,
          url: data.url,
          duration_ms: (data.duration_seconds || 0) * 1000,
          order_index: data.order,
        });
        setVideos((prev) => [...prev, toA6Video(a4Video)]);
        toast.success('Video adicionado com sucesso');
      } catch (err) {
        console.error('[useVideos] create error:', err);
        toast.error('Erro ao adicionar video');
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateVideo = useCallback(async (id: string, data: Partial<Video>) => {
    if (!summaryId) return;
    setIsMutating(true);
    try {
      // Optimistic update
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
      // REWIRED: Agent 4 api-media — adapt fields
      const a4Data: Partial<A4Video> = {};
      if (data.title !== undefined) a4Data.title = data.title;
      if (data.url !== undefined) a4Data.url = data.url;
      if (data.duration_seconds !== undefined) a4Data.duration_ms = data.duration_seconds * 1000;
      if (data.order !== undefined) a4Data.order_index = data.order;
      await apiUpdateVideo(summaryId, id, a4Data);
      toast.success('Video atualizado');
    } catch (err) {
      console.error('[useVideos] update error:', err);
      toast.error('Erro ao atualizar video');
      await fetchVideos(); // rollback
    } finally {
      setIsMutating(false);
    }
  }, [summaryId, fetchVideos]);

  const deleteVideo = useCallback(async (id: string) => {
    if (!summaryId) return;
    setIsMutating(true);
    try {
      // Note: Agent 4 uses hard delete for videos (not SACRED entity)
      setVideos((prev) => prev.filter((v) => v.id !== id));
      // REWIRED: Agent 4 api-media
      await apiDeleteVideo(summaryId, id);
      toast.success('Video eliminado');
    } catch (err) {
      console.error('[useVideos] delete error:', err);
      toast.error('Erro ao eliminar video');
      await fetchVideos();
    } finally {
      setIsMutating(false);
    }
  }, [summaryId, fetchVideos]);

  return {
    videos,
    filteredVideos,
    isLoading,
    error,
    isMutating,
    getVideoById,
    createVideo,
    updateVideo,
    deleteVideo,
    refetch: fetchVideos,
  };
}
