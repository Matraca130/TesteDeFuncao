// ============================================================
// Axon v4.4 — useStudentData Hook (REWIRED by Agent 4 P3)
// Phase 4: imports directly from api-student.ts (no barrel)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getStudentProfile,
  getStudentStats,
  getCourseProgress,
  getDailyActivity,
  getStudySessions,
  getFlashcardReviews,
  seedDemoData,
} from '../lib/api-student';
import type {
  StudentProfile,
  StudentStats,
  CourseProgress,
  DailyActivity,
  StudySession,
  FlashcardReview,
} from '../lib/types';

export type { StudentProfile, StudentStats, CourseProgress, DailyActivity, StudySession, FlashcardReview };

const DEFAULT_STUDENT_ID = 'demo-student-001';

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

export function useStudentData(studentId = DEFAULT_STUDENT_ID): UseStudentDataResult {
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
          getStudentProfile(studentId).catch(() => null),
          getStudentStats(studentId).catch(() => null),
          getCourseProgress(studentId).catch(() => []),
          getDailyActivity(studentId).catch(() => []),
          getStudySessions(studentId).catch(() => []),
          getFlashcardReviews(studentId).catch(() => []),
        ]);

      setData({
        profile: profile as StudentProfile | null,
        stats: stats as StudentStats | null,
        courseProgress: courseProgress as CourseProgress[],
        dailyActivity: dailyActivity as DailyActivity[],
        sessions: sessions as StudySession[],
        reviews: reviews as FlashcardReview[],
      });

      if (profile) setSeeded(true);
    } catch (err: any) {
      console.error('[useStudentData] Error fetching data:', err);
      setError(err.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const seedDataFn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await seedDemoData();
      setSeeded(true);
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

  return { data, loading, error, seeded, refresh: fetchAll, seedData: seedDataFn };
}
