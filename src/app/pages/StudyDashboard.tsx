// ============================================================
// Axon v4.4 — Study Dashboard (Dev 5)
// Student study area — browse approved content, study summaries
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/api-provider';
import { RequireAuth } from '../components/guards/RequireAuth';
import { AxonLogo } from '../components/AxonLogo';
import {
  BookOpen,
  FileText,
  Tag,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  Brain,
  Sparkles,
} from 'lucide-react';

interface Course { id: string; name: string; description?: string; }
interface Semester { id: string; name: string; course_id: string; }
interface Section { id: string; name: string; semester_id: string; }
interface Topic { id: string; name: string; section_id: string; }
interface Summary { id: string; title: string; content: string; topic_id: string; status: string; }
interface Keyword { id: string; term: string; definition: string; topic_id: string; }

function StudyDashboardContent() {
  const { user, logout, currentInstitution } = useAuth();
  const { api } = useApi();

  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<'summaries' | 'keywords'>('summaries');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, semRes, secRes, tRes, sRes, kRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get('/semesters'),
        api.get('/sections'),
        api.get('/topics'),
        api.get('/summaries'),
        api.get('/keywords'),
      ]);

      const parse = async (r: PromiseSettledResult<Response>, key: string) => {
        if (r.status === 'fulfilled' && r.value.ok) {
          const d = await r.value.json();
          return d[key] || [];
        }
        return [];
      };

      setCourses(await parse(cRes, 'courses'));
      setSemesters(await parse(semRes, 'semesters'));
      setSections(await parse(secRes, 'sections'));
      setTopics(await parse(tRes, 'topics'));
      setSummaries(await parse(sRes, 'summaries'));
      setKeywords(await parse(kRes, 'keywords'));
    } catch (err) {
      console.log('[StudyDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  // Only show approved summaries to students
  const approvedSummaries = summaries.filter(s => s.status === 'approved');
  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  const topicSummaries = approvedSummaries.filter(s => s.topic_id === selectedTopicId);
  const topicKeywords = keywords.filter(k => k.topic_id === selectedTopicId);

  // Search filter
  const filteredTopics = searchQuery.trim()
    ? topics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-teal-500" />
          <p className="text-sm text-gray-500">Carregando area de estudo...</p>
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
            <h1 className="text-sm font-bold text-gray-900">Axon Estudo</h1>
            <p className="text-xs text-gray-400">{currentInstitution?.name || 'Area do aluno'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar topico..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
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

      {/* Welcome banner */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Sparkles size={24} />
            <div>
              <h2 className="text-lg font-bold">Ola, {user?.name?.split(' ')[0] || 'aluno'}!</h2>
              <p className="text-sm text-teal-100">
                {approvedSummaries.length} resumos disponiveis para estudo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search results (mobile) */}
      <div className="px-4 sm:px-6 pt-3 sm:hidden">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar topico..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Search results */}
      {filteredTopics && (
        <div className="px-4 sm:px-6 pt-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">
              Resultados para "{searchQuery}" ({filteredTopics.length})
            </h3>
            {filteredTopics.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum topico encontrado</p>
            ) : (
              <div className="space-y-1">
                {filteredTopics.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTopicId(t.id); setSearchQuery(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 rounded-lg transition-colors text-left"
                  >
                    <BookOpen size={14} className="text-teal-500 flex-shrink-0" />
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Content tree */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-[calc(100vh-320px)] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen size={14} />
              Conteudo
            </h3>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <Brain size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Nenhum conteudo disponivel ainda</p>
              </div>
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
                                              {secTopics.map(topic => {
                                                const topicApproved = approvedSummaries.filter(s => s.topic_id === topic.id).length;
                                                return (
                                                  <button
                                                    key={topic.id}
                                                    onClick={() => setSelectedTopicId(topic.id)}
                                                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-lg ${
                                                      selectedTopicId === topic.id
                                                        ? 'bg-teal-50 text-teal-700 font-medium'
                                                        : 'text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                  >
                                                    <span className="flex items-center gap-2 truncate">
                                                      <BookOpen size={10} />
                                                      <span className="truncate">{topic.name}</span>
                                                    </span>
                                                    {topicApproved > 0 && (
                                                      <span className="text-[10px] bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-full">
                                                        {topicApproved}
                                                      </span>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                              {secTopics.length === 0 && (
                                                <p className="text-xs text-gray-400 px-3 py-1">Sem topicos</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Study area */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTopic ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900">{selectedTopic.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setActiveTab('summaries')}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        activeTab === 'summaries'
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText size={12} />
                        Resumos ({topicSummaries.length})
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('keywords')}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        activeTab === 'keywords'
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag size={12} />
                        Palavras-chave ({topicKeywords.length})
                      </span>
                    </button>
                  </div>
                </div>

                {activeTab === 'summaries' && (
                  <div className="space-y-3">
                    {topicSummaries.length === 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                        <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhum resumo aprovado para este topico</p>
                      </div>
                    ) : (
                      topicSummaries.map(s => (
                        <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={14} className="text-green-500" />
                            <h4 className="text-sm font-semibold text-gray-900">{s.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {s.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'keywords' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    {topicKeywords.length === 0 ? (
                      <div className="text-center py-6">
                        <Tag size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhuma palavra-chave para este topico</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topicKeywords.map(k => (
                          <div key={k.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full border border-teal-100 font-medium flex-shrink-0">
                                {k.term}
                              </span>
                              <p className="text-sm text-gray-600">{k.definition}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <Brain size={48} className="text-gray-300 mb-4" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">Pronto para estudar?</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Selecione um topico na arvore de conteudo para comecar a estudar os resumos e palavras-chave.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudyDashboard() {
  return (
    <RequireAuth>
      <StudyDashboardContent />
    </RequireAuth>
  );
}
