// ============================================================
// KeywordPopover.tsx — Extended by Agent 6 — PRISM
// Contains 3 new sections:
//   A6-05: Tab "Mis Notas" [SACRED]
//   A6-06: Section "Notas do Professor"
//   A6-07: Placeholder Diagnostico BKT
// P3: Refactored StudentNotesSection to use useStudentNotes hook
// ============================================================
import { useState } from 'react';
import {
  StickyNote, GraduationCap, BarChart3, Pencil, Trash2, Undo2,
  Save, X, ChevronDown, ChevronRight, Eye, EyeOff,
  Layers, HelpCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ScrollArea } from '../../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { Separator } from '../../ui/separator';
import { useStudentNotes } from '../../../hooks/use-student-notes';
import { getBktColor } from '../../../design-system/colors';

// ── Mock Professor Notes ──
interface ProfNote {
  id: string;
  keyword_id: string; // Added by Agent 6 — PRISM — P5 fix: filter by keywordId
  professor_name: string;
  note: string;
  created_at: string;
}

const MOCK_PROF_NOTES: ProfNote[] = [
  { id: 'pn-1', keyword_id: 'kw-1', professor_name: 'Dr. Silva', note: 'Esta keyword e essencial para a prova. Focar na cadeia de transporte de eletrons.', created_at: '2026-01-20' },
  { id: 'pn-2', keyword_id: 'kw-1', professor_name: 'Dr. Silva', note: 'Revisar a relacao entre mitocondria e apoptose celular.', created_at: '2026-02-01' },
  { id: 'pn-3', keyword_id: 'kw-2', professor_name: 'Profa. Costa', note: 'Ribossomos livres vs. aderidos ao RER — distinção importante.', created_at: '2026-01-25' },
  { id: 'pn-4', keyword_id: 'kw-3', professor_name: 'Dr. Silva', note: 'Comparar DNA polimerase I, II e III. Focar na III para a prova.', created_at: '2026-02-03' },
  { id: 'pn-5', keyword_id: 'kw-4', professor_name: 'Profa. Costa', note: 'Meiose I vs Meiose II: onde ocorre a reducao cromossômica?', created_at: '2026-02-08' },
  { id: 'pn-6', keyword_id: 'kw-5', professor_name: 'Dr. Silva', note: 'Revisar as fases clara e escura da fotossintese.', created_at: '2026-02-10' },
];

// ── Types ──
interface KeywordPopoverProps {
  keywordId: string;
  term: string;
  definition: string;
  pKnow?: number;
  flashcardCount?: number;
  quizCount?: number;
  quizAccuracy?: number;
  onClose?: () => void;
}

