// ============================================================
// A6-04 | VideoManager.tsx | Agent 6 — PRISM
// Gestion videos del profesor (YouTube/Vimeo)
// P3: Refactored to use useVideos + useSummaries hooks
// P6: Modularized — EditorPageShell, ConfirmDeleteDialog
// P7: Extracted VideoFormDialog, VideoCard (P3 refactor)
// ============================================================
import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useVideos } from '../hooks/use-videos';
import { useSummaries } from '../hooks/use-summaries';
import { EditorPageShell } from '../components/professor/EditorPageShell';
import { VideoFormDialog } from '../components/professor/VideoFormDialog';
import { VideoCard } from '../components/professor/VideoCard';
import { EmptyState } from '../components/shared/EmptyState';
import type { Video } from '../data/mock-data';
import type { VideoFormData } from '../components/professor/VideoFormDialog';

export function VideoManager() {
  const [selectedSummary, setSelectedSummary] = useState<string>('sum-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // P3: Hook layer
  const { summaries, isLoading: summariesLoading } = useSummaries();
  const {
    filteredVideos: allFiltered,
    isLoading,
    error,
    isMutating,
    createVideo,
    updateVideo,
    deleteVideo,
    refetch,
  } = useVideos({ summaryId: selectedSummary });

  const filteredVideos = useMemo(
    () =>
      allFiltered.filter(
        (v) => searchTerm === '' || v.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allFiltered, searchTerm]
  );

  const openCreate = () => {
    setEditingVideo(null);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: VideoFormData) => {
    if (editingVideo) {
      await updateVideo(editingVideo.id, {
        url: data.url,
        title: data.title,
        description: data.description,
        duration_seconds: data.duration_seconds,
        order: data.order,
      });
    } else {
      await createVideo({
        url: data.url,
        title: data.title,
        description: data.description,
        summary_id: selectedSummary,
        duration_seconds: data.duration_seconds,
        order: data.order,
      });
    }
    setIsDialogOpen(false);
    setEditingVideo(null);
  };

  return (
    <EditorPageShell
      title="Gerenciador de Videos"
      subtitle="Adicione e organize videos por resumo"
      isLoading={isLoading || summariesLoading}
      loadingVariant="grid"
      error={error}
      onRetry={refetch}
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedSummary} onValueChange={setSelectedSummary}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Summary" />
          </SelectTrigger>
          <SelectContent>
            {summaries.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar video..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        <Button onClick={openCreate} className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Video
        </Button>
      </div>

      {/* P7: Extracted VideoFormDialog */}
      <VideoFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingVideo={editingVideo}
        isMutating={isMutating}
        defaultOrder={filteredVideos.length + 1}
        onSave={handleSave}
      />

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-0">
            <EmptyState
              variant="videos"
              title="Nenhum video encontrado"
              description="Adicione o primeiro video para este resumo"
              actionLabel="Agregar Video"
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* P7: Extracted VideoCard */}
          {filteredVideos.map((v, index) => (
            <VideoCard
              key={v.id}
              video={v}
              index={index}
              onEdit={(video) => { setEditingVideo(video); setIsDialogOpen(true); }}
              onDelete={(id) => deleteVideo(id)}
            />
          ))}
        </div>
      )}
    </EditorPageShell>
  );
}
