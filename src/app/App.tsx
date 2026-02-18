// ============================================================
// Axon v4.4 — Admin Panel (Dev 1, FASE 2)
// Content Management: Courses, Content Tree, Summaries,
// Keywords, Approval Queue
// Wired to LIVE backend via useApi()
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import {
  GraduationCap, TreePine, FileText, Tag,
  CheckSquare, ChevronRight, Shield, Menu, X,
  LayoutDashboard, BookOpen, Layers, Clock,
  CheckCircle, AlertTriangle, Loader2, Wifi, WifiOff, LogOut,
  Activity,
} from 'lucide-react';

// API
import { ApiProvider, useApi } from './lib/api-provider';

// Components
import { CourseManager } from './components/admin/CourseManager';
import { ContentTree } from './components/admin/ContentTree';
import { SummaryEditor } from './components/admin/SummaryEditor';
import { KeywordManager } from './components/admin/KeywordManager';
import { ApprovalQueue } from './components/admin/ApprovalQueue';
import { AuthScreen, type AuthUser, type AuthResult } from './components/admin/AuthScreen';
import { DiagnosticsPanel } from './components/admin/DiagnosticsPanel';

// Mock data (fallback)
import {
  MOCK_COURSES, MOCK_SEMESTERS, MOCK_SECTIONS, MOCK_TOPICS,
  MOCK_SUMMARIES, MOCK_KEYWORDS,
} from './lib/mock-data';
import type { Course, Semester, Section, Topic, Summary, Keyword, SubTopic, ApprovalItem, ContentStatus, KeywordConnection } from './lib/types';

// ── View types ──
type AdminView = 'overview' | 'courses' | 'content-tree' | 'summaries' | 'keywords' | 'approval' | 'diagnostics';

const NAV_ITEMS: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'courses', label: 'Cursos', icon: GraduationCap },
  { id: 'content-tree', label: 'Arvore de Conteudo', icon: TreePine },
  { id: 'summaries', label: 'Resumos', icon: FileText },
  { id: 'keywords', label: 'Keywords', icon: Tag },
  { id: 'approval', label: 'Aprovacao', icon: CheckSquare },
  { id: 'diagnostics', label: 'Diagnostico', icon: Activity },
];

const INST_ID = 'inst-001';

// ── AxonLogo ──
function AxonLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-200/50">
        <span className="text-white text-sm font-black tracking-tighter">A</span>
      </div>
      {!collapsed && (
        <div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">Axon</span>
          <span className="text-[10px] text-gray-400 ml-1 font-medium">Admin</span>
        </div>
      )}
    </div>
  );
}

