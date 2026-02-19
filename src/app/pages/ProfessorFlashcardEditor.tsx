// A6-02 | ProfessorFlashcardEditor.tsx | Agent 6 — PRISM
import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useFlashcards } from '../hooks/use-flashcards';
import { useSummaries } from '../hooks/use-summaries';
import { useKeywords } from '../hooks/use-keywords';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';
import type { Flashcard } from '../data/mock-data';

export function ProfessorFlashcardEditor() {
  const [selectedSummary, setSelectedSummary] = useState<string>('sum-1');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const { summaries, isLoading: summariesLoading } = useSummaries();
  const { filteredKeywords: summaryKeywords } = useKeywords({ summaryId: selectedSummary });
  const { filteredFlashcards: allFiltered, isLoading, error, isMutating, createFlashcard, updateFlashcard, deleteFlashcard, refetch } = useFlashcards({ summaryId: selectedSummary, keywordId: selectedKeyword });
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');
  const [formKeywordId, setFormKeywordId] = useState('');
  const filteredCards = useMemo(() => allFiltered.filter((fc) => searchTerm === '' || fc.front.toLowerCase().includes(searchTerm.toLowerCase())), [allFiltered, searchTerm]);
  const resetForm = () => { setFormFront(''); setFormBack(''); setFormKeywordId(''); setEditingCard(null); };
  const openCreate = () => { resetForm(); setIsDialogOpen(true); };
  const openEdit = (fc: Flashcard) => { setEditingCard(fc); setFormFront(fc.front); setFormBack(fc.back); setFormKeywordId(fc.keyword_id); setIsDialogOpen(true); };
  const handleSave = async () => { if (!formFront.trim() || !formBack.trim()) return; if (editingCard) { await updateFlashcard(editingCard.id, { front: formFront, back: formBack, keyword_id: formKeywordId || editingCard.keyword_id }); } else { await createFlashcard({ front: formFront, back: formBack, keyword_id: formKeywordId || summaryKeywords[0]?.id || '', summary_id: selectedSummary, status: 'draft' }); } setIsDialogOpen(false); resetForm(); };
  const getKeywordTerm = (kid: string) => summaryKeywords.find((k) => k.id === kid)?.term || 'N/A';
  if (isLoading || summariesLoading) return <SkeletonPage variant="editor" />;
  if (error) return <div className="space-y-6 p-6 max-w-7xl mx-auto"><ErrorBanner message={error} onRetry={refetch} /></div>;

  return (
    <PageTransition>
    <div className="space-y-6 p-6 max-w-7xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div><h1 style={{ fontFamily: "'Georgia', serif" }} className="text-gray-900 tracking-tight">Editor de Flashcards</h1><p className="text-gray-500 mt-1">Crie e gerencie flashcards por keyword</p></div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedSummary} onValueChange={(v) => { setSelectedSummary(v); setSelectedKeyword('all'); }}><SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Summary" /></SelectTrigger><SelectContent>{summaries.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}</SelectContent></Select>
        <Select value={selectedKeyword} onValueChange={setSelectedKeyword}><SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Keyword" /></SelectTrigger><SelectContent><SelectItem value="all">Todas Keywords</SelectItem>{summaryKeywords.map((kw) => (<SelectItem key={kw.id} value={kw.id}>{kw.term}</SelectItem>))}</SelectContent></Select>
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button onClick={openCreate} className="bg-teal-500 hover:bg-teal-600 text-white"><Plus className="w-4 h-4 mr-2" />Criar Flashcard</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle style={{ fontFamily: "'Georgia', serif" }}>{editingCard ? 'Editar Flashcard' : 'Nova Flashcard'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><label className="text-gray-700 mb-1 block">Keyword</label><Select value={formKeywordId} onValueChange={setFormKeywordId}><SelectTrigger><SelectValue placeholder="Selecionar keyword" /></SelectTrigger><SelectContent>{summaryKeywords.map((kw) => (<SelectItem key={kw.id} value={kw.id}>{kw.term}</SelectItem>))}</SelectContent></Select></div>
              <div><label className="text-gray-700 mb-1 block">Frente (pergunta) *</label><Textarea value={formFront} onChange={(e) => setFormFront(e.target.value)} placeholder="Pergunta..." rows={3} /></div>
              <div><label className="text-gray-700 mb-1 block">Verso (resposta) *</label><Textarea value={formBack} onChange={(e) => setFormBack(e.target.value)} placeholder="Resposta..." rows={3} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white">{editingCard ? 'Salvar' : 'Criar'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={!!previewCard} onOpenChange={() => { setPreviewCard(null); setPreviewFlipped(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: "'Georgia', serif" }}>Preview</DialogTitle></DialogHeader>
          {previewCard && (<div className="min-h-[200px] flex items-center justify-center p-6 rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white cursor-pointer select-none" onClick={() => setPreviewFlipped(!previewFlipped)}><div className="text-center"><p className="text-gray-400 mb-2" style={{ fontSize: '0.75rem' }}>{previewFlipped ? 'RESPOSTA' : 'PERGUNTA'}</p><p className="text-gray-800">{previewFlipped ? previewCard.back : previewCard.front}</p><p className="text-gray-400 mt-4 flex items-center justify-center gap-1" style={{ fontSize: '0.75rem' }}><RotateCcw className="w-3 h-3" /> Clique para virar</p></div></div>)}
        </DialogContent>
      </Dialog>
      <Card className="border-gray-200">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>Flashcards<Badge variant="secondary" className="bg-teal-50 text-teal-700">{filteredCards.length}</Badge></CardTitle></CardHeader>
        <CardContent>
          {filteredCards.length === 0 ? (<EmptyState variant="flashcards" title="Nenhuma flashcard encontrada" description="Crie a primeira flashcard" actionLabel="Criar Flashcard" onAction={openCreate} />) : (
            <Table><TableHeader><TableRow><TableHead>Frente</TableHead><TableHead className="hidden md:table-cell">Keyword</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
              <TableBody>{filteredCards.map((fc) => (
                <TableRow key={fc.id}>
                  <TableCell className="text-gray-900 max-w-xs truncate">{fc.front}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="border-teal-200 text-teal-700">{getKeywordTerm(fc.keyword_id)}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className={fc.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}>{fc.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setPreviewCard(fc); setPreviewFlipped(false); }} className="text-gray-500 hover:text-teal-600"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(fc)} className="text-gray-500 hover:text-teal-600"><Pencil className="w-4 h-4" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar flashcard?</AlertDialogTitle><AlertDialogDescription>Esta flashcard sera marcada como eliminada.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteFlashcard(fc.id)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  </div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}