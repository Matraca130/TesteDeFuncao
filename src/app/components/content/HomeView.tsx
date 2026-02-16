import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useStudentDataContext } from '@/app/context/StudentDataContext';
import { courses } from '@/app/data/courses';
import { headingStyle, components } from '@/app/design-system';
import { 
  User,
  GraduationCap,
  Search,
  Bell,
  LayoutDashboard,
  Sparkles,
  ClipboardCheck,
  Library,
  Video,
  Image as ImageIcon,
  LogOut,
  MoreHorizontal,
  Play,
  CheckCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

export function HomeView() {
  const { setActiveView } = useApp();
  const { profile, stats, isConnected } = useStudentDataContext();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  // Real student data
  const studentName = profile?.name?.split(' ')[0] || 'Reed';
  const streakDays = stats?.currentStreak ?? 0;
  const studyHours = stats ? Math.round(stats.totalStudyMinutes / 60) : 8;
  const cardsReviewed = stats?.totalCardsReviewed ?? 0;

  // Calculate course progress from real data
  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { progress: 0, completed: 0, total: 0 };

    let totalLessons = 0;
    let completedLessons = 0;

    course.semesters.forEach(sem => {
      sem.sections.forEach(sec => {
        sec.topics.forEach(topic => {
          if (topic.lessons) {
            totalLessons += topic.lessons.length;
            completedLessons += topic.lessons.filter(l => l.completed).length;
          }
        });
      });
    });

    return {
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      completed: completedLessons,
      total: totalLessons
    };
  };

  // Real course data matching the image
  const anatomyProgress = getCourseProgress('anatomy');
  const histologyProgress = getCourseProgress('histology');

  const courseData = [
    {
      id: 'microbiology',
      title: 'Microbiologia',
      module: 'MÓDULO IV',
      progress: 40,
      progressText: '4/10 Aulas',
      icon: '🦠',
      iconBg: 'bg-purple-100',
      progressColor: 'bg-purple-500',
      percentColor: 'text-purple-600',
    },
    {
      id: 'cell-biology',
      title: 'Biologia Celular',
      module: 'MÓDULO FINAL',
      progress: 90,
      progressText: '9/10 Aulas',
      icon: '🌿',
      iconBg: 'bg-teal-100',
      progressColor: 'bg-teal-500',
      percentColor: 'text-teal-600',
    },
    {
      id: 'histology',
      title: 'Histologia',
      module: 'MÓDULO II',
      progress: histologyProgress.progress || 75,
      progressText: histologyProgress.total > 0 ? `${histologyProgress.completed}/${histologyProgress.total} Aulas` : '15/20 Aulas',
      icon: '🔬',
      iconBg: 'bg-teal-100',
      progressColor: 'bg-teal-500',
      percentColor: 'text-teal-600',
    },
    {
      id: 'anatomy',
      title: 'Anatomia Humana',
      module: 'MÓDULO I',
      progress: anatomyProgress.progress || 20,
      progressText: anatomyProgress.total > 0 ? `${anatomyProgress.completed}/${anatomyProgress.total} Aulas` : '4/20 Aulas',
      icon: '❤️',
      iconBg: 'bg-pink-100',
      progressColor: 'bg-pink-500',
      percentColor: 'text-pink-600',
    },
  ];

  // Calculate daily performance
  const dailyPerformance = Math.min(Math.round((studyHours / 10) * 100), 100);

  // Recent activities
  const recentActivities = [
    {
      icon: <Play size={14} />,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Vídeo de Anatomia',
      subtitle: 'Sistema Cardiovascular • Há 20 min'
    },
    {
      icon: <CheckCircle size={14} />,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      title: isConnected && cardsReviewed > 0 ? `${cardsReviewed} Flashcards Revisados` : 'Quiz de Histologia',
      subtitle: isConnected && cardsReviewed > 0 ? `Total acumulado • ${streakDays} dias seguidos` : 'Nota: 9.5/10 • Há 2 horas'
    },
    {
      icon: <FileText size={14} />,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: 'Novo resumo',
      subtitle: 'Ciclo de Krebs • 09:15'
    },
  ];

  return (
    <div className="flex min-h-screen bg-surface-dashboard">
      {/* Left Sidebar */}
      <aside className="w-[280px] bg-[#2c3e50] text-white flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">AXON</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">Medical Academy</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active onClick={() => setActiveView('home')} />
        </nav>

        {/* Logout Button */}
        <div className="px-4 py-6">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <LogOut size={16} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-surface-dashboard px-8 py-5 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar no acervo acadêmico..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-gray-200/50 rounded-lg text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-6 ml-6">
              {/* Notifications */}
              <button className="relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    Dr. Julian Reed
                  </p>
                  <p className="text-xs text-gray-500">Cardiologia</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 overflow-hidden flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8 overflow-y-auto bg-surface-dashboard">
          <div className="max-w-[1600px]">
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-[40px] font-bold text-gray-900 mb-2 leading-tight" style={headingStyle}>
                Bem-vindo de volta, Dr. Reed
              </h1>
              <p className="text-gray-500 italic text-sm mb-6" style={headingStyle}>
                "A excelência não é um ato, mas um hábito." — Aristóteles
              </p>
              
              {/* Time Filters Below Quote */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeFilter('today')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                    timeFilter === 'today'
                      ? 'bg-[#2c3e50] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                    timeFilter === 'week'
                      ? 'bg-[#2c3e50] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                    timeFilter === 'month'
                      ? 'bg-[#2c3e50] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Mês
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Left Content - Courses */}
              <div className="flex-1">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>
                    Disciplinas em Curso
                  </h2>
                  <button 
                    onClick={() => setActiveView('lesson-grid')}
                    className="text-teal-600 hover:text-teal-700 font-semibold text-sm flex items-center gap-1"
                  >
                    Ver currículo completo
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-2 gap-5">
                  {courseData.map(course => (
                    <CourseCard 
                      key={course.id}
                      title={course.title}
                      module={course.module}
                      progress={course.progress}
                      progressText={course.progressText}
                      icon={course.icon}
                      iconBg={course.iconBg}
                      progressColor={course.progressColor}
                      percentColor={course.percentColor}
                      onContinue={() => setActiveView('study')}
                    />
                  ))}
                </div>
              </div>

              {/* Right Sidebar - Performance & Activity */}
              <div className="w-[320px] space-y-5 flex-shrink-0">
                {/* Daily Performance Card */}
                <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-2xl p-7 text-white shadow-lg">
                  <h3 className="text-xl font-bold mb-7" style={headingStyle}>
                    Desempenho Diário
                  </h3>
                  
                  {/* Circular Progress */}
                  <div className="relative w-48 h-48 mx-auto mb-7">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="75"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="16"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="75"
                        stroke="#14b8a6"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 75}`}
                        strokeDashoffset={`${2 * Math.PI * 75 * (1 - 0.8)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-bold">80<span className="text-4xl">%</span></span>
                      <span className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-semibold">CONCLUÍDO</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xl font-bold mb-1">8 de 10 Horas</p>
                    <p className="text-sm text-gray-300">Você está próximo da excelência.</p>
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900" style={headingStyle}>
                      Atividade Recente
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <ActivityItem 
                        key={index}
                        icon={activity.icon}
                        iconColor={activity.iconColor}
                        iconBg={activity.iconBg}
                        title={activity.title}
                        subtitle={activity.subtitle}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Access Shortcuts ── */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-5" style={headingStyle}>
                Acesso Rápido
              </h2>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { key: 'study' as const, icon: Sparkles, label: 'IA Mentor', desc: 'Assistente inteligente para seus estudos' },
                  { key: 'quiz' as const, icon: ClipboardCheck, label: 'Avaliações', desc: 'Teste seus conhecimentos' },
                  { key: 'lesson-grid' as const, icon: Library, label: 'Biblioteca', desc: 'Acesse todo o acervo acadêmico' },
                  { key: 'study' as const, icon: Video, label: 'Masterclasses', desc: 'Aulas com especialistas' },
                  { key: '3d' as const, icon: ImageIcon, label: 'Atlas Visual', desc: 'Explore modelos anatômicos' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setActiveView(item.key)}
                      className="bg-white rounded-2xl p-5 text-left border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                        <Icon size={22} className="text-teal-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1" style={headingStyle}>
                        {item.label}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ── Nav Item Component ─────────────────────────────────────

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-[#34495e] text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Course Card Component ──────────────────────────────────

function CourseCard({ 
  title, 
  module, 
  progress, 
  progressText, 
  icon, 
  iconBg,
  progressColor,
  percentColor,
  onContinue 
}: { 
  title: string; 
  module: string; 
  progress: number; 
  progressText: string; 
  icon: string; 
  iconBg: string;
  progressColor: string;
  percentColor: string;
  onContinue: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 text-2xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {title}
            </h3>
            <span className={`text-base font-bold ${percentColor}`}>
              {progress}%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            {module}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Progresso</span>
          <span className="text-xs text-gray-500">{progressText}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-700 rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Button */}
      <button 
        onClick={onContinue}
        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors text-sm"
      >
        Continuar Estudo
      </button>
    </div>
  );
}

// ── Activity Item Component ────────────────────────────────

function ActivityItem({ 
  icon, 
  iconColor,
  iconBg,
  title, 
  subtitle 
}: { 
  icon: React.ReactNode; 
  iconColor: string;
  iconBg: string;
  title: string; 
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight mb-0.5">
          {title}
        </p>
        <p className="text-xs text-gray-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}