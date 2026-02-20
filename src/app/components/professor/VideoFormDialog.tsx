// ============================================================
// VideoFormDialog.tsx | Added by Agent 6 — PRISM — P7 DRY (P3)
// Self-contained video create/edit form with live URL preview,
// YouTube/Vimeo detection, and embedded iframe preview.
// ============================================================
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { parseVideoUrl } from '../../utils/media-helpers';
import type { Video } from '../../data/mock-data';

export interface VideoFormData {
  url: string;
  title: string;
  description: string;
  duration_seconds: number;
  order: number;
}

interface VideoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVideo: Video | null;
  isMutating: boolean;
  /** Default order value for new videos */
  defaultOrder: number;
  onSave: (data: VideoFormData) => Promise<void>;
}

export function VideoFormDialog({
  open,
  onOpenChange,
  editingVideo,
  isMutating,
  defaultOrder,
  onSave,
}: VideoFormDialogProps) {
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formOrder, setFormOrder] = useState('');

  // Sync form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (editingVideo) {
      setFormUrl(editingVideo.url);
      setFormTitle(editingVideo.title);
      setFormDescription(editingVideo.description);
      setFormDuration(String(editingVideo.duration_seconds));
      setFormOrder(String(editingVideo.order));
    } else {
      setFormUrl('');
      setFormTitle('');
      setFormDescription('');
      setFormDuration('');
      setFormOrder(String(defaultOrder));
    }
  }, [open, editingVideo, defaultOrder]);

  const previewParsed = parseVideoUrl(formUrl);

  const handleSave = async () => {
    if (!formUrl.trim() || !formTitle.trim()) return;
    await onSave({
      url: formUrl,
      title: formTitle,
      description: formDescription,
      duration_seconds: parseInt(formDuration) || 0,
      order: parseInt(formOrder) || defaultOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Georgia', serif" }}>
            {editingVideo ? 'Editar Video' : 'Novo Video'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-gray-700 mb-1 block">URL do Video *</label>
            <Input
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            {previewParsed.platform && (
              <p className="text-teal-600 mt-1" style={{ fontSize: '0.75rem' }}>
                {previewParsed.platform === 'youtube' ? 'YouTube' : 'Vimeo'} detectado
                (ID: {previewParsed.videoId})
              </p>
            )}
            {formUrl && !previewParsed.platform && (
              <p className="text-amber-600 mt-1" style={{ fontSize: '0.75rem' }}>
                URL nao reconhecida
              </p>
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
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Titulo do video"
            />
          </div>
          <div>
            <label className="text-gray-700 mb-1 block">Descricao</label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descricao..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-700 mb-1 block">Duracao (seg)</label>
              <Input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="Ex: 1200"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-1 block">Ordem</label>
              <Input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isMutating}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            {editingVideo ? 'Salvar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