// ── Overview Dashboard ──
function OverviewDashboard({
  courses, semesters, sections, topics, summaries, keywords, approvalItems,
  onNavigate, backendStatus,
}: {
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  topics: Topic[];
  summaries: Summary[];
  keywords: Keyword[];
  approvalItems: ApprovalItem[];
  onNavigate: (view: AdminView) => void;
  backendStatus: 'connected' | 'offline' | 'loading';
}) {
  const draftCount = approvalItems.filter(i => i.status === 'draft').length;
  const publishedSummaries = summaries.filter(s => s.status === 'published').length;
  const publishedKw = keywords.filter(k => k.status === 'published').length;
  const totalSubTopics = keywords.reduce((acc, k) => acc + (k.subtopics?.length || 0), 0);

  const stats = [
    { label: 'Cursos', value: courses.length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', onClick: () => onNavigate('courses') },
    { label: 'Semestres', value: semesters.length, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', onClick: () => onNavigate('content-tree') },
    { label: 'Secoes', value: sections.length, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50', onClick: () => onNavigate('content-tree') },
    { label: 'Topicos', value: topics.length, icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50', onClick: () => onNavigate('content-tree') },
    { label: 'Resumos', value: summaries.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', onClick: () => onNavigate('summaries') },
    { label: 'Keywords', value: keywords.length, icon: Tag, color: 'text-rose-600', bg: 'bg-rose-50', onClick: () => onNavigate('keywords') },
    { label: 'Sub-topicos', value: totalSubTopics, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', onClick: () => onNavigate('keywords') },
    { label: 'Pendentes', value: draftCount, icon: Clock, color: draftCount > 0 ? 'text-amber-600' : 'text-emerald-600', bg: draftCount > 0 ? 'bg-amber-50' : 'bg-emerald-50', onClick: () => onNavigate('approval') },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie a estrutura de conteudo academico do Axon.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border ${
          backendStatus === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          backendStatus === 'loading' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-gray-50 text-gray-500 border-gray-200'
        }`}>
          {backendStatus === 'connected' ? <Wifi size={12} /> : backendStatus === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
          {backendStatus === 'connected' ? 'Backend Live' : backendStatus === 'loading' ? 'Conectando...' : 'Modo Offline'}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button key={stat.label} onClick={stat.onClick}
              className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={18} className={stat.color} />
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pendentes de Aprovacao</h3>
            {draftCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <AlertTriangle size={10} /> {draftCount}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {approvalItems.filter(i => i.status === 'draft').slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600">
                <Clock size={12} className="text-amber-500" />
                <span className="flex-1 truncate">{item.title}</span>
                <span className="text-gray-400 text-[10px]">{item.entity_type}</span>
              </div>
            ))}
            {draftCount > 4 && <p className="text-[10px] text-gray-400">+{draftCount - 4} mais</p>}
          </div>
          <button onClick={() => onNavigate('approval')}
            className="mt-4 w-full py-2 text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors">
            Ver fila completa
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Status do Conteudo</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-sm text-gray-700">Resumos publicados</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{publishedSummaries}/{summaries.length}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${summaries.length > 0 ? (publishedSummaries / summaries.length) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-teal-500" />
                <span className="text-sm text-gray-700">Keywords publicadas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{publishedKw}/{keywords.length}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${keywords.length > 0 ? (publishedKw / keywords.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Inner App (has access to useApi) ──
function AdminPanel() {
  const { api } = useApi();

  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline' | 'loading'>('loading');

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // State
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [semesters, setSemesters] = useState<Semester[]>(MOCK_SEMESTERS);
  const [sections, setSections] = useState<Section[]>(MOCK_SECTIONS);
  const [topics, setTopics] = useState<Topic[]>(MOCK_TOPICS);
  const [summaries, setSummaries] = useState<Summary[]>(MOCK_SUMMARIES);
  const [keywords, setKeywords] = useState<Keyword[]>(MOCK_KEYWORDS);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<Course>(MOCK_COURSES[0]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // ── Restore session on mount ──
  useEffect(() => {
    const savedToken = localStorage.getItem('axon_token');
    if (!savedToken) {
      setAuthChecking(false);
      return;
    }
    api.setAuthToken(savedToken);
    api.get<{ user: AuthUser }>('/auth/me')
      .then((data) => {
        if (data?.user) {
          setAuthUser(data.user);
          console.log('[Auth] Session restored for', data.user.email);
        } else {
          localStorage.removeItem('axon_token');
          api.setAuthToken(null);
        }
      })
      .catch((err) => {
        console.log('[Auth] Session restore failed:', err);
        localStorage.removeItem('axon_token');
        api.setAuthToken(null);
      })
      .finally(() => setAuthChecking(false));
  }, [api]);

  // ── Auth handlers ──
  const handleSignIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    // Use publicPost to avoid sending a stale/expired authToken — signin doesn't need user JWT
    // IMPORTANTE: não fazemos auto-signup aqui. Se o login falhar, o erro sobe diretamente
    // para o AuthScreen, que exibe o feedback correto ao usuário (noAccountHint / mensagem de erro).
    const data = await api.publicPost<any, { user: AuthUser; access_token: string }>('/auth/signin', { email, password });
    if (!data?.access_token) throw new Error('No access token returned');
    localStorage.setItem('axon_token', data.access_token);
    api.setAuthToken(data.access_token);
    console.log('[Auth] Signed in successfully:', data.user.email);
    return data;
  }, [api]);

  const handleSignUp = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    // Use publicPost to avoid sending a stale/expired authToken — signup doesn't need user JWT
    const data = await api.publicPost<any, { user: AuthUser; access_token: string }>('/auth/signup', { email, password, name });
    if (!data?.access_token) throw new Error('No access token returned');
    localStorage.setItem('axon_token', data.access_token);
    api.setAuthToken(data.access_token);
    return data;
  }, [api]);

  const handleSignOut = useCallback(() => {
    api.post('/auth/signout').catch(() => {});
    localStorage.removeItem('axon_token');
    api.setAuthToken(null);
    setAuthUser(null);
  }, [api]);

  const handleAuthenticated = useCallback((result: AuthResult) => {
    setAuthUser(result.user);
  }, []);

  // ── Load ALL data from backend AFTER auth ──
  useEffect(() => {
    if (!authUser) return; // Skip if not authenticated
    let cancelled = false;

    async function loadFromBackend() {
      // ── JWT expiry tracking ──
      // Some backend endpoints validate JWT against Supabase; if the stored token
      // is expired, those calls fail with AUTH_EXPIRED. We track this via safeGet
      // so existing inner catch blocks keep working, and we sign out at the end.
      let jwtExpired = false;

      async function safeGet<T>(path: string, params?: Record<string, string>): Promise<T | null> {
        if (jwtExpired) return null; // short-circuit: stop making calls once expired
        try {
          return await api.get<T>(path, params);
        } catch (e: any) {
          if ((e?.message || '').startsWith('AUTH_EXPIRED')) {
            jwtExpired = true;
            return null; // absorb — callers check for null gracefully
          }
          throw e; // re-throw other errors to existing catch blocks
        }
      }

      // Hoisted accumulators for cross-block access
      let allSems: Semester[] = [];
      let allSecs: Section[] = [];
      let allTopics: Topic[] = [];
      let allSums: Summary[] = [];
      let loadedKeywords: Keyword[] = [];

      try {
        // Health check uses publicAnonKey (no user JWT needed, avoids Supabase JWT validation issues)
        const health = await api.publicGet<{ status: string }>('/health');
        if (cancelled) return;
        if (health?.status !== 'ok') {
          setBackendStatus('offline');
          return;
        }
        setBackendStatus('connected');
        console.log('[Admin] Backend connected');

        // Load courses
        try {
          const data = await safeGet<Course[]>('/courses', { institution_id: INST_ID });
          if (!cancelled && data && data.length > 0) {
            setCourses(data);
            setSelectedCourse(data[0]);
            console.log(`[Admin] Loaded ${data.length} courses`);

            for (const course of data) {
              try {
                const sems = await safeGet<Semester[]>('/semesters', { course_id: course.id });
                if (sems) allSems.push(...sems);

                for (const sem of (sems || [])) {
                  try {
                    const secs = await safeGet<Section[]>('/sections', { semester_id: sem.id });
                    if (secs) allSecs.push(...secs);

                    for (const sec of (secs || [])) {
                      try {
                        const tops = await safeGet<Topic[]>('/topics', { section_id: sec.id });
                        if (tops) allTopics.push(...tops);

                        for (const top of (tops || [])) {
                          try {
                            const sums = await safeGet<Summary[]>('/summaries', { topic_id: top.id });
                            if (sums) allSums.push(...sums);
                          } catch (_e) { /* no summaries for this topic */ }
                        }
                      } catch (_e) { /* no topics for this section */ }
                    }
                  } catch (_e) { /* no sections for this semester */ }
                }
              } catch (_e) { /* no semesters for this course */ }
            }

            if (!cancelled) {
              if (allSems.length > 0) { setSemesters(allSems); console.log(`[Admin] Loaded ${allSems.length} semesters`); }
              if (allSecs.length > 0) { setSections(allSecs); console.log(`[Admin] Loaded ${allSecs.length} sections`); }
              if (allTopics.length > 0) { setTopics(allTopics); console.log(`[Admin] Loaded ${allTopics.length} topics`); }
              if (allSums.length > 0) { setSummaries(allSums); console.log(`[Admin] Loaded ${allSums.length} summaries`); }
            }
          }
        } catch (e) { console.log('[Admin] Could not load content hierarchy:', e); }

        // Load keywords
        try {
          const data = await safeGet<Keyword[]>('/keywords', { institution_id: INST_ID });
          if (!cancelled && data && data.length > 0) {
            loadedKeywords = data;
            setKeywords(data);
            console.log(`[Admin] Loaded ${data.length} keywords`);
          }
        } catch (e) { console.log('[Admin] Could not load keywords:', e); }

        // Load approval queue — try dedicated endpoint first, then derive from loaded data
        try {
          const data = await safeGet<ApprovalItem[]>('/content/approval-queue');
          if (!cancelled && data && data.length > 0) {
            setApprovalItems(data);
            console.log(`[Admin] Loaded ${data.length} approval items from endpoint`);
          }
        } catch (e) {
          // Fallback: derive approval items from summaries + keywords + subtopics
          console.log('[Admin] Approval endpoint not available, deriving from loaded data');
          if (!cancelled) {
            const derived: ApprovalItem[] = [];

            // Add summaries
            for (const sum of allSums.length > 0 ? allSums : MOCK_SUMMARIES) {
              const topicObj = (allTopics.length > 0 ? allTopics : MOCK_TOPICS).find(t => t.id === sum.topic_id);
              const heading = sum.content_markdown.match(/^# (.+)$/m)?.[1];
              derived.push({
                entity_type: 'summary',
                id: sum.id,
                title: heading || topicObj?.name || 'Resumo',
                status: sum.status,
                source: 'manual',
                created_at: sum.created_at,
                parent_info: topicObj ? `Topico: ${topicObj.name}` : undefined,
              });
            }

            // Add keywords
            const kwList = loadedKeywords.length > 0 ? loadedKeywords : MOCK_KEYWORDS;
            for (const kw of kwList) {
              derived.push({
                entity_type: 'keyword',
                id: kw.id,
                title: kw.term,
                status: kw.status,
                source: kw.source || 'manual',
                created_at: kw.created_at,
              });

              // Add subtopics from this keyword
              for (const st of (kw.subtopics || [])) {
                derived.push({
                  entity_type: 'subtopic',
                  id: st.id,
                  title: `${st.title} (${kw.term})`,
                  status: st.status || 'draft',
                  source: st.source || 'manual',
                  created_at: st.created_at || kw.created_at,
                  parent_info: `Keyword: ${kw.term}`,
                });
              }
            }

            setApprovalItems(derived);
            console.log(`[Admin] Derived ${derived.length} approval items from loaded data`);
          }
        }

        // ── JWT expiry: sign out gracefully after all loads complete ──
        if (jwtExpired && !cancelled) {
          console.log('[Admin] JWT expired during data load — clearing session, please log in again.');
          localStorage.removeItem('axon_token');
          api.setAuthToken(null);
          setAuthUser(null);
        }

      } catch (err) {
        if (!cancelled) {
          console.log('[Admin] Backend not reachable, using mock data:', err);
          setBackendStatus('offline');
        }
      }
    }

    loadFromBackend();
    return () => { cancelled = true; };
  }, [api, authUser]);

  const draftCount = approvalItems.filter(i => i.status === 'draft').length;

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveView('content-tree');
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setActiveView('summaries');
  };

  // ── Course CRUD callbacks ──
  const handleCreateCourse = useCallback(async (data: { name: string; description: string | null; color: string }) => {
    try {
      const newCourse = await api.post<any, Course>('/courses', {
        institution_id: INST_ID, ...data,
      });
      return newCourse;
    } catch (err) {
      console.error('[Admin] Failed to create course:', err);
      return null;
    }
  }, [api]);

  const handleUpdateCourse = useCallback(async (id: string, data: { name: string; description: string | null; color: string }) => {
    try {
      return await api.put<any, Course>(`/courses/${id}`, data);
    } catch (err) {
      console.error('[Admin] Failed to update course:', err);
      return null;
    }
  }, [api]);

  const handleDeleteCourse = useCallback(async (id: string) => {
    try { await api.del(`/courses/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete course:', err); return false; }
  }, [api]);

  // ── Semester CRUD callbacks ──
  const handleCreateSemester = useCallback(async (data: { course_id: string; name: string; order_index: number }) => {
    try { return await api.post<any, Semester>('/semesters', data); }
    catch (err) { console.error('[Admin] Failed to create semester:', err); return null; }
  }, [api]);

  const handleUpdateSemester = useCallback(async (id: string, data: { name: string }) => {
    try { return await api.put<any, Semester>(`/semesters/${id}`, data); }
    catch (err) { console.error('[Admin] Failed to update semester:', err); return null; }
  }, [api]);

  const handleDeleteSemester = useCallback(async (id: string) => {
    try { await api.del(`/semesters/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete semester:', err); return false; }
  }, [api]);

  // ── Section CRUD callbacks ──
  const handleCreateSection = useCallback(async (data: { semester_id: string; name: string; order_index: number }) => {
    try { return await api.post<any, Section>('/sections', { ...data, image_url: null }); }
    catch (err) { console.error('[Admin] Failed to create section:', err); return null; }
  }, [api]);

  const handleUpdateSection = useCallback(async (id: string, data: { name: string }) => {
    try { return await api.put<any, Section>(`/sections/${id}`, data); }
    catch (err) { console.error('[Admin] Failed to update section:', err); return null; }
  }, [api]);

  const handleDeleteSection = useCallback(async (id: string) => {
    try { await api.del(`/sections/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete section:', err); return false; }
  }, [api]);

  // ── Topic CRUD callbacks ──
  const handleCreateTopic = useCallback(async (data: { section_id: string; name: string; order_index: number }) => {
    try { return await api.post<any, Topic>('/topics', data); }
    catch (err) { console.error('[Admin] Failed to create topic:', err); return null; }
  }, [api]);

  const handleUpdateTopic = useCallback(async (id: string, data: { name: string }) => {
    try { return await api.put<any, Topic>(`/topics/${id}`, data); }
    catch (err) { console.error('[Admin] Failed to update topic:', err); return null; }
  }, [api]);

  const handleDeleteTopic = useCallback(async (id: string) => {
    try { await api.del(`/topics/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete topic:', err); return false; }
  }, [api]);

  // ── Summary CRUD callbacks ──
  const handleCreateSummary = useCallback(async (data: { topic_id: string; course_id: string; content_markdown: string }) => {
    try {
      return await api.post<any, Summary>('/summaries', {
        ...data, institution_id: INST_ID, status: 'draft',
      });
    }
    catch (err) { console.error('[Admin] Failed to create summary:', err); return null; }
  }, [api]);

  const handleUpdateSummary = useCallback(async (id: string, data: { content_markdown: string }) => {
    try { return await api.put<any, Summary>(`/summaries/${id}`, data); }
    catch (err) { console.error('[Admin] Failed to update summary:', err); return null; }
  }, [api]);

  // Gap 4: Delete summary
  const handleDeleteSummary = useCallback(async (id: string) => {
    try { await api.del(`/summaries/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete summary:', err); return false; }
  }, [api]);

  // ── Keyword CRUD callbacks ──
  const handleCreateKeyword = useCallback(async (data: { term: string; definition: string | null; priority: number }) => {
    try {
      return await api.post<any, Keyword>('/keywords', {
        ...data, institution_id: INST_ID, status: 'draft', source: 'professor',
      });
    }
    catch (err) { console.error('[Admin] Failed to create keyword:', err); return null; }
  }, [api]);

  const handleUpdateKeyword = useCallback(async (id: string, data: Record<string, unknown>) => {
    try { return await api.put<any, Keyword>(`/keywords/${id}`, data); }
    catch (err) { console.error('[Admin] Failed to update keyword:', err); return null; }
  }, [api]);

  const handleDeleteKeyword = useCallback(async (id: string) => {
    try { await api.del(`/keywords/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete keyword:', err); return false; }
  }, [api]);

  // ── SubTopic CRUD callbacks ──
  const handleCreateSubTopic = useCallback(async (data: { keyword_id: string; title: string; description: string | null }) => {
    try { return await api.post<any, any>('/subtopics', { ...data, status: 'draft', source: 'professor' }); }
    catch (err) { console.error('[Admin] Failed to create subtopic:', err); return null; }
  }, [api]);

  const handleDeleteSubTopic = useCallback(async (id: string) => {
    try { await api.del(`/subtopics/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete subtopic:', err); return false; }
  }, [api]);

  // Gap 5: Update subtopic
  const handleUpdateSubTopic = useCallback(async (id: string, data: { title?: string; description?: string | null }) => {
    try { return await api.put<any, SubTopic>(`/subtopics/${id}`, data); }
    catch (err) { console.error('[Admin] Failed to update subtopic:', err); return null; }
  }, [api]);

  // ── KeywordConnection CRUD callbacks ──
  const handleCreateConnection = useCallback(async (data: { keyword_a_id: string; keyword_b_id: string; relationship_type?: string; strength?: number; description?: string | null }) => {
    try { return await api.post<any, KeywordConnection>('/connections', data); }
    catch (err) { console.error('[Admin] Failed to create connection:', err); return null; }
  }, [api]);

  const handleDeleteConnection = useCallback(async (id: string) => {
    try { await api.del(`/connections/${id}`); return true; }
    catch (err) { console.error('[Admin] Failed to delete connection:', err); return false; }
  }, [api]);

  // ── Approval queue: status change handler (Gap 3) ──
  const handleApprovalStatusChange = useCallback((changes: { entity_type: string; id: string; new_status: ContentStatus }[]) => {
    for (const change of changes) {
      if (change.entity_type === 'summary') {
        setSummaries(prev => prev.map(s => s.id === change.id ? { ...s, status: change.new_status } : s));
      } else if (change.entity_type === 'keyword') {
        setKeywords(prev => prev.map(k => k.id === change.id ? { ...k, status: change.new_status } : k));
      } else if (change.entity_type === 'subtopic') {
        setKeywords(prev => prev.map(k => ({
          ...k,
          subtopics: k.subtopics?.map(st => st.id === change.id ? { ...st, status: change.new_status } : st),
        })));
      }
      // Update the approval items state too
      setApprovalItems(prev => prev.map(item =>
        item.id === change.id ? { ...item, status: change.new_status } : item
      ));
    }
  }, []);

  // ── Batch status callback ──
  const handleBatchStatus = useCallback(async (items: { entity_type: string; id: string; new_status: string; reviewer_note?: string }[]) => {
    try {
      const result = await api.put<any, any>('/content/batch-status', { items });
      return result;
    }
    catch (err) { console.error('[Admin] Batch status failed:', err); return null; }
  }, [api]);

  // ── AI Generate callback ──
  const handleAiGenerate = useCallback(async (content: string, summaryId?: string, courseId?: string) => {
    try {
      const result = await api.post<any, any>('/ai/generate', {
        content,
        summary_id: summaryId,
        course_id: courseId,
      });
      return result;
    }
    catch (err) { console.error('[Admin] AI generate failed:', err); return null; }
  }, [api]);

  const isLive = backendStatus === 'connected';

  // ── Show loading while checking session ──
  if (authChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f2ea]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-200/50">
            <span className="text-white text-xl font-black tracking-tighter">A</span>
          </div>
          <Loader2 size={20} className="animate-spin text-teal-500" />
          <p className="text-sm text-gray-500">Verificando sessao...</p>
        </div>
      </div>
    );
  }

  // ── Show auth screen if not logged in ──
  if (!authUser) {
    return (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <OverviewDashboard
            courses={courses} semesters={semesters} sections={sections}
            topics={topics} summaries={summaries} keywords={keywords}
            approvalItems={approvalItems} onNavigate={setActiveView}
            backendStatus={backendStatus}
          />
        );
      case 'courses':
        return (
          <CourseManager
            courses={courses}
            institutionId={INST_ID}
            onCoursesChange={setCourses}
            onSelectCourse={handleSelectCourse}
            onCreateCourse={isLive ? handleCreateCourse : undefined}
            onUpdateCourse={isLive ? handleUpdateCourse : undefined}
            onDeleteCourse={isLive ? handleDeleteCourse : undefined}
          />
        );
      case 'content-tree':
        return (
          <ContentTree
            course={selectedCourse}
            semesters={semesters}
            sections={sections}
            topics={topics}
            onSemestersChange={setSemesters}
            onSectionsChange={setSections}
            onTopicsChange={setTopics}
            onSelectTopic={handleSelectTopic}
            onCreateSemester={isLive ? handleCreateSemester : undefined}
            onUpdateSemester={isLive ? handleUpdateSemester : undefined}
            onDeleteSemester={isLive ? handleDeleteSemester : undefined}
            onCreateSection={isLive ? handleCreateSection : undefined}
            onUpdateSection={isLive ? handleUpdateSection : undefined}
            onDeleteSection={isLive ? handleDeleteSection : undefined}
            onCreateTopic={isLive ? handleCreateTopic : undefined}
            onUpdateTopic={isLive ? handleUpdateTopic : undefined}
            onDeleteTopic={isLive ? handleDeleteTopic : undefined}
          />
        );
      case 'summaries':
        return (
          <div className="h-full flex flex-col">
            <SummaryEditor
              topic={selectedTopic}
              summaries={summaries}
              onSummariesChange={setSummaries}
              onBack={() => setActiveView('content-tree')}
              onCreateSummary={isLive ? handleCreateSummary : undefined}
              onUpdateSummary={isLive ? handleUpdateSummary : undefined}
              onDeleteSummary={isLive ? handleDeleteSummary : undefined}
              onAiGenerate={isLive ? handleAiGenerate : undefined}
              selectedCourseId={selectedCourse.id}
            />
          </div>
        );
      case 'keywords':
        return (
          <KeywordManager
            keywords={keywords}
            onKeywordsChange={setKeywords}
            onCreateKeyword={isLive ? handleCreateKeyword : undefined}
            onUpdateKeyword={isLive ? handleUpdateKeyword : undefined}
            onDeleteKeyword={isLive ? handleDeleteKeyword : undefined}
            onCreateSubTopic={isLive ? handleCreateSubTopic : undefined}
            onDeleteSubTopic={isLive ? handleDeleteSubTopic : undefined}
            onUpdateSubTopic={isLive ? handleUpdateSubTopic : undefined}
            onCreateConnection={isLive ? handleCreateConnection : undefined}
            onDeleteConnection={isLive ? handleDeleteConnection : undefined}
          />
        );
      case 'approval':
        return (
          <ApprovalQueue
            items={approvalItems}
            onStatusChange={handleApprovalStatusChange}
            onBatchStatus={isLive ? handleBatchStatus : undefined}
          />
        );
      case 'diagnostics':
        return (
          <DiagnosticsPanel />
        );
      default:
        return null;
    }
  };

  const currentNav = NAV_ITEMS.find(n => n.id === activeView);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f5f2ea]">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-white border-r border-gray-200 transition-all duration-200 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
          <AxonLogo collapsed={!sidebarOpen} />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <Menu size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const showBadge = item.id === 'approval' && draftCount > 0;
            return (
              <button key={item.id}
                onClick={() => { setActiveView(item.id); setMobileSidebar(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={!sidebarOpen ? item.label : undefined}>
                <Icon size={18} className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {draftCount}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && showBadge && (
                  <span className="absolute right-2 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-gray-100">
          <div className={`flex items-center gap-2 px-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Shield size={14} className="text-amber-600" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-700 truncate">{authUser.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{authUser.email}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleSignOut} title="Sair" className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={14} />
              </button>
            )}
          </div>
          {!sidebarOpen && (
            <button onClick={handleSignOut} title="Sair" className="mt-2 w-full flex justify-center p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileSidebar(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-50 flex flex-col md:hidden">
              <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
                <AxonLogo collapsed={false} />
                <button onClick={() => setMobileSidebar(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  const showBadge = item.id === 'approval' && draftCount > 0;
                  return (
                    <button key={item.id}
                      onClick={() => { setActiveView(item.id); setMobileSidebar(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                      <Icon size={18} className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {showBadge && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {draftCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebar(true)} className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden">
              <Menu size={18} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Admin</span>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="font-semibold text-gray-900">{currentNav?.label}</span>
            </div>
          </div>
          {(activeView === 'content-tree' || activeView === 'summaries') && courses.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Curso:</span>
              <select value={selectedCourse.id}
                onChange={(e) => {
                  const c = courses.find(c => c.id === e.target.value);
                  if (c) setSelectedCourse(c);
                }}
                className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </header>

        <div className={`flex-1 overflow-y-auto ${activeView === 'summaries' ? '' : 'p-4 md:p-6'}`}>
          <AnimatePresence mode="wait">
            <motion.div key={activeView}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`mx-auto ${activeView === 'summaries' ? 'h-full' : 'max-w-6xl'}`}>
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Root App with ApiProvider ──
export default function App() {
  return (
    <ApiProvider>
      <AdminPanel />
      <Toaster position="bottom-right" richColors closeButton />
    </ApiProvider>
  );
}