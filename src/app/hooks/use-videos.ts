// ============================================================
// useVideos — CRUD hook for professor video management
// Added by Agent 6 — PRISM — P3 Hook Layer
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_VIDEOS, type Video } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockUpdate, mockSoftDelete } from '../api-client/mock-api';

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
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchAll(MOCK_VIDEOS);
      setVideos(data);
    } catch {
      setError('Erro ao carregar videos');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setIsMutating(true);
      try {
        const newV: Video = { ...data, id: `vid-${Date.now()}`, deleted_at: null };
        await mockCreate(newV);
        setVideos((prev) => [...prev, newV]);
        toast.success('Video adicionado com sucesso');
      } catch {
        toast.error('Erro ao adicionar video');
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateVideo = useCallback(async (id: string, data: Partial<Video>) => {
    setIsMutating(true);
    try {
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
      await mockUpdate({ id, ...data });
      toast.success('Video atualizado');
    } catch {
      toast.error('Erro ao atualizar video');
      await fetchVideos();
    } finally {
      setIsMutating(false);
    }
  }, [fetchVideos]);

  const deleteVideo = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, deleted_at: new Date().toISOString() } : v))
      );
      await mockSoftDelete(id);
      toast.success('Video eliminado');
    } catch {
      toast.error('Erro ao eliminar video');
      await fetchVideos();
    } finally {
      setIsMutating(false);
    }
  }, [fetchVideos]);

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
