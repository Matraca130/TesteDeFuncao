// ============================================================
// A6-03 | ProfessorQuizEditor.tsx | Agent 6 — PRISM
// CRUD quiz questions del profesor
// P3: Refactored to use useQuizQuestions + useSummaries + useKeywords hooks
// ============================================================
import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, HelpCircle, CheckCircle, ToggleLeft, FileText, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { useQuizQuestions } from '../hooks/use-quiz-questions';
import { useSummaries } from '../hooks/use-summaries';
import { useKeywords } from '../hooks/use-keywords';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';
import type { QuizQuestion } from '../data/mock-data';

const QUIZ_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  mcq: { label: 'Multipla Escolha', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-blue-50 text-blue-700' },
  true_false: { label: 'Verdadeiro/Falso', icon: <ToggleLeft className="w-3 h-3" />, color: 'bg-purple-50 text-purple-700' },
  fill_blank: { label: 'Preencher', icon: <FileText className="w-3 h-3" />, color: 'bg-amber-50 text-amber-700' },
  open: { label: 'Aberta', icon: <HelpCircle className="w-3 h-3" />, color: 'bg-green-50 text-green-700' },
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: 'Facil', color: 'bg-green-50 text-green-700' },
  medium: { label: 'Medio', color: 'bg-amber-50 text-amber-700' },
  hard: { label: 'Dificil', color: 'bg-red-50 text-red-700' },
};

