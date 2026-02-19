// ============================================================
// Axon v4.4 — Professor Dashboard (Dev 5)
// Dashboard for professors — manage content, view summaries
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useContentData } from '../hooks/useContentData';
import { RequireAuth } from '../components/guards/RequireAuth';
import { AxonLogo } from '../components/AxonLogo';
import {
  BookOpen,
  FileText,
  Tag,
  Plus,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Loader2,
  LogOut,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../lib/api-provider';

function ProfessorDashboardContent() {
  const { user, logout, currentInstitution, currentMembership } = useAuth();
  const { api } = useApi();
  const navigate = useNavigate();
  const {
    courses, semesters, sections, topics, summaries,
    loading, refresh,
  } = useContentData({
    include: ['courses', 'semesters', 'sections', 'topics', 'summaries'],
  });

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // New summary form
  const [showNewSummary, setShowNewSummary] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  const topicSummaries = summaries.filter(s => s.topic_id === selectedTopicId);
  const pendingCount = summaries.filter(s => s.status === 'pending').length;
  const approvedCount = summaries.filter(s => s.status === 'approved').length;

  const handleSubmitSummary = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedTopicId) {
      toast.error('Preencha titulo e conteudo');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/summaries', {
        title: newTitle,
        content: newContent,
        topic_id: selectedTopicId,
        status: 'pending',
      });
      if (res.ok) {
        toast.success('Resumo enviado para aprovacao!');
        setNewTitle('');
        setNewContent('');
        setShowNewSummary(false);
        refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erro ao criar resumo');
      }
    } catch {
      toast.error('Erro de conexao');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const cfg: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-600', label: 'Rascunho' },
      pending: { color: 'bg-amber-100 text-amber-700', label: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-700', label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeitado' },
    };
    const c = cfg[status] || cfg.draft;
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.color}`}>{c.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-teal-500" />
          <p className="text-sm text-gray-500">Carregando painel do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <AxonLogo size="sm" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-gray-900">Axon Professor</h1>
            <p className="text-xs text-gray-400">{currentInstitution?.name || 'Professor'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'P'}
              </span>
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cursos', value: courses.length, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Topicos', value: topics.length, icon: BookOpen, color: 'text-teal-600 bg-teal-50' },
            { label: 'Pendentes', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Aprovados', value: approvedCount, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Content tree */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-[calc(100vh-260px)] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen size={14} />
              Conteudo
            </h3>
            {courses.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nenhum curso encontrado</p>
            ) : (
              <div className="space-y-0.5">
                {courses.map(course => {
                  const courseSems = semesters.filter(s => s.course_id === course.id);
                  const isExp = expandedCourses.has(course.id);
                  return (
                    <div key={course.id}>
                      <button
                        onClick={() => toggle(expandedCourses, course.id, setExpandedCourses)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <GraduationCap size={14} className="text-indigo-500" />
                        <span className="truncate">{course.name}</span>
                      </button>
                      {isExp && (
                        <div className="ml-4">
                          {courseSems.map(sem => {
                            const semSecs = sections.filter(s => s.semester_id === sem.id);
                            const semExp = expandedSemesters.has(sem.id);
                            return (
                              <div key={sem.id}>
                                <button
                                  onClick={() => toggle(expandedSemesters, sem.id, setExpandedSemesters)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                                >
                                  {semExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  <span className="truncate">{sem.name}</span>
                                </button>
                                {semExp && (
                                  <div className="ml-4">
                                    {semSecs.map(sec => {
                                      const secTopics = topics.filter(t => t.section_id === sec.id);
                                      const secExp = expandedSections.has(sec.id);
                                      return (
                                        <div key={sec.id}>
                                          <button
                                            onClick={() => toggle(expandedSections, sec.id, setExpandedSections)}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg"
                                          >
                                            {secExp ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                            <span className="truncate">{sec.name}</span>
                                          </button>
                                          {secExp && (
                                            <div className="ml-4">
                                              {secTopics.map(topic => (
                                                <button
                                                  key={topic.id}
                                                  onClick={() => setSelectedTopicId(topic.id)}
                                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg ${
                                                    selectedTopicId === topic.id
                                                      ? 'bg-teal-50 text-teal-700 font-medium'
                                                      : 'text-gray-500 hover:bg-gray-50'
                                                  }`}
                                                >
                                                  <BookOpen size={10} />
                                                  <span className="truncate">{topic.name}</span>
                                                </button>
                                              ))}
                                              {secTopics.length === 0 && (
                                                <p className="text-xs text-gray-400 px-3 py-1">Sem topicos</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {semSecs.length === 0 && (
                                      <p className="text-xs text-gray-400 px-3 py-1">Sem secoes</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {courseSems.length === 0 && (
                            <p className="text-xs text-gray-400 px-3 py-1">Sem semestres</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic detail */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTopic ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{selectedTopic.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{topicSummaries.length} resumo(s)</p>
                    </div>
                    <button
                      onClick={() => setShowNewSummary(!showNewSummary)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Plus size={14} />
                      Novo resumo
                    </button>
                  </div>
                </div>

                {/* New summary form */}
                {showNewSummary && (
                  <div className="bg-white rounded-xl border border-teal-200 p-5 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Novo resumo</h4>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Titulo do resumo"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <textarea
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="Conteudo do resumo..."
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setShowNewSummary(false)}
                        className="px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmitSummary}
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                      >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Enviar para aprovacao
                      </button>
                    </div>
                  </div>
                )}

                {/* Summaries list */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={14} />
                    Resumos
                  </h4>
                  {topicSummaries.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhum resumo para este topico</p>
                  ) : (
                    <div className="space-y-2">
                      {topicSummaries.map(s => (
                        <div key={s.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">{(s as any).title || s.id}</span>
                            {statusBadge(s.status)}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{(s as any).content || s.content_markdown}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <BookOpen size={40} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  Selecione um topico na arvore para ver e criar resumos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfessorDashboard() {
  return (
    <RequireAuth>
      <ProfessorDashboardContent />
    </RequireAuth>
  );
}
