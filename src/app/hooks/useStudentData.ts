// ============================================================
// Axon — useStudentData Hook
// Fetches and caches student data from the backend
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/app/services/studentApi';
import type {
  StudentProfile,
  StudentStats,
  CourseProgress,
  DailyActivity,
  StudySession,
  FlashcardReview,
} from '@/app/types/student';

export interface StudentData {
  profile: StudentProfile | null;
  stats: StudentStats | null;
  courseProgress: CourseProgress[];
  dailyActivity: DailyActivity[];
  sessions: StudySession[];
  reviews: FlashcardReview[];
}

export interface UseStudentDataResult {
  data: StudentData;
  loading: boolean;
  error: string | null;
  seeded: boolean;
  refresh: () => Promise<void>;
  seedData: () => Promise<void>;
}

export function useStudentData(): UseStudentDataResult {
  const [data, setData] = useState<StudentData>({
    profile: null,
    stats: null,
    courseProgress: [],
    dailyActivity: [],
    sessions: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, stats, courseProgress, dailyActivity, sessions, reviews] =
        await Promise.all([
          api.getProfile().catch(() => null),
          api.getStats().catch(() => null),
          api.getAllCourseProgress().catch(() => []),
          api.getDailyActivity().catch(() => []),
          api.getSessions().catch(() => []),
          api.getReviews().catch(() => []),
        ]);

      setData({
        profile: profile as StudentProfile | null,
        stats: stats as StudentStats | null,
        courseProgress: courseProgress as CourseProgress[],
        dailyActivity: dailyActivity as DailyActivity[],
        sessions: sessions as StudySession[],
        reviews: reviews as FlashcardReview[],
      });

      // If profile exists, data has been seeded
      if (profile) setSeeded(true);
    } catch (err: any) {
      console.error('[useStudentData] Error fetching data:', err);
      setError(err.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, []);

  const seedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.seedDemoData();
      setSeeded(true);
      // Refresh data after seeding
      await fetchAll();
    } catch (err: any) {
      console.error('[useStudentData] Error seeding data:', err);
      setError(err.message || 'Failed to seed demo data');
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, seeded, refresh: fetchAll, seedData };
}
