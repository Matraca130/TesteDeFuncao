// ══════════════════════════════════════════════════════════════
// AXON — Shared Admin Types
// ══════════════════════════════════════════════════════════════

import type { Course, Topic } from '@/app/data/courses';

export type ValidationStatus = 'complete' | 'partial' | 'empty';

export interface ValidationResult {
  status: ValidationStatus;
  requiredMissing: string[];
  optionalEmpty: string[];
}

export type SaveStatus = 'idle' | 'success' | 'error';

export interface SelectedTopicInfo {
  course: Course;
  semesterTitle: string;
  sectionTitle: string;
  topic: Topic;
}
