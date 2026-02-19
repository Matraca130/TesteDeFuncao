// ============================================================
// DashboardHome — Overview page showing all Agent 6 features
// P4: Motion animations + staggered card entrance
// ============================================================
import { Link } from 'react-router';
import { Key, Layers, HelpCircle, Play, Rocket, Brain, Target, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { KeywordPopover } from '../components/content/canvas/KeywordPopover';
import { PageTransition } from '../components/shared/PageTransition';

const QUICK_LINKS = [
  { label: 'Keywords', description: 'CRUD keywords', icon: Key, path: '/professor/keywords', color: 'bg-teal-50 text-teal-500' },
  { label: 'Flashcards', description: 'CRUD flashcards', icon: Layers, path: '/professor/flashcards', color: 'bg-blue-50 text-blue-500' },
  { label: 'Quiz', description: 'CRUD perguntas', icon: HelpCircle, path: '/professor/quizzes', color: 'bg-purple-50 text-purple-500' },
  { label: 'Videos', description: 'Gerenciar videos', icon: Play, path: '/professor/videos', color: 'bg-amber-50 text-amber-500' },
  { label: 'Content Flow', description: 'Wizard de conteudo', icon: Rocket, path: '/professor/content-flow', color: 'bg-green-50 text-green-500' },
  { label: 'Smart Study', description: 'Estudo inteligente', icon: Brain, path: '/study/smart-study', color: 'bg-rose-50 text-rose-500' },
  { label: 'Study Plans', description: 'Planos de estudo', icon: Target, path: '/study/plans', color: 'bg-indigo-50 text-indigo-500' },
  { label: 'Video Study', description: 'Assistir + notas', icon: Play, path: '/study/video/vid-1', color: 'bg-orange-50 text-orange-500' },
];

export function DashboardHome() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-gray-900 tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>AXON — Agent 6 PRISM</h1>
            <p className="text-gray-500 mt-1">UI para a experiencia do Professor e do Alumno — 14 tareas implementadas</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-pink-50 text-pink-700 border-pink-200">Agent 6</Badge>
              <Badge className="bg-teal-50 text-teal-700 border-teal-200">P5 — Final</Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">3-Layer Pattern</Badge>
            </div>
          </motion.div>
          <div>
            <p className="text-gray-400 uppercase tracking-wider mb-3" style={{ fontSize: '0.625rem', fontWeight: 600 }}>Acesso Rapido</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_LINKS.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.div key={link.path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4), ease: [0.25, 0.46, 0.45, 0.94] }}>
                    <Link to={link.path}>
                      <Card className="border-gray-200 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${link.color}`}><Icon className="w-5 h-5" /></div>
                          <p className="text-gray-900" style={{ fontSize: '0.875rem' }}>{link.label}</p>
                          <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{link.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <ActivityHeatmap studentId="s-1" />
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-3" style={{ fontSize: '0.625rem', fontWeight: 600 }}>Keyword Popover Demo</p>
              <KeywordPopover keywordId="kw-1" term="Mitocondria" definition="Organela responsavel pela producao de energia celular (ATP) atraves da respiracao celular." pKnow={0.45} flashcardCount={3} quizCount={2} quizAccuracy={65} />
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}