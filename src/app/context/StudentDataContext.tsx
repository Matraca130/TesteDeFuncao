// ============================================================
// Axon — Student Data Context
// Provides student data from Supabase to all views
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as api from '@/app/services/studentApi';
import type {
  StudentProfile,
  StudentStats,
  CourseProgress,
  DailyActivity,
  StudySession,
  FlashcardReview,
} from '@/app/types/student';

// @refresh reset

export interface StudentDataState {
  profile: StudentProfile | null;
  stats: StudentStats | null;
  courseProgress: CourseProgress[];
  dailyActivity: DailyActivity[];
  sessions: StudySession[];
  reviews: FlashcardReview[];
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
}

const StudentDataContext = createContext<StudentDataContextType>({
  profile: null,
  stats: null,
  courseProgress: [],
  dailyActivity: [],
  sessions: [],
  reviews: [],
  loading: true,
  error: null,
  isConnected: false,
  refresh: async () => {},
  seedAndLoad: async () => {},
  updateProfile: async () => {},
  updateStats: async () => {},
  logSession: async () => {},
  saveReviews: async () => {},
});

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StudentDataState>({
    profile: null,
    stats: null,
    courseProgress: [],
    dailyActivity: [],
    sessions: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [didAutoSeed, setDidAutoSeed] = useState(false);

  const fetchAll = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const [profile, stats, courseProgress, dailyActivity, sessions, reviews] =
        await Promise.allSettled([
          api.getProfile(),
          api.getStats(),
          api.getAllCourseProgress(),
          api.getDailyActivity(),
          api.getSessions(),
          api.getReviews(),
        ]);

      const profileVal = profile.status === 'fulfilled' ? profile.value : null;

      setData({
        profile: profileVal,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        courseProgress: courseProgress.status === 'fulfilled' ? courseProgress.value : [],
        dailyActivity: dailyActivity.status === 'fulfilled' ? dailyActivity.value : [],
        sessions: sessions.status === 'fulfilled' ? sessions.value : [],
        reviews: reviews.status === 'fulfilled' ? reviews.value : [],
      });

      setLoading(false);
      return !!profileVal; // true if data exists
    } catch (err: any) {
      console.error('[StudentDataContext] fetch error:', err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, []);

  const seedAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      await api.seedDemoData();
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [fetchAll]);

  const updateProfileFn = useCallback(async (updates: Partial<StudentProfile>) => {
    try {
      const updated = await api.updateProfile(updates);
      setData(prev => ({ ...prev, profile: { ...prev.profile!, ...updated } }));
    } catch (err: any) {
      console.error('[StudentDataContext] updateProfile error:', err);
    }
  }, []);

  const updateStatsFn = useCallback(async (updates: Partial<StudentStats>) => {
    try {
      const updated = await api.updateStats(updates);
      setData(prev => ({ ...prev, stats: { ...prev.stats!, ...updated } }));
    } catch (err: any) {
      console.error('[StudentDataContext] updateStats error:', err);
    }
  }, []);

  const logSessionFn = useCallback(async (session: Omit<StudySession, 'studentId'>) => {
    try {
      const created = await api.logSession(session);
      setData(prev => ({ ...prev, sessions: [created, ...prev.sessions] }));
    } catch (err: any) {
      console.error('[StudentDataContext] logSession error:', err);
    }
  }, []);

  const saveReviewsFn = useCallback(async (reviews: FlashcardReview[]) => {
    try {
      await api.saveReviews(reviews);
      setData(prev => ({
        ...prev,
        reviews: [
          ...reviews,
          ...prev.reviews.filter(r =>
            !reviews.some(nr => nr.cardId === r.cardId && nr.topicId === r.topicId && nr.courseId === r.courseId)
          ),
        ],
      }));
    } catch (err: any) {
      console.error('[StudentDataContext] saveReviews error:', err);
    }
  }, []);

  // Auto-load on mount — auto-seed if empty
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const hasData = await fetchAll();
      if (!hasData && !cancelled && !didAutoSeed) {
        // No student data in DB — auto-seed demo data
        setDidAutoSeed(true);
        try {
          await api.seedDemoData();
          await fetchAll();
        } catch (err: any) {
          console.error('[StudentDataContext] auto-seed error:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [fetchAll, didAutoSeed]);

  const isConnected = !!data.profile;

  return (
    <StudentDataContext.Provider
      value={{
        ...data,
        loading,
        error,
        isConnected,
        refresh: async () => { await fetchAll(); },
        seedAndLoad,
        updateProfile: updateProfileFn,
        updateStats: updateStatsFn,
        logSession: logSessionFn,
        saveReviews: saveReviewsFn,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentDataContext() {
  return useContext(StudentDataContext);
}