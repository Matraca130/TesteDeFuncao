// ============================================================
// Axon v4.4 — Legacy Admin Panel
// Extracted from the original monolithic App.tsx
// Auth is handled by guards (RequireAuth + RequireRole in AdminLayout)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/api-provider';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  FileText,
  Tag,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Stethoscope,
  GraduationCap,
  Building2,
  BarChart3,
  Loader2,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
interface Course {
  id: string;
  name: string;
  description?: string;
  institution_id?: string;
}

interface Semester {
  id: string;
  name: string;
  course_id: string;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface Topic {
  id: string;
  name: string;
  section_id: string;
}

interface Summary {
  id: string;
  title: string;
  content: string;
  topic_id: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

interface Keyword {
  id: string;
  term: string;
  definition: string;
  topic_id: string;
}

// ── Navigation Items ───────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'content', label: 'Conteudo', icon: BookOpen },
  { id: 'members', label: 'Membros', icon: Users },
  { id: 'approvals', label: 'Aprovacoes', icon: CheckCircle },
  { id: 'diagnostics', label: 'Diagnosticos', icon: Stethoscope },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

// ── Axon Logo ──────────────────────────────────────────────
function AxonLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg`}
    >
      <span className="text-white font-black">A</span>
    </div>
  );
}

// ── Overview Dashboard ─────────────────────────────────────
function OverviewDashboard({
  courses,
  summaries,
}: {
  courses: Course[];
  summaries: Summary[];
}) {
  const pendingCount = summaries.filter((s) => s.status === 'pending').length;
  const approvedCount = summaries.filter((s) => s.status === 'approved').length;

  const stats = [
    {
      label: 'Cursos',
      value: courses.length,
      icon: GraduationCap,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Resumos',
      value: summaries.length,
      icon: FileText,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      label: 'Pendentes',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Aprovados',
      value: approvedCount,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Visao Geral</h2>
        <p className="text-sm text-gray-500 mt-1">
          Resumo da sua instituicao
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Atividade Recente
        </h3>
        {summaries.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma atividade recente</p>
        ) : (
          <div className="space-y-3">
            {summaries.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{s.title}</span>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-gray-100 text-gray-600', label: 'Rascunho' },
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pendente' },
    approved: { color: 'bg-green-100 text-green-700', label: 'Aprovado' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeitado' },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

// ── Content Tree ───────────────────────────────────────────
function ContentTree({
  courses,
  semesters,
  sections,
  topics,
  onSelectTopic,
  selectedTopicId,
}: {
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  topics: Topic[];
  onSelectTopic: (topicId: string) => void;
  selectedTopicId: string | null;
}) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <div className="space-y-1">
      {courses.map((course) => {
        const courseSemesters = semesters.filter((s) => s.course_id === course.id);
        const isExpanded = expandedCourses.has(course.id);
        return (
          <div key={course.id}>
            <button
              onClick={() => toggle(expandedCourses, course.id, setExpandedCourses)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <GraduationCap size={14} className="text-indigo-500" />
              <span className="truncate">{course.name}</span>
            </button>
            {isExpanded && (
              <div className="ml-4">
                {courseSemesters.map((semester) => {
                  const semSections = sections.filter((s) => s.semester_id === semester.id);
                  const semExpanded = expandedSemesters.has(semester.id);
                  return (
                    <div key={semester.id}>
                      <button
                        onClick={() =>
                          toggle(expandedSemesters, semester.id, setExpandedSemesters)
                        }
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {semExpanded ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                        <span className="truncate">{semester.name}</span>
                      </button>
                      {semExpanded && (
                        <div className="ml-4">
                          {semSections.map((section) => {
                            const secTopics = topics.filter(
                              (t) => t.section_id === section.id
                            );
                            const secExpanded = expandedSections.has(section.id);
                            return (
                              <div key={section.id}>
                                <button
                                  onClick={() =>
                                    toggle(
                                      expandedSections,
                                      section.id,
                                      setExpandedSections
                                    )
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  {secExpanded ? (
                                    <ChevronDown size={10} />
                                  ) : (
                                    <ChevronRight size={10} />
                                  )}
                                  <span className="truncate">{section.name}</span>
                                </button>
                                {secExpanded && (
                                  <div className="ml-4">
                                    {secTopics.map((topic) => (
                                      <button
                                        key={topic.id}
                                        onClick={() => onSelectTopic(topic.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
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
                                      <p className="text-xs text-gray-400 px-3 py-1">
                                        Sem topicos
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {semSections.length === 0 && (
                            <p className="text-xs text-gray-400 px-3 py-1">
                              Sem secoes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {courseSemesters.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-1">Sem semestres</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {courses.length === 0 && (
        <p className="text-sm text-gray-400 px-3 py-2">Nenhum curso encontrado</p>
      )}
    </div>
  );
}

// ── Content Manager Section ────────────────────────────────
function ContentManagerSection({
  courses,
  semesters,
  sections,
  topics,
  summaries,
  keywords,
}: {
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  topics: Topic[];
  summaries: Summary[];
  keywords: Keyword[];
}) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const topicSummaries = summaries.filter((s) => s.topic_id === selectedTopicId);
  const topicKeywords = keywords.filter((k) => k.topic_id === selectedTopicId);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Conteudo</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie cursos, semestres, secoes e topicos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen size={14} />
            Arvore de Conteudo
          </h3>
          <ContentTree
            courses={courses}
            semesters={semesters}
            sections={sections}
            topics={topics}
            onSelectTopic={setSelectedTopicId}
            selectedTopicId={selectedTopicId}
          />
        </div>

        {/* Content detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTopic ? (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {selectedTopic.name}
                </h3>
                <p className="text-xs text-gray-400">
                  Topico selecionado - {topicSummaries.length} resumo(s), {topicKeywords.length} palavra(s)-chave
                </p>
              </div>

              {/* Summaries */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  Resumos ({topicSummaries.length})
                </h4>
                {topicSummaries.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum resumo para este topico</p>
                ) : (
                  <div className="space-y-3">
                    {topicSummaries.map((s) => (
                      <div
                        key={s.id}
                        className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {s.title}
                          </span>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {s.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag size={14} />
                  Palavras-chave ({topicKeywords.length})
                </h4>
                {topicKeywords.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Nenhuma palavra-chave para este topico
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topicKeywords.map((k) => (
                      <div
                        key={k.id}
                        className="bg-teal-50 text-teal-700 text-xs px-3 py-1.5 rounded-full border border-teal-100"
                        title={k.definition}
                      >
                        {k.term}
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
                Selecione um topico na arvore para ver seu conteudo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Approval Queue Section ─────────────────────────────────
function ApprovalsSection({ summaries }: { summaries: Summary[] }) {
  const pending = summaries.filter((s) => s.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Aprovacoes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Revise e aprove resumos pendentes
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
          <CheckCircle size={40} className="text-green-300 mb-3" />
          <p className="text-sm text-gray-500">Nenhum resumo pendente de aprovacao</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{s.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{s.content}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <CheckCircle size={16} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Members Section ────────────────────────────────────────
function MembersSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Membros</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie membros da instituicao
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
        <Users size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          Gerenciamento de membros em construcao
        </p>
      </div>
    </div>
  );
}

// ── Diagnostics Section ────────────────────────────────────
function DiagnosticsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Diagnosticos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ferramentas de diagnostico do sistema
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
        <Stethoscope size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          Diagnosticos em construcao
        </p>
      </div>
    </div>
  );
}

// ── Settings Section ───────────────────────────────────────
function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuracoes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure sua instituicao
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
        <Settings size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          Configuracoes em construcao
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT — LegacyAdminPanel
// ════════════════════════════════════════════════════════════
export default function LegacyAdminPanel() {
  const { user, logout, currentInstitution } = useAuth();
  const { api } = useApi();

  // ── State ──
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ── Data ──
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  // ── Fetch all data ──
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [coursesRes, semestersRes, sectionsRes, topicsRes, summariesRes, keywordsRes] =
        await Promise.allSettled([
          api.get('/courses'),
          api.get('/semesters'),
          api.get('/sections'),
          api.get('/topics'),
          api.get('/summaries'),
          api.get('/keywords'),
        ]);

      const parse = async (result: PromiseSettledResult<Response>, key: string) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          const data = await result.value.json();
          return data[key] || data || [];
        }
        return [];
      };

      setCourses(await parse(coursesRes, 'courses'));
      setSemesters(await parse(semestersRes, 'semesters'));
      setSections(await parse(sectionsRes, 'sections'));
      setTopics(await parse(topicsRes, 'topics'));
      setSummaries(await parse(summariesRes, 'summaries'));
      setKeywords(await parse(keywordsRes, 'keywords'));
    } catch (err) {
      console.log('[LegacyAdminPanel] Error fetching data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Render active section ──
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewDashboard courses={courses} summaries={summaries} />;
      case 'content':
        return (
          <ContentManagerSection
            courses={courses}
            semesters={semesters}
            sections={sections}
            topics={topics}
            summaries={summaries}
            keywords={keywords}
          />
        );
      case 'members':
        return <MembersSection />;
      case 'approvals':
        return <ApprovalsSection summaries={summaries} />;
      case 'diagnostics':
        return <DiagnosticsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewDashboard courses={courses} summaries={summaries} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex">
      {/* ── Sidebar ── */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <AxonLogo size="sm" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">Axon</h1>
                <p className="text-xs text-gray-400 truncate">
                  {currentInstitution?.name || 'Admin Panel'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeSection === item.id
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LayoutDashboard size={18} />
            </button>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Admin'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoadingData}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={isLoadingData ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin text-teal-500" />
                <p className="text-sm text-gray-500">Carregando dados...</p>
              </div>
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </main>
    </div>
  );
}
