import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as api from '@/app/services/studentApi';
import type { StudentProfile, StudentStats, CourseProgress, DailyActivity, StudySession, FlashcardReview, StudySummary, SummaryAnnotation } from '@/app/types/student';

// @refresh reset

export interface StudentDataState {
  profile: StudentProfile | null;
  stats: StudentStats | null;
  courseProgress: CourseProgress[];
  dailyActivity: DailyActivity[];
  sessions: StudySession[];
  reviews: FlashcardReview[];
  summaries: StudySummary[];
}

interface StudentDataContextType extends StudentDataState {
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
  seedAndLoad: () => Promise<void>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<void>;
  updateStats: (data: Partial<StudentStats>) => Promise<void>;
  logSession: (data: Omit<StudySession, 'studentId'>) => Promise<void>;
  saveReviews: (reviews: FlashcardReview[]) => Promise<void>;
  // ── Summaries ──
  fetchSummaries: () => Promise<void>;
  saveSummary: (courseId: string, topicId: string, data: Partial<StudySummary>) => Promise<StudySummary>;
  deleteSummary: (courseId: string, topicId: string) => Promise<void>;
  updateSummaryLocal: (courseId: string, topicId: string, updates: Partial<StudySummary>) => void;
  // ── Annotations ──
  addAnnotation: (courseId: string, topicId: string, annotation: SummaryAnnotation) => Promise<void>;
  removeAnnotation: (courseId: string, topicId: string, annotationId: string) => Promise<void>;
  // ── Keyword mastery/notes per summary ──
  updateKeywordMastery: (courseId: string, topicId: string, keyword: string, mastery: string) => Promise<void>;
  addKeywordNote: (courseId: string, topicId: string, keyword: string, note: string) => Promise<void>;
}

