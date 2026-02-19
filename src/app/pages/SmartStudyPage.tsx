// ============================================================
// A6-11 | SmartStudyPage.tsx | Agent 6 — PRISM
// Smart study UI con NeedScore ranking + BKT colors
// P3: Refactored to use useSmartStudy + useSummaries hooks
// P5: filter by summary
// ============================================================
import { useState, useMemo } from 'react';
import { Brain, RefreshCw, BookOpen, Clock, TrendingUp, Filter, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useSmartStudy } from '../hooks/use-smart-study';
import { useSummaries } from '../hooks/use-summaries';
import { useKeywords } from '../hooks/use-keywords';
import { getBktColor } from '../design-system/colors';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return `Hace ${diff} dias`;
}

export function SmartStudyPage() {
  const [filterSummary, setFilterSummary] = useState('all');
  const { summaries } = useSummaries();
  const { keywords } = useKeywords();
  const { sortedItems, isLoading, error, isGenerating, needAttention, mastered, total, generateSession, refetch } = useSmartStudy();

  const keywordSummaryMap = useMemo(() => {
    const map = new Map<string, string>();
    keywords.forEach((kw) => map.set(kw.id, kw.summary_id));
    return map;
  }, [keywords]);

  const displayItems = useMemo(() => {
    if (filterSummary === 'all') return sortedItems;
    return sortedItems.filter((item) => keywordSummaryMap.get(item.keyword_id) === filterSummary);
  }, [sortedItems, filterSummary, keywordSummaryMap]);

  if (isLoading) return <SkeletonPage variant="study" />;
  if (error) return <div className="p-6 max-w-7xl mx-auto space-y-6"><ErrorBanner message={error} onRetry={refetch} /></div>;

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-gray-900 tracking-tight flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}><Brain className="w-7 h-7 text-teal-500" />Estudo Inteligente</h1>
            <p className="text-gray-500 mt-1">Keywords ordenadas por necessidade de estudo</p>
          </div>
          <Button onClick={generateSession} disabled={isGenerating} className="bg-teal-500 hover:bg-teal-600 text-white"><RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />{isGenerating ? 'Gerando...' : 'Gerar Sessao'}</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-gray-200"><CardContent className="p-5 flex items-center gap-4"><div className="bg-red-50 rounded-xl p-3"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Precisam atencao</p><p className="text-gray-900" style={{ fontSize: '1.5rem', fontFamily: "'Georgia', serif" }}>{needAttention}</p></div></CardContent></Card>
          <Card className="border-gray-200"><CardContent className="p-5 flex items-center gap-4"><div className="bg-green-50 rounded-xl p-3"><TrendingUp className="w-5 h-5 text-green-500" /></div><div><p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Dominadas</p><p className="text-gray-900" style={{ fontSize: '1.5rem', fontFamily: "'Georgia', serif" }}>{mastered}</p></div></CardContent></Card>
          <Card className="border-gray-200"><CardContent className="p-5 flex items-center gap-4"><div className="bg-teal-50 rounded-xl p-3"><Zap className="w-5 h-5 text-teal-500" /></div><div><p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Total keywords</p><p className="text-gray-900" style={{ fontSize: '1.5rem', fontFamily: "'Georgia', serif" }}>{total}</p></div></CardContent></Card>
        </div>
        <div className="flex gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filterSummary} onValueChange={setFilterSummary}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filtrar por resumo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Resumos</SelectItem>
              {summaries.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {displayItems.length === 0 ? (
          <Card className="border-gray-200"><CardContent className="py-0"><EmptyState variant="study" title="Nenhuma keyword precisa de revisao agora" description="Gere uma sessao de estudo para comecar" actionLabel="Gerar Sessao" onAction={generateSession} /></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => {
              const bkt = getBktColor(item.p_know);
              return (
                <motion.div key={item.keyword_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.35), ease: [0.25, 0.46, 0.45, 0.94] }}>
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bkt.bg, color: bkt.color, fontSize: '0.875rem', fontWeight: 600 }}>{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>{item.term}</h3>
                          <TooltipProvider><Tooltip><TooltipTrigger><Badge variant="secondary" style={{ backgroundColor: bkt.bg, color: bkt.color, borderColor: bkt.color }}>{bkt.label}</Badge></TooltipTrigger><TooltipContent><p>p(know) = {(item.p_know * 100).toFixed(0)}%</p></TooltipContent></Tooltip></TooltipProvider>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400" style={{ fontSize: '0.75rem' }}>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {daysAgo(item.last_studied)}</span>
                          <span>NeedScore: {(item.need_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full sm:w-40 shrink-0">
                        <div className="flex justify-between mb-1"><span className="text-gray-400" style={{ fontSize: '0.75rem' }}>Dominio</span><span className="text-gray-600" style={{ fontSize: '0.75rem' }}>{(item.p_know * 100).toFixed(0)}%</span></div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${item.p_know * 100}%`, backgroundColor: bkt.color }} /></div>
                      </div>
                      <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white shrink-0"><BookOpen className="w-4 h-4 mr-1" />Estudar</Button>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}