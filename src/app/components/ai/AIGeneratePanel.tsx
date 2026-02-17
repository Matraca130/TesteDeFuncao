import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles, Loader2, Check, X, ChevronDown, ChevronUp,
  BookOpen, HelpCircle, Link2, Tag, FileText
} from 'lucide-react';

interface GeneratedDraft {
  id: string;
  status: string;
  keywords: any[];
  flashcards: any[];
  quiz_questions: any[];
  suggested_connections: any[];
}

interface AIGeneratePanelProps {
  courseId?: string;
  summaryId?: string;
  onApprovalComplete?: () => void;
}

export function AIGeneratePanel({ courseId, summaryId, onApprovalComplete }: AIGeneratePanelProps) {
  const { apiFetch } = useAuth();
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keywords: true, flashcards: false, quiz: false, connections: false,
  });
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [selectedFlashcards, setSelectedFlashcards] = useState<Set<string>>(new Set());
  const [selectedQuiz, setSelectedQuiz] = useState<Set<string>>(new Set());
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());

  async function handleGenerate() {
    if (!content.trim()) return;
    setError(''); setGenerating(true); setDraft(null);
    try {
      const data = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ summary_id: summaryId, content: content.trim(), course_id: courseId }),
      });
      setDraft(data);
      setSelectedKeywords(new Set(data.keywords.map((k: any) => k.id)));
      setSelectedFlashcards(new Set(data.flashcards.map((f: any) => f.id)));
      setSelectedQuiz(new Set(data.quiz_questions.map((q: any) => q.id)));
      setSelectedConnections(new Set(data.suggested_connections.map((c: any) => c.id)));
    } catch (err: any) { setError(err.message); }
    finally { setGenerating(false); }
  }

  async function handleApprove() {
    if (!draft) return;
    setApproving(true); setError('');
    try {
      await apiFetch('/ai/generate/approve', {
        method: 'POST',
        body: JSON.stringify({
          draft_id: draft.id,
          approved_keyword_ids: Array.from(selectedKeywords),
          approved_flashcard_ids: Array.from(selectedFlashcards),
          approved_quiz_ids: Array.from(selectedQuiz),
          approved_connection_ids: Array.from(selectedConnections),
        }),
      });
      setDraft(null); setContent('');
      onApprovalComplete?.();
    } catch (err: any) { setError(err.message); }
    finally { setApproving(false); }
  }

  function toggleSection(section: string) { setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] })); }
  function toggleItem(set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); setFn(next);
  }
  function selectAll(items: any[], setFn: React.Dispatch<React.SetStateAction<Set<string>>>) { setFn(new Set(items.map((i: any) => i.id))); }
  function deselectAll(setFn: React.Dispatch<React.SetStateAction<Set<string>>>) { setFn(new Set()); }

  return (
    <div className="flex flex-col gap-4">
      {!draft && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Gerar Conteudo com IA</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Cole o texto do resumo e a IA gerara keywords, sub-topicos, flashcards e quiz.</p>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Cole aqui o conteudo do resumo de estudo..." rows={6} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition" />
          {error && !draft && (<div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>)}
          <button onClick={handleGenerate} disabled={generating || !content.trim()} className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4" />Gerar Conteudo</>}
          </button>
        </div>
      )}
      {draft && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Rascunho gerado — Revise e aprove</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDraft(null)} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
              <button onClick={handleApprove} disabled={approving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
                {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Aprovar Selecionados
              </button>
            </div>
          </div>
          {error && (<div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>)}
          <DraftSection title="Keywords" icon={<Tag className="w-4 h-4" />} count={draft.keywords.length} selectedCount={selectedKeywords.size} expanded={expandedSections.keywords} onToggle={() => toggleSection('keywords')} onSelectAll={() => selectAll(draft.keywords, setSelectedKeywords)} onDeselectAll={() => deselectAll(setSelectedKeywords)}>
            {draft.keywords.map((kw: any) => (
              <div key={kw.id} onClick={() => toggleItem(selectedKeywords, setSelectedKeywords, kw.id)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedKeywords.has(kw.id) ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selectedKeywords.has(kw.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{selectedKeywords.has(kw.id) && <Check className="w-3 h-3" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{kw.term}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${kw.priority === 0 ? 'bg-red-100 text-red-700' : kw.priority === 1 ? 'bg-orange-100 text-orange-700' : kw.priority === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>P{kw.priority}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{kw.definition}</p>
                    {kw.subtopics?.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">{kw.subtopics.map((st: any) => (<span key={st.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{st.title}</span>))}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </DraftSection>
          <DraftSection title="Flashcards" icon={<BookOpen className="w-4 h-4" />} count={draft.flashcards.length} selectedCount={selectedFlashcards.size} expanded={expandedSections.flashcards} onToggle={() => toggleSection('flashcards')} onSelectAll={() => selectAll(draft.flashcards, setSelectedFlashcards)} onDeselectAll={() => deselectAll(setSelectedFlashcards)}>
            {draft.flashcards.map((fc: any) => (
              <div key={fc.id} onClick={() => toggleItem(selectedFlashcards, setSelectedFlashcards, fc.id)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedFlashcards.has(fc.id) ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selectedFlashcards.has(fc.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{selectedFlashcards.has(fc.id) && <Check className="w-3 h-3" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{fc.front}</p>
                    <p className="text-xs text-gray-500 mt-1">{fc.back}</p>
                    {fc.keyword_term && <span className="inline-block text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded mt-1">{fc.keyword_term}</span>}
                  </div>
                </div>
              </div>
            ))}
          </DraftSection>
          <DraftSection title="Quiz" icon={<HelpCircle className="w-4 h-4" />} count={draft.quiz_questions.length} selectedCount={selectedQuiz.size} expanded={expandedSections.quiz} onToggle={() => toggleSection('quiz')} onSelectAll={() => selectAll(draft.quiz_questions, setSelectedQuiz)} onDeselectAll={() => deselectAll(setSelectedQuiz)}>
            {draft.quiz_questions.map((q: any) => (
              <div key={q.id} onClick={() => toggleItem(selectedQuiz, setSelectedQuiz, q.id)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedQuiz.has(q.id) ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selectedQuiz.has(q.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{selectedQuiz.has(q.id) && <Check className="w-3 h-3" />}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{q.quiz_type}</span>
                    <p className="text-sm text-gray-900 mt-1">{q.question}</p>
                    {q.options && (<div className="mt-1 space-y-0.5">{q.options.map((opt: string, i: number) => (<p key={i} className={`text-xs ${i === q.correct_answer ? 'text-green-600 font-medium' : 'text-gray-500'}`}>{opt}</p>))}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </DraftSection>
          {draft.suggested_connections.length > 0 && (
            <DraftSection title="Conexoes" icon={<Link2 className="w-4 h-4" />} count={draft.suggested_connections.length} selectedCount={selectedConnections.size} expanded={expandedSections.connections} onToggle={() => toggleSection('connections')} onSelectAll={() => selectAll(draft.suggested_connections, setSelectedConnections)} onDeselectAll={() => deselectAll(setSelectedConnections)}>
              {draft.suggested_connections.map((conn: any) => (
                <div key={conn.id} onClick={() => toggleItem(selectedConnections, setSelectedConnections, conn.id)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedConnections.has(conn.id) ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selectedConnections.has(conn.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{selectedConnections.has(conn.id) && <Check className="w-3 h-3" />}</div>
                    <span className="text-sm font-medium text-gray-900">{conn.keyword_a_term}</span>
                    <span className="text-xs text-gray-400">—{conn.label}—</span>
                    <span className="text-sm font-medium text-gray-900">{conn.keyword_b_term}</span>
                  </div>
                </div>
              ))}
            </DraftSection>
          )}
        </div>
      )}
    </div>
  );
}

function DraftSection({ title, icon, count, selectedCount, expanded, onToggle, onSelectAll, onDeselectAll, children }: {
  title: string; icon: React.ReactNode; count: number; selectedCount: number; expanded: boolean;
  onToggle: () => void; onSelectAll: () => void; onDeselectAll: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
        <span className="text-indigo-500">{icon}</span>
        <span className="text-sm font-medium text-gray-900 flex-1 text-left">{title}</span>
        <span className="text-xs text-gray-500">{selectedCount}/{count} selecionados</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={onSelectAll} className="text-xs text-indigo-600 hover:underline">Selecionar todos</button>
            <span className="text-xs text-gray-300">|</span>
            <button onClick={onDeselectAll} className="text-xs text-gray-500 hover:underline">Deselecionar todos</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">{children}</div>
        </div>
      )}
    </div>
  );
}