export function ProfessorQuizEditor() {
  const [selectedSummary, setSelectedSummary] = useState<string>('sum-1');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  // P3: Hook layer
  const { summaries, isLoading: summariesLoading } = useSummaries();
  const { filteredKeywords: summaryKeywords } = useKeywords({ summaryId: selectedSummary });
  const {
    filteredQuestions: allFiltered,
    isLoading,
    error,
    isMutating,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    refetch,
  } = useQuizQuestions({ summaryId: selectedSummary, keywordId: selectedKeyword, quizType: filterType });

  // Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formType, setFormType] = useState<string>('mcq');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState('0');
  const [formCorrectBool, setFormCorrectBool] = useState('true');
  const [formCorrectText, setFormCorrectText] = useState('');
  const [formRubric, setFormRubric] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<string>('medium');
  const [formKeywordId, setFormKeywordId] = useState('');

  // Filter by search term only (summary/keyword/type filtering is now in the hook)
  const filteredQuestions = useMemo(
    () =>
      allFiltered.filter(
        (q) =>
          searchTerm === '' || q.question.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allFiltered, searchTerm]
  );

  const resetForm = () => {
    setFormQuestion('');
    setFormType('mcq');
    setFormOptions(['', '', '', '']);
    setFormCorrectIndex('0');
    setFormCorrectBool('true');
    setFormCorrectText('');
    setFormRubric('');
    setFormDifficulty('medium');
    setFormKeywordId('');
    setEditingQuestion(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setFormQuestion(q.question);
    setFormType(q.quiz_type);
    setFormDifficulty(q.difficulty_tier);
    setFormKeywordId(q.keyword_id);
    if (q.quiz_type === 'mcq') {
      setFormOptions(q.options || ['', '', '', '']);
      setFormCorrectIndex(String(q.correct_answer));
    } else if (q.quiz_type === 'true_false') {
      setFormCorrectBool(String(q.correct_answer));
    } else {
      setFormCorrectText(String(q.correct_answer));
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formQuestion.trim()) return;

    let correctAnswer: string | number | boolean = '';
    if (formType === 'mcq') correctAnswer = parseInt(formCorrectIndex);
    else if (formType === 'true_false') correctAnswer = formCorrectBool === 'true';
    else if (formType === 'fill_blank') correctAnswer = formCorrectText;
    else correctAnswer = formRubric;

    if (editingQuestion) {
      await updateQuestion(editingQuestion.id, {
        question: formQuestion,
        quiz_type: formType as QuizQuestion['quiz_type'],
        options: formType === 'mcq' ? formOptions : undefined,
        correct_answer: correctAnswer,
        difficulty_tier: formDifficulty as QuizQuestion['difficulty_tier'],
        keyword_id: formKeywordId || editingQuestion.keyword_id,
      });
    } else {
      await createQuestion({
        question: formQuestion,
        quiz_type: formType as QuizQuestion['quiz_type'],
        options: formType === 'mcq' ? formOptions : undefined,
        correct_answer: correctAnswer,
        keyword_id: formKeywordId || summaryKeywords[0]?.id || '',
        summary_id: selectedSummary,
        difficulty_tier: formDifficulty as QuizQuestion['difficulty_tier'],
      });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteQuestion(id);
  };

  const getKeywordTerm = (kid: string) => summaryKeywords.find((k) => k.id === kid)?.term || 'N/A';

  if (isLoading || summariesLoading) {
    return <SkeletonPage variant="editor" />;
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
          Editor de Quiz
        </h1>
        <p className="text-gray-500 mt-1">Crie perguntas MCQ, Verdadeiro/Falso, Preencher e Abertas</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <Select value={selectedSummary} onValueChange={(v) => { setSelectedSummary(v); setSelectedKeyword('all'); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Summary" />
          </SelectTrigger>
          <SelectContent>
            {summaries.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedKeyword} onValueChange={setSelectedKeyword}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Keyword" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {summaryKeywords.map((kw) => (
              <SelectItem key={kw.id} value={kw.id}>{kw.term}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="mcq">Multipla Escolha</SelectItem>
            <SelectItem value="true_false">V/F</SelectItem>
            <SelectItem value="fill_blank">Preencher</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-teal-500 hover:bg-teal-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Criar Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Georgia', serif" }}>
                {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 mb-1 block">Keyword</label>
                  <Select value={formKeywordId} onValueChange={setFormKeywordId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {summaryKeywords.map((kw) => (
                        <SelectItem key={kw.id} value={kw.id}>{kw.term}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-700 mb-1 block">Dificuldade</label>
                  <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facil</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="hard">Dificil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={formType} onValueChange={setFormType}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="mcq">MCQ</TabsTrigger>
                  <TabsTrigger value="true_false">V/F</TabsTrigger>
                  <TabsTrigger value="fill_blank">Preencher</TabsTrigger>
                  <TabsTrigger value="open">Aberta</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <label className="text-gray-700 mb-1 block">Pergunta *</label>
                  <Textarea value={formQuestion} onChange={(e) => setFormQuestion(e.target.value)} placeholder="Escreva a pergunta..." rows={2} />
                </div>

                <TabsContent value="mcq" className="space-y-3 mt-3">
                  <label className="text-gray-700 block">Opcoes e resposta correta:</label>
                  <RadioGroup value={formCorrectIndex} onValueChange={setFormCorrectIndex}>
                    {formOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...formOptions];
                            newOpts[i] = e.target.value;
                            setFormOptions(newOpts);
                          }}
                          placeholder={`Opcao ${i + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </RadioGroup>
                </TabsContent>

                <TabsContent value="true_false" className="mt-3">
                  <label className="text-gray-700 mb-2 block">Resposta correta:</label>
                  <RadioGroup value={formCorrectBool} onValueChange={setFormCorrectBool} className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true">Verdadeiro</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false">Falso</Label>
                    </div>
                  </RadioGroup>
                </TabsContent>

                <TabsContent value="fill_blank" className="mt-3">
                  <label className="text-gray-700 mb-1 block">Resposta correta</label>
                  <Input value={formCorrectText} onChange={(e) => setFormCorrectText(e.target.value)} placeholder="Texto que completa o espaco" />
                </TabsContent>

                <TabsContent value="open" className="mt-3">
                  <label className="text-gray-700 mb-1 block">Rubrica de avaliacao</label>
                  <Textarea value={formRubric} onChange={(e) => setFormRubric(e.target.value)} placeholder="Criterios de correcao..." rows={3} />
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white">
                {editingQuestion ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions Table */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
            Perguntas
            <Badge variant="secondary" className="bg-teal-50 text-teal-700">{filteredQuestions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <EmptyState
              variant="quiz"
              title="Nenhuma pergunta encontrada"
              description="Crie a primeira pergunta de quiz para este resumo"
              actionLabel="Criar Pergunta"
              onAction={openCreate}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Keyword</TableHead>
                  <TableHead>Dificuldade</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((q) => {
                  const typeInfo = QUIZ_TYPE_LABELS[q.quiz_type];
                  const diffInfo = DIFFICULTY_LABELS[q.difficulty_tier];
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="text-gray-900 max-w-xs truncate">{q.question}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${typeInfo.color} gap-1`}>
                          {typeInfo.icon} {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="border-teal-200 text-teal-700">
                          {getKeywordTerm(q.keyword_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={diffInfo.color}>{diffInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(q)} className="text-gray-500 hover:text-teal-600">
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
                                <AlertDialogTitle>Eliminar pergunta?</AlertDialogTitle>
                                <AlertDialogDescription>Esta pergunta sera removida.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(q.id)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}