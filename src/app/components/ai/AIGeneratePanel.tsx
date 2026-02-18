import React, { useState } from 'react';
import { useApi } from '../../lib/api-provider';
import {
  Sparkles, Loader2, Check,
  BookOpen, HelpCircle, Link2, Tag, FileText
} from 'lucide-react';

// ── Extracted types (single source of truth) ──
import type {
  GeneratedKeyword,
  GeneratedFlashcard,
  GeneratedQuizQuestion,
  GeneratedConnection,
  GeneratedDraft,
} from './ai-generate-types';

// ── Extracted submodules (Step 3: wiring) ──
import { DraftSection } from './DraftSection';
import { KeywordCard, FlashcardCard, QuizCard, ConnectionCard } from './DraftItemCards';

// -- Component --

interface AIGeneratePanelProps {
  courseId?: string;
  summaryId?: string;
  onApprovalComplete?: () => void;
}

export function AIGeneratePanel({ courseId, summaryId, onApprovalComplete }: AIGeneratePanelProps) {
  const { api } = useApi();
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keywords: true,
    flashcards: false,
    quiz: false,
    connections: false,
  });

  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [selectedFlashcards, setSelectedFlashcards] = useState<Set<string>>(new Set());
  const [selectedQuiz, setSelectedQuiz] = useState<Set<string>>(new Set());
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());

  async function handleGenerate() {
    if (!content.trim()) return;
    setError('');
    setGenerating(true);
    setDraft(null);

    try {
      const data = await api.post<any, GeneratedDraft>('/ai/generate', {
        summary_id: summaryId,
        content: content.trim(),
        course_id: courseId,
      });

      setDraft(data);
      setSelectedKeywords(new Set(data.keywords.map((k: GeneratedKeyword) => k.id)));
      setSelectedFlashcards(new Set(data.flashcards.map((f: GeneratedFlashcard) => f.id)));
      setSelectedQuiz(new Set(data.quiz_questions.map((q: GeneratedQuizQuestion) => q.id)));
      setSelectedConnections(new Set(data.suggested_connections.map((c: GeneratedConnection) => c.id)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove() {
    if (!draft) return;
    setApproving(true);
    setError('');

    try {
      await api.post('/ai/generate/approve', {
        draft_id: draft.id,
        approved_keyword_ids: Array.from(selectedKeywords),
        approved_flashcard_ids: Array.from(selectedFlashcards),
        approved_quiz_ids: Array.from(selectedQuiz),
        approved_connection_ids: Array.from(selectedConnections),
      });

      setDraft(null);
      setContent('');
      onApprovalComplete?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setApproving(false);
    }
  }

  function toggleSection(section: string) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function toggleItem(set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFn(next);
  }

  function selectAll(items: { id: string }[], setFn: React.Dispatch<React.SetStateAction<Set<string>>>) {
    setFn(new Set(items.map((i) => i.id)));
  }

  function deselectAll(setFn: React.Dispatch<React.SetStateAction<Set<string>>>) {
    setFn(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      {!draft && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Gerar Conteudo com IA</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Cole o texto do resumo e a IA gerara keywords, sub-topicos, flashcards e quiz.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o conteudo do resumo de estudo..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition"
          />
          {error && !draft && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || !content.trim()}
            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Conteudo
              </>
            )}
          </button>
        </div>
      )}

      {draft && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Rascunho gerado — Revise e aprove
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDraft(null)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                {approving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Aprovar Selecionados
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <DraftSection
            title="Keywords"
            icon={<Tag className="w-4 h-4" />}
            count={draft.keywords.length}
            selectedCount={selectedKeywords.size}
            expanded={expandedSections.keywords}
            onToggle={() => toggleSection('keywords')}
            onSelectAll={() => selectAll(draft.keywords, setSelectedKeywords)}
            onDeselectAll={() => deselectAll(setSelectedKeywords)}
          >
            {draft.keywords.map((kw) => (
              <KeywordCard
                key={kw.id}
                keyword={kw}
                selected={selectedKeywords.has(kw.id)}
                onToggle={() => toggleItem(selectedKeywords, setSelectedKeywords, kw.id)}
              />
            ))}
          </DraftSection>

          <DraftSection
            title="Flashcards"
            icon={<BookOpen className="w-4 h-4" />}
            count={draft.flashcards.length}
            selectedCount={selectedFlashcards.size}
            expanded={expandedSections.flashcards}
            onToggle={() => toggleSection('flashcards')}
            onSelectAll={() => selectAll(draft.flashcards, setSelectedFlashcards)}
            onDeselectAll={() => deselectAll(setSelectedFlashcards)}
          >
            {draft.flashcards.map((fc) => (
              <FlashcardCard
                key={fc.id}
                flashcard={fc}
                selected={selectedFlashcards.has(fc.id)}
                onToggle={() => toggleItem(selectedFlashcards, setSelectedFlashcards, fc.id)}
              />
            ))}
          </DraftSection>

          <DraftSection
            title="Quiz"
            icon={<HelpCircle className="w-4 h-4" />}
            count={draft.quiz_questions.length}
            selectedCount={selectedQuiz.size}
            expanded={expandedSections.quiz}
            onToggle={() => toggleSection('quiz')}
            onSelectAll={() => selectAll(draft.quiz_questions, setSelectedQuiz)}
            onDeselectAll={() => deselectAll(setSelectedQuiz)}
          >
            {draft.quiz_questions.map((q) => (
              <QuizCard
                key={q.id}
                question={q}
                selected={selectedQuiz.has(q.id)}
                onToggle={() => toggleItem(selectedQuiz, setSelectedQuiz, q.id)}
              />
            ))}
          </DraftSection>

          {draft.suggested_connections.length > 0 && (
            <DraftSection
              title="Conexoes"
              icon={<Link2 className="w-4 h-4" />}
              count={draft.suggested_connections.length}
              selectedCount={selectedConnections.size}
              expanded={expandedSections.connections}
              onToggle={() => toggleSection('connections')}
              onSelectAll={() => selectAll(draft.suggested_connections, setSelectedConnections)}
              onDeselectAll={() => deselectAll(setSelectedConnections)}
            >
              {draft.suggested_connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  selected={selectedConnections.has(conn.id)}
                  onToggle={() => toggleItem(selectedConnections, setSelectedConnections, conn.id)}
                />
              ))}
            </DraftSection>
          )}
        </div>
      )}
    </div>
  );
}