// ============================================================
// Axon v4.4 — Legacy Admin Panel
// Temporary monolithic admin page. Will be decomposed into
// individual pages inside AppShell in Phase 2.
// Auth is handled by guards (RequireAuth + RequireRole in AdminLayout)
// ============================================================
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContentData } from '../hooks/useContentData';
import {
  LayoutDashboard, BookOpen, Users, Settings, LogOut,
  ChevronRight, ChevronDown, Plus, FileText, Tag,
  CheckCircle, Clock, XCircle, GraduationCap,
  Loader2, RefreshCw, Stethoscope,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'content', label: 'Conteudo', icon: BookOpen },
  { id: 'members', label: 'Membros', icon: Users },
  { id: 'approvals', label: 'Aprovacoes', icon: CheckCircle },
  { id: 'diagnostics', label: 'Diagnosticos', icon: Stethoscope },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-gray-100 text-gray-600', label: 'Rascunho' },
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pendente' },
    approved: { color: 'bg-green-100 text-green-700', label: 'Aprovado' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeitado' },
    published: { color: 'bg-teal-100 text-teal-700', label: 'Publicado' },
  };
  const c = config[status] || config.draft;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.color}`}>{c.label}</span>;
}

function OverviewDashboard({ courses, summaries }: { courses: any[]; summaries: any[] }) {
  const pendingCount = summaries.filter((s: any) => s.status === 'pending').length;
  const approvedCount = summaries.filter((s: any) => s.status === 'approved' || s.status === 'published').length;
  const stats = [
    { label: 'Cursos', value: courses.length, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Resumos', value: summaries.length, icon: FileText, color: 'text-teal-600 bg-teal-50' },
    { label: 'Pendentes', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Aprovados', value: approvedCount, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ];
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">Visao Geral</h2><p className="text-sm text-gray-500 mt-1">Resumo da sua instituicao</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}><stat.icon size={20} /></div><div><p className="text-2xl font-bold text-gray-900">{stat.value}</p><p className="text-xs text-gray-500">{stat.label}</p></div></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        {summaries.length === 0 ? <p className="text-sm text-gray-400">Nenhuma atividade recente</p> : (
          <div className="space-y-3">{summaries.slice(0, 5).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3"><FileText size={16} className="text-gray-400" /><span className="text-sm text-gray-700">{s.title || s.id}</span></div>
              <StatusBadge status={s.status} />
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

function PlaceholderSection({ title, icon: Icon, description }: { title: string; icon: any; description: string }) {
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">{title}</h2></div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
        <Icon size={40} className="text-gray-300 mb-3" /><p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default function LegacyAdminPanel() {
  const { user, logout, currentInstitution } = useAuth();
  const {
    courses, semesters, sections, topics, summaries, keywords,
    loading: isLoadingData, refresh: fetchData,
  } = useContentData();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewDashboard courses={courses} summaries={summaries} />;
      case 'members': return <PlaceholderSection title="Membros" icon={Users} description="Em construcao" />;
      case 'approvals': return <PlaceholderSection title="Aprovacoes" icon={CheckCircle} description="Em construcao" />;
      case 'diagnostics': return <PlaceholderSection title="Diagnosticos" icon={Stethoscope} description="Em construcao" />;
      case 'settings': return <PlaceholderSection title="Configuracoes" icon={Settings} description="Em construcao" />;
      default: return <OverviewDashboard courses={courses} summaries={summaries} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex">
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 border-b border-gray-100"><div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"><span className="text-white text-sm font-black">A</span></div>
          {!sidebarCollapsed && <div className="min-w-0"><h1 className="text-base font-bold text-gray-900 truncate">Axon</h1><p className="text-xs text-gray-400 truncate">{currentInstitution?.name || 'Admin Panel'}</p></div>}
        </div></div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${activeSection === item.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} title={sidebarCollapsed ? item.label : undefined}>
              <item.icon size={18} />{!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100"><div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span></div>
          {!sidebarCollapsed && <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate">{user?.name}</p><p className="text-xs text-gray-400 truncate">{user?.email}</p></div>}
          <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0" title="Sair"><LogOut size={14} /></button>
        </div></div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><LayoutDashboard size={18} /></button>
            <h2 className="text-base font-semibold text-gray-900">{NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Admin'}</h2>
          </div>
          <button onClick={fetchData} disabled={isLoadingData} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50" title="Atualizar">
            <RefreshCw size={16} className={isLoadingData ? 'animate-spin' : ''} />
          </button>
        </header>
        <div className="p-6">
          {isLoadingData ? <div className="flex items-center justify-center py-20"><div className="flex flex-col items-center gap-3"><Loader2 size={24} className="animate-spin text-teal-500" /><p className="text-sm text-gray-500">Carregando dados...</p></div></div> : renderSection()}
        </div>
      </main>
    </div>
  );
}
