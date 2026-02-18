// ============================================================
// Axon v4.2 — FlashcardSession (Dev 3 Frontend)
// MERGED: Original design language (split-panel, images, speedometer,
//         teal branding) + v4.2 contract types (4 grades, DeltaColor,
//         SubmitReviewRes.feedback inline, fsrs_state not fsrs).
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Brain, Eye, CheckCircle, ArrowRight, Clock,
  TrendingUp, RotateCcw, Plus, ChevronRight,
  AlertTriangle, Trophy, Sparkles,
} from 'lucide-react';

import type { Grade, DeltaColor } from '../../types/enums';
import type { FlashcardCard } from '../../types/instruments';
import type {
  DueFlashcardItem,
  SubmitReviewReq,
  SubmitReviewRes,
} from '../../types/api-contract';

import { useApi } from '../lib/api-provider';
import {
  buildMockDueItems,
  mockSubmitReview,
  mockCreateSession,
  MOCK_USER_ID,
  MOCK_INSTITUTION_ID,
} from '../lib/mock-data';

// Grade mapping: frontend decimals -> backend integers
function gradeToInt(grade: Grade): number {
  if (grade <= 0.00) return 1;
  if (grade <= 0.35) return 2;
  if (grade <= 0.65) return 3;
  return 4;
}

// Normalize FSRS state from backend (numeric -> string)
function normalizeFsrsState(state: any): string {
  if (typeof state === 'string') return state;
  const map: Record<number, string> = { 0: 'new', 1: 'learning', 2: 'review', 3: 'relearning' };
  return map[state] ?? 'new';
}

