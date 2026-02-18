// ============================================================
// Axon v4.4 — SummaryEditor (Dev 1, FASE 2)
// Markdown editor + preview + "Generate AI" button
// Wired to LIVE backend via callbacks from App.tsx
// Field: content_markdown (backend contract). NO title field.
// Title comes from Topic parent name.
// Gap 4: handleDeleteSummary + delete button
// Gap 6: Sonner toasts for feedback
// ============================================================
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import type { Summary, Topic, ContentStatus } from '../../lib/types';
import { toast } from 'sonner';
import {
  FileText, Eye, Edit3, Sparkles, Save, ArrowLeft,
  Clock, User, Loader2, CheckCircle, XCircle, Trash2,
} from 'lucide-react';

interface SummaryEditorProps {
  topic: Topic | null;
  summaries: Summary[];
  onSummariesChange: (summaries: Summary[]) => void;
  onBack?: () => void;
  selectedCourseId?: string;
  // Backend callbacks
  onCreateSummary?: (data: { topic_id: string; course_id: string; content_markdown: string }) => Promise<Summary | null>;
  onUpdateSummary?: (id: string, data: { content_markdown: string }) => Promise<Summary | null>;
  onDeleteSummary?: (id: string) => Promise<boolean>;
  onAiGenerate?: (content: string, summaryId?: string, courseId?: string) => Promise<any>;
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-gray-900 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-700 text-sm leading-relaxed">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 my-2">$&</ul>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function SummaryEditor({ topic, summaries, onSummariesChange, onBack, selectedCourseId, onCreateSummary, onUpdateSummary, onDeleteSummary, onAiGenerate }: SummaryEditorProps) {
  const topicSummaries = useMemo(() =>
    topic ? summaries.filter(s => s.topic_id === topic.id) : [],
    [summaries, topic]
  );

  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(topicSummaries[0] || null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [content, setContent] = useState(selectedSummary?.content_markdown || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectSummary = (s: Summary) => {
    if (hasChanges && !confirm('Descartar alteracoes nao salvas?')) return;
    setSelectedSummary(s);
    setContent(s.content_markdown);
    setHasChanges(false);
    setMode('edit');
  };

  const handleNewSummary = async () => {
    if (!topic) return;
    const initialContent = `# ${topic.name}\n\nConteudo do resumo aqui...`;

    if (onCreateSummary) {
      setSaving(true);
      try {
        const created = await onCreateSummary({
          topic_id: topic.id,
          course_id: selectedCourseId || '',
          content_markdown: initialContent,
        });
        if (created) {
          onSummariesChange([...summaries, created]);
          setSelectedSummary(created);
          setContent(created.content_markdown);
          setHasChanges(false);
          setMode('edit');
          toast.success('Resumo criado com sucesso');
        }
      } catch (err) {
        console.error('[SummaryEditor] Create failed:', err);
        toast.error('Erro ao criar resumo');
      } finally {
        setSaving(false);
      }
    } else {
      const newSummary: Summary = {
        id: `sum-${Date.now()}`,
        topic_id: topic.id,
        course_id: selectedCourseId || '',
        institution_id: 'inst-001',
        content_markdown: initialContent,
        status: 'draft',
        created_at: new Date().toISOString(),
        created_by: 'user-prof-001',
        updated_at: new Date().toISOString(),
      };
      onSummariesChange([...summaries, newSummary]);
      setSelectedSummary(newSummary);
      setContent(newSummary.content_markdown);
      setHasChanges(false);
      setMode('edit');
    }
  };

  const handleSave = async () => {
    if (!selectedSummary) return;
    setSaving(true);
    try {
      if (onUpdateSummary) {
        const updated = await onUpdateSummary(selectedSummary.id, { content_markdown: content });
        if (updated) {
          onSummariesChange(summaries.map(s => s.id === selectedSummary.id ? updated : s));
          setSelectedSummary(updated);
          setHasChanges(false);
          toast.success('Resumo salvo com sucesso');
        }
      } else {
        const updated = summaries.map(s =>
          s.id === selectedSummary.id
            ? { ...s, content_markdown: content, updated_at: new Date().toISOString() }
            : s
        );
        onSummariesChange(updated);
        setSelectedSummary({ ...selectedSummary, content_markdown: content, updated_at: new Date().toISOString() });
        setHasChanges(false);
        toast.success('Resumo salvo localmente');
      }
    } catch (err) {
      console.error('[SummaryEditor] Save failed:', err);
      toast.error('Erro ao salvar resumo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSummary) return;
    if (!confirm('Tem certeza que deseja deletar este resumo? Esta acao nao pode ser desfeita.')) return;

    setDeleting(true);
    try {
      if (onDeleteSummary) {
        const ok = await onDeleteSummary(selectedSummary.id);
        if (ok) {
          const remaining = summaries.filter(s => s.id !== selectedSummary.id);
          onSummariesChange(remaining);
          const nextSummary = remaining.find(s => s.topic_id === topic?.id) || null;
          setSelectedSummary(nextSummary);
          setContent(nextSummary?.content_markdown || '');
          setHasChanges(false);
          toast.success('Resumo deletado com sucesso');
        }
      } else {
        const remaining = summaries.filter(s => s.id !== selectedSummary.id);
        onSummariesChange(remaining);
        const nextSummary = remaining.find(s => s.topic_id === topic?.id) || null;
        setSelectedSummary(nextSummary);
        setContent(nextSummary?.content_markdown || '');
        setHasChanges(false);
        toast.success('Resumo removido localmente');
      }
    } catch (err) {
      console.error('[SummaryEditor] Delete failed:', err);
      toast.error('Erro ao deletar resumo');
    } finally {
      setDeleting(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!topic) return;
    setAiLoading(true);
    try {
      if (onAiGenerate) {
        // Call real AI endpoint
        const result = await onAiGenerate(
          content || `Gere um resumo completo sobre: ${topic.name}`,
          selectedSummary?.id,
          selectedCourseId,
        );
        if (result) {
          console.log('[SummaryEditor] AI draft generated:', result);
          // AI returns a draft with generated content
          const aiContent = `# ${topic.name}\n\n## Introducao\nConteudo gerado por IA sobre ${topic.name}.\n\n${
            result.keywords?.length > 0
              ? `## Keywords Identificadas\n${result.keywords.map((k: any) => `- **${k.term}**: ${k.definition || ''}`).join('\n')}\n\n`
              : ''
          }## Pontos-Chave para Revisao\n- Revisar e editar o conteudo gerado\n- Verificar precisao dos termos medicos\n- Aprovar keywords e flashcards na fila de aprovacao`;
          setContent(aiContent);
          setHasChanges(true);
          toast.success('Conteudo IA gerado — revise antes de salvar');
        }
      } else {
        // Mock AI generation
        await new Promise(r => setTimeout(r, 2000));
        const aiContent = `# ${topic.name}\n\n## Introducao\nConteudo gerado por IA sobre ${topic.name}. Este resumo aborda os conceitos fundamentais, estruturas anatomicas relevantes e correlacoes clinicas.\n\n## Conceitos Principais\n- Definicao e classificacao\n- Estrutura anatomica\n- Relacoes topograficas\n- Vascularizacao e inervacao\n\n## Correlacao Clinica\n- Patologias associadas\n- Importancia diagnostica\n- Procedimentos relevantes\n\n## Pontos-Chave para Revisao\n- Ponto 1: Identificar estruturas\n- Ponto 2: Compreender funcoes\n- Ponto 3: Correlacao clinica`;
        setContent(aiContent);
        setHasChanges(true);
        toast.success('Conteudo IA gerado (mock)');
      }
    } catch (err) {
      console.error('[SummaryEditor] AI generate failed:', err);
      toast.error('Erro na geracao de conteudo IA');
    } finally {
      setAiLoading(false);
    }
  };

  const statusConfig: Record<ContentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    draft: { label: 'Rascunho', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    published: { label: 'Publicado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
    rejected: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  };

  const deriveTitle = (md: string) => {
    const match = md.match(/^# (.+)$/m);
    return match ? match[1] : (topic?.name || 'Sem titulo');
  };

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <FileText size={48} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Selecione um topico na arvore de conteudo para editar resumos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={16} className="text-gray-500" />
            </button>
          )}
          <div>
            <p className="text-xs text-gray-500">Topico</p>
            <h3 className="text-sm font-semibold text-gray-900">{topic.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAiGenerate} disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiLoading ? 'Gerando...' : 'Gerar com IA'}
          </button>
          <button onClick={handleNewSummary} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            Novo Resumo
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-56 border-r border-gray-200 bg-gray-50/50 overflow-y-auto shrink-0">
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Resumos ({topicSummaries.length})
            </p>
            {topicSummaries.map(s => {
              const st = statusConfig[s.status];
              const StatusIcon = st.icon;
              const displayTitle = deriveTitle(s.content_markdown);
              return (
                <button key={s.id} onClick={() => selectSummary(s)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedSummary?.id === s.id ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-white/60'
                  }`}>
                  <p className="font-medium text-gray-800 text-xs truncate">{displayTitle}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusIcon size={10} className={st.color} />
                    <span className={`text-[10px] ${st.color}`}>{st.label}</span>
                  </div>
                </button>
              );
            })}
            {topicSummaries.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum resumo</p>
            )}
          </div>
        </div>

        {selectedSummary ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <button onClick={() => setMode('edit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === 'edit' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  <Edit3 size={12} /> Editar
                </button>
                <button onClick={() => setMode('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === 'preview' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  <Eye size={12} /> Preview
                </button>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && <span className="text-[10px] text-amber-600 font-medium">Nao salvo</span>}
                <button onClick={handleSave} disabled={!hasChanges || saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Salvar
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Deletar
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-lg font-semibold text-gray-900">{deriveTitle(content)}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><User size={10} /> {selectedSummary.created_by}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(selectedSummary.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {mode === 'edit' ? (
                <textarea value={content}
                  onChange={(e) => { setContent(e.target.value); setHasChanges(true); }}
                  className="w-full h-full p-4 text-sm font-mono text-gray-700 bg-white border-none outline-none resize-none leading-relaxed"
                  placeholder="Escreva o conteudo em Markdown..." />
              ) : (
                <div className="p-6 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Selecione ou crie um resumo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}