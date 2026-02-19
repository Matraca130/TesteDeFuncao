// A6-01 | ProfessorKeywordEditor.tsx | Agent 6 — PRISM
import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Sparkles, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useKeywords } from '../hooks/use-keywords';
import { useSummaries } from '../hooks/use-summaries';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';
import type { Keyword } from '../data/mock-data';

export function ProfessorKeywordEditor() {
  const [selectedSummary, setSelectedSummary] = useState<string>('sum-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const { summaries, isLoading: summariesLoading } = useSummaries();
  const { filteredKeywords: allFiltered, isLoading, error, isMutating, isGenerating, createKeyword, updateKeyword, deleteKeyword, generateAI, refetch } = useKeywords({ summaryId: selectedSummary });
  const [formTerm, setFormTerm] = useState('');
  const [formDefinition, setFormDefinition] = useState('');
  const [formPriority, setFormPriority] = useState([3]);
  const [formSource, setFormSource] = useState('');
  const [formModel3d, setFormModel3d] = useState('');
  const filteredKeywords = useMemo(() => allFiltered.filter((kw) => searchTerm === '' || kw.term.toLowerCase().includes(searchTerm.toLowerCase())), [allFiltered, searchTerm]);
  const resetForm = () => { setFormTerm(''); setFormDefinition(''); setFormPriority([3]); setFormSource(''); setFormModel3d(''); setEditingKeyword(null); };
  const openCreate = () => { resetForm(); setIsDialogOpen(true); };
  const openEdit = (kw: Keyword) => { setEditingKeyword(kw); setFormTerm(kw.term); setFormDefinition(kw.definition); setFormPriority([kw.priority]); setFormSource(''); setFormModel3d(''); setIsDialogOpen(true); };
  const handleSave = async () => { if (!formTerm.trim()) return; if (editingKeyword) { await updateKeyword(editingKeyword.id, { term: formTerm, definition: formDefinition, priority: formPriority[0] }); } else { await createKeyword({ term: formTerm, definition: formDefinition, priority: formPriority[0], summary_id: selectedSummary, status: 'draft' }); } setIsDialogOpen(false); resetForm(); };
  const selectedSummaryTitle = summaries.find((s) => s.id === selectedSummary)?.title || '';
  if (isLoading || summariesLoading) return <SkeletonPage variant="editor" />;
  if (error) return <div className="space-y-6 p-6 max-w-7xl mx-auto"><ErrorBanner message={error} onRetry={refetch} /></div>;

  return (
    <PageTransition>
    <div className="space-y-6 p-6 max-w-7xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div><h1 style={{ fontFamily: "'Georgia', serif" }} className="text-gray-900 tracking-tight">Editor de Keywords</h1><p className="text-gray-500 mt-1">Gerencie as keywords de cada resumo</p></div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedSummary} onValueChange={setSelectedSummary}><SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Selecionar Summary" /></SelectTrigger><SelectContent>{summaries.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}</SelectContent></Select>
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar keyword..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
        <div className="flex gap-2">
          <Button onClick={() => generateAI(selectedSummary)} disabled={isGenerating || isMutating} variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50"><Sparkles className="w-4 h-4 mr-2" />{isGenerating ? 'Gerando...' : 'Gerar com IA'}</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button onClick={openCreate} className="bg-teal-500 hover:bg-teal-600 text-white"><Plus className="w-4 h-4 mr-2" />Criar Keyword</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle style={{ fontFamily: "'Georgia', serif" }}>{editingKeyword ? 'Editar Keyword' : 'Nova Keyword'}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><label className="text-gray-700 mb-1 block">Termo *</label><Input value={formTerm} onChange={(e) => setFormTerm(e.target.value)} placeholder="Ex: Mitocondria" /></div>
                <div><label className="text-gray-700 mb-1 block">Definicao</label><Textarea value={formDefinition} onChange={(e) => setFormDefinition(e.target.value)} placeholder="Definicao detalhada..." rows={3} /></div>
                <div><label className="text-gray-700 mb-1 block">Prioridade: {formPriority[0]}</label><Slider value={formPriority} onValueChange={setFormPriority} min={1} max={5} step={1} className="mt-2" /><div className="flex justify-between mt-1"><span className="text-gray-400" style={{ fontSize: '0.75rem' }}>Baixa</span><span className="text-gray-400" style={{ fontSize: '0.75rem' }}>Alta</span></div></div>
                <div><label className="text-gray-700 mb-1 block">Fonte de referencia</label><Input value={formSource} onChange={(e) => setFormSource(e.target.value)} placeholder="Ex: Guyton Cap. 2" /></div>
                <div><label className="text-gray-700 mb-1 block">URL Modelo 3D (opcional)</label><Input value={formModel3d} onChange={(e) => setFormModel3d(e.target.value)} placeholder="https://..." /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white">{editingKeyword ? 'Salvar' : 'Criar'}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="border-gray-200">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}><span>Keywords — {selectedSummaryTitle}</span><Badge variant="secondary" className="bg-teal-50 text-teal-700">{filteredKeywords.length}</Badge></CardTitle></CardHeader>
        <CardContent>
          {filteredKeywords.length === 0 ? (<EmptyState variant="keywords" title="Nenhuma keyword encontrada" description="Crie a primeira keyword para este resumo ou gere com IA" actionLabel="Criar Keyword" onAction={openCreate} />) : (
            <Table><TableHeader><TableRow><TableHead>Termo</TableHead><TableHead className="hidden md:table-cell">Definicao</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
              <TableBody>{filteredKeywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="text-gray-900">{kw.term}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500 max-w-xs truncate">{kw.definition}</TableCell>
                  <TableCell><div className="flex items-center gap-1">{Array.from({ length: kw.priority }, (_, i) => (<Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />))}</div></TableCell>
                  <TableCell><Badge variant="secondary" className={kw.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}>{kw.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(kw)} className="text-gray-500 hover:text-teal-600"><Pencil className="w-4 h-4" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar keyword?</AlertDialogTitle><AlertDialogDescription>A keyword "{kw.term}" sera marcada como eliminada.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteKeyword(kw.id)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
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