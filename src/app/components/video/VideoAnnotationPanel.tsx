// ============================================================
// A6-09 | VideoAnnotationPanel.tsx | Agent 6 — PRISM [SACRED]
// Panel de notas com timestamp — VideoNote = dato sagrado
// SACRED: Soft-delete OBLIGATORIO. NUNCA hard delete.
// P3: Refactored to use useVideoNotes hook
// ============================================================
import { useState } from 'react';
import { Clock, Pencil, Trash2, Undo2, Save, StickyNote, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Badge } from '../ui/badge';
import { useVideoNotes } from '../../hooks/use-video-notes';
import { formatTimestamp } from '../../utils/media-helpers';
import { EmptyState } from '../shared/EmptyState'; // Added by Agent 6 — PRISM — P5 consistency

interface VideoAnnotationPanelProps {
  videoId: string;
  currentTimestamp?: number;
  onTimestampClick?: (seconds: number) => void;
}

export function VideoAnnotationPanel({
  videoId,
  currentTimestamp = 0,
  onTimestampClick,
}: VideoAnnotationPanelProps) {
  // P3: Hook layer — SACRED compliance preserved
  const {
    activeNotes,
    deletedNotes,
    isLoading,
    isMutating,
    createNote,
    updateNote,
    softDeleteNote,
    restoreNote,
    exportNotes,
  } = useVideoNotes({ videoId });

  const [newNote, setNewNote] = useState('');
  const [linkTimestamp, setLinkTimestamp] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const handleCreate = async () => {
    if (!newNote.trim()) return;
    await createNote(
      newNote.trim(),
      linkTimestamp ? Math.floor(currentTimestamp) : null
    );
    setNewNote('');
  };

  const handleEdit = (id: string) => {
    const n = activeNotes.find((n) => n.id === id);
    if (n) {
      setEditingId(id);
      setEditText(n.note);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await updateNote(editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
            <StickyNote className="w-5 h-5 text-teal-500" />
            Notas do Video
            <Badge variant="secondary" className="bg-teal-50 text-teal-700">
              {activeNotes.length}
            </Badge>
          </CardTitle>
          {activeNotes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={exportNotes} className="text-gray-500 hover:text-teal-600">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 px-6">
        {activeNotes.length === 0 ? (
          <EmptyState
            variant="notes"
            title="Sem notas ainda"
            description="Comece a tomar notas enquanto assiste ao video"
          />
        ) : (
          <div className="space-y-2 pb-3">
            {activeNotes.map((n) => (
              <div
                key={n.id}
                className="group p-3 rounded-xl border border-gray-100 hover:border-teal-200 transition-colors bg-white"
              >
                {editingId === n.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white">
                        <Save className="w-3 h-3 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {n.timestamp_seconds !== null && (
                          <button
                            onClick={() => onTimestampClick?.(n.timestamp_seconds!)}
                            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 mb-1 transition-colors"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(n.timestamp_seconds)}
                          </button>
                        )}
                        <p className="text-gray-700" style={{ fontSize: '0.875rem' }}>{n.note}</p>
                        <p className="text-gray-400 mt-1" style={{ fontSize: '0.75rem' }}>{n.created_at}</p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(n.id)} className="h-7 w-7 p-0 text-gray-400 hover:text-teal-600">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => softDeleteNote(n.id)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Deleted Notes Section — SACRED: soft-delete with restore */}
        {deletedNotes.length > 0 && (
          <Collapsible open={showDeleted} onOpenChange={setShowDeleted} className="mt-2 mb-3">
            <CollapsibleTrigger className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors w-full" style={{ fontSize: '0.75rem' }}>
              {showDeleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Notas eliminadas ({deletedNotes.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {deletedNotes.map((n) => (
                <div key={n.id} className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between gap-2">
                  <p className="text-gray-400 truncate" style={{ fontSize: '0.875rem' }}>{n.note}</p>
                  <Button variant="ghost" size="sm" onClick={() => restoreNote(n.id)} className="shrink-0 text-teal-600 hover:text-teal-700">
                    <Undo2 className="w-3 h-3 mr-1" /> Restaurar
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </ScrollArea>

      {/* Create Note Form */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Escreva uma nota..."
          rows={2}
          className="mb-2"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="link-ts"
              checked={linkTimestamp}
              onCheckedChange={(v) => setLinkTimestamp(v === true)}
            />
            <label htmlFor="link-ts" className="text-gray-500 cursor-pointer" style={{ fontSize: '0.75rem' }}>
              Vincular ao momento ({formatTimestamp(Math.floor(currentTimestamp))})
            </label>
          </div>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!newNote.trim() || isMutating}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            Salvar
          </Button>
        </div>
      </div>
    </Card>
  );
}