const GRADE_BUTTONS: { value: Grade; label: string; color: string; hover: string; text: string; desc: string; kbd: string; }[] = [
  { value: 0.00 as Grade, label: 'De novo', color: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-500', desc: 'Esqueci', kbd: '1' },
  { value: 0.35 as Grade, label: 'Dificil', color: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-500', desc: 'Com dificuldade', kbd: '2' },
  { value: 0.65 as Grade, label: 'Bom', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-500', desc: 'Lembrei bem', kbd: '3' },
  { value: 0.90 as Grade, label: 'Facil', color: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-500', desc: 'Muito facil', kbd: '4' },
];

const DELTA_COLOR_META: Record<string, { hex: string; label: string; bg: string }> = {
  red: { hex: '#EF4444', label: 'Critico', bg: 'bg-red-500' },
  orange: { hex: '#F97316', label: 'Insuficiente', bg: 'bg-orange-500' },
  yellow: { hex: '#EAB308', label: 'Proximo', bg: 'bg-yellow-500' },
  green: { hex: '#22C55E', label: 'Dominado', bg: 'bg-emerald-500' },
  blue: { hex: '#3B82F6', label: 'Superado', bg: 'bg-blue-500' },
};
function getColorMeta(color: string) { return DELTA_COLOR_META[color] ?? DELTA_COLOR_META.red; }

function SpeedometerGauge({ total, currentIndex, sessionGrades }: { total: number; currentIndex: number; sessionGrades: Grade[]; }) {
  const size = 120, strokeWidth = 8, center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;
  const startAngle = 135, sweepAngle = 270;
  const polarToCartesian = (angle: number) => { const rad = (angle * Math.PI) / 180; return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) }; };
  const describeArc = (start: number, end: number) => { const s = polarToCartesian(start); const e = polarToCartesian(end); const largeArc = end - start > 180 ? 1 : 0; return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`; };
  const segmentAngle = sweepAngle / Math.max(total, 1);
  const segmentGap = Math.min(1.5, segmentAngle * 0.1);
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;
  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {Array.from({ length: total }).map((_, i) => { const segStart = startAngle + i * segmentAngle + segmentGap; const segEnd = startAngle + (i + 1) * segmentAngle - segmentGap; return <path key={`bg-${i}`} d={describeArc(segStart, segEnd)} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={strokeWidth} strokeLinecap="round" />; })}
        {Array.from({ length: total }).map((_, i) => { const isCompleted = i < sessionGrades.length; const isCurrent = i === currentIndex; if (!isCompleted && !isCurrent) return null; let color = '#14b8a6'; if (isCompleted) { const g = sessionGrades[i]; color = g >= 0.90 ? '#10b981' : g >= 0.65 ? '#22c55e' : g >= 0.35 ? '#f59e0b' : '#f43f5e'; } const segStart = startAngle + i * segmentAngle + segmentGap; const segEnd = startAngle + (i + 1) * segmentAngle - segmentGap; return <motion.path key={`seg-${i}`} d={describeArc(segStart, segEnd)} fill="none" stroke={color} strokeWidth={isCurrent ? strokeWidth + 2 : strokeWidth} strokeLinecap="round" initial={{ opacity: 0, pathLength: 0 }} animate={{ opacity: isCurrent ? [0.6, 1, 0.6] : 1, pathLength: 1 }} transition={isCurrent ? { opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }, pathLength: { duration: 0.4 } } : { duration: 0.4 }} />; })}
        {(() => { const needleAngle = startAngle + (currentIndex / Math.max(total, 1)) * sweepAngle + segmentAngle / 2; const rad = (needleAngle * Math.PI) / 180; const tip = polarToCartesian(needleAngle); const inner = { x: center + (radius - 18) * Math.cos(rad), y: center + (radius - 18) * Math.sin(rad) }; return <motion.line x1={inner.x} y1={inner.y} x2={tip.x} y2={tip.y} stroke="#374151" strokeWidth={2} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} />; })()}
        <circle cx={center} cy={center} r={3} fill="#6b7280" opacity={0.5} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 8 }}>
        <span className="text-2xl font-black text-gray-800 tabular-nums leading-none">{Math.round(progress)}%</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{currentIndex + 1}</span>
        <span className="text-[10px] text-gray-400">/</span>
        <span className="text-[11px] font-semibold text-gray-400 tabular-nums">{total}</span>
      </div>
    </div>
  );
}

function GradeButtons({ onGrade, disabled }: { onGrade: (g: Grade) => void; disabled: boolean }) {
  useEffect(() => { function handleKey(e: KeyboardEvent) { if (disabled) return; const idx = ['1', '2', '3', '4'].indexOf(e.key); if (idx >= 0) onGrade(GRADE_BUTTONS[idx].value); } window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [onGrade, disabled]);
  return (
    <div className="w-full max-w-xl mx-auto grid grid-cols-4 gap-2">
      {GRADE_BUTTONS.map((g) => (
        <button key={g.value} onClick={() => !disabled && onGrade(g.value)} disabled={disabled} className="group flex flex-col items-center gap-1.5 transition-transform active:scale-95 outline-none disabled:opacity-40">
          <div className={`w-full h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-1 group-hover:shadow-lg ${g.color} ${g.hover}`}>
            <span className="text-[10px] opacity-70">{g.kbd}</span>
            <span className="text-sm font-bold">{g.label}</span>
          </div>
          <span className={`text-[9px] font-medium ${g.text} hidden sm:block`}>{g.desc}</span>
        </button>
      ))}
    </div>
  );
}

function ReviewFeedbackDisplay({ feedback, grade, onContinue }: { feedback: SubmitReviewRes['feedback']; grade: Grade; onContinue: () => void; }) {
  const cBefore = getColorMeta(feedback.color_before); const cAfter = getColorMeta(feedback.color_after);
  const improved = feedback.delta_after > feedback.delta_before;
  const daysUntil = feedback.stability != null ? Math.round(feedback.stability * 10) / 10 : null;
  const isLapse = grade === 0.00;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 py-4 px-6">
      {isLapse && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full"><AlertTriangle size={12} /> Lapse — card volta para reaprendizagem</motion.div>)}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1"><div className={`w-10 h-10 rounded-full ${cBefore.bg} shadow-lg`} /><span className="text-[10px] text-gray-500">{cBefore.label}</span></div>
        <ArrowRight size={18} className={improved ? 'text-emerald-500' : 'text-red-400'} />
        <div className="flex flex-col items-center gap-1"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className={`w-10 h-10 rounded-full ${cAfter.bg} shadow-lg ring-2 ring-white`} /><span className="text-[10px] text-gray-500">{cAfter.label}</span></div>
      </div>
      <div className="flex items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><TrendingUp size={13} className={improved ? 'text-emerald-500' : 'text-red-400'} /><span>{improved ? '+' : ''}{((feedback.delta_after - feedback.delta_before) * 100).toFixed(0)}%</span></div>
        <div className="flex items-center gap-1.5"><Brain size={13} className="text-violet-500" /><span>{(feedback.mastery * 100).toFixed(0)}% mastery</span></div>
        {daysUntil != null && (<div className="flex items-center gap-1.5"><Clock size={13} className="text-blue-500" /><span>{daysUntil < 1 ? `${Math.round(daysUntil * 24)}h` : `${daysUntil}d`}</span></div>)}
      </div>
      <button onClick={onContinue} className="mt-1 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-full transition-colors flex items-center gap-2 shadow-sm">Continuar <ChevronRight size={14} /></button>
    </motion.div>
  );
}

function StudentCardCreator({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { front: string; back: string }) => void; }) {
  const [front, setFront] = useState(''); const [back, setBack] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Plus size={18} className="text-violet-500" /> Criar Flashcard Pessoal</h3><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button></div>
        <p className="text-xs text-gray-400">D39: Cards pessoais alimentam o BKT com FLASHCARD_MULTIPLIER = 1.00.</p>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Pergunta (front) *</label><textarea value={front} onChange={(e) => setFront(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 resize-none placeholder:text-gray-300" placeholder="Qual e o principal efeito..." /></div>
          <div><label className="block text-sm font-medium text-gray-600 mb-1.5">Resposta (back) *</label><textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 resize-none placeholder:text-gray-300" placeholder="O principal efeito e..." /></div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
          <button onClick={() => { if (front.trim() && back.trim()) { onSubmit({ front, back }); onClose(); } }} disabled={!front.trim() || !back.trim()} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm rounded-xl transition-colors disabled:cursor-not-allowed">Criar Card</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

type SessionPhase = 'loading' | 'studying' | 'feedback' | 'summary' | 'empty';
interface SessionReviewResult { grade: Grade; feedback: SubmitReviewRes['feedback']; response_time_ms: number; }

export function FlashcardSession() {
  const { api } = useApi();
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [dueItems, setDueItems] = useState<DueFlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitReviewRes | null>(null);
  const [lastGrade, setLastGrade] = useState<Grade | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionReviewResult[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const showTime = useRef(Date.now());

  const currentItem = dueItems[currentIndex] ?? null;
  const progress = dueItems.length > 0 ? (currentIndex / dueItems.length) * 100 : 0;

  const handleContinue = useCallback(() => {
    setIsRevealed(false); setLastResult(null); setLastGrade(null);
    if (currentIndex < dueItems.length - 1) {
      setCurrentIndex((i) => i + 1); showTime.current = Date.now(); setPhase('studying');
    } else {
      if (sessionId) { api.put<any, any>(`/sessions/${sessionId}/end`, {}).then((res) => console.log(`[FlashcardSession] Session ended`), (err) => console.log('[FlashcardSession] Failed to end session:', err)); }
      setPhase('summary');
    }
  }, [currentIndex, dueItems.length, sessionId, api]);

  const handleGrade = useCallback(async (grade: Grade) => {
    if (!currentItem || phase !== 'studying' || !isRevealed || !sessionId) return;
    const response_time_ms = Date.now() - showTime.current;
    const baseReq = { session_id: sessionId, item_id: currentItem.card.id, instrument_type: 'flashcard' as const, subtopic_id: currentItem.card.subtopic_id ?? currentItem.card.keyword_id, keyword_id: currentItem.card.keyword_id, response_time_ms };
    let result: SubmitReviewRes;
    try {
      result = await api.post<any, SubmitReviewRes>('/reviews', { ...baseReq, grade: gradeToInt(grade) });
      console.log(`[FlashcardSession] API review OK: card=${baseReq.item_id}, grade=${gradeToInt(grade)}`);
    } catch (err) {
      console.log('[FlashcardSession] API review failed, using mock:', err);
      result = mockSubmitReview({ ...baseReq, grade } as any);
    }
    setLastResult(result); setLastGrade(grade);
    setSessionResults((prev) => [...prev, { grade, feedback: result.feedback, response_time_ms }]);
    setPhase('feedback');
  }, [currentItem, phase, isRevealed, sessionId, api]);

  const handleRestart = useCallback(() => { setCurrentIndex(0); setSessionResults([]); setIsRevealed(false); setLastResult(null); setLastGrade(null); showTime.current = Date.now(); setPhase('studying'); }, []);

  const handleCreateCard = useCallback((data: { front: string; back: string }) => {
    const now = new Date().toISOString();
    const newCard: FlashcardCard = { id: `fc-student-${Date.now()}`, summary_id: '', keyword_id: 'kw-custom', subtopic_id: null, institution_id: MOCK_INSTITUTION_ID, front: data.front, back: data.back, image_url: null, status: 'approved', source: 'student', created_by: MOCK_USER_ID, created_at: now };
    const newDueItem: DueFlashcardItem = { card: newCard, fsrs_state: { student_id: MOCK_USER_ID, card_id: newCard.id, stability: 0, state: 'new', reps: 0, lapses: 0, due_at: null, last_review_at: null, updated_at: now }, overdue_days: 0 };
    setDueItems((prev) => [...prev, newDueItem]);
    if (phase === 'empty') setPhase('studying');
  }, [phase]);

  useEffect(() => { function handleKey(e: KeyboardEvent) { if (showCreator) return; if (e.code === 'Space' && phase === 'studying' && !isRevealed) { e.preventDefault(); setIsRevealed(true); } if (e.code === 'Space' && phase === 'feedback') { e.preventDefault(); handleContinue(); } } window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [phase, isRevealed, showCreator, handleContinue]);

  // Load due cards + create session (API first, mock fallback)
  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        await api.post<any, any>('/seed?student_id=dev-user-001', {});
        console.log('[FlashcardSession] Seed OK');
        const session = await api.post<any, any>('/sessions', { instrument_type: 'flashcard', course_id: 'course-fisio-001' });
        if (cancelled) return;
        setSessionId(session.id);
        console.log(`[FlashcardSession] Session created: ${session.id}`);
        const items: any[] = await api.get<any>('/flashcards/due', { limit: 20 });
        if (cancelled) return;
        const normalized = items.map((item: any) => ({ card: item.card, fsrs_state: { ...item.fsrs_state, state: normalizeFsrsState(item.fsrs_state?.state), due_at: item.fsrs_state?.due ?? null, last_review_at: item.fsrs_state?.last_review ?? null, updated_at: item.fsrs_state?.last_review ?? new Date().toISOString() }, overdue_days: item.overdue_days ?? 0 }));
        setDueItems(normalized); showTime.current = Date.now();
        setPhase(normalized.length > 0 ? 'studying' : 'empty');
        console.log(`[FlashcardSession] Loaded ${normalized.length} due cards from API`);
      } catch (err) {
        console.log('[FlashcardSession] API unavailable, using mock data:', err);
        if (cancelled) return;
        const session = mockCreateSession('course-fisio-001');
        setSessionId(session.id);
        const items = buildMockDueItems();
        setDueItems(items); showTime.current = Date.now();
        setPhase(items.length > 0 ? 'studying' : 'empty');
      }
    }
    loadSession();
    return () => { cancelled = true; };
  }, [api]);

  if (phase === 'loading') { return (<div className="h-full flex items-center justify-center bg-[#0a0a0f]"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full" /><p className="text-sm text-gray-500">Carregando cards pendentes...</p></motion.div></div>); }

  if (phase === 'empty') { return (<div className="h-full flex items-center justify-center bg-gray-50 p-6"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4"><div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center"><CheckCircle size={28} className="text-emerald-500" /></div><h2 className="text-xl font-bold text-gray-900">Tudo em dia!</h2><p className="text-sm text-gray-500 max-w-sm">Nenhum card pendente para revisao agora.</p><button onClick={() => setShowCreator(true)} className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-xl transition-colors flex items-center gap-2 mx-auto"><Plus size={16} /> Criar Card Pessoal</button></motion.div><AnimatePresence>{showCreator && <StudentCardCreator onClose={() => setShowCreator(false)} onSubmit={handleCreateCard} />}</AnimatePresence></div>); }

  if (phase === 'summary') {
    const total = sessionResults.length;
    const avgGrade = total > 0 ? sessionResults.reduce((s, r) => s + r.grade, 0) / total : 0;
    const mastery = (avgGrade / 0.90) * 100;
    const avgResponseMs = total > 0 ? Math.round(sessionResults.reduce((s, r) => s + r.response_time_ms, 0) / total) : 0;
    const lapseCount = sessionResults.filter((r) => r.grade === 0.00).length;
    const circumference = 2 * Math.PI * 88;
    const colorCounts = sessionResults.reduce((acc, r) => { const c = r.feedback.color_after; acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<string, number>);
    const COLOR_ORDER: DeltaColor[] = ['blue', 'green', 'yellow', 'orange', 'red'];
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-br from-teal-200/20 via-teal-100/15 to-transparent rounded-full blur-3xl" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/25"><Trophy size={40} className="text-white" /></div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sessao Concluida!</h2>
          <p className="text-gray-500 mb-8 text-sm">Voce completou {total} flashcards</p>
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90"><circle cx="96" cy="96" r="88" stroke="#e2e8f0" strokeWidth="12" fill="none" /><motion.circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" className="text-teal-500" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - Math.min(mastery, 100) / 100) }} transition={{ duration: 1.5, ease: 'easeOut' }} /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold text-gray-900">{Math.min(Math.round(mastery), 100)}%</span><span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Dominio</span></div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center w-full mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div><p className="text-2xl font-bold text-gray-900">{total}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Cards</p></div>
            <div><p className="text-2xl font-bold text-gray-900">{sessionResults.filter((s) => s.grade >= 0.65).length}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Acertos</p></div>
            <div><p className="text-2xl font-bold text-gray-900">{lapseCount}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Lapsos</p></div>
            <div><p className="text-2xl font-bold text-gray-900">{(avgResponseMs / 1000).toFixed(1)}s</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Tempo</p></div>
          </div>
          <div className="w-full mb-6">
            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-200">{COLOR_ORDER.map((color) => colorCounts[color] ? (<motion.div key={color} initial={{ width: 0 }} animate={{ width: `${(colorCounts[color] / total) * 100}%` }} transition={{ delay: 0.5, duration: 0.5 }} className={getColorMeta(color).bg} />) : null)}</div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">{COLOR_ORDER.map((color) => colorCounts[color] ? (<span key={color} className="text-[10px] text-gray-500 flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${getColorMeta(color).bg}`} />{getColorMeta(color).label}: {colorCounts[color]}</span>) : null)}</div>
          </div>
          <div className="flex gap-4 w-full">
            <button onClick={handleRestart} className="flex-1 py-3 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><RotateCcw size={16} /> Repetir</button>
            <button onClick={() => setShowCreator(true)} className="flex-1 py-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"><Plus size={16} /> Criar Card</button>
          </div>
        </motion.div>
        <AnimatePresence>{showCreator && <StudentCardCreator onClose={() => setShowCreator(false)} onSubmit={handleCreateCard} />}</AnimatePresence>
      </div>
    );
  }

  // STUDYING / FEEDBACK
  const card = currentItem?.card;
  const hasImage = !!card?.image_url;
  const sessionGrades = sessionResults.map(r => r.grade);
  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-teal-600/[0.08] via-teal-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-tl from-teal-600/[0.05] via-teal-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-30">
        <button onClick={() => setPhase('summary')} className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-white/10"><X size={22} /></button>
        <div className="flex items-center gap-3">
          {currentItem && (<span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${currentItem.fsrs_state.state === 'new' ? 'bg-violet-500/20 text-violet-400' : currentItem.fsrs_state.state === 'learning' ? 'bg-orange-500/20 text-orange-400' : 'bg-teal-500/20 text-teal-400'}`}>{currentItem.fsrs_state.state}</span>)}
          {card?.source === 'student' && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Seu card</span>)}
          {card?.source === 'ai' && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1"><Sparkles size={10} /> IA</span>)}
          <button onClick={() => setShowCreator(true)} title="Criar card pessoal" className="p-2 text-gray-500 hover:text-violet-400 transition-colors rounded-full hover:bg-white/5"><Plus size={18} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-0 relative z-10 min-h-0 pt-14">
        {card && (
          <AnimatePresence mode="wait">
            <motion.div key={card.id + '-' + currentIndex} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} className="relative w-full h-full bg-white shadow-2xl shadow-black/40 overflow-hidden flex flex-row">
              <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
                <motion.div layout className={`p-6 md:p-8 lg:p-10 flex flex-col transition-colors duration-300 w-full ${isRevealed ? 'bg-gray-50 border-b border-gray-200 shrink-0' : 'flex-1 items-center justify-center text-center bg-white'}`}>
                  <div className="flex justify-center mb-4 pointer-events-none"><SpeedometerGauge total={dueItems.length} currentIndex={currentIndex} sessionGrades={sessionGrades} /></div>
                  <div className={`flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 ${!isRevealed ? 'justify-center' : ''}`}><Brain size={14} /> Pergunta</div>
                  <motion.h3 layout="position" className={`font-semibold leading-tight transition-all duration-300 ${isRevealed ? 'text-base text-left text-gray-500' : 'text-xl md:text-2xl lg:text-3xl text-gray-900'}`}>{card.front}</motion.h3>
                </motion.div>
                <AnimatePresence>{isRevealed && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex-1 p-6 md:p-8 lg:p-10 bg-white flex flex-col justify-center overflow-y-auto min-h-0"><div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold uppercase tracking-wider mb-3"><CheckCircle size={14} /> Resposta</div><h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-relaxed">{card.back}</h3></motion.div>)}</AnimatePresence>
                {!isRevealed && (<button onClick={() => setIsRevealed(true)} className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pb-10 bg-gradient-to-t from-white/80 to-transparent hover:from-gray-50/60 transition-colors cursor-pointer group outline-none"><div className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-gray-900/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-sm"><Eye size={16} /> Mostrar Resposta</div><span className="text-xs font-medium text-gray-400 mt-3 group-hover:opacity-0 transition-opacity flex items-center gap-1.5">Toque ou pressione <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">Espaco</kbd></span></button>)}
                <AnimatePresence mode="wait">
                  {phase === 'feedback' && lastResult && lastGrade != null ? (<motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="shrink-0 bg-gray-50 border-t border-gray-200 px-5 py-3"><ReviewFeedbackDisplay feedback={lastResult.feedback} grade={lastGrade} onContinue={handleContinue} /></motion.div>) : isRevealed ? (<motion.div key="grades" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="shrink-0 bg-gray-50 border-t border-gray-200 px-5 py-4"><GradeButtons onGrade={handleGrade} disabled={phase !== 'studying'} /></motion.div>) : null}
                </AnimatePresence>
              </div>
              <div className="hidden lg:flex w-[38%] shrink-0 border-l border-gray-100 bg-gray-50/30 flex-col relative overflow-hidden">
                {!hasImage && (<div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #14b8a6 1px, transparent 0)', backgroundSize: '24px 24px' }} />)}
                <AnimatePresence mode="wait">
                  <motion.div key={`${isRevealed ? 'revealed' : 'question'}-${currentIndex}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35, ease: 'easeInOut' }} className="flex-1 flex flex-col relative z-10 min-h-0">
                    {hasImage ? (<img src={card.image_url!} alt={card.front} className="flex-1 w-full object-cover min-h-0" />) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-full max-w-[220px] flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2"><span className="text-3xl font-black text-gray-800 tabular-nums">{currentIndex + 1}</span><span className="text-lg text-gray-300 font-light">/</span><span className="text-lg font-semibold text-gray-400 tabular-nums">{dueItems.length}</span></div>
                          <div className="w-full flex gap-1">{dueItems.map((_, i) => (<div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300" style={{ backgroundColor: i < sessionGrades.length ? sessionGrades[i] >= 0.65 ? '#22c55e' : sessionGrades[i] >= 0.35 ? '#eab308' : '#ef4444' : i === currentIndex ? '#14b8a6' : '#e5e7eb', opacity: i === currentIndex ? 1 : i < sessionGrades.length ? 0.8 : 0.4 }} />))}</div>
                          <span className="text-xs font-semibold text-gray-400 tracking-wide">{Math.round(progress)}% concluido</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <AnimatePresence>{showCreator && <StudentCardCreator onClose={() => setShowCreator(false)} onSubmit={handleCreateCard} />}</AnimatePresence>
    </div>
  );
}
