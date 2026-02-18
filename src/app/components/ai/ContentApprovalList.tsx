import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AIGeneratePanel } from './AIGeneratePanel';
import {
  FileText, Loader2, RefreshCw, Clock, CheckCircle2, Tag,
  BookOpen, HelpCircle, Plus, ChevronRight
} from 'lucide-react';

interface Draft {
  id: string;
  status: string;
  course_id?: string;
  summary_id?: string;
  generated_at: string;
  keywords: any[];
  flashcards: any[];
  quiz_questions: any[];
  suggested_connections: any[];
}

export function ContentApprovalList() {
  const { apiFetch } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/ai/drafts');
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const pendingDrafts = drafts.filter((d) => d.status === 'pending_review');
  const processedDrafts = drafts.filter((d) => d.status === 'processed');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Conteudo Gerado por IA</h2>
          <p className="text-sm text-gray-500 mt-1">
            Revise e aprove o conteudo gerado pela IA antes de publicar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDrafts}
            disabled={loading}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Gerar Novo
          </button>
        </div>
      </div>

      {/* Generator */}
      {showGenerator && (
        <div className="mb-6">
          <AIGeneratePanel
            onApprovalComplete={() => {
              setShowGenerator(false);
              loadDrafts();
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Pending drafts */}
      {!loading && pendingDrafts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendentes ({pendingDrafts.length})
          </h3>
          <div className="space-y-3">
            {pendingDrafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <button
                  onClick={() => setSelectedDraft(selectedDraft === draft.id ? null : draft.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-amber-50/50 transition text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Rascunho {draft.id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(draft.generated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {draft.keywords.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {draft.flashcards.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> {draft.quiz_questions.length}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedDraft === draft.id ? 'rotate-90' : ''}`} />
                </button>

                {selectedDraft === draft.id && (
                  <div className="border-t border-amber-200 p-4">
                    <AIGeneratePanel
                      courseId={draft.course_id}
                      summaryId={draft.summary_id || undefined}
                      onApprovalComplete={() => {
                        setSelectedDraft(null);
                        loadDrafts();
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed drafts */}
      {!loading && processedDrafts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Processados ({processedDrafts.length})
          </h3>
          <div className="space-y-2">
            {processedDrafts.map((draft) => (
              <div key={draft.id} className="flex items-center gap-4 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">Rascunho {draft.id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-500">{new Date(draft.generated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && drafts.length === 0 && !showGenerator && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Nenhum conteudo gerado ainda</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Gerar Novo" para comecar</p>
        </div>
      )}
    </div>
  );
}
