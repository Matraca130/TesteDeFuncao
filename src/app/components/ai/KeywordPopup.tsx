import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AIChatPanel } from './AIChatPanel';
import {
  X, Loader2, BookOpen, HelpCircle, Link2, MessageCircle,
  Layers, ChevronRight, ExternalLink
} from 'lucide-react';

interface KeywordPopupData {
  keyword: { id: string; term: string; definition: string; priority: number; course_id?: string };
  subtopics: { id: string; title: string; description?: string }[];
  subtopic_states: (any | null)[];
  related_keywords: { keyword: { id: string; term: string; definition: string }; connection_label: string }[];
  chat_history: { messages: { role: string; content: string; timestamp: string }[] } | null;
  flashcard_count: number;
  quiz_count: number;
}

interface KeywordPopupProps {
  keywordId: string;
  onClose: () => void;
  onNavigateToKeyword?: (keywordId: string) => void;
}

export function KeywordPopup({ keywordId, onClose, onNavigateToKeyword }: KeywordPopupProps) {
  const { apiFetch } = useAuth();
  const [data, setData] = useState<KeywordPopupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

  useEffect(() => { loadData(); }, [keywordId]);

  async function loadData() {
    setLoading(true); setError('');
    try { const result = await apiFetch(`/keyword-popup/${keywordId}`); setData(result); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  function getMasteryColor(state: any): string {
    if (!state) return 'bg-gray-200 text-gray-500';
    const p = state.p_known || state.mastery || 0;
    if (p >= 0.8) return 'bg-green-100 text-green-700 border-green-200';
    if (p >= 0.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }

  function getPriorityLabel(p: number) {
    switch (p) {
      case 0: return { text: 'Critico', cls: 'bg-red-100 text-red-700' };
      case 1: return { text: 'Alto', cls: 'bg-orange-100 text-orange-700' };
      case 2: return { text: 'Medio', cls: 'bg-blue-100 text-blue-700' };
      default: return { text: 'Baixo', cls: 'bg-gray-100 text-gray-600' };
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex-1 min-w-0">
            {loading ? <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" /> : data ? (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{data.keyword.term}</h2>
                {data.keyword.priority !== undefined && <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityLabel(data.keyword.priority).cls}`}>{getPriorityLabel(data.keyword.priority).text}</span>}
              </div>
            ) : <h2 className="text-lg font-bold text-red-600">Erro ao carregar</h2>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex border-b border-gray-100 px-6">
          <button onClick={() => setActiveTab('info')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === 'info' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Informacoes</button>
          <button onClick={() => setActiveTab('chat')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MessageCircle className="w-3.5 h-3.5" />Chat AI</button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (<div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>) :
          error ? (<div className="p-6 text-center"><p className="text-red-600 text-sm">{error}</p><button onClick={loadData} className="mt-3 text-sm text-indigo-600 hover:underline">Tentar novamente</button></div>) :
          data && activeTab === 'info' ? (
            <div className="p-6 space-y-6">
              <div><h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Definicao</h3><p className="text-sm text-gray-700 leading-relaxed">{data.keyword.definition}</p></div>
              {data.subtopics.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers className="w-4 h-4" />Sub-topicos ({data.subtopics.length})</h3>
                  <div className="space-y-2">
                    {data.subtopics.map((st, i) => {
                      const state = data.subtopic_states?.[i];
                      return (
                        <div key={st.id} className={`flex items-start gap-3 p-3 rounded-xl border ${getMasteryColor(state)}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{st.title}</p>
                            {st.description && <p className="text-xs opacity-75 mt-0.5">{st.description}</p>}
                          </div>
                          {state ? <span className="text-xs font-medium">{Math.round((state.p_known || state.mastery || 0) * 100)}%</span> : <span className="text-xs italic">Nao avaliado</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100"><BookOpen className="w-5 h-5 text-blue-500" /><div><p className="text-lg font-bold text-blue-700">{data.flashcard_count}</p><p className="text-xs text-blue-500">Flashcards</p></div></div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100"><HelpCircle className="w-5 h-5 text-purple-500" /><div><p className="text-lg font-bold text-purple-700">{data.quiz_count}</p><p className="text-xs text-purple-500">Questoes Quiz</p></div></div>
              </div>
              {data.related_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Link2 className="w-4 h-4" />Keywords Relacionadas ({data.related_keywords.length})</h3>
                  <div className="space-y-2">
                    {data.related_keywords.map((rel, i) => (
                      <button key={i} onClick={() => onNavigateToKeyword?.(rel.keyword.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{rel.keyword.term}</span><span className="text-xs text-gray-400">({rel.connection_label})</span></div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rel.keyword.definition}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : data && activeTab === 'chat' ? (
            <div className="h-[400px]"><AIChatPanel keywordId={keywordId} keywordTerm={data.keyword.term} initialMessages={data.chat_history?.messages || []} /></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
