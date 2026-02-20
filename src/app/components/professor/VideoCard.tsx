// ============================================================
// VideoCard.tsx | Added by Agent 6 — PRISM — P7 DRY (P3)
// Presentational video card with thumbnail, metadata,
// edit/delete actions. Uses media-helpers for thumbnails.
// ============================================================
import { Pencil, Play, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { parseVideoUrl, formatDuration, getThumbnailUrl } from '../../utils/media-helpers';
import { ConfirmDeleteDialog } from '../shared/ConfirmDeleteDialog';
import type { Video } from '../../data/mock-data';

interface VideoCardProps {
  video: Video;
  /** Index for staggered animation delay */
  index: number;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
}

export function VideoCard({ video, index, onEdit, onDelete }: VideoCardProps) {
  const thumb = getThumbnailUrl(video.url);
  const parsed = parseVideoUrl(video.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.08, 0.4),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card className="border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-100 relative group">
          {thumb ? (
            <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
              <Play className="w-10 h-10 text-teal-400" />
            </div>
          )}
          <div
            className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded"
            style={{ fontSize: '0.75rem' }}
          >
            {formatDuration(video.duration_seconds)}
          </div>
          <div className="absolute top-2 left-2">
            <Badge className="bg-white/90 text-gray-700 gap-1">
              <GripVertical className="w-3 h-3" /> #{video.order}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-gray-900 truncate">{video.title}</h3>
              <p
                className="text-gray-500 truncate mt-0.5"
                style={{ fontSize: '0.875rem' }}
              >
                {video.description}
              </p>
              <Badge
                variant="outline"
                className="mt-2 border-teal-200 text-teal-700"
                style={{ fontSize: '0.75rem' }}
              >
                {parsed.platform === 'youtube'
                  ? 'YouTube'
                  : parsed.platform === 'vimeo'
                  ? 'Vimeo'
                  : 'Video'}
              </Badge>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(video)}
                className="text-gray-500 hover:text-teal-600"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <ConfirmDeleteDialog
                title="Eliminar video?"
                description={`O video "${video.title}" sera removido.`}
                onConfirm={() => onDelete(video.id)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