const StudentDataContext = createContext<StudentDataContextType>({
  profile: null, stats: null, courseProgress: [], dailyActivity: [], sessions: [], reviews: [], summaries: [],
  loading: true, error: null, isConnected: false,
  refresh: async () => {}, seedAndLoad: async () => {},
  updateProfile: async () => {}, updateStats: async () => {},
  logSession: async () => {}, saveReviews: async () => {},
  fetchSummaries: async () => {},
  saveSummary: async () => ({} as StudySummary),
  deleteSummary: async () => {},
  updateSummaryLocal: () => {},
  addAnnotation: async () => {},
  removeAnnotation: async () => {},
  updateKeywordMastery: async () => {},
  addKeywordNote: async () => {},
});

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StudentDataState>({ profile: null, stats: null, courseProgress: [], dailyActivity: [], sessions: [], reviews: [], summaries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [didAutoSeed, setDidAutoSeed] = useState(false);

  const fetchAll = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const [profile, stats, courseProgress, dailyActivity, sessions, reviews, summaries] = await Promise.allSettled([
        api.getProfile(), api.getStats(), api.getAllCourseProgress(), api.getDailyActivity(), api.getSessions(), api.getReviews(), api.getAllSummaries(),
      ]);
      const profileVal = profile.status === 'fulfilled' ? profile.value : null;
      setData({
        profile: profileVal,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        courseProgress: courseProgress.status === 'fulfilled' ? courseProgress.value : [],
        dailyActivity: dailyActivity.status === 'fulfilled' ? dailyActivity.value : [],
        sessions: sessions.status === 'fulfilled' ? sessions.value : [],
        reviews: reviews.status === 'fulfilled' ? reviews.value : [],
        summaries: summaries.status === 'fulfilled' ? summaries.value : [],
      });
      setLoading(false);
      return !!profileVal;
    } catch (err: any) {
      console.error('[StudentDataContext] fetch error:', err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, []);

  const seedAndLoad = useCallback(async () => {
    setLoading(true);
    try { await api.seedDemoData(); await fetchAll(); }
    catch (err: any) { setError(err.message); setLoading(false); }
  }, [fetchAll]);

  const updateProfileFn = useCallback(async (updates: Partial<StudentProfile>) => {
    try { const updated = await api.updateProfile(updates); setData(prev => ({ ...prev, profile: { ...prev.profile!, ...updated } })); }
    catch (err: any) { console.error('[StudentDataContext] updateProfile error:', err); }
  }, []);

  const updateStatsFn = useCallback(async (updates: Partial<StudentStats>) => {
    try { const updated = await api.updateStats(updates); setData(prev => ({ ...prev, stats: { ...prev.stats!, ...updated } })); }
    catch (err: any) { console.error('[StudentDataContext] updateStats error:', err); }
  }, []);

  const logSessionFn = useCallback(async (session: Omit<StudySession, 'studentId'>) => {
    try { const created = await api.logSession(session); setData(prev => ({ ...prev, sessions: [created, ...prev.sessions] })); }
    catch (err: any) { console.error('[StudentDataContext] logSession error:', err); }
  }, []);

  const saveReviewsFn = useCallback(async (reviews: FlashcardReview[]) => {
    try {
      await api.saveReviews(reviews);
      setData(prev => ({ ...prev, reviews: [...reviews, ...prev.reviews.filter(r => !reviews.some(nr => nr.cardId === r.cardId && nr.topicId === r.topicId && nr.courseId === r.courseId))] }));
    } catch (err: any) { console.error('[StudentDataContext] saveReviews error:', err); }
  }, []);

  // ── Summaries ──
  const fetchSummariesFn = useCallback(async () => {
    try {
      const summaries = await api.getAllSummaries();
      setData(prev => ({ ...prev, summaries }));
    } catch (err: any) { console.error('[StudentDataContext] fetchSummaries error:', err); }
  }, []);

  const saveSummaryFn = useCallback(async (courseId: string, topicId: string, updates: Partial<StudySummary>): Promise<StudySummary> => {
    const saved = await api.saveSummary(courseId, topicId, updates);
    setData(prev => {
      const idx = prev.summaries.findIndex(s => s.courseId === courseId && s.topicId === topicId);
      const next = [...prev.summaries];
      if (idx >= 0) next[idx] = saved; else next.unshift(saved);
      return { ...prev, summaries: next };
    });
    return saved;
  }, []);

  const deleteSummaryFn = useCallback(async (courseId: string, topicId: string) => {
    await api.deleteSummary(courseId, topicId);
    setData(prev => ({ ...prev, summaries: prev.summaries.filter(s => !(s.courseId === courseId && s.topicId === topicId)) }));
  }, []);

  const updateSummaryLocalFn = useCallback((courseId: string, topicId: string, updates: Partial<StudySummary>) => {
    setData(prev => ({
      ...prev,
      summaries: prev.summaries.map(s =>
        s.courseId === courseId && s.topicId === topicId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  // ── Annotations ──
  const addAnnotationFn = useCallback(async (courseId: string, topicId: string, annotation: SummaryAnnotation) => {
    setData(prev => {
      const summaries = prev.summaries.map(s => {
        if (s.courseId === courseId && s.topicId === topicId) {
          return { ...s, annotations: [...(s.annotations || []), annotation] };
        }
        return s;
      });
      return { ...prev, summaries };
    });
    // Persist
    const summary = data.summaries.find(s => s.courseId === courseId && s.topicId === topicId);
    if (summary) {
      const updated = [...(summary.annotations || []), annotation];
      await api.saveSummary(courseId, topicId, { annotations: updated }).catch(err => console.error('[StudentDataContext] addAnnotation persist:', err));
    }
  }, [data.summaries]);

  const removeAnnotationFn = useCallback(async (courseId: string, topicId: string, annotationId: string) => {
    setData(prev => {
      const summaries = prev.summaries.map(s => {
        if (s.courseId === courseId && s.topicId === topicId) {
          return { ...s, annotations: (s.annotations || []).filter(a => a.id !== annotationId) };
        }
        return s;
      });
      return { ...prev, summaries };
    });
    const summary = data.summaries.find(s => s.courseId === courseId && s.topicId === topicId);
    if (summary) {
      const updated = (summary.annotations || []).filter(a => a.id !== annotationId);
      await api.saveSummary(courseId, topicId, { annotations: updated }).catch(err => console.error('[StudentDataContext] removeAnnotation persist:', err));
    }
  }, [data.summaries]);

  // ── Keyword mastery/notes per summary ──
  const updateKeywordMasteryFn = useCallback(async (courseId: string, topicId: string, keyword: string, mastery: string) => {
    setData(prev => {
      const summaries = prev.summaries.map(s => {
        if (s.courseId === courseId && s.topicId === topicId) {
          const km = { ...(s.keywordMastery || {}), [keyword]: mastery };
          return { ...s, keywordMastery: km };
        }
        return s;
      });
      return { ...prev, summaries };
    });
    const summary = data.summaries.find(s => s.courseId === courseId && s.topicId === topicId);
    if (summary) {
      const km = { ...(summary.keywordMastery || {}), [keyword]: mastery };
      await api.saveSummary(courseId, topicId, { keywordMastery: km }).catch(err => console.error('[StudentDataContext] updateKeywordMastery persist:', err));
    }
  }, [data.summaries]);

  const addKeywordNoteFn = useCallback(async (courseId: string, topicId: string, keyword: string, note: string) => {
    setData(prev => {
      const summaries = prev.summaries.map(s => {
        if (s.courseId === courseId && s.topicId === topicId) {
          const kn = { ...(s.keywordNotes || {}) };
          kn[keyword] = [...(kn[keyword] || []), note];
          return { ...s, keywordNotes: kn };
        }
        return s;
      });
      return { ...prev, summaries };
    });
    const summary = data.summaries.find(s => s.courseId === courseId && s.topicId === topicId);
    if (summary) {
      const kn = { ...(summary.keywordNotes || {}) };
      kn[keyword] = [...(kn[keyword] || []), note];
      await api.saveSummary(courseId, topicId, { keywordNotes: kn }).catch(err => console.error('[StudentDataContext] addKeywordNote persist:', err));
    }
  }, [data.summaries]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const hasData = await fetchAll();
      if (!hasData && !cancelled && !didAutoSeed) {
        setDidAutoSeed(true);
        try { await api.seedDemoData(); await fetchAll(); }
        catch (err: any) { console.error('[StudentDataContext] auto-seed error:', err); setError(err.message); setLoading(false); }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [fetchAll, didAutoSeed]);

  const isConnected = !!data.profile;
  return (
    <StudentDataContext.Provider value={{
      ...data, loading, error, isConnected,
      refresh: async () => { await fetchAll(); },
      seedAndLoad,
      updateProfile: updateProfileFn,
      updateStats: updateStatsFn,
      logSession: logSessionFn,
      saveReviews: saveReviewsFn,
      fetchSummaries: fetchSummariesFn,
      saveSummary: saveSummaryFn,
      deleteSummary: deleteSummaryFn,
      updateSummaryLocal: updateSummaryLocalFn,
      addAnnotation: addAnnotationFn,
      removeAnnotation: removeAnnotationFn,
      updateKeywordMastery: updateKeywordMasteryFn,
      addKeywordNote: addKeywordNoteFn,
    }}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentDataContext() { return useContext(StudentDataContext); }
