// ============================================================
// A6-04 | VideoManager.tsx | Agent 6 — PRISM
// Gestion videos del profesor (YouTube/Vimeo)
// P3: Refactored to use useVideos + useSummaries hooks
// ============================================================
import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Play, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { useVideos } from '../hooks/use-videos';
import { useSummaries } from '../hooks/use-summaries';
import { parseVideoUrl, formatDuration, getThumbnailUrl } from '../utils/media-helpers';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';
import type { Video } from '../data/mock-data';

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

  // Form state
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formOrder, setFormOrder] = useState('');

  const filteredVideos = useMemo(
    () =>
      allFiltered.filter(
        (v) => searchTerm === '' || v.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allFiltered, searchTerm]
  );

  const resetForm = () => {
    setFormUrl('');
    setFormTitle('');
    setFormDescription('');
    setFormDuration('');
    setFormOrder('');
    setEditingVideo(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOrder(String(filteredVideos.length + 1));
    setIsDialogOpen(true);
  };

  const openEdit = (v: Video) => {
    setEditingVideo(v);
    setFormUrl(v.url);
    setFormTitle(v.title);
    setFormDescription(v.description);
    setFormDuration(String(v.duration_seconds));
    setFormOrder(String(v.order));
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formUrl.trim() || !formTitle.trim()) return;

    if (editingVideo) {
      await updateVideo(editingVideo.id, {
        url: formUrl,
        title: formTitle,
        description: formDescription,
        duration_seconds: parseInt(formDuration) || 0,
        order: parseInt(formOrder) || 1,
      });
    } else {
      await createVideo({
        url: formUrl,
        title: formTitle,
        description: formDescription,
        summary_id: selectedSummary,
        duration_seconds: parseInt(formDuration) || 0,
        order: parseInt(formOrder) || filteredVideos.length + 1,
      });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteVideo(id);
  };

  const previewParsed = parseVideoUrl(formUrl);

  if (isLoading || summariesLoading) {
    return <SkeletonPage variant="grid" />;
  }

  if (error) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6 p-6 max-w-7xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontFamily: "'Georgia', serif" }} className="text-gray-900 tracking-tight">
          Gerenciador de Videos
        </h1>
        <p className="text-gray-500 mt-1">Adicione e organize videos por resumo</p>
      </div>

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-teal-500 hover:bg-teal-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Video
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Georgia', serif" }}>
                {editingVideo ? 'Editar Video' : 'Novo Video'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-gray-700 mb-1 block">URL do Video *</label>
                <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                {previewParsed.platform && (
                  <p className="text-teal-600 mt-1" style={{ fontSize: '0.75rem' }}>
                    {previewParsed.platform === 'youtube' ? 'YouTube' : 'Vimeo'} detectado (ID: {previewParsed.videoId})
                  </p>
                )}
                {formUrl && !previewParsed.platform && (
                  <p className="text-amber-600 mt-1" style={{ fontSize: '0.75rem' }}>URL nao reconhecida</p>
                )}
              </div>

              {previewParsed.platform && previewParsed.videoId && (
                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={
                      previewParsed.platform === 'youtube'
                        ? `https://www.youtube.com/embed/${previewParsed.videoId}`
                        : `https://player.vimeo.com/video/${previewParsed.videoId}`
                    }
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div>
                <label className="text-gray-700 mb-1 block">Titulo *</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Titulo do video" />
              </div>
              <div>
                <label className="text-gray-700 mb-1 block">Descricao</label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descricao..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 mb-1 block">Duracao (seg)</label>
                  <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="Ex: 1200" />
                </div>
                <div>
                  <label className="text-gray-700 mb-1 block">Ordem</label>
                  <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} placeholder="1" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white">
                {editingVideo ? 'Salvar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
          {filteredVideos.map((v, index) => {
            const thumb = getThumbnailUrl(v.url);
            const parsed = parseVideoUrl(v.url);
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.08, 0.4),
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
              <Card className="border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 relative group">
                  {thumb ? (
                    <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                      <Play className="w-10 h-10 text-teal-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded" style={{ fontSize: '0.75rem' }}>
                    {formatDuration(v.duration_seconds)}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-white/90 text-gray-700 gap-1">
                      <GripVertical className="w-3 h-3" /> #{v.order}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-gray-900 truncate">{v.title}</h3>
                      <p className="text-gray-500 truncate mt-0.5" style={{ fontSize: '0.875rem' }}>{v.description}</p>
                      <Badge variant="outline" className="mt-2 border-teal-200 text-teal-700" style={{ fontSize: '0.75rem' }}>
                        {parsed.platform === 'youtube' ? 'YouTube' : parsed.platform === 'vimeo' ? 'Vimeo' : 'Video'}
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(v)} className="text-gray-500 hover:text-teal-600">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar video?</AlertDialogTitle>
                            <AlertDialogDescription>O video "{v.title}" sera removido.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(v.id)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
    </PageTransition>
  );
}