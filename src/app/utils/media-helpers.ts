// ============================================================
// Axon v4.4 — Shared Media Helpers — Agent 6 PRISM
// Extracted to avoid duplication across VideoPlayer, VideoManager,
// VideoAnnotationPanel, and useVideoNotes.
// ============================================================

export function parseVideoUrl(url: string): { platform: 'youtube' | 'vimeo' | null; videoId: string | null } {
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return { platform: 'youtube', videoId: match[1] };
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return { platform: 'vimeo', videoId: match[1] };
  return { platform: null, videoId: null };
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getThumbnailUrl(url: string): string | null {
  const parsed = parseVideoUrl(url);
  if (parsed.platform === 'youtube' && parsed.videoId) {
    return `https://img.youtube.com/vi/${parsed.videoId}/mqdefault.jpg`;
  }
  return null;
}