export function KeywordPopover({ keywordId, term, definition, pKnow = 0.45, flashcardCount = 3, quizCount = 2, quizAccuracy = 65, onClose }: KeywordPopoverProps) {
  return (
    <Card className="w-full max-w-md border-gray-200 shadow-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle style={{ fontFamily: "'Georgia', serif" }} className="text-gray-900">{term}</CardTitle>
            <p className="text-gray-500 mt-1" style={{ fontSize: '0.875rem' }}>{definition}</p>
          </div>
          {onClose && (<Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-600 -mt-1 -mr-2"><X className="w-4 h-4" /></Button>)}
        </div>
        <div className="flex gap-3 mt-3">
          <Badge variant="secondary" className="bg-teal-50 text-teal-700 gap-1"><Layers className="w-3 h-3" /> {flashcardCount} flashcards</Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 gap-1"><HelpCircle className="w-3 h-3" /> {quizCount} quiz</Badge>
        </div>
      </CardHeader>
      <Separator />
      <Tabs defaultValue="notas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="notas" className="gap-1"><StickyNote className="w-3 h-3" /> Mis Notas</TabsTrigger>
          <TabsTrigger value="diagnostico" className="gap-1"><BarChart3 className="w-3 h-3" /> Diagnostico</TabsTrigger>
        </TabsList>
        <TabsContent value="notas" className="px-4 pb-2"><StudentNotesSection keywordId={keywordId} /></TabsContent>
        <TabsContent value="diagnostico" className="px-4 pb-2"><DiagnosticoSection pKnow={pKnow} flashcardCount={flashcardCount} quizCount={quizCount} quizAccuracy={quizAccuracy} /></TabsContent>
      </Tabs>
      <Separator />
      <ProfessorNotesSection keywordId={keywordId} />
    </Card>
  );
}

// ============================================================
// A6-05: Tab "Mis Notas" [SACRED — soft-delete only]
// ============================================================
function StudentNotesSection({ keywordId }: { keywordId: string }) {
  const { activeNotes, deletedNotes, isMutating, createNote, updateNote, softDeleteNote, restoreNote } = useStudentNotes({ keywordId });
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const handleCreate = async () => { if (!newNote.trim()) return; await createNote(newNote.trim()); setNewNote(''); };
  const handleEdit = (id: string) => { const n = activeNotes.find((n) => n.id === id); if (n) { setEditingId(id); setEditText(n.note); } };
  const handleSaveEdit = async () => { if (!editingId) return; await updateNote(editingId, editText.trim()); setEditingId(null); };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escreva uma nota..." rows={2} className="flex-1" />
        <Button size="sm" onClick={handleCreate} disabled={!newNote.trim() || isMutating} className="bg-teal-500 hover:bg-teal-600 text-white self-end"><Save className="w-3 h-3" /></Button>
      </div>
      <ScrollArea className="max-h-48">
        {activeNotes.length === 0 ? (
          <div className="text-center py-4"><StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-1" /><p className="text-gray-400" style={{ fontSize: '0.75rem' }}>Ainda nao tens notas para esta keyword</p></div>
        ) : (
          <div className="space-y-2">
            {activeNotes.map((n) => (
              <div key={n.id} className="group p-2 rounded-lg border border-gray-100 hover:border-teal-200 transition-colors">
                {editingId === n.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} autoFocus />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleSaveEdit} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white h-7" style={{ fontSize: '0.75rem' }}>Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7" style={{ fontSize: '0.75rem' }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="text-gray-700 flex-1" style={{ fontSize: '0.875rem' }}>{n.note}</p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleEdit(n.id)} className="p-1 text-gray-400 hover:text-teal-600 rounded"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => softDeleteNote(n.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      {deletedNotes.length > 0 && (
        <Collapsible open={showDeleted} onOpenChange={setShowDeleted}>
          <CollapsibleTrigger className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors" style={{ fontSize: '0.75rem' }}>
            {showDeleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Notas eliminadas ({deletedNotes.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {deletedNotes.map((n) => (
              <div key={n.id} className="flex items-center gap-2 p-1.5 rounded bg-gray-50">
                <p className="text-gray-400 truncate flex-1" style={{ fontSize: '0.75rem' }}>{n.note}</p>
                <button onClick={() => restoreNote(n.id)} className="text-teal-600 hover:text-teal-700 shrink-0" style={{ fontSize: '0.75rem' }}><Undo2 className="w-3 h-3" /></button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ============================================================
// A6-06: Seccion "Notas do Professor"
// ============================================================
function ProfessorNotesSection({ keywordId }: { keywordId: string }) {
  const [visibleNotes, setVisibleNotes] = useState<ProfNote[]>(MOCK_PROF_NOTES.filter(n => n.keyword_id === keywordId));
  const [hiddenNotes, setHiddenNotes] = useState<ProfNote[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  const toggleVisibility = (noteId: string) => {
    const note = visibleNotes.find((n) => n.id === noteId);
    if (note) { setVisibleNotes((prev) => prev.filter((n) => n.id !== noteId)); setHiddenNotes((prev) => [...prev, note]); }
  };
  const restoreVisibility = (noteId: string) => {
    const note = hiddenNotes.find((n) => n.id === noteId);
    if (note) { setHiddenNotes((prev) => prev.filter((n) => n.id !== noteId)); setVisibleNotes((prev) => [...prev, note]); }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4 text-teal-500" /><span className="text-gray-700" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notas do Professor</span></div>
      {visibleNotes.length === 0 ? (
        <p className="text-gray-400 text-center py-3" style={{ fontSize: '0.75rem' }}>Nenhuma nota do professor para esta keyword</p>
      ) : (
        <div className="space-y-2">
          {visibleNotes.map((n) => (
            <div key={n.id} className="group p-2 rounded-lg bg-amber-50/50 border border-amber-100">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-gray-700" style={{ fontSize: '0.875rem' }}>{n.note}</p><p className="text-gray-400 mt-1" style={{ fontSize: '0.625rem' }}>{n.professor_name} — {n.created_at}</p></div>
                <button onClick={() => toggleVisibility(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1" title="Ocultar nota"><EyeOff className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {hiddenNotes.length > 0 && (
        <Collapsible open={showHidden} onOpenChange={setShowHidden} className="mt-2">
          <CollapsibleTrigger className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors" style={{ fontSize: '0.75rem' }}>
            {showHidden ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Notas ocultas ({hiddenNotes.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {hiddenNotes.map((n) => (
              <div key={n.id} className="flex items-center gap-2 p-1.5 rounded bg-gray-50">
                <p className="text-gray-400 truncate flex-1" style={{ fontSize: '0.75rem' }}>{n.note}</p>
                <button onClick={() => restoreVisibility(n.id)} className="text-teal-600 hover:text-teal-700 shrink-0"><Eye className="w-3 h-3" /></button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ============================================================
// A6-07: Placeholder Diagnostico + BKT
// ============================================================
function DiagnosticoSection({ pKnow, flashcardCount, quizCount, quizAccuracy }: { pKnow: number; flashcardCount: number; quizCount: number; quizAccuracy: number }) {
  const bkt = getBktColor(pKnow);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700" style={{ fontSize: '0.875rem' }}>Tu nivel de dominio</span>
          <Badge style={{ backgroundColor: bkt.bg, color: bkt.color, borderColor: bkt.color }}>{bkt.label}</Badge>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pKnow * 100}%`, backgroundColor: bkt.color }} /></div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-400" style={{ fontSize: '0.625rem' }}>0%</span>
          <span style={{ fontSize: '0.75rem', color: bkt.color, fontWeight: 600 }}>{(pKnow * 100).toFixed(0)}%</span>
          <span className="text-gray-400" style={{ fontSize: '0.625rem' }}>100%</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-gray-50"><p className="text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>{flashcardCount}</p><p className="text-gray-400" style={{ fontSize: '0.625rem' }}>Flashcards</p></div>
        <div className="text-center p-2 rounded-lg bg-gray-50"><p className="text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>{quizCount}</p><p className="text-gray-400" style={{ fontSize: '0.625rem' }}>Quiz</p></div>
        <div className="text-center p-2 rounded-lg bg-gray-50"><p className="text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>{quizAccuracy}%</p><p className="text-gray-400" style={{ fontSize: '0.625rem' }}>Acerto</p></div>
      </div>
      <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 text-center">
        <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-1" />
        <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>Diagnostico AI disponivel em breve</p>
        <p className="text-gray-300" style={{ fontSize: '0.625rem' }}>Analise detalhada de pontos fortes e fracos</p>
      </div>
    </div>
  );
}